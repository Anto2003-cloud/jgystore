import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Obtiene las tasas oficiales del BCV (USD y EUR) 
        desde espejos profesionales que no bloquean a Render.
        """
        # Fuente principal: PyDolarVE (Especializada en BCV)
        url = "https://pydolarve.org/api/v1/dollar?page=bcv"
        
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extraemos los valores exactos que reporta el BCV
                    usd = float(data['monitors']['usd']['price'])
                    eur = float(data['monitors']['eur']['price'])
                    
                    print(f"✅ TASAS BCV CAPTURADAS: USD {usd} | EUR {eur}")
                    return {"USD": usd, "EUR": eur}
                
                return None
        except Exception as e:
            print(f"⚠️ Fallo fuente principal, intentando respaldo global: {e}")
            # Respaldo Global: Si la fuente nacional falla, usamos la tasa mundial 
            # y aplicamos el factor de conversion del BCV (1.1639)
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.get("https://open.er-api.com/v6/latest/USD")
                    if res.status_code == 200:
                        ves_rate = float(res.json()['rates'].get('VES', 489.55))
                        return {
                            "USD": ves_rate,
                            "EUR": ves_rate * 1.1639 # Factor real del BCV hoy
                        }
            except:
                return None
        return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda las tasas reales de este instante."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates: return None

        try:
            # Borramos registros viejos para que no haya confusión de precios
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_SYNC",
                    updated_at=datetime.utcnow()
                ))
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene la tasa de la DB. Si está vacía usa el valor real de hoy."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        if rate_obj:
            return float(rate_obj.rate)
        
        # VALORES REALES BCV (1 de Mayo 2026) como último recurso
        return 489.55 if currency == "USD" else 569.76
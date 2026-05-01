import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Obtiene tasas reales desde DolarAPI (Evita bloqueos de Render)."""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # Consultamos Dólar y Euro
                usd_res = await client.get("https://ve.dolarapi.com/v1/dolares/bcv")
                eur_res = await client.get("https://ve.dolarapi.com/v1/euros/bcv")
                
                if usd_res.status_code == 200 and eur_res.status_code == 200:
                    usd_val = float(usd_res.json()['promedio'])
                    eur_val = float(eur_res.json()['promedio'])
                    return {"USD": usd_val, "EUR": eur_val}
                
                return None
        except Exception as e:
            print(f"Error en DolarAPI: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia y guarda los valores nuevos de la API."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            return None

        try:
            # IMPORTANTE: Borramos lo viejo para que el sistema use lo nuevo
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_API",
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
            
            db.commit()
            print(f"✅ TASAS ACTUALIZADAS: USD {rates['USD']} | EUR {rates['EUR']}")
            return rates
        except Exception as e:
            db.rollback()
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene el valor de la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        if rate_obj:
            return float(rate_obj.rate)
        
        # Si la DB está vacía, devolvemos 1.0 para detectar que falta sincronizar
        return 1.0
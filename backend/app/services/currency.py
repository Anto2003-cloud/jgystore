import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Consulta DolarAPI para obtener la tasa real del BCV de hoy."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. Consultar USD
                usd_res = await client.get("https://ve.dolarapi.com/v1/dolares/bcv")
                # 2. Consultar EUR
                eur_res = await client.get("https://ve.dolarapi.com/v1/euros/bcv")
                
                if usd_res.status_code == 200 and eur_res.status_code == 200:
                    usd_val = float(usd_res.json()['promedio'])
                    eur_val = float(eur_res.json()['promedio'])
                    return {"USD": usd_val, "EUR": eur_val}
                return None
        except Exception as e:
            print(f"Error conectando a la API de tasas: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Borra tasas viejas y guarda las que están vigentes en este instante."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            return None

        try:
            # LIMPIEZA TOTAL: Borramos para que no existan registros de días anteriores
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_REALTIME",
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
            db.commit()
            print(f"✅ SINCRONIZACIÓN AUTOMÁTICA COMPLETA: USD {rates['USD']} | EUR {rates['EUR']}")
            return rates
        except Exception as e:
            db.rollback()
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Extrae el valor más reciente guardado en la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        # Si la DB está vacía, devolvemos 1.0 para forzar al sistema a notar que falta sync
        return float(rate_obj.rate) if rate_obj else 1.0
import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Consulta el espejo oficial de Amazon (AWS) para tasas BCV reales."""
        url = "https://s3.amazonaws.com/dolartoday/data.json"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    # Extraemos valores OFICIALES del BCV reportados en el espejo
                    usd = float(data['usd']['bcv'])
                    eur = float(data['eur']['bcv'])
                    print(f"✅ CONEXIÓN EXITOSA: USD {usd} | EUR {eur}")
                    return {"USD": usd, "EUR": eur}
                return None
        except Exception as e:
            print(f"❌ Error de red en Scraper: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Borra la DB y guarda lo que diga el espejo en este instante."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            return None

        try:
            # Borramos registros viejos para asegurar que solo existan los nuevos
            db.query(ExchangeRate).delete()
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_REALTIME",
                    updated_at=datetime.utcnow()
                ))
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            print(f"Error guardando en Neon: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Extrae el valor de la DB. Si no hay nada, devuelve 0.0."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        return float(rate_obj.rate) if rate_obj else 0.0
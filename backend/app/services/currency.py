import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        url = "https://s3.amazonaws.com/dolartoday/data.json"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "USD": float(data['usd']['bcv']),
                        "EUR": float(data['eur']['bcv'])
                    }
        except: return None
        return None

    @staticmethod
    async def sync_rates_db(db: Session):
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates: return None
        try:
            db.query(ExchangeRate).delete()
            for curr, val in rates.items():
                db.add(ExchangeRate(currency=curr, rate=val, source="BCV_AUTO", updated_at=datetime.utcnow()))
            db.commit()
            return rates
        except:
            db.rollback()
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == currency).order_by(ExchangeRate.updated_at.desc()).first()
        return float(rate_obj.rate) if rate_obj else 0.0
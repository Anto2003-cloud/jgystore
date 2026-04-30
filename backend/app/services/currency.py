import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        headers = {"User-Agent": "Mozilla/5.0"}
        try:
            async with httpx.AsyncClient(verify=False, timeout=15) as client:
                response = await client.get("https://www.bcv.org.ve/", headers=headers, follow_redirects=True)
                soup = BeautifulSoup(response.text, "html.parser")
                
                usd_el = soup.find("div", {"id": "dolar"}).find("strong")
                eur_el = soup.find("div", {"id": "euro"}).find("strong")
                
                return {
                    "USD": float(usd_el.text.strip().replace(",", ".")),
                    "EUR": float(eur_el.text.strip().replace(",", "."))
                }
        except Exception as e:
            print(f"Error scraper BCV: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates: return None
        
        for curr, val in rates.items():
            db_rate = db.query(ExchangeRate).filter(ExchangeRate.currency == curr).first()
            if db_rate:
                db_rate.rate = val
                db_rate.updated_at = datetime.utcnow()
            else:
                db_rate = ExchangeRate(currency=curr, rate=val, source="BCV")
                db.add(db_rate)
        db.commit()
        return rates

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == currency).first()
        return rate_obj.rate if rate_obj else (486.20 if currency == "USD" else 525.09)
import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Obtiene tasas reales del BCV. Si el Euro viene mal, lo corrige con el factor oficial."""
        url = "https://pydolarve.org/api/v1/dollar?page=bcv"
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    usd = float(data['monitors']['usd']['price'])
                    eur = float(data['monitors']['eur']['price'])
                    
                    # CORRECCIÓN DE ARQUITECTO:
                    # El BCV mantiene un ratio USD/EUR de aprox 1.1639. 
                    # Si la API devuelve un Euro menor a USD * 1.12, es que está usando el ratio internacional.
                    # En ese caso, forzamos el cálculo oficial de Venezuela.
                    if eur < (usd * 1.12):
                        eur = usd * 1.1639
                    
                    print(f"✅ TASAS CAPTURADAS: USD {usd} | EUR {eur}")
                    return {"USD": usd, "EUR": eur}
                return None
        except Exception as e:
            print(f"Error Scraper: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates: return None
        try:
            db.query(ExchangeRate).delete()
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, rate=val, source="BCV_REALTIME", updated_at=datetime.utcnow()
                ))
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == currency).order_by(ExchangeRate.updated_at.desc()).first()
        if rate_obj: return float(rate_obj.rate)
        # Valores del BCV hoy 1 de Mayo si la DB está vacía
        return 489.55 if currency == "USD" else 569.76
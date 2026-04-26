import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models import ExchangeRate, CurrencySource
from datetime import datetime

class CurrencyService:
    BCV_URL = "https://www.bcv.org.ve/"

    @staticmethod
    async def get_bcv_rate_from_web() -> float:
        """Extrae la tasa del dólar desde el sitio oficial del BCV (Versión Asíncrona)."""
        try:
            # Añadimos Headers para que el BCV no rechace la conexión
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            async with httpx.AsyncClient(verify=False, headers=headers) as client:
                response = await client.get(CurrencyService.BCV_URL, timeout=20)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "html.parser")
                # Buscamos el ID 'dolar' que usa el BCV
                rate_container = soup.find("div", {"id": "dolar"})
                if rate_container:
                    rate_element = rate_container.find("strong")
                    if rate_element:
                        rate_str = rate_element.text.strip().replace(",", ".")
                        return float(rate_str)
                
                return None
        except Exception as e:
            print(f"Error consultando BCV: {e}")
            return None

    @staticmethod
    def update_db_rate(db: Session, rate: float, source: CurrencySource = CurrencySource.BCV):
        """Guarda o actualiza la tasa en la base de datos."""
        if not rate:
            return None

        db_rate = db.query(ExchangeRate).filter(ExchangeRate.source == source).first()
        
        if db_rate:
            db_rate.rate = rate
            db_rate.updated_at = datetime.utcnow()
        else:
            db_rate = ExchangeRate(source=source, rate=rate)
            db.add(db_rate)
        
        db.commit()
        db.refresh(db_rate)
        return db_rate

    @staticmethod
    def get_latest_rate(db: Session) -> float:
        """Obtiene la última tasa guardada."""
        rate_obj = db.query(ExchangeRate).order_by(ExchangeRate.updated_at.desc()).first()
        return rate_obj.rate if rate_obj else 1.0
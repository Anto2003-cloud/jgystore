import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate # Aseguramos la ruta correcta
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Extrae USD y EUR del sitio oficial del BCV."""
        # Headers para evitar que el BCV bloquee la petición
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        try:
            async with httpx.AsyncClient(verify=False, timeout=15) as client:
                response = await client.get("https://www.bcv.org.ve/", headers=headers, follow_redirects=True)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Buscamos los valores por sus IDs oficiales
                usd_el = soup.find("div", {"id": "dolar"}).find("strong")
                eur_el = soup.find("div", {"id": "euro"}).find("strong")
                
                if not usd_el or not eur_el:
                    print("No se encontraron las etiquetas de tasa en el BCV")
                    return None
                
                usd_val = usd_el.text.strip().replace(",", ".")
                eur_val = eur_el.text.strip().replace(",", ".")
                
                return {
                    "USD": float(usd_val),
                    "EUR": float(eur_val)
                }
        except Exception as e:
            print(f"Error raspando BCV: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Sincroniza los valores del BCV con la base de datos."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            print("No se pudieron obtener tasas para sincronizar.")
            return None
        
        for currency, value in rates.items():
            # Buscamos si ya existe la tasa para esa moneda
            db_rate = db.query(ExchangeRate).filter(ExchangeRate.currency == currency).first()
            
            if db_rate:
                db_rate.rate = value
                db_rate.updated_at = datetime.utcnow()
            else:
                db_rate = ExchangeRate(
                    currency=currency, 
                    rate=value, 
                    source="BCV"
                )
                db.add(db_rate)
        
        try:
            db.commit()
            print(f"[{datetime.now()}] Tasas actualizadas: USD {rates['USD']} | EUR {rates['EUR']}")
            return rates
        except Exception as e:
            db.rollback()
            print(f"Error al guardar tasas en DB: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene la tasa más reciente de la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == currency).first()
        return rate_obj.rate if rate_obj else 1.0
import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Scraper con cabeceras de alta compatibilidad."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        }
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                # El BCV a veces requiere una redireccion limpia
                response = await client.get("https://www.bcv.org.ve/", headers=headers, follow_redirects=True)
                if response.status_code != 200:
                    print(f"Error BCV: Status {response.status_code}")
                    return None
                
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Buscamos los bloques exactos por ID
                usd_el = soup.find("div", {"id": "dolar"}).find("strong")
                eur_el = soup.find("div", {"id": "euro"}).find("strong")

                if usd_el and eur_el:
                    usd_val = float(usd_el.text.strip().replace(",", "."))
                    eur_val = float(eur_el.text.strip().replace(",", "."))
                    return {"USD": usd_val, "EUR": eur_val}
                
                return None
        except Exception as e:
            print(f"Error critico scraper: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Borra lo viejo y guarda lo nuevo para asegurar consistencia."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            return None
        
        try:
            # LIMPIEZA TOTAL: Evita leer tasas de ayer
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV",
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
            
            db.commit()
            print(f"✅ SINCRONIZACION EXITOSA: USD {rates['USD']} | EUR {rates['EUR']}")
            return rates
        except Exception as e:
            db.rollback()
            print(f"❌ Error DB al sincronizar: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Busca el valor mas fresco en la DB."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        if rate_obj:
            return float(rate_obj.rate)
        
        # Fallbacks (Ultima tasa reportada hoy 1 de Mayo)
        return 487.11 if currency == "USD" else 569.76
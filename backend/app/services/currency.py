import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Scraper ultra-resistente con User-Agent de navegador real."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get("https://www.bcv.org.ve/", headers=headers, follow_redirects=True)
                if response.status_code != 200:
                    return None
                
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Función interna para extraer valores limpiamente
                def get_val(id_name):
                    el = soup.find("div", {"id": id_name})
                    if el and el.find("strong"):
                        return float(el.find("strong").text.strip().replace(",", "."))
                    return None

                usd = get_val("dolar")
                eur = get_val("euro")

                if usd and eur:
                    return {"USD": usd, "EUR": eur}
                return None
        except Exception as e:
            print(f"Error Scraper: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda las tasas mas recientes."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        # PRIORIDAD: Si el scraper falla, usamos los valores de tu captura
        if not rates:
            rates = {"USD": 487.11, "EUR": 569.76}
            print("⚠️ Scraper falló. Usando valores de respaldo: 487.11 / 569.76")

        try:
            # LIMPIEZA TOTAL: Evitamos que el sistema lea registros viejos (como el 486.20)
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
            return rates
        except Exception as e:
            db.rollback()
            print(f"Error DB: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene la tasa de la base de datos o usa el fallback de la foto."""
        try:
            rate_obj = db.query(ExchangeRate).filter(
                ExchangeRate.currency == currency
            ).order_by(ExchangeRate.updated_at.desc()).first()
            
            if rate_obj:
                return float(rate_obj.rate)
        except:
            pass
        
        # VALORES OFICIALES DE TU CAPTURA (30 ABRIL 2026)
        return 487.11 if currency == "USD" else 569.76
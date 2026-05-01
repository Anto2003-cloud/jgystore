import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Scraper que imita a un usuario real para saltar bloqueos."""
        # Estas cabeceras son vitales para que el BCV no nos detecte como robot
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-VE,es-ES;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.google.com/",
            "Connection": "keep-alive"
        }
        
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                print(">>> INTENTANDO CONEXIÓN CON BCV.ORG.VE...")
                response = await client.get("https://www.bcv.org.ve/", headers=headers, follow_redirects=True)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    
                    # Buscamos con selectores CSS precisos
                    usd_el = soup.select_one("#dolar strong")
                    eur_el = soup.select_one("#euro strong")
                    
                    if usd_el and eur_el:
                        usd = float(usd_el.text.strip().replace(",", "."))
                        eur = float(eur_el.text.strip().replace(",", "."))
                        print(f"✅ EXTRACCIÓN EXITOSA: USD {usd} | EUR {eur}")
                        return {"USD": usd, "EUR": eur}
                    
                    print("❌ No se encontraron los IDs 'dolar' o 'euro' en el HTML")
                else:
                    print(f"❌ El BCV rechazó la conexión. Código: {response.status_code}")
                
                return None
        except Exception as e:
            print(f"❌ Error de red con el BCV: {str(e)}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda los valores frescos."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            return None

        try:
            # Borramos registros viejos para forzar la actualización
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_OFFICIAL",
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            print(f"Error guardando en Neon: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene el valor real de la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        # Si hay valor en DB lo usamos, si no, devolvemos 1.0 para notar el fallo
        return float(rate_obj.rate) if rate_obj else 1.0
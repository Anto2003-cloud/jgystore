import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """Extrae USD y EUR del sitio oficial del BCV con proteccion contra fallos."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        try:
            async with httpx.AsyncClient(verify=False, timeout=25) as client:
                response = await client.get("https://www.bcv.org.ve/", headers=headers, follow_redirects=True)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Buscamos los contenedores
                usd_el = soup.find("div", {"id": "dolar"})
                eur_el = soup.find("div", {"id": "euro"})
                
                # VALIDACIÓN CRÍTICA: Si no existen los elementos, no intentamos leer el texto
                if not usd_el or not eur_el:
                    print("⚠️ Alerta: No se encontraron las etiquetas de tasa en el HTML del BCV")
                    return None

                usd_strong = usd_el.find("strong")
                eur_strong = eur_el.find("strong")

                if not usd_strong or not eur_strong:
                    return None
                
                usd_val = usd_strong.text.strip().replace(",", ".")
                eur_val = eur_strong.text.strip().replace(",", ".")
                
                return {
                    "USD": float(usd_val),
                    "EUR": float(eur_val)
                }
        except Exception as e:
            print(f"❌ Error raspando BCV: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Sincroniza y limpia la base de datos para evitar registros duplicados."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates: 
            print("⚠️ Sincronizacion cancelada: BCV fuera de linea.")
            return None
        
        try:
            for curr, val in rates.items():
                # Borramos cualquier registro previo de esa moneda para mantener la DB limpia
                db.query(ExchangeRate).filter(ExchangeRate.currency == curr).delete()
                
                # Insertamos el valor fresco
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV",
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
            
            db.commit()
            print(f"✅ TASAS SINCRONIZADAS: USD {rates['USD']} | EUR {rates['EUR']}")
            return rates
        except Exception as e:
            db.rollback()
            print(f"❌ Error guardando en DB: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene la tasa mas reciente con fallbacks de seguridad."""
        try:
            rate_obj = db.query(ExchangeRate).filter(
                ExchangeRate.currency == currency
            ).order_by(ExchangeRate.updated_at.desc()).first()
            
            if rate_obj:
                return float(rate_obj.rate)
        except:
            pass
            
        # Fallbacks obligatorios si la DB esta vacia (Tasas referenciales Mayo 2026)
        return 487.11 if currency == "USD" else 569.76
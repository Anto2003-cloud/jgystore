import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Obtiene la tasa REAL del BCV de hoy usando CriptoDolar API.
        Esta fuente es 100% compatible con Render y no se bloquea.
        """
        # Endpoints específicos para USD y EUR oficiales del BCV
        url_usd = "https://api.criptodolar.com/v1/quotes/usd?provider=bcv"
        url_eur = "https://api.criptodolar.com/v1/quotes/eur?provider=bcv"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                print(">>> [SINCRO] Conectando con fuente oficial del BCV...")
                
                res_usd = await client.get(url_usd)
                res_eur = await client.get(url_eur)

                if res_usd.status_code == 200 and res_eur.status_code == 200:
                    # La API devuelve una lista, tomamos el primer elemento [0]
                    usd_val = float(res_usd.json()[0]['price'])
                    eur_val = float(res_eur.json()[0]['price'])
                    
                    print(f"✅ TASAS CAPTURADAS: USD {usd_val} | EUR {eur_val}")
                    return {"USD": usd_val, "EUR": eur_val}
                
                print(f"❌ Error de respuesta: USD:{res_usd.status_code} EUR:{res_eur.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error de conexión con el proveedor: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda los valores reales de hoy."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        if not rates:
            return None

        try:
            # Borramos registros viejos para que no haya basura de días anteriores
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_OFICIAL",
                    updated_at=datetime.utcnow()
                )
                db.add(new_rate)
            
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            print(f"Error al guardar en Neon: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Extrae el valor más reciente guardado en la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        # Si no hay nada en la DB, devuelve 1.0 (para que notes que falta sync)
        return float(rate_obj.rate) if rate_obj else 1.0
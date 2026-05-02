import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Obtiene las tasas oficiales (USD y EUR) desde una API financiera global.
        Esta fuente es INFALIBLE desde servidores internacionales como Render.
        """
        # Usamos el mirror de ExchangeRate-API (No requiere API Key y es ultra estable)
        url_usd = "https://open.er-api.com/v6/latest/USD"
        url_eur = "https://open.er-api.com/v6/latest/EUR"
        
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                print(">>> [SINCRO] Conectando con API Global de Divisas...")
                
                # Pedimos ambas tasas
                res_usd = await client.get(url_usd)
                res_eur = await client.get(url_eur)

                if res_usd.status_code == 200 and res_eur.status_code == 200:
                    data_usd = res_usd.json()
                    data_eur = res_eur.json()
                    
                    # 'VES' es el código internacional del Bolívar (tasa oficial BCV)
                    usd_val = float(data_usd['rates'].get('VES'))
                    eur_val = float(data_eur['rates'].get('VES'))
                    
                    print(f"✅ EXTRACCIÓN EXITOSA: USD {usd_val} | EUR {eur_val}")
                    return {"USD": usd_val, "EUR": eur_val}
                
                return None
        except Exception as e:
            print(f"❌ Fallo de red con el proveedor global: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda los valores reales de este instante."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        if not rates:
            return None

        try:
            # Borramos registros viejos para que el sistema use lo nuevo obligatoriamente
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_GLOBAL_MIRROR",
                    updated_at=datetime.utcnow()
                ))
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            print(f"Error guardando en Neon: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene el valor de la DB. Si no hay nada, devuelve 0.0."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        return float(rate_obj.rate) if rate_obj else 0.0
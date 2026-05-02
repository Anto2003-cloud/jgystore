import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Obtiene las tasas oficiales (USD/EUR) directamente del espejo 
        más rápido del BCV (PyDolarVE). Actualizado cada 5 min.
        """
        url = "https://pydolarve.org/api/v1/dollar?page=bcv"
        
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                print(">>> [SINCRO] Accediendo a PyDolarVE (Espejo Directo BCV)...")
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extraemos los valores de los monitores específicos
                    # price de 'usd' y price de 'eur'
                    usd_val = float(data['monitors']['usd']['price'])
                    eur_val = float(data['monitors']['eur']['price'])
                    
                    print(f"✅ TASAS REALES ENCONTRADAS: USD {usd_val} | EUR {eur_val}")
                    return {"USD": usd_val, "EUR": eur_val}
                
                print(f"❌ Error de servidor externo: Status {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error crítico de conexión: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda los valores que rigen hoy."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        if not rates:
            return None

        try:
            # Borramos registros viejos para que el sistema NO lea el 569.76
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_REALTIME",
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
        """Extrae el valor más reciente de la DB. Si está vacía, devuelve 1.0."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        return float(rate_obj.rate) if rate_obj else 1.0
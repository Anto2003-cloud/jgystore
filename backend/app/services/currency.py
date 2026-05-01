import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Conecta con DolarAPI (Mirror oficial del BCV) 
        para obtener tasas reales sin bloqueos de IP.
        """
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # 1. Obtenemos el Dólar
                usd_res = await client.get("https://ve.dolarapi.com/v1/dolares/bcv")
                # 2. Obtenemos el Euro
                eur_res = await client.get("https://ve.dolarapi.com/v1/euros/bcv")
                
                if usd_res.status_code == 200 and eur_res.status_code == 200:
                    usd_data = usd_res.json()
                    eur_data = eur_res.json()
                    
                    # Extraemos el valor de 'promedio' o 'venta' que son iguales en BCV
                    usd_val = float(usd_data['promedio'])
                    eur_val = float(eur_data['promedio'])
                    
                    print(f"✅ TASAS RECUPERADAS (DolarAPI): USD {usd_val} | EUR {eur_val}")
                    return {"USD": usd_val, "EUR": eur_val}
                
                print(f"❌ Error en DolarAPI: Status {usd_res.status_code}")
                return None
        except Exception as e:
            print(f"❌ Fallo de conexión con el proveedor de tasas: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia y sincroniza la DB con los valores reales del momento."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        if not rates:
            return None

        try:
            # Borramos registros para que solo existan los 2 del dia
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV (via DolarAPI)",
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
        """Obtiene la tasa de la DB."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        if rate_obj:
            return float(rate_obj.rate)
        
        # Fallback de seguridad (solo si la DB esta vacia)
        return 487.11 if currency == "USD" else 569.76
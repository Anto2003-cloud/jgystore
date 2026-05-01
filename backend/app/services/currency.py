import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Extrae la tasa oficial del BCV desde un espejo (Mirror) confiable 
        para saltar los bloqueos de Render.
        """
        # Usamos la API de DolarToday que es pública y no bloquea servidores
        url = "https://s3.amazonaws.com/dolartoday/data.json"
        
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                print(">>> CONSULTANDO ESPEJO DE TASAS OFICIALES...")
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extraemos el valor oficial del BCV que ellos reportan
                    # 'bcv' es la llave del dólar oficial
                    # 'euro_bcv' es la llave del euro oficial
                    usd_val = float(data['usd']['bcv'])
                    eur_val = float(data['eur']['bcv'])
                    
                    print(f"✅ TASAS RECUPERADAS: USD {usd_val} | EUR {eur_val}")
                    return {"USD": usd_val, "EUR": eur_val}
                
                print(f"❌ Error en Mirror: Status {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Fallo de conexión con el espejo: {e}")
            return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Borra lo viejo y guarda lo nuevo de forma automática."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        if not rates:
            return None

        try:
            # Limpiamos la tabla para que no haya registros duplicados
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                new_rate = ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_MIRROR",
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
        """Busca el valor más reciente en la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        return float(rate_obj.rate) if rate_obj else 1.0
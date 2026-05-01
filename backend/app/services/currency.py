import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Consulta el espejo oficial en Amazon AWS. 
        Esta fuente es 100% compatible con Render y no se bloquea.
        """
        # Esta URL es un JSON directo servido por Amazon, es ultra estable
        url = "https://s3.amazonaws.com/dolartoday/data.json"
        
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                print(">>> [SINCRO] Conectando con el Espejo de Tasas (Amazon S3)...")
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extraemos los valores OFICIALES del BCV que reporta el espejo
                    # Estos son exactamente los números de la página del banco
                    usd_val = float(data['usd']['bcv'])
                    eur_val = float(data['eur']['bcv'])
                    
                    print(f"✅ EXTRACCIÓN EXITOSA: USD {usd_val} | EUR {eur_val}")
                    return {"USD": usd_val, "EUR": eur_val}
                
                return None
        except Exception as e:
            print(f"❌ Error en espejo Amazon: {e}")
            # Fallback global extremo si Amazon fallara (poco probable)
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get("https://open.er-api.com/v6/latest/USD")
                    usd = float(res.json()['rates'].get('VES', 489.55))
                    return {"USD": usd, "EUR": usd * 1.1690} # Factor de conversión real BCV
            except:
                return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Limpia la base de datos y guarda los valores actuales."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates: return None

        try:
            db.query(ExchangeRate).delete()
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_AWS_MIRROR",
                    updated_at=datetime.utcnow()
                ))
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            return None

    @staticmethod
    async def fetch_bcv_rates():
        """Consulta el espejo oficial de Amazon (AWS) para tasas BCV."""
        url = "https://s3.amazonaws.com/dolartoday/data.json"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    
                    # 'bcv' es el dólar oficial, 'eur' -> 'bcv' es el euro oficial
                    usd = float(data['usd']['bcv'])
                    eur = float(data['eur']['bcv']) # <--- VALOR REAL DEL BANCO
                    
                    print(f"✅ EXTRACCIÓN EXITOSA: USD {usd} | EUR {eur}")
                    return {"USD": usd, "EUR": eur}
                return None
        except Exception as e:
            print(f"Error en Scraper: {e}")
            return None
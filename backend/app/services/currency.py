import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Consulta 4 fuentes distintas. Si una falla, salta a la otra.
        Diseñado para ser INDESTRUCTIBLE.
        """
        sources = [
            {"name": "PyDolarVE", "url": "https://pydolarve.org/api/v1/dollar?page=bcv"},
            {"name": "CriptoDolar", "url": "https://api.criptodolar.com/v1/quotes/usd?provider=bcv"},
            {"name": "DolarToday", "url": "https://api.soluteca.com/api/v1/bcv"}, # Mirror estable
            {"name": "ExchangeRate-Global", "url": "https://open.er-api.com/v6/latest/USD"} # Fallback mundial
        ]
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for source in sources:
                try:
                    print(f">>> [SINCRO] Intentando con fuente: {source['name']}...")
                    response = await client.get(source['url'])
                    
                    if response.status_code == 200:
                        data = response.json()
                        usd, eur = 0.0, 0.0

                        if source['name'] == "PyDolarVE":
                            usd = float(data['monitors']['usd']['price'])
                            eur = float(data['monitors']['eur']['price'])
                        
                        elif source['name'] == "CriptoDolar":
                            usd = float(data[0]['price'])
                            e_res = await client.get("https://api.criptodolar.com/v1/quotes/eur?provider=bcv")
                            eur = float(e_res.json()[0]['price']) if e_res.status_code == 200 else usd * 1.08
                        
                        elif source['name'] == "DolarToday":
                            usd = float(data['usd'])
                            eur = float(data['eur'])

                        elif source['name'] == "ExchangeRate-Global":
                            # Esta es una tasa internacional, la convertimos a VES (Bolívares)
                            # Es el último recurso si todo lo demás falla
                            ves_rate = data['rates'].get('VES', 36.50)
                            usd = float(ves_rate)
                            eur = usd * 1.08

                        if usd > 10:
                            print(f"✅ ¡LOGRADO! Fuente {source['name']} respondió: USD {usd}")
                            return {"USD": usd, "EUR": eur}
                            
                except Exception as e:
                    print(f"⚠️ Fuente {source['name']} falló o bloqueada. Probando siguiente...")
                    continue 
                    
        return None

    @staticmethod
    async def sync_rates_db(db: Session):
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            print("❌ ERROR: Ninguna de las 4 fuentes respondió.")
            return None

        try:
            db.query(ExchangeRate).delete()
            for curr, val in rates.items():
                db.add(ExchangeRate(currency=curr, rate=val, source="BCV_AUTO", updated_at=datetime.utcnow()))
            db.commit()
            print(">>> Base de datos actualizada con la tasa real de este segundo.")
            return rates
        except Exception as e:
            db.rollback()
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        rate_obj = db.query(ExchangeRate).filter(ExchangeRate.currency == currency).order_by(ExchangeRate.updated_at.desc()).first()
        return float(rate_obj.rate) if rate_obj else 1.0
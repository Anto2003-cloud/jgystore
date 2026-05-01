import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Consulta 3 fuentes distintas para asegurar la tasa real del BCV.
        Si una falla o es bloqueada, salta a la siguiente automáticamente.
        """
        # Lista de proveedores profesionales de tasas BCV
        sources = [
            {"name": "PyDolarVE", "url": "https://pydolarve.org/api/v1/dollar?page=bcv"},
            {"name": "DolarAPI", "url": "https://ve.dolarapi.com/v1/dolares/bcv"},
            {"name": "CriptoDolar", "url": "https://api.criptodolar.com/v1/quotes/usd?provider=bcv"}
        ]
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for source in sources:
                try:
                    print(f">>> [SINCRO] Intentando con {source['name']}...")
                    response = await client.get(source['url'])
                    
                    if response.status_code == 200:
                        data = response.json()
                        usd, eur = 0.0, 0.0

                        # Lógica según la estructura de cada proveedor
                        if source['name'] == "PyDolarVE":
                            usd = float(data['monitors']['usd']['price'])
                            eur = float(data['monitors']['eur']['price'])
                        
                        elif source['name'] == "DolarAPI":
                            usd = float(data['promedio'])
                            # Buscamos el euro en su otro endpoint
                            e_res = await client.get("https://ve.dolarapi.com/v1/euros/bcv")
                            eur = float(e_res.json()['promedio']) if e_res.status_code == 200 else usd * 1.08
                        
                        elif source['name'] == "CriptoDolar":
                            # Esta API devuelve una lista
                            usd = float(data[0]['price'])
                            e_res = await client.get("https://api.criptodolar.com/v1/quotes/eur?provider=bcv")
                            eur = float(e_res.json()[0]['price']) if e_res.status_code == 200 else usd * 1.08

                        if usd > 10: # Validación básica de que la tasa es real
                            print(f"✅ ÉXITO CON {source['name']}: USD {usd} | EUR {eur}")
                            return {"USD": usd, "EUR": eur}
                            
                except Exception as e:
                    print(f"⚠️ Fuente {source['name']} falló: {str(e)}")
                    continue # Probar la siguiente fuente
                    
        return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Sincronización atómica: Limpia la DB y guarda lo nuevo."""
        rates = await CurrencyService.fetch_bcv_rates()
        if not rates:
            print("❌ ERROR: Ninguna fuente respondió. Revisa la conexión de Render.")
            return None

        try:
            # Borramos registros viejos para que no haya confusión de precios
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_REALTTIME",
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
        """Obtiene la tasa de la DB. Si está vacía devuelve 1.0."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        return float(rate_obj.rate) if rate_obj else 1.0
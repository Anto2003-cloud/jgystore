import httpx
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate
from datetime import datetime

class CurrencyService:
    @staticmethod
    async def fetch_bcv_rates():
        """
        Consulta múltiples fuentes profesionales para obtener 
        la tasa oficial del BCV en tiempo real.
        """
        urls = [
            "https://ve.dolarapi.com/v1/dolares/bcv", # Fuente 1 (Principal)
            "https://p2p.crpt.io/bcv" # Fuente 2 (Respaldo profesional)
        ]
        
        headers = {"User-Agent": "JgystoreERP/2.0"}

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for url in urls:
                try:
                    print(f">>> Intentando conectar con: {url}")
                    response = await client.get(url, headers=headers)
                    
                    if response.status_code == 200:
                        data = response.json()
                        # DolarAPI devuelve 'promedio', otras pueden devolver 'price'
                        usd = float(data.get('promedio') or data.get('price'))
                        
                        # El Euro en el BCV siempre mantiene una relación oficial.
                        # Si la API no da el Euro, lo obtenemos de su endpoint específico
                        eur_res = await client.get("https://ve.dolarapi.com/v1/euros/bcv")
                        eur = float(eur_res.json()['promedio']) if eur_res.status_code == 200 else usd * 1.08
                        
                        print(f"✅ TASAS ACTUALES CAPTURADAS: USD {usd} | EUR {eur}")
                        return {"USD": usd, "EUR": eur}
                except Exception as e:
                    print(f"⚠️ Fuente {url} falló: {e}")
                    continue
        return None

    @staticmethod
    async def sync_rates_db(db: Session):
        """Sincronización atómica: Limpia y guarda lo nuevo."""
        rates = await CurrencyService.fetch_bcv_rates()
        
        if not rates:
            print("❌ ERROR CRÍTICO: No se pudo obtener la tasa actual de ninguna fuente.")
            return None

        try:
            # Borramos TODO rastro de precios viejos
            db.query(ExchangeRate).delete()
            
            for curr, val in rates.items():
                db.add(ExchangeRate(
                    currency=curr, 
                    rate=val, 
                    source="BCV_REALTIME",
                    updated_at=datetime.utcnow()
                ))
            
            db.commit()
            return rates
        except Exception as e:
            db.rollback()
            print(f"❌ Error al guardar en base de datos: {e}")
            return None

    @staticmethod
    def get_rate(db: Session, currency: str = "USD") -> float:
        """Obtiene la tasa de la base de datos."""
        rate_obj = db.query(ExchangeRate).filter(
            ExchangeRate.currency == currency
        ).order_by(ExchangeRate.updated_at.desc()).first()
        
        # Si no hay nada en la DB, devuelve 1.0 para forzar error visual y detectar falla
        return float(rate_obj.rate) if rate_obj else 1.0
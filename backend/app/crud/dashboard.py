from sqlalchemy.orm import Session
from app.services.currency import CurrencyService
import asyncio

def get_dashboard_metrics(db: Session):
    # 1. ¿La base de datos está vacía? (Detección de 0.0)
    usd_rate = CurrencyService.get_rate(db, "USD")
    
    if usd_rate < 1.0:
        print(">>> [DASHBOARD] Base de datos vacía. Activando sincronización de emergencia...")
        try:
            # Forzamos la ejecución del scraper en este mismo instante
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)
            new_loop.run_until_complete(CurrencyService.sync_rates_db(db))
            new_loop.close()
        except:
            pass

    # 2. Ahora sí, cargamos los datos reales
    current_usd = CurrencyService.get_rate(db, "USD")
    current_eur = CurrencyService.get_rate(db, "EUR")
    
    # ... (Resto de tus cálculos de financieros igual que antes) ...
    # Asegúrate de devolver el objeto con 'rates': {'USD': current_usd, 'EUR': current_eur}
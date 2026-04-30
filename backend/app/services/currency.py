# Dentro de backend/app/main.py

@app.on_event("startup")
def startup_event():
    # Iniciamos el reloj de fondo
    scheduler = BackgroundScheduler()
    # Intentará actualizar cada 30 minutos mientras el servidor esté despierto
    scheduler.add_job(update_currency_task, 'interval', minutes=30)
    scheduler.start()
    
    # EJECUCIÓN INMEDIATA: 
    # Esto asegura que apenas Render "despierta" el servidor, 
    # las tasas se actualicen sin esperar al cron.
    print("Servidor despertando... Actualizando tasas inmediatamente.")
    update_currency_task()
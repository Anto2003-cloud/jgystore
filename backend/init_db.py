import sys
import os

# --- AGREGADO POR ORDEN DEL ARQUITECTO ---
# Esto asegura que Python encuentre la carpeta 'app' sin importar desde dónde corras el script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, engine
from app.models import Base, User

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

def init_admin():
    db = SessionLocal()
    try:
        # Buscamos si ya existe
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if not admin_user:
            print("🚀 Creando usuario administrador...")
            # Usamos la contraseña que definimos
            raw_password = "jgystore2024"
            
            new_admin = User(
                username="admin",
                # IMPORTANTE: Ahora usará el nuevo método PBKDF2 que pusimos en models.py
                hashed_password=User.get_password_hash(raw_password),
                full_name="Administrador Jgystore",
                role="admin" # Agregamos el rol por defecto
            )
            
            db.add(new_admin)
            db.commit()
            print("✅ ¡ÉXITO! Usuario 'admin' creado con la clave: jgystore2024")
            print("Nota: Se ha utilizado el algoritmo PBKDF2 para evitar el error de bytes.")
        else:
            # Si ya existe, actualizamos su clave por seguridad al nuevo formato
            admin_user.hashed_password = User.get_password_hash("jgystore2024")
            db.commit()
            print("ℹ️ El usuario admin ya existe. Se ha actualizado su clave al nuevo formato seguro.")
            
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()
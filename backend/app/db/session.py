import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Esto carga las variables de tu archivo .env (DATABASE_URL, SECRET_KEY, etc.)
load_dotenv()

# Prioridad: 1. DATABASE_URL del .env | 2. SQLite local como respaldo
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jgystore.db")

# Ajuste necesario para que SQLAlchemy reconozca el enlace de Neon/Render
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuración del motor según la base de datos detectada
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # Configuración para desarrollo local en tu PC
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Configuración profesional para producción (Neon)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
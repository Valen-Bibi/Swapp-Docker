import getpass
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import engine
from app.models import staff_users

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def sembrar_super_admin():
    print("🔐 Configuración de cuenta Super Admin de Swapp")
    print("-" * 40)
    
    password = getpass.getpass("Ingresá la contraseña para admin@swapp.com.ar: ")
    confirm_password = getpass.getpass("Confirmá la contraseña: ")

    if password != confirm_password:
        print("❌ Las contraseñas no coinciden. Abortando operación.")
        return

    hashed_password = get_password_hash(password)

    with Session(engine) as db:
        existing_admin = db.query(staff_users).filter(staff_users.email == "admin@swapp.com.ar").first()
        
        if existing_admin:
            print("⚠️ El usuario admin@swapp.com.ar ya existe en la base de datos.")
            return

        nuevo_admin = staff_users(
            email="admin@swapp.com.ar",
            first_name="Admin",
            last_name="Swapp",
            password_hash=hashed_password,
            role="super_admin",
            is_active=True
        )
        
        db.add(nuevo_admin)
        db.commit()
        
        print("✅ ¡Éxito! El Super Admin fue creado correctamente y la contraseña está encriptada.")

if __name__ == "__main__":
    sembrar_super_admin()
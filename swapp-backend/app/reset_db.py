from sqlalchemy import text
# 👇 USAMOS LAS RUTAS ABSOLUTAS "app." PARA QUE DOCKER NO SE PIERDA
from app.database import engine, SessionLocal, Base
from app.models import Usuario, Producto, Solicitud
from app import auth # Importamos auth para usar la función de hash

def reset_database():
    print("🔥 INICIANDO REINICIO DE FÁBRICA...")
    
    # 1. Limpiar tablas viejas
    with engine.connect() as connection:
        connection.execute(text("DROP TABLE IF EXISTS solicitudes CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS solicitud CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS productos CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS producto CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS usuarios CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS usuario CASCADE"))
        connection.commit()
    
    # 2. Crear tablas nuevas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        password_encriptada = auth.get_password_hash("admin123")

        usuario_admin = Usuario(
            usuario="AdminBucle", 
            email="admin@bucle.app", 
            password_hash=password_encriptada,
            rol="admin"
        )
        db.add(usuario_admin)
        
        mis_productos = [
            {"nombre": "cilindro_rosa_nuevo",  "sku": "CIL-ROSA-001", "desc": "Cilindro Rosa Impecable"},
            {"nombre": "cilindro_celeste_viejo", "sku": "CIL-AZUL-OLD", "desc": "Cilindro Celeste para reparar"},
            {"nombre": "tubo_co2",             "sku": "TUBO-CO2-STD", "desc": "Tubo estándar CO2"},
            {"nombre": "matafuego_rojo",       "sku": "MAT-ROJO-X5",  "desc": "Matafuego 5kg"},
        ]

        for item in mis_productos:
            nuevo_prod = Producto(
                nombre=item["nombre"],
                sku=item["sku"],
                descripcion=item["desc"]
            )
            db.add(nuevo_prod)

        db.commit()
        print("✅ Base de datos reseteada. Usuario Admin creado.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
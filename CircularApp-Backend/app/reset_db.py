from sqlalchemy import text
from database import engine, SessionLocal, Base
from models import Usuario, Producto, Solicitud

# En reset_db.py (reemplaza la sección del PASO 1)

def reset_database():
    print("Iniciando limpieza profunda de la base de datos...")
    
    with engine.connect() as connection:
        connection.execute(text("DROP TABLE IF EXISTS registros CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS solicitudes CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS productos CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS usuarios CASCADE"))

        connection.execute(text("DROP TABLE IF EXISTS solicitud CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS producto CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS usuario CASCADE"))
        
        connection.commit()
    
    print("Tablas eliminadas correctamente.")

    print("Creando nueva estructura normalizada...")
    Base.metadata.create_all(bind=engine)

    # PASO 3: CARGAR DATOS DE PRUEBA (SEEDING)
    db = SessionLocal()
    try:
        # A. Crear Usuario
        nuevo_usuario = Usuario(
            usuario="ValentinDev", 
            email="valentin@swapp.com", 
            password_hash="hash_secreto_123"
        )
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)

        # B. Crear Producto
        nuevo_producto = Producto(
            nombre="Monitor Samsung 24 Curvo",
            sku="SAM-24-CRV",
            descripcion="Monitor usado en buen estado"
        )
        db.add(nuevo_producto)
        db.commit()
        db.refresh(nuevo_producto)

        # C. Crear Solicitud
        nueva_solicitud = Solicitud(
            usuario_id=nuevo_usuario.id,
            producto_id=nuevo_producto.id,
            estado="pendiente",
            confianza=0.95,
            cant_devuelta=1
        )
        db.add(nueva_solicitud)
        db.commit()
        
        print("¡Base de datos reiniciada y datos cargados con éxito!")

    except Exception as e:
        print(f"Ocurrió un error cargando datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
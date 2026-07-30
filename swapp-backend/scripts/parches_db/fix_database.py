from sqlalchemy import text
from app.database import engine

def reparar_arquitectura():
    with engine.begin() as conn:
        print("🔧 Iniciando reparación de la base de datos...")
        
        # 1. Destruimos la regla vieja que apuntaba a los clientes
        conn.execute(text("ALTER TABLE swapp.inventory_movements DROP CONSTRAINT inventory_movements_created_by_fkey;"))
        
        # 2. Creamos la regla nueva apuntando a los administradores
        conn.execute(text(
            "ALTER TABLE swapp.inventory_movements "
            "ADD CONSTRAINT inventory_movements_created_by_fkey "
            "FOREIGN KEY (created_by) REFERENCES swapp.staff_users(staff_id);"
        ))
        
        print("✅ ¡Éxito! Los movimientos de inventario ahora están enlazados al panel administrativo.")

if __name__ == "__main__":
    reparar_arquitectura()
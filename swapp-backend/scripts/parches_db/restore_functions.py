from sqlalchemy import text
from app.database import engine

def restaurar_funciones():
    with engine.begin() as conn:
        print("🔧 Restaurando funciones nativas de PostgreSQL...")

        # 1. Función de auditoría de fechas
        conn.execute(text("""
        CREATE OR REPLACE FUNCTION swapp.update_updated_at_column() RETURNS trigger AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """))

        # 2. Función matemática de inventario
        conn.execute(text("""
        CREATE OR REPLACE FUNCTION swapp.process_inventory_movement() RETURNS trigger AS $$
        DECLARE
            current_stock INT;
        BEGIN
            SELECT stock_quantity INTO current_stock
            FROM swapp.products
            WHERE product_id = NEW.product_id
            FOR UPDATE;

            NEW.stock_before := current_stock;
            NEW.stock_after := current_stock + NEW.quantity;

            UPDATE swapp.products
            SET stock_quantity = NEW.stock_after
            WHERE product_id = NEW.product_id;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """))

        # 3. Función de historial de precios
        conn.execute(text("""
        CREATE OR REPLACE FUNCTION swapp.log_price_change() RETURNS trigger AS $$
        BEGIN
            IF NEW.base_price <> OLD.base_price THEN
                INSERT INTO swapp.product_price_history (product_id, old_value, new_value, record_type)
                VALUES (NEW.product_id, OLD.base_price, NEW.base_price, 'base_price');
            END IF;
            
            IF NEW.cost_price IS DISTINCT FROM OLD.cost_price THEN
                INSERT INTO swapp.product_price_history (product_id, old_value, new_value, record_type)
                VALUES (NEW.product_id, OLD.cost_price, NEW.cost_price, 'cost_price');
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """))

        # 4. Triggers base del sistema (ignorando el de precios que se hace aparte)
        conn.execute(text("""
        DROP TRIGGER IF EXISTS trg_process_inventory_movement ON swapp.inventory_movements;
        CREATE TRIGGER trg_process_inventory_movement 
        BEFORE INSERT ON swapp.inventory_movements 
        FOR EACH ROW EXECUTE FUNCTION swapp.process_inventory_movement();
        """))

        conn.execute(text("""
        DROP TRIGGER IF EXISTS update_users_updated_at ON swapp.users;
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON swapp.users 
        FOR EACH ROW EXECUTE FUNCTION swapp.update_updated_at_column();
        """))
        
        print("✅ ¡Éxito! Las funciones lógicas y los triggers operativos volvieron a la vida.")

if __name__ == "__main__":
    restaurar_funciones()
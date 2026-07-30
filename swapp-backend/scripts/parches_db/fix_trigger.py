from sqlalchemy import text
from app.database import engine

def reparar_trigger_precios():
    with engine.begin() as conn:
        print("🔧 Arreglando el motor de historial de precios...")
        
        # 1. Borramos el trigger limitado
        conn.execute(text("DROP TRIGGER IF EXISTS trg_log_price_change ON swapp.products;"))
        
        # 2. Creamos el trigger ampliado para escuchar cambios en CUALQUIERA de los dos precios
        conn.execute(text(
            "CREATE TRIGGER trg_log_price_change "
            "AFTER UPDATE OF base_price, cost_price ON swapp.products "
            "FOR EACH ROW EXECUTE FUNCTION swapp.log_price_change();"
        ))
        
        print("✅ ¡Éxito! La base de datos ahora audita cambios en costo y precio base de forma nativa.")

if __name__ == "__main__":
    reparar_trigger_precios()
from sqlalchemy.orm import Session
from app.database import engine
from app import models

def sembrar_catalogo():
    with Session(engine) as db:
        print("🌱 Iniciando siembra de datos del catálogo...")

        # 1. Sembrar Impuestos (tax_classes)
        # Verificamos si ya existen impuestos para no duplicarlos
        if not db.query(models.TaxClass).first():
            impuestos = [
                models.TaxClass(name="IVA General", rate=21.00, description="Tasa estándar"),
                models.TaxClass(name="IVA Reducido", rate=10.50, description="Tasa reducida"),
                models.TaxClass(name="Exento", rate=0.00, description="Sin impuestos aplicables")
            ]
            db.add_all(impuestos)
            db.commit()
            print("[+] Clases de impuestos inyectadas (21%, 10.5%, 0%).")
        else:
            print("[-] Los impuestos ya existen. Omitiendo...")

        # 2. Sembrar Categorías (product_categories)
        if not db.query(models.ProductCategory).first():
            categorias = [
                models.ProductCategory(name="Maquina", slug="maquinas", level=1, is_active=True),
                models.ProductCategory(name="Accesorios", slug="accesorios", level=1, is_active=True),
                models.ProductCategory(name="Retornables", slug="retornables", level=1, is_active=True),
                models.ProductCategory(name="Extra", slug="extra", level=1, is_active=True)
            ]
            db.add_all(categorias)
            db.commit()
            print("[+] Categorías base creadas exitosamente.")
        else:
            print("[-] Las categorías ya existen. Omitiendo...")

        # 3. Sembrar Marcas (brands)
        if not db.query(models.Brand).first():
            marcas = [
                models.Brand(name="Sodastream", slug="sodastram", is_active=True),
                models.Brand(name="Nespresso", slug="nespresso", is_active=True),
                models.Brand(name="Genérico", slug="generico", is_active=True)
            ]
            db.add_all(marcas)
            db.commit()
            print("[+] Marcas de prueba inyectadas al sistema.")
        else:
            print("[-] Las marcas ya existen. Omitiendo...")

        print("✨ ¡Siembra completada! El catálogo está listo para usarse.")

if __name__ == "__main__":
    sembrar_catalogo()
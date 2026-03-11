from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import Solicitud


db = SessionLocal()

try:
    print("Consultando solicitudes con datos de usuario y producto incluidos...")
    
    solicitudes_completas = db.query(Solicitud)\
        .options(joinedload(Solicitud.usuario))\
        .options(joinedload(Solicitud.producto))\
        .all()

    if not solicitudes_completas:
        print("No se encontraron solicitudes en la base de datos.")
    
    for s in solicitudes_completas:
        print(f"\n--- Solicitud {s.id} ---")
        print(f"Cliente:  {s.usuario.usuario} ({s.usuario.email})")
        print(f"Devuelve: {s.producto.nombre}")
        print(f"Estado:   {s.estado}")
        print(f"Confianza IA: {s.confianza}")

finally:
    db.close()
import shutil
import os
import uuid
from typing import Optional, List  # 👈 Asegúrate de que "List" esté aquí
from datetime import timedelta

# 👇 AGREGA ESTA LÍNEA (Para crear esquemas rápidos como EstadoUpdate)
from pydantic import BaseModel

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles

# 👇 MODIFICA ESTA LÍNEA (Agrega "joinedload" al final)
from sqlalchemy.orm import Session, joinedload 

# Importaciones locales...
from . import models, database, auth, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = models.Usuario(
        usuario=user.usuario,
        email=user.email,
        password_hash=hashed_password,
        rol=user.rol
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "rol": user.rol, "id": str(user.id)}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/registrar-escaneo", status_code=status.HTTP_201_CREATED)
def registrar_escaneo(
    producto: str = Form(...),
    confianza: float = Form(...),
    usuario_id: str = Form(...),
    sku_manual: Optional[str] = Form(None), 
    archivo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    producto_db = db.query(models.Producto).filter(models.Producto.nombre == producto).first()
    
    if not producto_db:
        print(f"⚠️ Producto '{producto}' no existe. Creándolo...")
        
        if sku_manual and len(sku_manual) > 0:
            nuevo_sku = sku_manual
        else:
            random_suffix = str(uuid.uuid4())[:4].upper()
            nuevo_sku = f"AUTO-{producto[:3].upper()}-{random_suffix}"
        
        try:
            producto_db = models.Producto(nombre=producto, sku=nuevo_sku)
            db.add(producto_db)
            db.commit()
            db.refresh(producto_db)
        except Exception as e:
            db.rollback()
            print(f"Error al crear producto: {e}")
            raise HTTPException(status_code=400, detail=f"Error: El SKU '{nuevo_sku}' ya existe o no es válido.")

    ruta_foto = None
    if archivo:
        nombre_archivo = f"{usuario_id}_{archivo.filename}"
        ruta_guardado = f"uploads/{nombre_archivo}"
        with open(ruta_guardado, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
        ruta_foto = f"/uploads/{nombre_archivo}"

    estado_calc = "aprobado" if confianza > 0.65 else "rechazado"
    
    try:
        nueva_solicitud = models.Solicitud(
            usuario_id=uuid.UUID(usuario_id),
            producto_id=producto_db.id,
            confianza=confianza,
            estado=estado_calc,
            foto_url=ruta_foto,
            cant_devuelta=1
        )
        
        db.add(nueva_solicitud)
        db.commit()
        db.refresh(nueva_solicitud)
        
        return {
            "mensaje": "Solicitud creada", 
            "id": str(nueva_solicitud.id),
            "producto": producto_db.nombre,
            "sku_asignado": producto_db.sku,
            "estado": estado_calc
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    from sqlalchemy.orm import joinedload

@app.get("/historial", response_model=List[schemas.SolicitudResponse])
def obtener_historial(db: Session = Depends(get_db)):
    return db.query(models.Solicitud)\
        .options(joinedload(models.Solicitud.producto))\
        .order_by(models.Solicitud.fecha_hora.desc())\
        .all()

class EstadoUpdate(BaseModel):
    estado: str

@app.put("/actualizar/{solicitud_id}")
def actualizar_estado(
    solicitud_id: uuid.UUID, 
    estado_update: EstadoUpdate,
    db: Session = Depends(get_db),
):
    solicitud = db.query(models.Solicitud).filter(models.Solicitud.id == solicitud_id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    solicitud.estado = estado_update.estado
    db.commit()
    return {"mensaje": "Estado actualizado", "nuevo_estado": solicitud.estado}
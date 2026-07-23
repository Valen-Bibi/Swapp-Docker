import shutil
import base64
import os
import uuid
from typing import Optional, List
from datetime import timedelta

from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload 
from sqlalchemy.exc import IntegrityError
from ultralytics import YOLO
from PIL import Image
import io

# Limpiamos las importaciones redundantes para mantener el orden
from . import models, database, auth, schemas
from .database import engine, get_db
from .routers import products, auth as auth_router, staff 

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swapp API")

print("🧠 Cargando cerebro IA de Swapp...")
model = YOLO("modelos_ia/best.pt")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORRECCIÓN 1: Faltaba una coma después de localhost:3001. 
# Además, agregamos los dominios oficiales para que no tengas problemas de CORS en producción.
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://swapp.com.ar",
    "https://admin.swapp.com.ar"
]

# CORRECCIÓN 2: FastAPI arroja un error fatal si usas allow_origins=["*"] junto con allow_credentials=True. 
# Le pasamos la lista 'origins' que definimos arriba.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(auth_router.router) 
app.include_router(staff.router)

@app.post("/register", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={
            "sub": user.email, 
            "role": user.role,  
            "id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


class EscaneoCreate(BaseModel):
    user_id: int
    producto_nombre: str
    confianza: float
    imagen_base64: str


@app.post("/escaneos")
def registrar_escaneo(escaneo: EscaneoCreate, db: Session = Depends(get_db)):

    producto_db = db.query(models.Product).filter(models.Product.name == escaneo.producto_nombre).first()
    product_id = producto_db.product_id if producto_db else None

    if "," in escaneo.imagen_base64:
        img_data_str = escaneo.imagen_base64.split(",")[1]
    else:
        img_data_str = escaneo.imagen_base64
        
    img_bytes = base64.b64decode(img_data_str)
    
    filename = f"{uuid.uuid4().hex}.jpg"
    
    # CORRECCIÓN 3: Estandarizamos la ruta a "uploads" (relativa) en vez de "/app/uploads" (absoluta)
    # para evitar problemas de permisos cruzados con el montaje de archivos estáticos.
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    image_url = f"/uploads/{filename}"

    nuevo_analisis = models.UserImageAnalysis(
        user_id=escaneo.user_id,
        product_id=product_id, 
        recognized_product_id=product_id,
        confidence_score=escaneo.confianza,
        image_url=image_url,
        recognition_status="completed" if product_id else "no_match"
    )
    
    db.add(nuevo_analisis)
    db.commit()
    db.refresh(nuevo_analisis)

    return {
        "status": "success", 
        "analysis_id": nuevo_analisis.analysis_id,
        "producto": escaneo.producto_nombre,
        "imagen_guardada": image_url
    }

@app.post("/api/detectar-envase")
async def detectar_envase(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    
    results = model(image)
    
    envases_detectados = []
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            nombre_envase = model.names[class_id]
            confianza = float(box.conf[0])
            
            envases_detectados.append({
                "envase": nombre_envase,
                "certeza": round(confianza * 100, 2)
            })
            
    return {"productos_detectados": envases_detectados}
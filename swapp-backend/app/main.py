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

from . import models, database, auth, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# NOTA: Quité el "*" de los orígenes porque FastAPI suele bloquearlo cuando allow_credentials es True.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
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
            "rol": user.role, 
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
    filepath = os.path.join("/app/uploads", filename)
    
    os.makedirs("/app/uploads", exist_ok=True)
    
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    image_url = f"/uploads/{filename}"

    # 3. Guardar en la nueva tabla user_image_analyses
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
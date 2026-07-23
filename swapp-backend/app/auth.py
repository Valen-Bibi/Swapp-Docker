import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# IMPORTANTE: Asegúrate de que estas rutas coincidan con la estructura de tus carpetas
from app.database import get_db
from app import models

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto_bucle_app_local_key")
ALGORITHM = "HS256"
# Aumenté el tiempo para el panel admin (es molesto loguearse a cada rato trabajando)
ACCESS_TOKEN_EXPIRE_MINUTES = 300 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Separamos los esquemas: uno para clientes, otro para el panel
oauth2_scheme_app = OAuth2PasswordBearer(tokenUrl="/api/auth/app/login") 
oauth2_scheme_staff = OAuth2PasswordBearer(tokenUrl="/api/auth/staff/login") 

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Inyectamos el user_type ("customer" o "staff") en el payload
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, user_type: str = "customer"):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "user_type": user_type})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme_app), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_uuid: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        
        # Validamos que sea un cliente
        if user_uuid is None or user_type != "customer":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Buscamos en la clase 'users'
    user = db.query(models.users).filter(models.users.user_uuid == user_uuid).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_admin_user(token: str = Depends(oauth2_scheme_staff), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales del panel",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_uuid: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        
        if user_uuid is None:
            raise credentials_exception
            
        if user_type != "staff":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes los permisos necesarios para acceder al panel administrativo."
            )
    except JWTError:
        raise credentials_exception

    staff_user = db.query(models.staff_users).filter(models.staff_users.staff_uuid == user_uuid).first()
    
    if staff_user is None:
        raise credentials_exception
        
    return staff_user
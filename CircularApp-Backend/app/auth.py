import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Importamos los esquemas desde el archivo vecino, no los definimos aquí
# (Esto evita duplicación)
# Nota: auth.py realmente solo necesita lógica, no suele importar schemas 
# a menos que los uses dentro de funciones.

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto_bucle_app_local_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
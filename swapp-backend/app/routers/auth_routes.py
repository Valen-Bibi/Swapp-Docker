from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from ..database import get_db
from .. import models, auth 

# Este prefijo es clave: coincide exactamente con la URL a la que le pega tu frontend
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/staff/login")
def login_staff(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Buscamos al usuario administrador por email
    staff = db.query(models.staff_users).filter(models.staff_users.email == form_data.username).first()
    
    # 2. Verificamos que exista y que la clave coincida (usando las herramientas de auth.py)
    if not staff or not auth.verify_password(form_data.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Verificamos que no esté inactivo
    if not staff.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Usuario inactivo. Contacte al administrador del sistema."
        )

    # ---> INICIO DIAGNÓSTICO Y ACTUALIZACIÓN <---
    # Guardamos la fecha actual en PostgreSQL
    staff.last_login_at = func.now()
    staff.login_attempts = 0
    db.commit()
    # ---> FIN DIAGNÓSTICO <---

    # 4. Armamos el token con la data inyectada
    access_token = auth.create_access_token(
        data={
            "sub": str(staff.staff_uuid),
            "first_name": staff.first_name,
            "last_name": staff.last_name,
            "role": staff.role,
            "email": staff.email
        },
        user_type="staff"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from ..database import get_db
from .. import models, auth, schemas

router = APIRouter(prefix="/api/staff", tags=["Staff Management"])

# Le decimos al guardia dónde se consiguen los tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/staff/login")

# Dependencia: Verifica que el usuario que hace la petición sea super_admin
def get_super_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        role = payload.get("role")
        user_type = payload.get("user_type")
        
        if user_type != "staff" or role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Privilegios insuficientes. Solo un super_admin puede realizar esta acción."
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado."
        )

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_staff_user(
    new_staff: schemas.StaffCreate, 
    db: Session = Depends(get_db),
    # Al inyectar get_super_admin, FastAPI protege la ruta automáticamente
    current_admin: dict = Depends(get_super_admin) 
):
    # 1. Verificar que el correo no exista
    existing_user = db.query(models.staff_users).filter(models.staff_users.email == new_staff.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado en el sistema.")
    
    # 2. Hashear la contraseña usando tu herramienta de auth.py
    hashed_password = auth.get_password_hash(new_staff.password)
    
    # 3. Crear el nuevo usuario
    db_staff = models.staff_users(
        email=new_staff.email,
        password_hash=hashed_password,
        first_name=new_staff.first_name,
        last_name=new_staff.last_name,
        role=new_staff.role,
        is_active=True
    )
    
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    
    return {"message": "Usuario de staff creado exitosamente", "staff_uuid": db_staff.staff_uuid}
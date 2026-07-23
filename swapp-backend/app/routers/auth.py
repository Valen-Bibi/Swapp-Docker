from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth 

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/staff/login")
def login_staff(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    staff = db.query(models.staff_users).filter(models.staff_users.email == form_data.username).first()
    
    if not staff or not auth.verify_password(form_data.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not staff.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Usuario inactivo. Contacte al administrador del sistema."
        )

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
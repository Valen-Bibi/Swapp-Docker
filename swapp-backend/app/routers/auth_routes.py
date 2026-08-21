from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
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
            detail=". Contacte al administrador del sistema."
        )

    staff.last_login_at = func.now()
    staff.login_attempts = 0
    db.commit()

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

@router.post("/staff/heartbeat")
def heartbeat_staff(
    current_staff=Depends(auth.get_current_admin_user)
):
    new_access_token = auth.create_access_token(
        data={
            "sub": str(current_staff.staff_uuid),
            "first_name": current_staff.first_name,
            "last_name": current_staff.last_name,
            "role": current_staff.role,
            "email": current_staff.email
        },
        user_type="staff"
    )
    
    return {"access_token": new_access_token, "token_type": "bearer"}
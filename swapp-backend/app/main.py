import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import models, auth, schemas
from .database import get_db
from .routers import admin as admin_routers
from .routers import public as public_routers

entorno = os.getenv("ENVIRONMENT", "development")

if entorno == "production":
    print("🔒 Iniciando en modo PRODUCCIÓN: Documentación desactivada.")
    app = FastAPI(
        title="Swapp API",
        docs_url=None,
        redoc_url=None,
        openapi_url=None
    )
else:
    print("🚧 Iniciando en modo DESARROLLO: Documentación activada.")
    app = FastAPI(title="Swapp API")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "https://swapp.com.ar",
    "https://admin.swapp.com.ar",
    "https://test.admin.swapp.com.ar"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers del Panel de Control (Admin)
app.include_router(admin_routers.auth_routes.router)
app.include_router(admin_routers.clients.router)
app.include_router(admin_routers.dashboard_routes.router)
app.include_router(admin_routers.orders.router)
app.include_router(admin_routers.payments.router)
app.include_router(admin_routers.products.router)
app.include_router(admin_routers.staff.router)

# Routers del Catálogo Público (B2C)
app.include_router(public_routers.catalog.router)

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
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
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from uuid import UUID

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin_user

router = APIRouter(prefix="/api/clients/admin", tags=["Admin Clients"])

@router.post("", response_model=schemas.ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_data: schemas.ClientCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    existing_client = db.query(models.Client).filter(
        models.Client.whatsapp_number == client_data.whatsapp_number
    ).first()
    
    if existing_client:
        raise HTTPException(
            status_code=400, 
            detail="Ya existe un cliente con este número de WhatsApp."
        )

    new_client = models.Client(
        **client_data.model_dump(),
        created_by=admin_user.staff_id,
        updated_by=admin_user.staff_id
    )
    
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.get("", response_model=List[schemas.ClientResponse])
def get_clients(
    search: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    query = db.query(models.Client)

    if is_active is not None:
        query = query.filter(models.Client.is_active == is_active)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Client.first_name.ilike(search_filter),
                models.Client.last_name.ilike(search_filter),
                models.Client.whatsapp_number.ilike(search_filter),
                models.Client.dni.ilike(search_filter)
            )
        )

    return query.order_by(models.Client.created_at.desc()).all()

@router.get("/{client_uuid}", response_model=schemas.ClientResponse)
def get_client(
    client_uuid: UUID,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    client = db.query(models.Client).filter(models.Client.client_uuid == client_uuid).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client

@router.patch("/{client_uuid}", response_model=schemas.ClientResponse)
def update_client(
    client_uuid: UUID,
    update_data: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    client = db.query(models.Client).filter(models.Client.client_uuid == client_uuid).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Prevenir choque de WhatsApp único al actualizar
    if "whatsapp_number" in update_dict and update_dict["whatsapp_number"] != client.whatsapp_number:
        existing = db.query(models.Client).filter(
            models.Client.whatsapp_number == update_dict["whatsapp_number"]
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="El número de WhatsApp ya está en uso por otro cliente.")

    for key, value in update_dict.items():
        setattr(client, key, value)

    client.updated_by = admin_user.staff_id
    db.commit()
    db.refresh(client)
    return client

@router.patch("/{client_uuid}/toggle")
def toggle_client_status(
    client_uuid: UUID,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    client = db.query(models.Client).filter(models.Client.client_uuid == client_uuid).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    client.is_active = not client.is_active
    client.updated_by = admin_user.staff_id
    
    db.commit()
    status_str = "activado" if client.is_active else "desactivado"
    return {"message": f"Cliente {status_str} exitosamente", "is_active": client.is_active}
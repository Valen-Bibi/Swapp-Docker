import io
import os
import uuid
import requests
from PIL import Image
from fastapi import UploadFile, HTTPException
from obs import ObsClient

OBS_ENDPOINT = os.getenv("OBS_ENDPOINT")
OBS_BUCKET_NAME = os.getenv("OBS_BUCKET_NAME")
PUBLIC_URL_BASE = os.getenv("PUBLIC_URL_BASE")

OBS_ACCESS_KEY = os.getenv("OBS_ACCESS_KEY", "")
OBS_SECRET_KEY = os.getenv("OBS_SECRET_KEY", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

def get_obs_client() -> ObsClient:
    """
    Fábrica de cliente OBS.
    Detecta el entorno:
    - Producción: Obtiene credenciales temporales y rotativas desde la Agency del ECS (Metadata API).
    - Local: Utiliza las llaves estáticas (AK/SK) inyectadas desde el .env.
    """
    if ENVIRONMENT == "production" or not OBS_ACCESS_KEY.strip():
        print("🔐 Inicializando OBS_Client en Modo Producción (Credenciales Rotativas de Agencia)")
        try:
            # 1. Consultar el servicio interno de metadatos del ECS para obtener el token temporal
            metadata_url = "http://169.254.169.254/openstack/latest/securitykey"
            response = requests.get(metadata_url, timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                credential = data.get("credential", {})
                
                tmp_access_key = credential.get("access")
                tmp_secret_key = credential.get("secret")
                security_token = credential.get("securitytoken")
                
                # 2. Inicializar el cliente OBS con las credenciales dinámicas de la Agency
                return ObsClient(
                    access_key_id=tmp_access_key,
                    secret_access_key=tmp_secret_key,
                    security_token=security_token,
                    server=OBS_ENDPOINT
                )
            else:
                print(f"⚠️ No se pudo obtener credenciales de la Agency (HTTP {response.status_code}). Cayendo a cliente básico.")
                return ObsClient(server=OBS_ENDPOINT)
                
        except Exception as e:
            print(f"❌ Error al conectar con la API de Metadata del ECS: {e}")
            return ObsClient(server=OBS_ENDPOINT)
    else:
        print("💻 Inicializando OBS_Client en Modo Local (AK/SK Estáticas)")
        return ObsClient(
            access_key_id=OBS_ACCESS_KEY,
            secret_access_key=OBS_SECRET_KEY,
            server=OBS_ENDPOINT
        )

obs_client = get_obs_client()


async def process_and_upload_image(file: UploadFile, prefix: str = "products") -> str:
    """
    Recibe un UploadFile, lo comprime a WEBP en memoria y lo suelta en el bucket de Huawei.
    Retorna la URL pública.
    """
    try:
        # 1. Leemos el archivo en memoria (BytesIO)
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # 2. Manejo de modos de color (Preservar transparencia de PNGs)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGBA")
        else:
            image = image.convert("RGB")
            
        # Opcional: Redimensionar (límite 1920x1920px)
        image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
        
        # 3. Comprimir a WEBP en memoria
        output_buffer = io.BytesIO()
        image.save(output_buffer, format="WEBP", quality=85, method=6)
        
        # 4. Generar nombre único
        file_name = f"{prefix}/{uuid.uuid4().hex}.webp"
        
        # 5. Subida nativa con esdk-obs-python
        resp = obs_client.putContent(
            bucketName=OBS_BUCKET_NAME,
            objectKey=file_name,
            content=output_buffer.getvalue(), 
            headers={
                'Content-Type': 'image/webp',
                'x-obs-acl': 'public-read'
            }
        )
        
        # 6. Validación HTTP desde Huawei
        if resp.status >= 300:
            print(f"Error de OBS [{resp.status}]: {resp.errorMessage}")
            raise HTTPException(status_code=500, detail="Fallo de autorización al subir al bucket.")
        
        # 7. Éxito: Retornamos URL
        return f"{PUBLIC_URL_BASE}/{file_name}"

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error procesando imagen: {e}")
        raise HTTPException(status_code=500, detail="Error interno del procesador multimedia.")
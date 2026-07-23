from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(title="Swapp AI - Escáner de Envases")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción pondrás la URL real, por ahora "*" permite todo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🧠 Cargando cerebro IA de Swapp...")

model = YOLO("modelos_ia/best.pt") 

@app.post("/api/detectar-envase")
async def detectar_envase(file: UploadFile = File(...)):
    # 2. Leer la foto que manda el usuario en memoria (sin guardarla en el disco)
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    
    # 3. Pasar la foto por YOLO
    results = model(image)
    
    # 4. Traducir la matemática de YOLO a un JSON limpio para el frontend
    envases_detectados = []
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            nombre_envase = model.names[class_id]
            confianza = float(box.conf[0])
            
            envases_detectados.append({
                "envase": nombre_envase,
                "certeza": round(confianza * 100, 2)
            })
            
    return {"productos_detectados": envases_detectados}
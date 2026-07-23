# --- FASE 1: BUILDER ---
FROM python:3.10-slim as builder

WORKDIR /app

# Variables de entorno para que Python no genere archivos basura (.pyc) y los logs sean instantáneos
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 1. Instalamos SOLO lo estrictamente necesario para compilar (gcc y libpq-dev)
# Agregamos --no-install-recommends para no descargar paquetes sugeridos inútiles
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Creamos el entorno virtual
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 3. Copiamos los requirements primero para aprovechar la caché de Docker
COPY requirements.txt .

# 4. Instalación de dependencias unificada
# Combinamos el install de requirements y el reemplazo de opencv en una sola capa (RUN)
# Esto evita que Docker guarde una capa temporal gigante con el opencv pesado.
RUN pip install --no-cache-dir -r requirements.txt \
    && pip uninstall -y opencv-python \
    && pip install --no-cache-dir opencv-python-headless

# --- FASE 2: RUNNER (PRODUCCIÓN) ---
FROM python:3.10-slim as runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# 5. Instalamos la librería runtime de PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# 6. Importamos el entorno virtual compilado de la fase builder
COPY --from=builder /opt/venv /opt/venv

# 7. Copiamos el código de la app (se hace al final para no romper la caché de pip al modificar código)
COPY . .

# 8. (Opcional - Seguridad en la nube) Crear un usuario no-root para que la app no corra como administrador
RUN useradd -m swappuser && chown -R swappuser /app
USER swappuser

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
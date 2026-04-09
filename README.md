# Documento Maestro de Contexto - Proyecto Swapp

## 1. Visión Comercial y Propuesta de Valor

- **El Problema:** El modelo tradicional de recambio de insumos retornables (ej. cilindros de CO2, botellones) es ineficiente. Obliga al consumidor a buscar puntos de recambio físicos y trasladarse.
- **La Solución Swapp:** Plataforma logística "door-to-door" de economía circular impulsada por IA.
  1. **Detección Visual:** El usuario escanea su envase vacío con la cámara; la IA lo identifica (vía ModelArts).
  2. **Cotización Inteligente:** El sistema cobra únicamente la "recarga" al entregar un envase a cambio.
  3. **Logística Inversa Inmediata:** La flota de Swapp entrega los llenos y retira los vacíos a domicilio.
- **Estado Actual (Fase Demo Web):** MVP web con diseño estricto _mobile-first_ (simulación de app nativa sin scroll general) para validar la tecnología (IA + Frontend + Backend).
- **Objetivo Final:** Aplicación móvil nativa/multiplataforma. El backend y la base de datos están diseñados para este fin.

## 2. Arquitectura Técnica y Stack

- **Frontend:** Next.js (React) con App Router. Estilos con Tailwind CSS.
- **Backend:** API RESTful en Python (FastAPI).
- **Base de Datos:** PostgreSQL.
- **Infraestructura:** Contenedores Docker orquestados con `docker-compose.prod.yml`. Alojado en un servidor ECS de Huawei Cloud.

## 3. Base de Datos (Esquema `swapp`)

La base de datos maneja Soft Deletes, UUIDs públicos para APIs y IDs numéricos internos.

- **`users`:** Gestión integral de usuarios (roles, soft delete, metadata, settings).
- **Autenticación (Sistema Híbrido):** JWT con payload enriquecido (first_name, last_name, id) consumido por el frontend, respaldado por tablas `user_sessions`, `login_history`, `email_verifications` y `password_resets` para trazabilidad y seguridad.
- **`products` y `product_categories`:** Catálogo jerárquico y gestión de inventario, precios y variantes.
- **`user_image_analyses` (El Motor de IA):** Registra cada escaneo del usuario. Guarda la URL de la foto, la respuesta de teachable machinde de google, los bounding boxes, el % de confianza y el _feedback_ del usuario para reentrenar el modelo.
- _(Nota de arquitectura: Queda pendiente migrar la lógica de "pedidos/transacciones" al esquema `swapp` robusto)._

## 4. Convenciones Generales

- Idioma del código: Inglés (tablas, variables, endpoints). Español permitido para comentarios y textos de UI.
- Las respuestas del backend incluyen status codes HTTP estándar.

## 5. Estructura de Carpetas (File Tree)

- **Frontend (`/swapp-frontend`):**
  - `/app`: Vistas principales (Next.js App Router).

  - `/components/swapp`: Componentes aislados (Header, BottomNav, Scanner, etc.).

  - `/context`: Manejo de estado global (AuthContext).

  - `/public`: SVGs, imágenes y assets (siluetas del tutorial, etc.).

- **Backend (`/swapp-backend`):**
  - `/app`: Código fuente principal de FastAPI (main.py, routers, models, schemas).

  - `requirements.txt`: Dependencias de Python.

## 6. Variables de Entorno (Environment)

_El proyecto utiliza variables de entorno para no hardcodear datos sensibles:_

- **Frontend:** `NEXT_PUBLIC_API_URL` (Apunta al backend).

- **Backend:** `DATABASE_URL` (Conexión a PostgreSQL), Secret Keys para JWT, y credenciales de Huawei ModelArts.

## 7. Estado Actual / Siguiente Tarea (Actualizable)

- **Último logro:** Se configuró el JWT en el backend para que devuelva `first_name` y `last_name`, y el frontend (Header) ya lo consume correctamente. También se separó la memoria Swap en el ECS de Huawei para compilar Docker sin errores de RAM (Exit code 137).

- **Tarea Inmediata:** Armar la vista del Catálogo consumiendo la tabla `swapp.products` y mostrar los productos en formato grilla.

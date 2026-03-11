Documentación Técnica - Swapp Frontend.

Visión General del Proyecto:

Swapp es una aplicación web progresiva (PWA) diseñada para dispositivos móviles. Su objetivo principal es permitir a los usuarios escanear envases reutilizables utilizando la cámara de su dispositivo e inteligencia artificial para obtener beneficios.
La arquitectura del frontend está construida sobre Next.js 14 (App Router), priorizando el rendimiento, la optimización de imágenes y una estructura de componentes clara. La aplicación funciona en un entorno contenerizado con Docker, comunicándose con un backend desarrollado en Python (FastAPI).

Stack Tecnológico:

- Next.js 14 (App Router): Framework principal de React. Maneja el enrutado, renderizado híbrido (SSR/CSR) y la estructura del proyecto.

- React: Biblioteca para la construcción de la interfaz de usuario basada en componentes.

- TypeScript: Superset de JavaScript que añade tipado estático, mejorando la robustez y el mantenimiento del código.

- Tailwind: CSSFramework de utilidades CSS para un diseño rápido, responsivo y consistente.

- TensorFlow.js / Teachable Machine: Motor de inteligencia artificial en el cliente para el reconocimiento de imágenes directamente en el navegador.

- Context: APIManejo del estado global de la aplicación (específicamente para la autenticación).

Estructura del Proyecto (/CircularApp-Frontend)

A continuación se detalla la organización de los archivos clave dentro del directorio del frontend:

/CircularApp-Frontend
│
├── /.next # Archivos de compilación generados por Next.js (No tocar).
│
├── /app # ➡️ Enrutador Principal (App Router)
│ ├── globals.css # Estilos CSS globales y directivas de Tailwind.
│ ├── layout.tsx # Layout raíz. Envuelve toda la app, define fuentes y proveedores de contexto.
│ └── page.tsx # Página de inicio. Actúa como "semáforo" condicional (Tutorial vs. App Principal).
│
├── /components # ➡️ Bloques de construcción de la UI
│ ├── Scanner.tsx # Componente CORE. Maneja la cámara y el modelo de IA.
│ │
│ └── /swapp # Sub-componentes específicos de la interfaz de marca
│ ├── ActionBtn.tsx # Botones circulares de acción rápida (Historial, Galería, etc.).
│ ├── AuthModal.tsx # Modal emergente para Login y Registro de usuarios.
│ ├── BottomNav.tsx # Barra de navegación inferior (solo visible para usuarios logueados).
│ └── Header.tsx # Barra superior con el logo y menú de perfil.
│
├── /context # ➡️ Estado Global
│ └── AuthContext.tsx # Maneja el estado de sesión del usuario (si está logueado o no).
│
├── /public # ➡️ Archivos Estáticos
│ └── /models # Modelo de IA local. Contiene los archivos exportados por Teachable Machine (model.json, weights.bin, etc.).
│
├── /services # ➡️ Comunicación con el Backend
│ └── api.ts # Funciones para realizar peticiones HTTP a la API de Python.
│
├── /utils # Funciones auxiliares y utilidades compartidas.
│
├── next.config.mjs # Configuración del servidor Next.js.
├── tailwind.config.ts # Configuración de temas, colores y plugins de Tailwind.
└── tsconfig.json # Configuración del compilador de TypeScript.

Arquitectura y Flujo Principal:

La aplicación basa su lógica de navegación en el estado de autenticación del usuario.

1. El Cascarón: Layout Principal (app/layout.tsx):

- Es el componente que envuelve a todas las rutas.

- Responsabilidad: Define la tipografía base (Inter), integra los estilos globales y envuelve la aplicación con el proveedor de estado global (AuthProvider).

- UI: Establece una estructura visual similar a una app nativa, limitando el ancho máximo en pantallas grandes para simular un celular y renderizando el Header y la BottomNav de manera condicional.

2. El "Semáforo" de Entrada (app/page.tsx):

- Es el punto de entrada único. No tiene contenido propio, sino que decide qué vista renderizar basándose en el AuthContext.

- Si NO está autenticado: Renderiza la vista TutorialView. Una pantalla de onboarding ("Página 0") con un efecto visual de "Spotlight" sobre la cámara, diseñada para guiar al usuario a su primer escaneo con la promesa de un descuento.

- Si SÍ está autenticado: Renderiza la vista MainScannerApp. La interfaz completa de la aplicación, con acceso al escáner, historial, galería y menú de navegación completo.

3. El Núcleo de IA: El Escáner (components/Scanner.tsx):

- Este es el componente más crítico. Funciona de forma autónoma para capturar y analizar imágenes.

- Carga del Modelo: Al montarse, carga los archivos del modelo de red neuronal (model.json, metadata.json) almacenados localmente en la carpeta /public/models. Esto asegura una carga rápida sin depender de la red externa.

- Acceso a Cámara: Solicita permisos y accede a la cámara trasera del dispositivo (facingMode: "environment").

Ciclo de Detección:

    1. Muestra el feed de video en tiempo real.

    2. Al capturar, dibuja el frame actual en un <canvas> oculto.

    3. Pasa la imagen del canvas al modelo de TensorFlow.js.

    4. Devuelve la predicción (clase del producto) y el nivel de confianza a la vista padre (page.tsx) para que tome decisiones.

Catálogo de Componentes UI (/components/swapp):

- Header.tsx: Barra superior fija. Muestra el branding de Swapp y el acceso al menú de usuario/perfil.

- BottomNav.tsx: Barra de navegación inferior flotante. Solo aparece cuando el usuario está registrado, permitiendo navegar entre las secciones principales de la app.

- AuthModal.tsx: Componente tipo "pop-up" que maneja los formularios de Inicio de Sesión y Registro. Es invocado tanto desde el tutorial (para reclamar el premio) como desde el header.

- ActionBtn.tsx: Componente de botón reutilizable con ícono y etiqueta, usado en la parte inferior de la pantalla principal para acciones rápidas como ver el historial.

Estado y Servicios

Autenticación (AuthContext.tsx): Utiliza React Context API para mantener el estado de la sesión del usuario accesible en toda la aplicación. Determina qué interfaz se muestra en page.tsx y si se renderiza la BottomNav.

Capa de Servicios (services/api.ts): Centraliza todas las llamadas HTTP (fetch/axios) hacia el backend de FastAPI. Aquí se definen las funciones para registrar un escaneo, crear usuarios, iniciar sesión, etc., manejando los endpoints y la comunicación de datos.

Documentación generada para el equipo de desarrollo de Swapp.
Versión 1.0

// src/services/api.ts
import { base64ToBlob } from "@/utils/imageConverter";

// URL de tu Backend (definida en docker-compose o localhost)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

// ID temporal de Armando Paredes (El que creamos en el Paso 1)
const DEMO_USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

export const registrarEscaneo = async (
  producto: string,
  confianza: number,
  imagenBase64: string
) => {
  try {
    // 1. Convertir Base64 a Archivo Real
    const blob = base64ToBlob(imagenBase64);
    const file = new File([blob], "captura_swapp.jpg", { type: "image/jpeg" });

    // 2. Crear el formulario (FormData) como si fuera un HTML Form
    const formData = new FormData();
    formData.append("producto", producto);
    formData.append("confianza", confianza.toString());
    formData.append("usuario_id", DEMO_USER_ID);
    formData.append("archivo", file); // Aquí va el archivo binario

    // 3. Enviar al Backend
    const response = await fetch(`${API_URL}/registrar-escaneo`, {
      method: "POST",
      body: formData,
      // Nota: No poner 'Content-Type': 'multipart/form-data', 
      // fetch lo pone automático con el boundary correcto.
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al registrar");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en servicio registrarEscaneo:", error);
    throw error;
  }
};
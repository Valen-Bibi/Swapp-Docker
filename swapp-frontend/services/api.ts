const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

export const registrarEscaneo = async (producto: string, confianza: number, imagenBase64: string, userId: number) => {
    try {
        const response = await fetch(`${API_URL}/escaneos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                producto_nombre: producto,
                confianza: confianza,
                imagen_base64: imagenBase64
            }),
        });

        if (!response.ok) {
            throw new Error("Error al registrar el escaneo");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en registrarEscaneo:", error);
        throw error;
    }
};
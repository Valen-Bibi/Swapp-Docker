"use client";

import { useState, useRef, useEffect } from "react";
import Scanner, { ScannerHandle } from "@/components/Scanner";
import ActionBtn from "@/components/swapp/ActionBtn";
import { registrarEscaneo } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { playShutterSound } from "@/utils/audio";
import BottomNav from "@/components/swapp/BottomNav";

export default function MainScannerApp() {
	const { user } = useAuth();

	const [detectedProduct, setDetectedProduct] = useState<string | null>(null);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [isCameraReady, setIsCameraReady] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [showFlash, setShowFlash] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [confidenceValue, setConfidenceValue] = useState<number>(0);
	const scannerRef = useRef<ScannerHandle>(null);

	useEffect(() => {
		const sincronizarEscaneoPendiente = async () => {
			if (user?.id) {
				const escaneoGuardado = localStorage.getItem("swapp_escaneo_pendiente");

				if (escaneoGuardado) {
					localStorage.removeItem("swapp_escaneo_pendiente");

					try {
						const datos = JSON.parse(escaneoGuardado);

						await registrarEscaneo(
							datos.producto,
							datos.confianza,
							datos.imagen,
							user.id,
						);

						console.log("✅ Escaneo de invitado sincronizado con éxito!");
					} catch (error) {
						console.error(
							"❌ Error al sincronizar el escaneo pendiente",
							error,
						);
					}
				}
			}
		};

		sincronizarEscaneoPendiente();
	}, [user]);

	const handleShutterClick = async () => {
		if (!isCameraReady) {
			await scannerRef.current?.startCamera();
			setIsCameraReady(true);
		} else {
			setDetectedProduct(null);
			playShutterSound();
			if (navigator.vibrate) navigator.vibrate(50);
			setShowFlash(true);
			setTimeout(() => setShowFlash(false), 150);
			setIsAnalyzing(true);
			scannerRef.current?.capture();
		}
	};

	const handleScanResult = (
		producto: string,
		confianza: number,
		imagen: string,
	) => {
		setCapturedImage(imagen);
		setIsAnalyzing(false);
		setConfidenceValue(confianza);

		// Recordatorio: Si en el futuro la base de datos requiere IDs exactos en lugar de strings,
		// este es el momento donde deberás mapear el string (ej: "Botella 500ml") al ID de tu tabla products.
		if (confianza > 0.8 && producto !== "background" && producto !== "") {
			setDetectedProduct(producto);
			if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
		} else {
			console.log("No se detectó objeto claro.");
		}
	};

	const handleRetake = () => {
		setCapturedImage(null);
		setDetectedProduct(null);
		setConfidenceValue(0);
	};

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const performSave = async () => {
		if (!detectedProduct || !capturedImage || !user?.id) return;

		try {
			setIsSaving(true);
			const resultado = await registrarEscaneo(
				detectedProduct,
				confidenceValue,
				capturedImage,
				user.id,
			);
			alert(`✅ ¡Guardado! Producto registrado.`);
			handleRetake();
		} catch (error) {
			console.error(error);
			alert("❌ Error al guardar. Revisá la consola.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col h-full min-h-screen bg-swapp-navy relative">
			{/* CONTENEDOR PRINCIPAL DE LA CÁMARA */}
			<div
				className={`transition-all duration-500 ease-in-out shadow-2xl overflow-hidden bg-black ${
					isExpanded
						? "fixed inset-0 z-[100] w-full h-full rounded-none"
						: "relative w-[90%] mx-auto mt-6 rounded-3xl h-[65vh] z-10 border border-white/10"
				}`}>
				<Scanner
					ref={scannerRef}
					onScan={handleScanResult}
					className="absolute inset-0 w-full h-full z-0"
				/>

				{/* EFECTO DE FLASH */}
				<div
					className={`absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 ${
						showFlash ? "opacity-100" : "opacity-0"
					}`}></div>

				{/* ANIMACIÓN DE ANALIZANDO (Igual al Tutorial) */}
				{isAnalyzing && (
					<div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
						<div className="w-12 h-12 border-4 border-swapp-mint border-t-transparent rounded-full animate-spin mb-4"></div>
						<p className="text-white font-bold tracking-widest animate-pulse">
							ANALIZANDO...
						</p>
					</div>
				)}

				{/* RESULTADO Y CONTROLES (Cuando hay captura) */}
				{capturedImage && !isAnalyzing && (
					<>
						{/* Imagen Capturada de fondo */}
						<div className="absolute inset-0 z-10 bg-black animate-fadeIn">
							<img
								src={capturedImage}
								alt="Captura"
								className="w-full h-full object-cover"
							/>
						</div>

						{/* Gradiente oscuro abajo para que el texto sea legible */}
						<div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-20 pointer-events-none"></div>

						{/* Panel de Información del Producto */}
						<div className="absolute bottom-0 left-0 w-full p-6 z-30 flex flex-col items-center animate-slideUp">
							<span className="text-4xl mb-2">✨</span>
							<h3 className="text-gray-300 text-sm font-medium uppercase tracking-widest mb-2">
								{detectedProduct ? "Producto Identificado" : "No detectado"}
							</h3>

							<div
								className={`px-6 py-3 rounded-xl text-xl font-black shadow-lg mb-8 uppercase text-center border-2 ${
									detectedProduct
										? "bg-swapp-mint text-swapp-dark border-transparent"
										: "bg-red-500/20 text-red-100 border-red-500/50"
								}`}>
								{detectedProduct || "Intenta acercar el envase"}
							</div>

							<div className="flex w-full gap-4">
								<button
									onClick={handleRetake}
									disabled={isSaving}
									className="flex-1 bg-white/10 border border-white/20 backdrop-blur-md text-white py-4 rounded-xl font-medium hover:bg-white/20 transition disabled:opacity-50">
									Volver
								</button>
								<button
									onClick={performSave}
									disabled={!detectedProduct || isSaving}
									className={`flex-1 py-4 rounded-xl font-bold transition shadow-[0_0_20px_rgba(0,255,170,0.3)] ${
										detectedProduct
											? "bg-swapp-mint text-swapp-dark hover:scale-105"
											: "bg-gray-600 text-gray-400 cursor-not-allowed shadow-none"
									} ${isSaving ? "animate-pulse cursor-wait" : ""}`}>
									{isSaving ? "Guardando..." : "Confirmar"}
								</button>
							</div>
						</div>
					</>
				)}

				{/* CONTROLES DE CÁMARA (Cuando NO hay captura) */}
				{!capturedImage && !isAnalyzing && (
					<div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-between items-center px-10 z-30 pointer-events-none">
						{/* Placeholder para centrar el botón principal */}
						<div className="w-12"></div>

						{/* BOTÓN DISPARADOR (Igual al Tutorial) */}
						<button
							onClick={handleShutterClick}
							className={`pointer-events-auto w-20 h-20 rounded-full border-4 flex items-center justify-center transition active:scale-95 bg-transparent ${
								!isCameraReady
									? "border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 animate-pulse"
									: "border-swapp-mint"
							}`}>
							<div
								className={`w-16 h-16 rounded-full backdrop-blur-sm ${
									!isCameraReady ? "bg-white/90" : "bg-white/50"
								}`}></div>
						</button>

						{/* BOTÓN DE EXPANDIR/CONTRAER */}
						<button
							onClick={toggleExpand}
							className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:text-swapp-mint hover:bg-black/60 backdrop-blur-md transition border border-white/10">
							{isExpanded ? (
								<svg
									className="w-6 h-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 14h4v4M4 14l5 5m11-5h-4v4m4-4l-5 5M4 10h4V6m-4 4l5-5m11 5h-4V6m4 4l-5-5"
									/>
								</svg>
							) : (
								<svg
									className="w-6 h-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
									/>
								</svg>
							)}
						</button>
					</div>
				)}
			</div>

			{!isExpanded && <BottomNav />}
		</div>
	);
}

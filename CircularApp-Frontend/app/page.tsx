"use client";

import { useState, useRef } from "react";
// Componentes
import Scanner, { ScannerHandle } from "@/components/Scanner";
import ActionBtn from "@/components/swapp/ActionBtn";
import AuthModal from "@/components/swapp/AuthModal"; // 👈 FALTABA ESTO

// Lógica y Contexto
import { registrarEscaneo } from "@/services/api";
import { useAuth } from "@/context/AuthContext"; // 👈 FALTABA ESTO

// --- FUNCIÓN HELPER: GENERADOR DE SONIDO (SHUTTER) ---
const playShutterSound = () => {
	try {
		const AudioContext =
			window.AudioContext || (window as any).webkitAudioContext;
		if (!AudioContext) return;

		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.type = "sine";
		osc.frequency.setValueAtTime(1200, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

		gain.gain.setValueAtTime(0.3, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

		osc.start();
		osc.stop(ctx.currentTime + 0.1);
	} catch (e) {
		console.error("Audio no soportado");
	}
};

export default function Home() {
	const { isAuthenticated } = useAuth(); // 👈 Usamos el contexto para saber si es Armando o Invitado

	// --- ESTADOS ---
	const [detectedProduct, setDetectedProduct] = useState<string | null>(null);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);

	// UI/UX
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [isCameraReady, setIsCameraReady] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [showFlash, setShowFlash] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false); // 👈 Controla el modal

	// Datos
	const [isSaving, setIsSaving] = useState(false);
	const [confidenceValue, setConfidenceValue] = useState<number>(0);

	const scannerRef = useRef<ScannerHandle>(null);

	// --- HANDLERS (FUNCIONES) ---

	// 1. Botón Disparo (Shutter)
	const handleShutterClick = async () => {
		if (!isCameraReady) {
			console.log("Solicitando cámara...");
			await scannerRef.current?.startCamera();
			setIsCameraReady(true);
		} else {
			console.log("Capturando...");
			setDetectedProduct(null);

			playShutterSound();
			if (navigator.vibrate) navigator.vibrate(50);

			setShowFlash(true);
			setTimeout(() => setShowFlash(false), 150);

			setIsAnalyzing(true);
			scannerRef.current?.capture();
		}
	};

	// 2. Resultado del Escáner
	const handleScanResult = (
		producto: string,
		confianza: number,
		imagen: string,
	) => {
		setCapturedImage(imagen);
		setIsAnalyzing(false);
		setConfidenceValue(confianza);

		if (confianza > 0.85 && producto !== "Nada") {
			console.log(`¡Detectado! ${producto}`);
			setDetectedProduct(producto);
			if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
		} else {
			console.log("No se detectó objeto claro.");
		}
	};

	// 3. Botón Volver (Retake)
	const handleRetake = () => {
		setCapturedImage(null);
		setDetectedProduct(null);
		setConfidenceValue(0);
	};

	// 4. Botón Expandir/Contraer
	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	// 5. Lógica Real de Guardado
	const performSave = async () => {
		if (!detectedProduct || !capturedImage) return;

		try {
			setIsSaving(true);
			const resultado = await registrarEscaneo(
				detectedProduct,
				confidenceValue,
				capturedImage,
			);

			console.log("Guardado en BD:", resultado);
			alert(`✅ ¡Guardado! Producto "${resultado.producto}" registrado.`);
			handleRetake();
		} catch (error) {
			console.error(error);
			alert("❌ Error al guardar. Revisa que el Backend esté corriendo.");
		} finally {
			setIsSaving(false);
		}
	};

	// 6. Botón Confirmar (El Portero 🛡️)
	const handleConfirm = () => {
		if (isAuthenticated) {
			// Si ya está logueado, guarda directo
			performSave();
		} else {
			// Si NO está logueado, abre el modal
			setShowAuthModal(true); // 👈 AQUI SE ABRE EL MODAL
		}
	};

	// --- RENDERIZADO (JSX) ---
	return (
		<div className="flex flex-col h-full relative">
			{/* --- MODAL DE LOGIN (Invisible hasta que se active) --- */}
			{/* 👇 FALTABA ESTE COMPONENTE */}
			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				onSuccess={() => {
					setShowAuthModal(false); // Cerramos modal
					performSave(); // Guardamos automáticamente al terminar el login
				}}
			/>

			{/* SECCIÓN 1: Visor de Cámara */}
			<div
				className={`
            transition-all duration-500 ease-in-out shadow-2xl overflow-hidden bg-swapp-dark
            ${
							isExpanded
								? "fixed inset-0 z-50 w-full h-full max-w-md mx-auto rounded-none"
								: "relative w-[90%] mx-auto mt-4 rounded-2xl h-[65%] z-10"
						}
        `}>
				<Scanner
					ref={scannerRef}
					onScan={handleScanResult}
					className="absolute inset-0 w-full h-full z-0"
				/>

				<div
					className={`absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 ${showFlash ? "opacity-100" : "opacity-0"}`}></div>

				{capturedImage && (
					<div className="absolute inset-0 z-10 bg-black animate-fadeIn">
						<img
							src={capturedImage}
							alt="Captura"
							className="w-full h-full object-cover"
						/>
						{isAnalyzing && <div className="absolute inset-0 bg-black/40" />}
					</div>
				)}

				{isAnalyzing && (
					<div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white">
						<div className="w-12 h-12 border-4 border-swapp-mint border-t-transparent rounded-full animate-spin mb-2"></div>
						<span className="font-bold text-sm tracking-wide animate-pulse">
							ANALIZANDO...
						</span>
					</div>
				)}

				<div className="absolute inset-0 opacity-20 pointer-events-none z-20">
					<div className="w-full h-full grid grid-cols-3 grid-rows-3">
						<div className="border-r border-b border-white/30"></div>
						<div className="border-r border-b border-white/30"></div>
						<div className="border-b border-white/30"></div>
						<div className="border-r border-b border-white/30"></div>
						<div className="border-r border-b border-white/30"></div>
						<div className="border-b border-white/30"></div>
						<div className="border-r border-white/30"></div>
						<div className="border-r border-white/30"></div>
						<div></div>
					</div>
				</div>

				{/* CAPA 4: Controles */}
				{capturedImage && !isAnalyzing ? (
					// --- MODO REVISIÓN ---
					<>
						{detectedProduct && (
							<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-swapp-mint text-swapp-dark px-6 py-2 rounded-full text-sm font-bold shadow-lg z-30 animate-bounce">
								✨ {detectedProduct} ✨
							</div>
						)}

						{isExpanded && (
							<button
								onClick={toggleExpand}
								className="absolute top-4 right-4 text-white bg-black/20 p-2 rounded-full backdrop-blur-md z-50 hover:bg-black/40">
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						)}

						<div className="absolute bottom-6 left-0 w-full flex gap-4 px-6 z-30">
							<button
								onClick={handleRetake}
								disabled={isSaving}
								className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 rounded-xl font-medium hover:bg-white/30 transition flex items-center justify-center gap-2 disabled:opacity-50">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Volver
							</button>
							<button
								onClick={handleConfirm}
								disabled={!detectedProduct || isSaving}
								className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg 
                            ${detectedProduct ? "bg-swapp-mint text-swapp-dark hover:scale-105" : "bg-gray-500/50 text-gray-300 cursor-not-allowed"}
                            ${isSaving ? "animate-pulse cursor-wait" : ""}
                        `}>
								{isSaving ? (
									<span>Guardando...</span>
								) : (
									<>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={3}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Confirmar
									</>
								)}
							</button>
						</div>
					</>
				) : (
					!isAnalyzing && (
						// --- MODO CÁMARA EN VIVO ---
						<div className="absolute bottom-6 left-0 w-full flex justify-between items-center px-8 z-30">
							<div className="w-8 h-8"></div>

							<button
								className={`w-20 h-20 rounded-full border-4 flex items-center justify-center hover:scale-105 transition active:scale-95 ${isCameraReady ? "border-white" : "border-swapp-mint animate-pulse"}`}
								onClick={handleShutterClick}>
								<div
									className={`w-16 h-16 rounded-full transition-all duration-300 flex items-center justify-center ${!isCameraReady ? "bg-swapp-mint" : "bg-white/80"}`}>
									{!isCameraReady && (
										<svg
											className="w-8 h-8 text-swapp-dark"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
									)}
								</div>
							</button>

							<button
								onClick={toggleExpand}
								className="text-white hover:text-swapp-mint transition p-2">
								{isExpanded ? (
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 9L4 4m0 0l5 5M4 4h5m-5 0v5m11 5l5 5m0 0l-5-5m5 5v-5m0 5h-5"
										/>
									</svg>
								) : (
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
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
					)
				)}
			</div>

			<div className="bg-white mx-6 mt-8 rounded-2xl p-6 shadow-inner flex justify-between items-center h-40 relative z-0">
				<ActionBtn
					label="Catálogo"
					icon={
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
						/>
					}
				/>
				<ActionBtn
					label="Historial"
					active
					icon={
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					}
				/>
				<ActionBtn
					label="Galería"
					icon={
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					}
				/>
			</div>
		</div>
	);
}

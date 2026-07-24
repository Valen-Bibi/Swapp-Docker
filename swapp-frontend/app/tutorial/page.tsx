"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Scanner, { ScannerHandle } from "@/components/Scanner";
import BackButton from "@/components/swapp/BackButton";
import ModelViewer from "@/components/swapp/ModelViewer"; // <-- Importamos el visor 3D

type TutorialStep =
	| "INTRO_SCAN"
	| "READY_TO_SCAN"
	| "SCANNING"
	| "SUCCESS_5000"
	| "ERROR_RETRY";

const SiluetaAnimada = () => {
	const siluetas = [
		"/siluetas/botella.svg",
		"/siluetas/cilindro.svg",
		"/siluetas/maquina.svg",
	];

	const [index, setIndex] = useState(0);
	const [isFlipping, setIsFlipping] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsFlipping(true);
			setTimeout(() => {
				setIndex((prevIndex) => (prevIndex + 1) % siluetas.length);
				setIsFlipping(false);
			}, 300);
		}, 1500);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="w-20 h-32 flex items-center justify-center relative">
			<div className="absolute inset-0 bg-swapp-verde-agua/10 blur-lg rounded-full"></div>
			<img
				src={siluetas[index]}
				alt="Silueta de envase"
				className={`w-full h-full object-contain relative z-10 transition-all duration-300 ease-in-out drop-shadow-[0_0_8px_rgba(1,195,142,0.5)] ${
					isFlipping ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
				}`}
			/>
		</div>
	);
};

export default function TutorialView() {
	const [step, setTutorialStep] = useState<TutorialStep>("INTRO_SCAN");
	const [failedAttempts, setFailedAttempts] = useState(0);

	// --- NUEVOS ESTADOS PARA MOSTRAR EL RESULTADO ---
	const [detectedProductName, setDetectedProductName] = useState<string | null>(
		null,
	);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	// ------------------------------------------------

	const scannerRef = useRef<ScannerHandle>(null);
	const router = useRouter();

	const { completeTutorial } = useAuth();

	useEffect(() => {
		const pendingScan = localStorage.getItem("swapp_escaneo_pendiente");
		if (pendingScan) {
			try {
				const data = JSON.parse(pendingScan);
				setDetectedProductName(data.producto);
				setCapturedImageUrl(data.imagen);
				setTutorialStep("SUCCESS_5000");
			} catch (e) {
				console.error("Error al leer el escaneo pendiente", e);
			}
		}
	}, []);

	const handleMainAction = async () => {
		if (step === "INTRO_SCAN") {
			await scannerRef.current?.startCamera();
			setTutorialStep("READY_TO_SCAN");
		} else if (step === "READY_TO_SCAN") {
			setTutorialStep("SCANNING");
			if (navigator.vibrate) navigator.vibrate(50);
			scannerRef.current?.capture();
		}
	};

	const handleRestartCamera = async () => {
		localStorage.removeItem("swapp_escaneo_pendiente");
		setDetectedProductName(null);
		setCapturedImageUrl(null);
		setTutorialStep("READY_TO_SCAN");
		await scannerRef.current?.startCamera();
	};

	const handleFinishTutorial = (path: string) => {
		completeTutorial();
		router.push(path);
	};

	const handleBackToIntro = () => {
		scannerRef.current?.stopCamera();
		setTutorialStep("INTRO_SCAN");
	};

	const handleTutorialScan = (
		producto: string,
		confianza: number,
		imagen: string,
	) => {
		scannerRef.current?.stopCamera();

		if (confianza > 0.8 && producto !== "background" && producto !== "") {
			try {
				const escaneoPendiente = {
					producto: producto,
					confianza: confianza,
					imagen: imagen,
				};
				localStorage.setItem(
					"swapp_escaneo_pendiente",
					JSON.stringify(escaneoPendiente),
				);
				// Guardamos en estado para renderizar en pantalla
				setDetectedProductName(producto);
				setCapturedImageUrl(imagen);
			} catch (e) {
				console.error("Error al guardar en localStorage", e);
			}
			if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
			setTutorialStep("SUCCESS_5000");
			setFailedAttempts(0);
		} else {
			setFailedAttempts((prev) => prev + 1);
			setTutorialStep("ERROR_RETRY");
		}
	};

	return (
		<div className="fixed inset-0 bg-black flex items-center justify-center z-[60] overflow-hidden">
			<div className="relative w-full h-full sm:w-[400px] sm:h-[850px] sm:max-h-[90vh] bg-swapp-negro sm:rounded-[32px] overflow-hidden sm:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
				{step === "READY_TO_SCAN" && (
					<BackButton
						onClick={handleBackToIntro}
						className="absolute top-8 left-6 z-50 animate-fadeIn"
					/>
				)}

				{(step === "INTRO_SCAN" ||
					step === "READY_TO_SCAN" ||
					step === "ERROR_RETRY") && (
					<div className="absolute top-8 right-6 z-50 animate-fadeIn">
						<button
							onClick={() => handleFinishTutorial("/login")}
							className="text-white/80 hover:text-white text-sm font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-lg">
							Omitir Tutorial
						</button>
					</div>
				)}

				{/* Solo montamos la cámara si NO estamos en la pantalla de éxito, para dar lugar al 3D */}
				{step !== "SUCCESS_5000" && (
					<div className="absolute inset-0 bg-swapp-negro-azulado z-0">
						<Scanner
							ref={scannerRef}
							onScan={handleTutorialScan}
							className="w-full h-full object-cover"
						/>
					</div>
				)}

				{step === "INTRO_SCAN" && (
					<div className="absolute inset-0 bg-swapp-negro-azulado/90 backdrop-blur-sm z-40 pointer-events-none flex flex-col items-center justify-center">
						<div className="absolute top-[15%] px-8 text-center">
							<h2 className="text-white text-4xl font-black mb-3 tracking-tight">
								¡Empezá a ahorrar!
							</h2>
							<p className="text-swapp-tiza text-m mb-8 leading-relaxed">
								Tomá una foto de tu envase vacío o máquina para obtener un
								descuento inmediato.
							</p>
						</div>
						<div className="absolute bottom-[30%] z-50 pointer-events-none flex flex-col items-center">
							<SiluetaAnimada />
							<span className="text-swapp-menta text-xs text-center mt-20 font-bold tracking-[0.2em] uppercase opacity-80">
								La IA detectará tu modelo
							</span>
						</div>
					</div>
				)}

				{(step === "INTRO_SCAN" || step === "READY_TO_SCAN") && (
					<>
						<div
							className={`absolute bottom-24 left-1/2 -translate-x-1/2 ${step === "INTRO_SCAN" ? "z-50" : "z-30"}`}>
							<button
								onClick={handleMainAction}
								className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 active:scale-90 bg-transparent
                  ${step === "INTRO_SCAN" ? "border-swapp-verde-agua shadow-[0_0_15px_rgba(1,195,142,0.6)] hover:scale-105" : "border-swapp-tiza shadow-lg"}
                `}>
								<div
									className={`w-16 h-16 rounded-full backdrop-blur-md ${step === "INTRO_SCAN" ? "bg-swapp-tiza" : "bg-white/60"}`}></div>
							</button>
						</div>
						<div
							className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-6 text-center ${step === "INTRO_SCAN" ? "z-50" : "z-30"}`}>
							<button
								onClick={() => handleFinishTutorial("/catalogo")}
								className="text-sm font-medium text-swapp-tiza underline underline-offset-4 transition-colors cursor-pointer pointer-events-auto">
								¿No tenés un envase? Ver catálogo
							</button>
						</div>
					</>
				)}

				{step === "SCANNING" && (
					<div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
						<div className="absolute inset-0 bg-swapp-azul-petroleo/60 backdrop-blur-sm"></div>
						<div className="relative z-10 flex flex-col items-center">
							<div className="w-16 h-16 border-4 border-swapp-verde-agua/30 border-t-swapp-verde-agua rounded-full animate-spin mb-6 drop-shadow-[0_0_8px_rgba(1,195,142,1)]"></div>
							<p className="text-swapp-menta font-black text-lg tracking-[0.3em] animate-pulse drop-shadow-[0_0_5px_rgba(1,195,142,0.8)]">
								ANALIZANDO
							</p>
							<p className="text-swapp-tiza/60 text-xs mt-2 font-mono tracking-widest">
								MOTOR IA ACTIVO
							</p>
						</div>
					</div>
				)}

				{/* --- NUEVA VISTA DE ÉXITO CON 3D INTEGRADO --- */}
				{step === "SUCCESS_5000" && capturedImageUrl && (
					<div className="absolute inset-0 z-10 bg-swapp-negro-azulado flex flex-col items-center justify-start overflow-hidden pt-10 animate-fadeIn">
						{/* Imagen de fondo desenfocada */}
						<img
							src={capturedImageUrl}
							alt="Fondo"
							className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110"
						/>

						{/* Modelo 3D */}
						<div className="relative z-20 w-56 h-64 flex items-center justify-center mt-4">
							<ModelViewer modelPath="/models/maquina_terra.glb" />
						</div>

						{/* Panel inferior */}
						<div className="absolute bottom-0 left-0 w-full p-6 z-30 flex flex-col animate-slideUp bg-gradient-to-t from-swapp-negro-azulado via-swapp-negro-azulado/95 to-transparent pt-12 text-center">
							<p className="text-swapp-menta text-sm font-bold uppercase tracking-widest mb-1">
								¡Qué buena elección!
							</p>
							<h3 className="text-white text-2xl font-black mb-6 drop-shadow-md">
								{detectedProductName || "Producto Detectado"}
							</h3>

							<div className="flex flex-col gap-3 w-full">
								<button
									onClick={() => handleFinishTutorial("/registro")}
									className="w-full bg-swapp-menta text-swapp-negro-azulado py-4 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(128,225,199,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
									Guardar en mi cuenta
								</button>
								<button
									onClick={handleRestartCamera}
									className="w-full bg-white/10 text-white border border-white/20 py-4 rounded-xl font-medium hover:bg-white/20 active:scale-95 transition-all">
									Escanear otro producto
								</button>
							</div>
						</div>
					</div>
				)}

				{step === "ERROR_RETRY" && (
					<div className="absolute inset-0 bg-swapp-negro-azulado/95 backdrop-blur-md z-50 flex flex-col items-center justify-center px-8 text-center animate-fadeIn">
						<div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
							<span className="text-6xl opacity-80">🤔</span>
						</div>
						<h2 className="text-2xl font-black text-white mb-3">
							No pudimos identificar tu producto
						</h2>
						<p className="text-swapp-tiza/80 mb-10 text-lg">
							{failedAttempts >= 2
								? "Parece que este producto no está en nuestra base de datos."
								: "Intentá que el producto esté centrado y haya buena luz en la habitación."}
						</p>
						<button
							onClick={handleRestartCamera}
							className="bg-swapp-tiza text-swapp-negro-azulado w-full py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all mb-5">
							Intentar de nuevo
						</button>
						<button
							onClick={() => handleFinishTutorial("/catalogo")}
							className="text-swapp-verde-agua font-bold tracking-wide pointer-events-auto">
							Explorar catálogo manual
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

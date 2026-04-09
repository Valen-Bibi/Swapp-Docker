"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import Scanner, { ScannerHandle } from "@/components/Scanner";
import BackButton from "@/components/swapp/BackButton";

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
	const scannerRef = useRef<ScannerHandle>(null);
	const router = useRouter();

	const { completeTutorial } = useAuth();

	useEffect(() => {
		const pendingScan = localStorage.getItem("swapp_escaneo_pendiente");
		if (pendingScan) {
			setTutorialStep("SUCCESS_5000");
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
		setTutorialStep("READY_TO_SCAN");
		await scannerRef.current?.startCamera();
	};

	const handleFinishTutorial = (path: string) => {
		completeTutorial();
		router.push(path);
	};

	// --- 2. Función para volver a la pantalla inicial ---
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
				{/* --- 3. Renderizamos el BackButton cuando la cámara está activa --- */}
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

				<div className="absolute inset-0 bg-swapp-negro-azulado z-0">
					<Scanner
						ref={scannerRef}
						onScan={handleTutorialScan}
						className="w-full h-full object-cover"
					/>
				</div>

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

				{step === "SUCCESS_5000" && (
					<div className="absolute inset-0 bg-gradient-to-br from-swapp-verde-agua to-swapp-turquesa-oscuro z-50 flex flex-col items-center justify-center px-8 text-swapp-negro-azulado text-center animate-fadeIn">
						<div className="bg-white/20 p-6 rounded-full backdrop-blur-md mb-6 shadow-2xl">
							<span className="text-6xl drop-shadow-md">🎉</span>
						</div>
						<h2 className="text-4xl font-black mb-3 text-white drop-shadow-md">
							¡Detectado!
						</h2>
						<p className="text-xl font-medium mb-10 text-swapp-negro-azulado">
							Tenés{" "}
							<span className="font-black bg-white px-3 py-1.5 rounded-lg shadow-sm text-2xl">
								$5.000 a favor
							</span>
							<br />
							<span className="text-sm mt-2 block opacity-80 font-bold">
								para tu próxima recarga.
							</span>
						</p>
						<button
							onClick={() => handleFinishTutorial("/registro")}
							className="bg-swapp-negro-azulado text-white w-full py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">
							Reclamar mis $5.000
						</button>
						<button
							onClick={handleRestartCamera}
							className="mt-6 text-sm font-bold text-swapp-negro-azulado/60 hover:text-swapp-negro-azulado transition-colors">
							Escanear otro producto
						</button>
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

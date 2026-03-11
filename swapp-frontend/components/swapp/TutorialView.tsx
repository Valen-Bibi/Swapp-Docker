"use client";

import { useState, useRef, useEffect } from "react";
import Scanner, { ScannerHandle } from "@/components/Scanner";
import { playShutterSound } from "@/utils/audio";

type TutorialStep =
	| "INTRO_SCAN"
	| "READY_TO_SCAN"
	| "SCANNING"
	| "SUCCESS_5000"
	| "ERROR_RETRY"
	| "CATALOG_VIEW";

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
		<div className="w-24 h-40 flex items-center justify-center">
			<img
				src={siluetas[index]}
				alt="Silueta de envase"
				className={`w-full h-full object-contain transition-all duration-300 ease-in-out drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${
					isFlipping ? "scale-x-0 opacity-20" : "scale-x-100 opacity-90"
				}`}
			/>
		</div>
	);
};

export default function TutorialView({
	onRegisterClick,
}: {
	onRegisterClick: () => void;
}) {
	const [step, setTutorialStep] = useState<TutorialStep>("INTRO_SCAN");
	const [failedAttempts, setFailedAttempts] = useState(0);
	const scannerRef = useRef<ScannerHandle>(null);

	const handleMainAction = async () => {
		if (step === "INTRO_SCAN") {
			await scannerRef.current?.startCamera();
			setTutorialStep("READY_TO_SCAN");
		} else if (step === "READY_TO_SCAN") {
			setTutorialStep("SCANNING");
			scannerRef.current?.capture();
		}
	};

	const handleRestartCamera = async () => {
		setTutorialStep("READY_TO_SCAN");
		await scannerRef.current?.startCamera();
	};

	const handleTutorialScan = (
		producto: string,
		confianza: number,
		imagen: string,
	) => {
		console.log(
			`IA del Tutorial dice: ${producto} al ${(confianza * 100).toFixed(1)}%`,
		);

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
				console.log("🎒 Escaneo de invitado guardado en memoria local");
			} catch (e) {
				console.error("Error al guardar en localStorage", e);
			}

			setTutorialStep("SUCCESS_5000");
			setFailedAttempts(0);
		} else {
			setFailedAttempts((prev) => prev + 1);
			setTutorialStep("ERROR_RETRY");
		}
	};

	return (
		<div className="fixed inset-0 flex flex-col bg-gray-900 overflow-hidden z-[60]">
			{/* CAPA 1: Cámara real */}
			<div className="absolute inset-0 bg-black z-0">
				<Scanner
					ref={scannerRef}
					onScan={handleTutorialScan}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* CAPA 2: EL OVERLAY OSCURO (SPOTLIGHT) */}
			{step === "INTRO_SCAN" && (
				<div className="absolute inset-0 bg-black/80 z-40 pointer-events-none flex flex-col items-center justify-center">
					<div className="absolute top-1/4 px-8 text-center animate-pulse">
						<h2 className="text-white text-3xl font-bold mb-2">
							¡Empezá a ahorrar!
						</h2>
						<p className="text-gray-300 text-lg mb-6">
							Tomá una foto de tu envase vacío para obtener un descuento.
						</p>
						<div className="inline-block bg-swapp-dark/60 text-swapp-mint px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm">
							Tocá el botón y dale permiso a la cámara
						</div>
					</div>

					<div className="absolute bottom-40 mb-4 z-50 pointer-events-none flex flex-col items-center">
						<SiluetaAnimada />
						<span className="text-swapp-mint text-xs text-center mt-4 font-semibold tracking-wider animate-pulse">
							ENFOCÁ TU ENVASE
						</span>
					</div>
				</div>
			)}

			{/* CAPA 3: CONTROLES DE LA CÁMARA */}
			{(step === "INTRO_SCAN" || step === "READY_TO_SCAN") && (
				<>
					<div
						className={`absolute bottom-16 left-1/2 -translate-x-1/2 ${step === "INTRO_SCAN" ? "z-50" : "z-30"}`}>
						<button
							onClick={handleMainAction}
							className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition active:scale-95 bg-transparent
                ${step === "INTRO_SCAN" ? "border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105" : "border-swapp-mint"}
              `}>
							<div
								className={`w-16 h-16 rounded-full backdrop-blur-sm ${step === "INTRO_SCAN" ? "bg-white/90" : "bg-white/50"}`}></div>
						</button>
					</div>

					<div
						className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-6 text-center ${step === "INTRO_SCAN" ? "z-50" : "z-30"}`}>
						<button
							onClick={() => setTutorialStep("CATALOG_VIEW")}
							className="text-sm text-gray-300 underline underline-offset-4 hover:text-white transition cursor-pointer pointer-events-auto">
							¿No tenés un envase vacío? Ver catálogo completo
						</button>
					</div>
				</>
			)}

			{/* ESTADO: ESCANEANDO */}
			{step === "SCANNING" && (
				<div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
					<div className="w-12 h-12 border-4 border-swapp-mint border-t-transparent rounded-full animate-spin mb-4"></div>
					<p className="text-white font-bold tracking-widest animate-pulse">
						ANALIZANDO...
					</p>
				</div>
			)}

			{/* ESTADO: ÉXITO */}
			{step === "SUCCESS_5000" && (
				<div className="absolute inset-0 bg-swapp-mint/95 z-50 flex flex-col items-center justify-center px-6 text-swapp-dark text-center animate-fadeIn">
					<span className="text-6xl mb-4">🎉</span>
					<h2 className="text-3xl font-black mb-2">¡Envase detectado!</h2>
					<p className="text-xl font-medium mb-8">
						Tenés{" "}
						<span className="font-bold bg-white px-2 py-1 rounded-md">
							$5.000 a favor
						</span>{" "}
						para tu próxima recarga.
					</p>
					<button
						onClick={onRegisterClick}
						className="bg-swapp-dark text-white w-full py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition">
						Reclamar mis $5.000
					</button>
					<button
						onClick={handleRestartCamera}
						className="mt-4 text-sm font-medium text-swapp-dark/70 hover:text-swapp-dark">
						Escanear otro producto
					</button>
				</div>
			)}

			{/* ESTADO: ERROR / REINTENTO */}
			{step === "ERROR_RETRY" && (
				<div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center px-6 text-center animate-fadeIn">
					<span className="text-6xl mb-4">🤔</span>
					<h2 className="text-2xl font-bold text-white mb-2">
						Producto no detectado
					</h2>

					<p className="text-gray-300 mb-8">
						{failedAttempts >= 2
							? "Sigue sin detectarse el producto. Te recomendamos revisar el catálogo."
							: "Asegurate de que el envase esté bien iluminado y centrado."}
					</p>

					<button
						onClick={handleRestartCamera}
						className="bg-white text-swapp-dark w-full py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition mb-4">
						Volver a intentar
					</button>

					<button
						onClick={() => setTutorialStep("CATALOG_VIEW")}
						className="text-swapp-mint font-medium underline underline-offset-4">
						Ver catálogo
					</button>
				</div>
			)}

			{/* ESTADO: CATÁLOGO */}
			{step === "CATALOG_VIEW" && (
				<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center">
					<h2 className="text-2xl font-bold text-swapp-dark mb-4">
						Catálogo Swapp
					</h2>
					<p className="text-gray-500 mb-8">
						Acá irá la lista de productos disponibles.
					</p>
					<button
						onClick={() => setTutorialStep("INTRO_SCAN")}
						className="px-6 py-2 border-2 border-swapp-dark rounded-lg font-bold">
						Volver al inicio
					</button>
				</div>
			)}
		</div>
	);
}

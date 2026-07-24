"use client";

import {
	useEffect,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
} from "react";

export interface ScannerHandle {
	startCamera: () => Promise<void>;
	capture: () => void;
	stopCamera: () => void;
}

interface ScannerProps {
	onScan: (producto: string, confianza: number, imagen: string) => void;
	className?: string;
}

// 1. Apuntamos a tu nuevo cerebro en el backend
const API_URL = "http://localhost:7860/api/detectar-envase";

const Scanner = forwardRef<ScannerHandle, ScannerProps>(
	({ onScan, className }, ref) => {
		const videoRef = useRef<HTMLVideoElement>(null);
		const [isCameraActive, setIsCameraActive] = useState(false);
		const [isAnalyzing, setIsAnalyzing] = useState(false); // Para evitar doble captura por accidente

		// Ya no hay useEffect que cargue el modelo local. Arranca vacío y rápido.

		useImperativeHandle(ref, () => ({
			startCamera: async () => {
				if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
					try {
						const stream = await navigator.mediaDevices.getUserMedia({
							video: { facingMode: "environment" },
						});
						if (videoRef.current) {
							videoRef.current.srcObject = stream;
							videoRef.current.onloadedmetadata = () => {
								videoRef.current?.play();
								setIsCameraActive(true);
							};
						}
					} catch (err) {
						console.error("Error cámara:", err);
					}
				}
			},

			capture: () => {
				if (!videoRef.current || !isCameraActive || isAnalyzing) return;

				setIsAnalyzing(true);
				console.log("📸 Capturando y consultando a YOLO...");

				// Saca la foto del video
				const canvas = document.createElement("canvas");
				canvas.width = videoRef.current.videoWidth;
				canvas.height = videoRef.current.videoHeight;
				const ctx = canvas.getContext("2d");
				ctx?.drawImage(videoRef.current, 0, 0);

				const imageDataUrl = canvas.toDataURL("image/jpeg");

				// 2. Transforma la foto y la envía al servidor
				canvas.toBlob(async (blob) => {
					if (!blob) {
						setIsAnalyzing(false);
						return;
					}

					const formData = new FormData();
					formData.append("file", blob, "captura.jpg");

					try {
						const response = await fetch(API_URL, {
							method: "POST",
							body: formData,
						});

						if (!response.ok) throw new Error("Error en servidor");
						const data = await response.json();

						let bestClass = "";
						let highestProbability = 0;

						// 3. Traduce la respuesta de YOLO al formato que tu app ya entiende
						if (
							data.productos_detectados &&
							data.productos_detectados.length > 0
						) {
							const mejor = data.productos_detectados.reduce(
								(prev: any, current: any) =>
									prev.certeza > current.certeza ? prev : current,
							);
							bestClass = mejor.envase;
							highestProbability = mejor.certeza / 100; // YOLO da 0-100, la app espera 0-1
						}

						// 4. Se lo pasa al padre exactamente igual que antes
						onScan(bestClass, highestProbability, imageDataUrl);
					} catch (error) {
						console.error("Error de conexión con YOLO:", error);
						// Si falla el server, mandamos vacío para que el padre maneje el error
						onScan("", 0, imageDataUrl);
					} finally {
						setIsAnalyzing(false);
					}
				}, "image/jpeg");
			},

			stopCamera: () => {
				if (videoRef.current && videoRef.current.srcObject) {
					const stream = videoRef.current.srcObject as MediaStream;
					stream.getTracks().forEach((track) => track.stop());
					videoRef.current.srcObject = null;
					setIsCameraActive(false);
				}
			},
		}));

		// 5. El bloque visual: Exactamente idéntico al original, sin agregados que rompan el Z-Index.
		return (
			<div className={`relative bg-black overflow-hidden ${className}`}>
				<video
					ref={videoRef}
					className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? "opacity-100" : "opacity-0"}`}
					muted
					playsInline
				/>
				{!isCameraActive && (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10">
						<svg
							className="w-24 h-24 opacity-30"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</div>
				)}
			</div>
		);
	},
);

Scanner.displayName = "Scanner";
export default Scanner;

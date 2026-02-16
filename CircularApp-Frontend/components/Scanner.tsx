"use client";

import {
	useEffect,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
} from "react";
import * as tmImage from "@teachablemachine/image";

export interface ScannerHandle {
	startCamera: () => Promise<void>;
	capture: () => void; // Ya no necesita ser async porque la lógica va dentro del onload
}

interface ScannerProps {
	onScan: (producto: string, confianza: number, imagen: string) => void;
	className?: string;
}

const URL_MODELO = "https://teachablemachine.withgoogle.com/models/psvxCV8fo/";

const Scanner = forwardRef<ScannerHandle, ScannerProps>(
	({ onScan, className }, ref) => {
		const videoRef = useRef<HTMLVideoElement>(null);
		const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
		const [isModelLoading, setIsModelLoading] = useState(true);
		const [isCameraActive, setIsCameraActive] = useState(false);

		useEffect(() => {
			const loadModel = async () => {
				try {
					const modelURL = URL_MODELO + "model.json";
					const metadataURL = URL_MODELO + "metadata.json";
					const loadedModel = await tmImage.load(modelURL, metadataURL);
					setModel(loadedModel);
					setIsModelLoading(false);
					console.log("Modelo IA cargado.");
				} catch (err) {
					console.error("Error cargando modelo:", err);
					setIsModelLoading(false);
				}
			};
			loadModel();
		}, []);

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

			// --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
			capture: () => {
				if (!videoRef.current || !model || !isCameraActive) return;

				// 1. Primero CAPTURAMOS la imagen visual
				const canvas = document.createElement("canvas");
				canvas.width = videoRef.current.videoWidth;
				canvas.height = videoRef.current.videoHeight;
				const ctx = canvas.getContext("2d");
				ctx?.drawImage(videoRef.current, 0, 0);

				// Convertimos a URL (base64)
				const imageDataUrl = canvas.toDataURL("image/jpeg");

				// 2. Creamos una imagen HTML falsa para dársela a la IA
				const imgElement = document.createElement("img");
				imgElement.src = imageDataUrl;

				// 3. Cuando la imagen "virtual" cargue, la analizamos
				imgElement.onload = async () => {
					console.log("📸 Imagen generada, iniciando análisis IA...");

					const prediction = await model.predict(imgElement);

					let highestProbability = 0;
					let bestClass = "";

					prediction.forEach((p) => {
						if (p.probability > highestProbability) {
							highestProbability = p.probability;
							bestClass = p.className;
						}
					});

					// 4. Devolvemos el resultado (La imagen YA fue capturada al principio)
					onScan(bestClass, highestProbability, imageDataUrl);
				};
			},
		}));

		return (
			<div className={`relative bg-black overflow-hidden ${className}`}>
				<video
					ref={videoRef}
					className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? "opacity-100" : "opacity-0"}`}
					muted
					playsInline
				/>
				{(!isCameraActive || isModelLoading) && (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10">
						{isModelLoading ? (
							<p className="text-sm animate-pulse">Cargando Cerebro IA...</p>
						) : (
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
						)}
					</div>
				)}
			</div>
		);
	},
);

Scanner.displayName = "Scanner";
export default Scanner;

"use client";

import { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import { Upload, Camera, RefreshCw } from "lucide-react"; // Iconos bonitos

// URL de tu modelo de Teachable Machine (¡Asegúrate de que sea el tuyo!)
const URL_MODELO = "https://teachablemachine.withgoogle.com/models/psvxCV8fo/";

interface ScannerProps {
	onScan: (producto: string, confianza: number, imagen: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null); // Referencia para el input de archivo
	const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
	const [isModelLoading, setIsModelLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar el modelo al iniciar
	useEffect(() => {
		const loadModel = async () => {
			try {
				const modelURL = URL_MODELO + "model.json";
				const metadataURL = URL_MODELO + "metadata.json";
				const loadedModel = await tmImage.load(modelURL, metadataURL);
				setModel(loadedModel);
				setIsModelLoading(false);
			} catch (err) {
				console.error("Error cargando modelo:", err);
				setError("Error al cargar la IA");
				setIsModelLoading(false);
			}
		};
		loadModel();
	}, []);

	// Iniciar cámara automáticamente
	useEffect(() => {
		startCamera();
		// Limpieza al salir
		return () => {
			stopCamera();
		};
	}, []);

	const startCamera = async () => {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "environment" }, // Cámara trasera preferida
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.play();
					// Iniciar loop de predicción
					requestAnimationFrame(loop);
				}
			} catch (err) {
				console.error("No se pudo acceder a la cámara", err);
			}
		}
	};

	const stopCamera = () => {
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			stream.getTracks().forEach((track) => track.stop());
		}
	};

	const loop = async () => {
		if (videoRef.current && model) {
			if (videoRef.current.readyState === 4) {
				await predict(videoRef.current);
			}
			requestAnimationFrame(loop);
		}
	};

	const predict = async (imageSource: HTMLVideoElement | HTMLImageElement) => {
		if (!model) return;

		const prediction = await model.predict(imageSource);

		// Buscamos la clase con mayor probabilidad
		let highestProbability = 0;
		let bestClass = "";

		prediction.forEach((p) => {
			if (p.probability > highestProbability) {
				highestProbability = p.probability;
				bestClass = p.className;
			}
		});

		// Si la confianza es alta (> 85%), disparamos el evento
		if (highestProbability > 0.85 && bestClass !== "Nada") {
			// Capturar imagen para mostrarla luego
			let imageDataUrl = "";

			if (imageSource instanceof HTMLVideoElement) {
				// Si es video, capturamos un frame en un canvas invisible
				const canvas = document.createElement("canvas");
				canvas.width = imageSource.videoWidth;
				canvas.height = imageSource.videoHeight;
				canvas.getContext("2d")?.drawImage(imageSource, 0, 0);
				imageDataUrl = canvas.toDataURL("image/jpeg");
			} else {
				// Si es imagen subida, usamos su fuente directa
				imageDataUrl = imageSource.src;
			}

			onScan(bestClass, highestProbability, imageDataUrl);
		}
	};

	// --- LÓGICA NUEVA: MANEJO DE ARCHIVOS ---
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// 1. Detener la cámara para ahorrar recursos
			stopCamera();

			// 2. Leer el archivo
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.src = e.target?.result as string;
				img.onload = async () => {
					// 3. Analizar la imagen estática
					await predict(img);
				};
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
			{/* Input Oculto para subir archivos */}
			<input
				type="file"
				accept="image/*"
				ref={fileInputRef}
				onChange={handleFileUpload}
				className="hidden"
			/>

			{isModelLoading && (
				<div className="absolute z-20 text-white animate-pulse">
					Cargando IA... 🧠
				</div>
			)}

			{error && (
				<div className="absolute z-20 text-red-500 bg-white p-2 rounded">
					{error}
				</div>
			)}

			{/* Video de la cámara */}
			<video
				ref={videoRef}
				className="absolute inset-0 w-full h-full object-cover"
				muted
				playsInline
			/>

			{/* Botones de control flotantes */}
			<div className="absolute bottom-6 flex gap-6 z-30">
				{/* Botón: Subir Foto */}
				<button
					onClick={() => fileInputRef.current?.click()}
					className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/40 transition-all border border-white/30 shadow-lg flex flex-col items-center">
					<Upload size={24} />
					<span className="text-[10px] mt-1 font-medium">Subir</span>
				</button>

				{/* Decorativo: Indicador de escaneo activo */}
				<div className="w-16 h-16 rounded-full border-4 border-green-400 animate-pulse flex items-center justify-center bg-transparent shadow-[0_0_20px_rgba(74,222,128,0.5)]">
					<Camera size={24} className="text-green-400" />
				</div>

				{/* Botón: Reiniciar Cámara (por si subió foto y quiere volver a escanear) */}
				<button
					onClick={() => {
						startCamera();
						if (fileInputRef.current) fileInputRef.current.value = "";
					}}
					className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/40 transition-all border border-white/30 shadow-lg flex flex-col items-center">
					<RefreshCw size={24} />
					<span className="text-[10px] mt-1 font-medium">Cámara</span>
				</button>
			</div>

			{/* Overlay de escaneo */}
			<div className="absolute inset-0 border-[30px] border-black/50 pointer-events-none rounded-3xl"></div>
			<div className="absolute w-64 h-1 bg-green-500/80 top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-scan"></div>
		</div>
	);
}

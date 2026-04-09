"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Scanner, { ScannerHandle } from "@/components/Scanner";
import { registrarEscaneo } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext"; // Ajustado a la ruta nueva
import BottomNav from "@/components/swapp/BottomNav";
import ModelViewer from "@/components/swapp/ModelViewer";

type ScannerAppState =
	| "IDLE"
	| "ANALYZING"
	| "CONFIRMATION"
	| "QUANTITY_SELECTION"
	| "ERROR_NOT_DETECTED";

export default function MainScannerApp() {
	const { user } = useAuth();
	const { addToCart } = useCart();
	const router = useRouter();

	const [appState, setAppState] = useState<ScannerAppState>("IDLE");
	const [detectedProduct, setDetectedProduct] = useState<string | null>(null);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isCameraReady, setIsCameraReady] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [showFlash, setShowFlash] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [confidenceValue, setConfidenceValue] = useState<number>(0);

	const [returnQty, setReturnQty] = useState(1);
	const [receiveQty, setReceiveQty] = useState(1);

	// Simulación de productos recomendados traídos desde la Base de Datos
	const [relatedProducts] = useState([
		{ id: "rel-1", name: "Saborizante Cola", price: 4500, emoji: "🥤" },
		{ id: "rel-2", name: "Botella Fuse 1L", price: 8900, emoji: "💧" },
		{ id: "rel-3", name: "Saborizante Limón", price: 4500, emoji: "🍋" },
	]);

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

						setDetectedProduct(datos.producto);
						setCapturedImage(datos.imagen);
						setConfidenceValue(datos.confianza);
						setReturnQty(1);
						setReceiveQty(1);
						setAppState("QUANTITY_SELECTION");
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
			if (navigator.vibrate) navigator.vibrate(50);
			setShowFlash(true);
			setTimeout(() => setShowFlash(false), 150);
			setAppState("ANALYZING");
			scannerRef.current?.capture();
		}
	};

	const handleScanResult = (
		producto: string,
		confianza: number,
		imagen: string,
	) => {
		setCapturedImage(imagen);
		setConfidenceValue(confianza);

		if (confianza > 0.8 && producto !== "background" && producto !== "") {
			setDetectedProduct(producto);
			setReturnQty(1);
			setReceiveQty(1);
			if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
			setAppState("CONFIRMATION");
		} else {
			setAppState("ERROR_NOT_DETECTED");
		}
	};

	const handleRetake = () => {
		setCapturedImage(null);
		setDetectedProduct(null);
		setConfidenceValue(0);
		setAppState("IDLE");
	};

	const toggleExpand = () => setIsExpanded(!isExpanded);

	const handleConfirmProduct = () => setAppState("QUANTITY_SELECTION");

	// Función para agregar un producto recomendado rápidamente al carrito
	const handleAddRelatedToCart = (relatedProd: any) => {
		const mappedProduct = {
			product_uuid: relatedProd.id,
			name: relatedProd.name,
			base_price: relatedProd.price,
			sale_price: null,
			stock_quantity: 50,
			category_id: 2,
			main_image_url: null,
			is_featured: false,
			sold_count: 0,
			description: "Producto recomendado",
			short_description: "Accesorio Swapp",
		};

		addToCart({
			type: "normal",
			product: mappedProduct,
			quantity: 1,
		});

		// Vibración de feedback sutil
		if (navigator.vibrate) navigator.vibrate(30);
	};

	const handleAddToCart = async () => {
		if (!detectedProduct) return;
		setIsSaving(true);

		if (user?.id && capturedImage) {
			try {
				await registrarEscaneo(
					detectedProduct,
					confidenceValue,
					capturedImage,
					user.id,
				);
			} catch (error) {
				console.error("Error guardando el análisis de IA", error);
			}
		}

		const mockProduct = {
			product_uuid: "uuid-mock-123",
			name: detectedProduct,
			base_price: 15000,
			sale_price: 12000,
			stock_quantity: 100,
			category_id: 1,
			main_image_url: capturedImage || null,
			is_featured: false,
			sold_count: 0,
			description: "Cilindro recargable detectado por IA",
			short_description: "Insumo Swapp",
		};

		addToCart({
			type: "cylinder",
			product: mockProduct,
			returnQty: returnQty,
			receiveQty: receiveQty,
		});

		setIsSaving(false);
		router.push("/carrito");
	};

	return (
		<div className="flex flex-col h-full min-h-screen bg-transparent relative">
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

				<div
					className={`absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 ${showFlash ? "opacity-100" : "opacity-0"}`}></div>

				{appState === "ANALYZING" && (
					<div className="absolute inset-0 bg-swapp-negro-azulado/90 z-50 flex flex-col items-center justify-center backdrop-blur-md">
						<div className="w-16 h-16 border-4 border-swapp-menta/30 border-t-swapp-menta rounded-full animate-spin mb-6 drop-shadow-[0_0_8px_rgba(128,225,199,1)]"></div>
						<p className="text-swapp-menta font-black text-lg tracking-[0.3em] animate-pulse drop-shadow-[0_0_5px_rgba(128,225,199,0.8)]">
							ANALIZANDO...
						</p>
					</div>
				)}

				{(appState === "CONFIRMATION" ||
					appState === "QUANTITY_SELECTION" ||
					appState === "ERROR_NOT_DETECTED") &&
					capturedImage && (
						<div className="absolute inset-0 z-10 bg-swapp-negro-azulado flex flex-col items-center justify-start overflow-hidden pt-10">
							<img
								src={capturedImage}
								alt="Fondo"
								className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110"
							/>

							{appState !== "ERROR_NOT_DETECTED" && (
								<div className="relative z-20 w-56 h-64 flex items-center justify-center mt-4">
									<ModelViewer modelPath="/models/maquina_terra.glb" />
								</div>
							)}
						</div>
					)}

				{appState === "ERROR_NOT_DETECTED" && (
					<div className="absolute bottom-0 left-0 w-full p-6 z-30 flex flex-col items-center animate-slideUp bg-gradient-to-t from-swapp-negro-azulado via-swapp-negro-azulado/95 to-transparent pt-12 text-center">
						<div className="bg-red-500/10 p-5 rounded-full mb-4 border border-red-500/20">
							<span className="text-4xl opacity-80">🤔</span>
						</div>
						<h3 className="text-white text-2xl font-black mb-2 drop-shadow-md">
							No pudimos identificarlo
						</h3>
						<p className="text-swapp-tiza/80 text-sm mb-8 px-4">
							Asegurate de que el envase esté bien centrado y haya buena luz en
							la habitación.
						</p>

						<button
							onClick={handleRetake}
							className="w-full bg-swapp-tiza text-swapp-negro-azulado py-4 rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all mb-3">
							Intentar de nuevo
						</button>
						<button
							onClick={() => router.push("/catalogo")}
							className="text-swapp-verde-agua font-bold tracking-wide py-2">
							Buscar en catálogo manual
						</button>
					</div>
				)}

				{appState === "CONFIRMATION" && (
					<div className="absolute bottom-0 left-0 w-full p-6 z-30 flex flex-col animate-slideUp bg-gradient-to-t from-swapp-negro-azulado via-swapp-negro-azulado/95 to-transparent pt-12 text-center">
						<p className="text-swapp-menta text-sm font-bold uppercase tracking-widest mb-1">
							¿Es este tu producto?
						</p>
						<h3 className="text-white text-2xl font-black mb-8 drop-shadow-md">
							{detectedProduct || "Producto Desconocido"}
						</h3>

						<div className="flex flex-col gap-3 w-full">
							<button
								onClick={handleConfirmProduct}
								className="w-full bg-swapp-menta text-swapp-negro-azulado py-4 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(128,225,199,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
								1. ¡Sí, es mi producto!
							</button>
							<button
								onClick={handleRetake}
								className="w-full bg-white/10 text-white border border-white/20 py-4 rounded-xl font-medium hover:bg-white/20 active:scale-95 transition-all">
								2. No, tomar foto de vuelta
							</button>
						</div>
					</div>
				)}

				{appState === "QUANTITY_SELECTION" && (
					<div className="absolute bottom-0 left-0 w-full p-5 z-30 flex flex-col animate-slideUp bg-swapp-negro-azulado border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
						<button
							onClick={() => setAppState("CONFIRMATION")}
							className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors">
							<svg
								className="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>

						<h3 className="text-white text-lg font-black mb-4 text-center mt-1">
							{detectedProduct}
						</h3>

						<div className="flex gap-3 mb-4">
							<div className="flex-1 bg-white/5 rounded-xl p-2 border border-white/10">
								<p className="text-[10px] text-gray-400 font-bold mb-1 uppercase text-center tracking-wider">
									Vacíos (Entregás)
								</p>
								<div className="flex items-center justify-between bg-black/40 rounded-lg p-1">
									<button
										onClick={() => setReturnQty(Math.max(0, returnQty - 1))}
										className="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
										-
									</button>
									<span className="text-white font-black text-sm">
										{returnQty}
									</span>
									<button
										onClick={() => setReturnQty(returnQty + 1)}
										className="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
										+
									</button>
								</div>
							</div>

							<div className="flex-1 bg-swapp-verde-agua/10 rounded-xl p-2 border border-swapp-verde-agua/30 shadow-[0_0_15px_rgba(1,195,142,0.1)]">
								<p className="text-[10px] text-swapp-menta font-bold mb-1 uppercase text-center tracking-wider">
									Llenos (Llevás)
								</p>
								<div className="flex items-center justify-between bg-black/40 rounded-lg p-1">
									<button
										onClick={() => setReceiveQty(Math.max(1, receiveQty - 1))}
										className="w-6 h-6 flex items-center justify-center rounded bg-swapp-verde-agua/20 text-swapp-menta font-bold hover:bg-swapp-verde-agua/40 transition-colors">
										-
									</button>
									<span className="text-white font-black text-sm">
										{receiveQty}
									</span>
									<button
										onClick={() => setReceiveQty(receiveQty + 1)}
										className="w-6 h-6 flex items-center justify-center rounded bg-swapp-verde-agua/20 text-swapp-menta font-bold hover:bg-swapp-verde-agua/40 transition-colors">
										+
									</button>
								</div>
							</div>
						</div>

						{/* --- INICIO SECCIÓN CROSS-SELLING --- */}
						<div className="mb-5">
							<p className="text-xs text-swapp-menta font-bold mb-2 flex items-center gap-1">
								💡 Van genial con tu producto:
							</p>
							<div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-5 px-5">
								{relatedProducts.map((prod) => (
									<div
										key={prod.id}
										className="min-w-[120px] bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center flex-shrink-0">
										<div className="text-2xl mb-1">{prod.emoji}</div>
										<h4 className="text-white text-[11px] font-medium text-center line-clamp-1">
											{prod.name}
										</h4>
										<p className="text-swapp-tiza/70 text-[10px] mb-2">
											${prod.price}
										</p>
										<button
											onClick={() => handleAddRelatedToCart(prod)}
											className="w-full bg-white/10 hover:bg-swapp-verde-agua/20 hover:text-swapp-menta text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors border border-white/5">
											+ Agregar
										</button>
									</div>
								))}
							</div>
						</div>
						{/* --- FIN SECCIÓN CROSS-SELLING --- */}

						<button
							onClick={handleAddToCart}
							disabled={isSaving}
							className="w-full bg-gradient-to-r from-swapp-turquesa-oscuro to-swapp-verde-agua text-swapp-negro-azulado py-3.5 rounded-xl font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
							{isSaving ? "Procesando..." : "Ir al carrito y pagar"}
						</button>
					</div>
				)}

				{appState === "IDLE" && (
					<div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-between items-center px-10 z-30 pointer-events-none">
						<div className="w-12"></div>
						<button
							onClick={handleShutterClick}
							className={`pointer-events-auto w-20 h-20 rounded-full border-4 flex items-center justify-center transition active:scale-95 bg-transparent ${
								!isCameraReady
									? "border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 animate-pulse"
									: "border-swapp-menta shadow-[0_0_15px_rgba(128,225,199,0.5)]"
							}`}>
							<div
								className={`w-16 h-16 rounded-full backdrop-blur-sm ${!isCameraReady ? "bg-white/90" : "bg-white/50"}`}></div>
						</button>
						<button
							onClick={toggleExpand}
							className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:text-swapp-menta hover:bg-black/60 backdrop-blur-md transition border border-white/10">
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

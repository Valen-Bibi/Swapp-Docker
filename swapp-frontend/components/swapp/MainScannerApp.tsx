"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Scanner, { ScannerHandle } from "@/components/Scanner";
import { registrarEscaneo } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
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

	// --- ESTADOS DE CANTIDAD ---
	const [returnQty, setReturnQty] = useState(1);
	const [receiveQty, setReceiveQty] = useState(1);
	const [quantity, setQuantity] = useState(1); // Para productos no retornables
	const [isReturnable, setIsReturnable] = useState(false); // Determina qué UI mostrar
	// ---------------------------

	const scannerRef = useRef<ScannerHandle>(null);

	useEffect(() => {
		return () => {
			scannerRef.current?.stopCamera();
		};
	}, []);

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
						setQuantity(1);

						// TODO: Aquí deberías hacer el fetch a tu DB para ver si el producto es retornable.
						// Ejemplo: const res = await fetch(`/api/productos?ai_label=${datos.producto}`); ...
						setIsReturnable(datos.producto.toLowerCase().includes("cilindro"));

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
			setQuantity(1);

			// TODO: Al igual que arriba, reemplazar con la validación real de la base de datos
			setIsReturnable(producto.toLowerCase().includes("cilindro"));

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

		// TODO: Reemplazar mockProduct con el producto real traído de la base de datos
		const empaquetarId = `mock-${detectedProduct.toLowerCase().replace(/\s+/g, "-")}`;

		const mockProduct = {
			product_uuid: empaquetarId, // <-- Ahora cada producto tiene su propio ID único
			name: detectedProduct,
			base_price: 15000,
			sale_price: 12000,
			stock_quantity: 100,
			category_id: 1,
			main_image_url: capturedImage || null,
			is_featured: false,
			sold_count: 0,
			description: "Producto detectado por IA",
			short_description: "Insumo Swapp",
			is_returnable: isReturnable,
		};

		if (isReturnable) {
			addToCart({
				type: "returnable",
				product: mockProduct,
				returnQty: returnQty,
				receiveQty: receiveQty,
			});
		} else {
			addToCart({
				type: "normal",
				product: mockProduct,
				quantity: quantity,
			});
		}

		setIsSaving(false);
		router.push("/carrito");
	};

	return (
		<>
			<div
				className={`transition-all duration-500 ease-in-out bg-black overflow-hidden ${
					isExpanded
						? "fixed inset-0 z-[100] w-full h-full rounded-none"
						: "absolute inset-0 w-full h-full"
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
					<div className="absolute bottom-0 left-0 w-full p-6 z-30 flex flex-col animate-slideUp bg-swapp-negro-azulado border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
						<button
							onClick={() => setAppState("CONFIRMATION")}
							className="absolute top-5 left-5 text-white/50 hover:text-white transition-colors">
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

						<h3 className="text-white text-xl font-black mb-6 text-center mt-2">
							{detectedProduct}
						</h3>

						{/* --- LÓGICA DINÁMICA DE UI DE CANTIDADES --- */}
						{isReturnable ? (
							<div className="flex gap-4 mb-8">
								<div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/10">
									<p className="text-xs text-gray-400 font-bold mb-2 uppercase text-center tracking-wider">
										Vacíos (Entregás)
									</p>
									<div className="flex items-center justify-between bg-black/40 rounded-xl p-1.5">
										<button
											onClick={() => setReturnQty(Math.max(0, returnQty - 1))}
											className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
											-
										</button>
										<span className="text-white font-black text-lg">
											{returnQty}
										</span>
										<button
											onClick={() => setReturnQty(returnQty + 1)}
											className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
											+
										</button>
									</div>
								</div>

								<div className="flex-1 bg-swapp-verde-agua/10 rounded-2xl p-3 border border-swapp-verde-agua/30 shadow-[0_0_15px_rgba(1,195,142,0.1)]">
									<p className="text-xs text-swapp-menta font-bold mb-2 uppercase text-center tracking-wider">
										Llenos (Llevás)
									</p>
									<div className="flex items-center justify-between bg-black/40 rounded-xl p-1.5">
										<button
											onClick={() => setReceiveQty(Math.max(1, receiveQty - 1))}
											className="w-8 h-8 flex items-center justify-center rounded-lg bg-swapp-verde-agua/20 text-swapp-menta font-bold hover:bg-swapp-verde-agua/40 transition-colors">
											-
										</button>
										<span className="text-white font-black text-lg">
											{receiveQty}
										</span>
										<button
											onClick={() => setReceiveQty(receiveQty + 1)}
											className="w-8 h-8 flex items-center justify-center rounded-lg bg-swapp-verde-agua/20 text-swapp-menta font-bold hover:bg-swapp-verde-agua/40 transition-colors">
											+
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="flex justify-center mb-8">
								<div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
									<p className="text-sm text-gray-300 font-bold uppercase tracking-wider">
										Cantidad a comprar
									</p>
									<div className="flex items-center justify-between bg-black/40 rounded-xl p-1.5 gap-4">
										<button
											onClick={() => setQuantity(Math.max(1, quantity - 1))}
											className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
											-
										</button>
										<span className="text-white font-black text-xl w-6 text-center">
											{quantity}
										</span>
										<button
											onClick={() => setQuantity(quantity + 1)}
											className="w-10 h-10 flex items-center justify-center rounded-lg bg-swapp-verde-agua/20 text-swapp-menta font-bold hover:bg-swapp-verde-agua/40 transition-colors">
											+
										</button>
									</div>
								</div>
							</div>
						)}
						{/* ------------------------------------------- */}

						<button
							onClick={handleAddToCart}
							disabled={isSaving}
							className="w-full bg-gradient-to-r from-swapp-turquesa-oscuro to-swapp-verde-agua text-swapp-negro-azulado py-4 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(1,195,142,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-2">
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
										d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
									/>
								</svg>
							)}
						</button>
					</div>
				)}
			</div>

			{!isExpanded && <BottomNav />}
		</>
	);
}

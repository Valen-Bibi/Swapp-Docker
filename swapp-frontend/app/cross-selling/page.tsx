"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

// --- CONFIGURACIÓN DE BENEFICIOS ---
const ENVIO_GRATIS_UMBRAL = 50000;

// --- INTERFACES ---
interface Product {
	product_uuid: string;
	name: string;
	base_price: number;
	sale_price: number | null;
	stock_quantity: number;
	category_id: number | null;
	main_image_url: string | null;
	is_featured: boolean;
	sold_count: number;
	description: string | null;
	short_description: string | null;
}

function CrossSellingContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { addToCart } = useCart();

	const productUuid = searchParams.get("product_uuid");

	const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [returnQty, setReturnQty] = useState(1);
	const [receiveQty, setReceiveQty] = useState(1);

	const [recommendations, setRecommendations] = useState<Product[]>([]);
	const [addedRecommendations, setAddedRecommendations] = useState<
		Record<string, boolean>
	>({});

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setScannedProduct({
				product_uuid: "mock-cilindro-123",
				name: "Cilindro Rosa Sodastream (Conexión Rápida)",
				base_price: 41599,
				sale_price: null,
				stock_quantity: 50,
				category_id: 2,
				main_image_url: "/product-image/cilindro_rosa.webp",
				is_featured: true,
				sold_count: 120,
				description:
					"Cilindro de repuesto original para máquinas Sodastream con sistema Quick Connect.",
				short_description: "Rinde hasta 60 Litros de soda",
			});

			setRecommendations([
				{
					product_uuid: "mock-rec-1",
					name: "Saborizante Cola Sodastream",
					base_price: 6500,
					sale_price: 5200,
					stock_quantity: 15,
					category_id: 5,
					main_image_url: null,
					is_featured: false,
					sold_count: 40,
					description: "El sabor clásico para acompañar tu soda.",
					short_description: "Ideal para tu soda",
				},
				{
					product_uuid: "mock-rec-2",
					name: "Botella Metal 0.5l (Llevar)",
					base_price: 16599,
					sale_price: null,
					stock_quantity: 10,
					category_id: 1,
					main_image_url: "/product-image/botella_metal_0,5L.webp",
					is_featured: false,
					sold_count: 25,
					description: "Lleva tu soda a donde quieras.",
					short_description: "Llevá tu soda a todos lados",
				},
			]);
			setIsLoading(false);
		}, 800);
		return () => clearTimeout(timer);
	}, [productUuid]);

	const isReturnable = scannedProduct?.name.toLowerCase().includes("cilindro");

	const getMainProductPrice = () => {
		if (!scannedProduct) return 0;
		const baseToUse = scannedProduct.sale_price ?? scannedProduct.base_price;
		if (isReturnable) {
			const refills = Math.min(returnQty, receiveQty);
			const news = Math.max(0, receiveQty - returnQty);
			return refills * baseToUse + news * (baseToUse * 2);
		}
		return baseToUse * quantity;
	};

	const getRecommendationsPrice = () => {
		return recommendations.reduce((total, rec) => {
			if (addedRecommendations[rec.product_uuid]) {
				return total + (rec.sale_price ?? rec.base_price);
			}
			return total;
		}, 0);
	};

	const totalPrice = getMainProductPrice() + getRecommendationsPrice();

	// Lógica de progreso
	const progresoEnvio = Math.min((totalPrice / ENVIO_GRATIS_UMBRAL) * 100, 100);
	const faltanteEnvio = Math.max(ENVIO_GRATIS_UMBRAL - totalPrice, 0);

	const toggleRecommendation = (uuid: string) => {
		setAddedRecommendations((prev) => ({ ...prev, [uuid]: !prev[uuid] }));
	};

	const handleContinueToCart = () => {
		if (!scannedProduct) return;
		addToCart({
			type: isReturnable ? "returnable" : "normal",
			product: {
				...scannedProduct,
				is_returnable: isReturnable,
			} as any,
			quantity: quantity,
			returnQty: returnQty,
			receiveQty: receiveQty,
		});
		recommendations.forEach((rec) => {
			if (addedRecommendations[rec.product_uuid]) {
				addToCart({ type: "normal", product: rec as any, quantity: 1 });
			}
		});
		router.push("/carrito");
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-swapp-tiza flex flex-col items-center justify-center">
				<div className="w-12 h-12 border-4 border-swapp-azul-oceano/30 border-t-swapp-azul-oceano rounded-full animate-spin"></div>
				<p className="mt-4 text-swapp-azul-petroleo font-bold">
					Preparando tu producto...
				</p>
			</div>
		);
	}

	return (
		<div className="absolute inset-0 overflow-y-auto bg-swapp-tiza pb-[140px]">
			{/* --- NUEVO HEADER: CON BARRA DE PROGRESO STICKY --- */}
			<div className="bg-swapp-tiza px-5 py-3 flex items-center gap-4 sticky top-0 z-30pga">
				<button
					onClick={() => router.back()}
					className="text-swapp-azul-petroleo hover:bg-gray-200 p-1.5 rounded-full transition-colors flex-shrink-0">
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<div className="flex-1">
					<div className="flex justify-between items-center mb-1.5">
						<span className="text-[10px] font-black text-swapp-azul-petroleo uppercase tracking-tight">
							{progresoEnvio >= 100
								? "¡Envío gratis!"
								: `Faltan $${faltanteEnvio.toLocaleString("es-AR")} para envío gratis...`}
						</span>
						<span className="text-[10px] font-black text-swapp-azul-oceano">
							{Math.round(progresoEnvio)}%
						</span>
					</div>
					<div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
						<div
							className={`h-full transition-all duration-700 ease-out ${progresoEnvio >= 100 ? "bg-swapp-verde-agua" : "bg-swapp-azul-oceano"}`}
							style={{ width: `${progresoEnvio}%` }}></div>
					</div>
				</div>
			</div>

			<div className="px-5 pt-4 flex flex-col gap-8">
				<div className="text-center -mb-4">
					<h1 className="text-base font-black text-swapp-azul-petroleo uppercase tracking-widest opacity-80">
						Confirma tu pedido
					</h1>
				</div>

				{/* 1. HERO CARD (Producto Escaneado) */}
				<div className="bg-white rounded-[2rem] p-6 relative overflow-hidden border border-gray-100 shadow-md">
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4 text-center">
						Producto Identificado
					</p>

					<img
						src={
							scannedProduct?.main_image_url ||
							"/product-image/placeholder.webp"
						}
						alt={scannedProduct?.name}
						className="h-32 w-auto object-contain mx-auto mb-4"
					/>

					<h2 className="text-lg font-black text-swapp-azul-petroleo text-center leading-tight mb-1">
						{scannedProduct?.name}
					</h2>
					<p className="text-center text-swapp-azul-oceano font-bold text-lg mb-5">
						$
						{(
							scannedProduct?.sale_price ??
							scannedProduct?.base_price ??
							0
						).toLocaleString("es-AR")}
					</p>

					{/* Controles de Cantidad Side-by-Side */}
					{isReturnable ? (
						<div className="w-full flex flex-col gap-2">
							<div className="flex w-full gap-3">
								<div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
									<span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
										Vacíos (Entregás)
									</span>
									<div className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
										<button
											onClick={() => setReturnQty(Math.max(0, returnQty - 1))}
											className="text-lg font-bold text-swapp-azul-oceano w-6 text-center">
											-
										</button>
										<span className="font-bold text-sm text-swapp-azul-petroleo">
											{returnQty}
										</span>
										<button
											onClick={() => setReturnQty(returnQty + 1)}
											className="text-lg font-bold text-swapp-azul-oceano w-6 text-center">
											+
										</button>
									</div>
								</div>
								<div className="flex-1 flex flex-col justify-center items-center bg-swapp-verde-agua/10 p-3 rounded-xl border border-swapp-verde-agua/30">
									<span className="text-[10px] font-bold text-swapp-turquesa-oscuro uppercase tracking-wide mb-2">
										Llenos (Llevás)
									</span>
									<div className="flex items-center justify-between w-full bg-white border border-swapp-verde-agua/30 rounded-lg px-2 py-1 shadow-sm">
										<button
											onClick={() => setReceiveQty(Math.max(1, receiveQty - 1))}
											className="text-lg font-bold text-swapp-azul-oceano w-6 text-center">
											-
										</button>
										<span className="font-bold text-sm text-swapp-azul-petroleo">
											{receiveQty}
										</span>
										<button
											onClick={() => setReceiveQty(receiveQty + 1)}
											className="text-lg font-bold text-swapp-azul-oceano w-6 text-center">
											+
										</button>
									</div>
								</div>
							</div>
							{receiveQty > returnQty && (
								<p className="text-[10px] text-swapp-turquesa-oscuro text-center font-bold mt-1">
									⚠️ Se cobrarán {receiveQty - returnQty} envase(s) nuevo(s).
								</p>
							)}
						</div>
					) : (
						<div className="w-full flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
							<span className="text-sm font-bold text-swapp-azul-petroleo">
								Cantidad
							</span>
							<div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-sm">
								<button
									onClick={() => setQuantity(Math.max(1, quantity - 1))}
									className="text-2xl font-bold text-swapp-azul-oceano w-6 text-center">
									-
								</button>
								<span className="font-bold text-lg text-swapp-azul-petroleo w-6 text-center">
									{quantity}
								</span>
								<button
									onClick={() => setQuantity(quantity + 1)}
									className="text-2xl font-bold text-swapp-azul-oceano w-6 text-center">
									+
								</button>
							</div>
						</div>
					)}
				</div>

				{/* 2. RECOMENDACIONES (Cross-Selling) */}
				{recommendations.length > 0 && (
					<div className="space-y-4">
						<h3 className="text-lg font-black text-swapp-azul-petroleo flex items-center gap-2">
							✨ Mejorá tu experiencia
						</h3>
						<div className="grid grid-cols-2 gap-4">
							{recommendations.map((rec) => {
								const isAdded = addedRecommendations[rec.product_uuid];
								return (
									<div
										key={rec.product_uuid}
										onClick={() => toggleRecommendation(rec.product_uuid)}
										className={`bg-white rounded-xl p-4 relative flex flex-col items-center shadow-sm cursor-pointer transition-all duration-200 border-2 ${isAdded ? "border-swapp-menta bg-white" : "border-transparent hover:shadow-md"}`}>
										{rec.sale_price && (
											<span className="absolute top-2 left-2 bg-swapp-turquesa-oscuro text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
												OFERTA
											</span>
										)}
										<div
											className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10 ${isAdded ? "bg-swapp-menta text-swapp-azul-petroleo" : "bg-gray-100 text-gray-300"}`}>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												strokeWidth={3}
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</div>
										<img
											src={
												rec.main_image_url || "/product-image/placeholder.webp"
											}
											alt={rec.name}
											className="h-20 w-auto object-contain mb-3 mt-2"
										/>
										<div className="w-full text-left mt-auto">
											<h4 className="text-[11px] font-bold text-swapp-azul-petroleo leading-tight mb-1 line-clamp-2 min-h-[28px]">
												{rec.name}
											</h4>
											<div className="flex items-center gap-1">
												<p className="text-xs font-black text-swapp-azul-oceano">
													$
													{(rec.sale_price ?? rec.base_price).toLocaleString(
														"es-AR",
													)}
												</p>
												{rec.sale_price && (
													<p className="text-[9px] text-gray-400 line-through">
														${rec.base_price.toLocaleString("es-AR")}
													</p>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* 3. BARRA INFERIOR (Sticky) */}
			{(() => {
				const totalItems =
					(isReturnable ? receiveQty : quantity) +
					Object.values(addedRecommendations).filter(Boolean).length;
				return (
					<div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-5 py-4 pb-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50 flex items-center gap-3">
						<div className="flex flex-col flex-shrink-0">
							<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide opacity-70">
								Total a pagar
							</span>
							<span className="text-xl font-black text-swapp-azul-petroleo leading-none mt-1">
								${totalPrice.toLocaleString("es-AR")}
							</span>
						</div>

						<button
							onClick={handleContinueToCart}
							className="flex-1 bg-swapp-azul-petroleo text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-swapp-azul-oceano active:scale-95 transition-all text-center">
							Continuar
						</button>

						<div className="flex flex-col items-center justify-center bg-swapp-menta text-swapp-azul-petroleo w-14 h-[44px] rounded-xl font-black shadow-sm border border-swapp-verde-agua/30">
							<span className="text-lg leading-none">{totalItems}</span>
							<span className="text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5">
								Ítems
							</span>
						</div>
					</div>
				);
			})()}
		</div>
	);
}

export default function CrossSellingPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-swapp-tiza flex items-center justify-center">
					<div className="w-8 h-8 border-4 border-swapp-azul-oceano/30 border-t-swapp-azul-oceano rounded-full animate-spin"></div>
				</div>
			}>
			<CrossSellingContent />
		</Suspense>
	);
}

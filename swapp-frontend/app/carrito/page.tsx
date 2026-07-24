"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, ReturnableCartItem } from "@/context/CartContext";

const ENVIO_GRATIS_UMBRAL = 50000;

export default function CarritoPage() {
	const router = useRouter();

	// Extraemos las funciones de actualización del contexto
	const {
		items,
		totalAmount,
		totalItems,
		removeFromCart,
		clearCart,
		addToCart,
		updateReturnableQty,
		updateQuantity,
	} = useCart();

	const [relatedProducts] = useState([
		{
			id: "rel-1",
			name: "Saborizante Cola",
			price: 4500,
			emoji: "🥤",
			img: "/product-image/placeholder.webp",
		},
		{
			id: "rel-2",
			name: "Botella Fuse 1L",
			price: 8900,
			emoji: "💧",
			img: "/product-image/placeholder.webp",
		},
		{
			id: "rel-3",
			name: "Saborizante Limón",
			price: 4500,
			emoji: "🍋",
			img: "/product-image/placeholder.webp",
		},
	]);

	const progresoEnvio = Math.min(
		(totalAmount / ENVIO_GRATIS_UMBRAL) * 100,
		100,
	);
	const faltanteEnvio = Math.max(ENVIO_GRATIS_UMBRAL - totalAmount, 0);

	const handleAddRelatedToCart = (relatedProd: any) => {
		const mappedProduct = {
			product_uuid: relatedProd.id,
			name: relatedProd.name,
			base_price: relatedProd.price,
			sale_price: null,
			stock_quantity: 50,
			category_id: 2,
			main_image_url: relatedProd.img,
			is_featured: false,
			sold_count: 0,
			description: "Producto recomendado",
			short_description: "Accesorio Swapp",
			is_returnable: false,
		};

		addToCart({
			type: "normal",
			product: mappedProduct,
			quantity: 1,
		});

		if (navigator.vibrate) navigator.vibrate(30);
	};

	const calculateReturnableDetails = (item: ReturnableCartItem) => {
		const priceToUse = item.product.sale_price ?? item.product.base_price;
		const refills = Math.min(item.returnQty, item.receiveQty);
		const extras = Math.max(0, item.receiveQty - item.returnQty);

		const refillPrice = refills * priceToUse;
		const extraPrice = extras * (priceToUse * 2);
		const totalItemPrice = refillPrice + extraPrice;

		return {
			refills,
			extras,
			refillPrice,
			extraPrice,
			totalItemPrice,
			priceToUse,
		};
	};

	return (
		<div className="absolute inset-0 overflow-y-auto bg-swapp-tiza pb-[140px] z-10">
			{/* HEADER STICKY CON BARRA DE PROGRESO */}
			<div className="bg-swapp-tiza px-5 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
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
								? "¡Envío gratis desbloqueado!"
								: `Faltan $${faltanteEnvio.toLocaleString("es-AR")} para envío gratis`}
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

			<div className="px-5 pt-4 flex flex-col gap-6">
				<div className="flex justify-between items-center mt-2">
					<h1 className="text-2xl font-bold text-swapp-azul-petroleo">
						Tu Carrito
					</h1>
					{items.length > 0 && (
						<button
							onClick={clearCart}
							className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
							Vaciar
						</button>
					)}
				</div>

				{items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 bg-swapp-blanco rounded-[2rem] shadow-sm mt-4 px-6 text-center">
						<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<svg
								className="w-10 h-10 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<h2 className="text-xl font-bold text-swapp-azul-petroleo mb-2">
							Tu carrito está vacío
						</h2>
						<p className="text-l text-swapp-negro mb-2">
							¡Añadí productos escaneando envases o desde el catálogo!
						</p>
						<Link
							href="/hub"
							className="bg-swapp-azul-petroleo text-white font-semibold py-3 px-8 rounded-xl mt-4">
							Tomar Foto
						</Link>
					</div>
				) : (
					<>
						<div className="flex flex-col gap-6">
							{items.map((item) => {
								const isReturnable = item.type === "returnable";
								const product = item.product;
								const priceToUse = product.sale_price ?? product.base_price;

								// Forzamos la imagen de stock para mayor estética
								const displayImage = isReturnable
									? "/product-image/cilindro_rosa.webp"
									: product.main_image_url || "/product-image/placeholder.webp";

								return (
									<div
										key={product.product_uuid}
										className="bg-white rounded-[2rem] p-6 relative overflow-hidden border border-gray-100 shadow-md">
										<button
											onClick={() => removeFromCart(product.product_uuid)}
											className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors z-10">
											<svg
												className="w-6 h-6"
												fill="none"
												stroke="currentColor"
												strokeWidth={2}
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>

										<div className="flex flex-col items-center mb-4">
											<img
												src={displayImage}
												alt={product.name}
												className="h-28 w-auto object-contain mb-3 drop-shadow-sm"
											/>
											<h2 className="text-lg font-black text-swapp-azul-petroleo text-center leading-tight mb-1">
												{product.name}
											</h2>
											<p className="text-center text-swapp-azul-oceano font-bold text-base">
												${priceToUse.toLocaleString("es-AR")} c/u
												{product.sale_price && (
													<span className="text-[10px] text-gray-400 line-through ml-2">
														${product.base_price.toLocaleString("es-AR")}
													</span>
												)}
											</p>
										</div>

										{isReturnable ? (
											<div className="w-full flex flex-col gap-3">
												<div className="flex w-full gap-3">
													<div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
														<span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
															Vacíos (Entregás)
														</span>
														<div className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
															<button
																onClick={() =>
																	updateReturnableQty?.(
																		product.product_uuid,
																		Math.max(0, item.returnQty - 1),
																		item.receiveQty,
																	)
																}
																className="text-lg font-bold text-swapp-azul-oceano w-6 text-center hover:bg-gray-50 rounded active:scale-90 transition-transform">
																-
															</button>
															<span className="font-bold text-sm text-swapp-azul-petroleo">
																{item.returnQty}
															</span>
															<button
																onClick={() =>
																	updateReturnableQty?.(
																		product.product_uuid,
																		item.returnQty + 1,
																		item.receiveQty,
																	)
																}
																className="text-lg font-bold text-swapp-azul-oceano w-6 text-center hover:bg-gray-50 rounded active:scale-90 transition-transform">
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
																onClick={() =>
																	updateReturnableQty?.(
																		product.product_uuid,
																		item.returnQty,
																		Math.max(1, item.receiveQty - 1),
																	)
																}
																className="text-lg font-bold text-swapp-azul-oceano w-6 text-center hover:bg-swapp-verde-agua/10 rounded active:scale-90 transition-transform">
																-
															</button>
															<span className="font-bold text-sm text-swapp-azul-petroleo">
																{item.receiveQty}
															</span>
															<button
																onClick={() =>
																	updateReturnableQty?.(
																		product.product_uuid,
																		item.returnQty,
																		item.receiveQty + 1,
																	)
																}
																className="text-lg font-bold text-swapp-azul-oceano w-6 text-center hover:bg-swapp-verde-agua/10 rounded active:scale-90 transition-transform">
																+
															</button>
														</div>
													</div>
												</div>

												{(() => {
													const details = calculateReturnableDetails(item);
													return (
														<div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-2">
															{details.refills > 0 && (
																<div className="flex justify-between text-xs text-gray-500 mb-1">
																	<span>{details.refills}x Intercambios</span>
																	<span>
																		$
																		{details.refillPrice.toLocaleString(
																			"es-AR",
																		)}
																	</span>
																</div>
															)}
															{details.extras > 0 && (
																<div className="flex justify-between text-xs text-swapp-turquesa-oscuro font-medium mb-1">
																	<span>{details.extras}x Envases Nuevos</span>
																	<span>
																		$
																		{details.extraPrice.toLocaleString("es-AR")}
																	</span>
																</div>
															)}
															<hr className="border-gray-200 my-2" />
															<div className="flex justify-between items-center">
																<span className="text-xs font-bold text-swapp-azul-petroleo uppercase">
																	Subtotal
																</span>
																<span className="text-base font-black text-swapp-azul-oceano">
																	$
																	{details.totalItemPrice.toLocaleString(
																		"es-AR",
																	)}
																</span>
															</div>
														</div>
													);
												})()}
											</div>
										) : (
											<div className="w-full flex flex-col gap-3 mt-2">
												<div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
													<span className="text-xs font-bold text-swapp-azul-petroleo uppercase tracking-wide">
														Cantidad
													</span>
													<div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-sm">
														<button
															onClick={() =>
																updateQuantity?.(
																	product.product_uuid,
																	Math.max(1, item.quantity - 1),
																)
															}
															className="text-xl font-bold text-swapp-azul-oceano w-6 text-center hover:bg-gray-50 rounded active:scale-90 transition-transform">
															-
														</button>
														<span className="font-bold text-base text-swapp-azul-petroleo w-6 text-center">
															{item.quantity}
														</span>
														<button
															onClick={() =>
																updateQuantity?.(
																	product.product_uuid,
																	item.quantity + 1,
																)
															}
															className="text-xl font-bold text-swapp-azul-oceano w-6 text-center hover:bg-gray-50 rounded active:scale-90 transition-transform">
															+
														</button>
													</div>
												</div>
												<div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
													<span className="text-xs font-bold text-swapp-azul-petroleo uppercase">
														Subtotal
													</span>
													<span className="text-base font-black text-swapp-azul-oceano">
														$
														{(item.quantity * priceToUse).toLocaleString(
															"es-AR",
														)}
													</span>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>

						{/* SECCIÓN CROSS-SELLING */}
						<div className="mt-4 mb-2">
							<h3 className="text-base font-black text-swapp-azul-petroleo mb-4 flex items-center gap-2">
								✨ Completa tu experiencia
							</h3>
							<div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 -mx-5 px-5">
								{relatedProducts.map((prod) => (
									<div
										key={prod.id}
										className="min-w-[140px] bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col items-center flex-shrink-0">
										<div className="text-4xl mb-3">{prod.emoji}</div>
										<h4 className="text-swapp-azul-petroleo text-xs font-bold text-center line-clamp-2 min-h-[32px] mb-2">
											{prod.name}
										</h4>
										<p className="text-swapp-azul-oceano text-sm font-black mb-3">
											${prod.price.toLocaleString("es-AR")}
										</p>
										<button
											onClick={() => handleAddRelatedToCart(prod)}
											className="w-full bg-swapp-verde-agua/10 hover:bg-swapp-verde-agua hover:text-white text-swapp-azul-petroleo text-xs font-bold py-2.5 rounded-xl transition-colors border border-swapp-verde-agua/20">
											+ Agregar
										</button>
									</div>
								))}
							</div>
						</div>

						<div className="bg-swapp-azul-petroleo text-white p-6 rounded-2xl shadow-lg flex flex-col gap-3 relative overflow-hidden mt-2 mb-6">
							<div className="absolute -top-10 -right-10 w-32 h-32 bg-swapp-azul-oceano rounded-full opacity-20 blur-2xl"></div>
							<h3 className="font-bold text-lg mb-1 relative z-10">
								Resumen de compra
							</h3>
							<div className="flex justify-between text-sm text-gray-300 relative z-10">
								<span>Productos ({totalItems})</span>
								<span>${(totalAmount || 0).toLocaleString("es-AR")}</span>
							</div>
							<div className="flex justify-between text-sm text-gray-300 relative z-10">
								<span>Envío</span>
								<span className="text-swapp-verde-agua font-semibold">
									{progresoEnvio >= 100 ? "¡Gratis!" : "Calculado en checkout"}
								</span>
							</div>
							<hr className="border-white/20 my-2 relative z-10" />
							<div className="flex justify-between items-end relative z-10">
								<span className="text-sm font-medium uppercase text-gray-300 mb-1">
									Total a pagar
								</span>
								<span className="text-3xl font-black">
									${totalAmount.toLocaleString("es-AR")}
								</span>
							</div>
						</div>
					</>
				)}
			</div>

			{items.length > 0 && (
				<div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-5 pb-8 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
					<div className="flex flex-col flex-shrink-0">
						<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
							Total
						</span>
						<span className="text-xl font-black text-swapp-azul-petroleo leading-none mt-0.5">
							${totalAmount.toLocaleString("es-AR")}
						</span>
					</div>
					<button className="flex-1 bg-swapp-azul-oceano hover:bg-swapp-azul-petroleo text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors shadow-md active:scale-[0.98]">
						Continuar al Checkout
					</button>
				</div>
			)}
		</div>
	);
}

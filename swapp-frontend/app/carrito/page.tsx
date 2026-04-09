"use client";

import Link from "next/link";
import { useCart, CylinderCartItem } from "@/context/CartContext";

export default function CarritoPage() {
	const { items, totalAmount, totalItems, removeFromCart, clearCart } =
		useCart();

	// CÁLCULO ACTUALIZADO PARA CONSIDERAR OFERTAS EN CILINDROS
	const calculateCylinderDetails = (item: CylinderCartItem) => {
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
		<div className="absolute inset-0 z-10 bg-swapp-tiza overflow-y-auto px-5 pt-4 pb-[120px] flex flex-col gap-6">
			{/* ... (Mantén el mismo Header y Empty State que te pasé antes) ... */}

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
					{/* SVG Vacío */}
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
						¡Para Agregar productos al carrito, puedes tomar una imagen de
						productos recambiables!
					</p>
					<Link
						href="/hub"
						className="bg-swapp-azul-petroleo text-white font-semibold py-3 px-8 rounded-xl mt-4">
						Tomar Foto de Producto
					</Link>
					<Link
						href="/catalogo"
						className="bg-swapp-azul-petroleo text-white font-semibold py-3 px-8 rounded-xl mt-4">
						Explorar Catálogo
					</Link>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-4">
						{items.map((item) => {
							const isCylinder = item.type === "cylinder";
							const product = item.product;
							// Determinar precio base para renderizado normal
							const priceToUse = product.sale_price ?? product.base_price;

							return (
								<div
									key={product.product_uuid}
									className="bg-swapp-blanco p-4 rounded-xl shadow-sm relative flex flex-col gap-3">
									<button
										onClick={() => removeFromCart(product.product_uuid)}
										className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors z-10">
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

									<div className="flex items-center gap-4">
										<div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center p-2 flex-shrink-0">
											<img
												src={
													product.main_image_url ||
													"/product-image/placeholder.webp"
												}
												alt={product.name}
												className="h-full w-auto object-contain"
											/>
										</div>
										<div className="flex-1 pr-6">
											<h3 className="text-sm font-bold text-swapp-azul-petroleo leading-tight mb-1">
												{product.name}
											</h3>
											<div className="flex items-end gap-2">
												<p className="text-xs font-bold text-swapp-azul-oceano">
													${priceToUse.toLocaleString("es-AR")} c/u
												</p>
												{product.sale_price && (
													<p className="text-[10px] text-gray-400 line-through mb-[1px]">
														${product.base_price.toLocaleString("es-AR")}
													</p>
												)}
											</div>
										</div>
									</div>

									<div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100 mt-1">
										{isCylinder ? (
											<div className="flex flex-col gap-2">
												<div className="flex justify-between items-center text-swapp-azul-petroleo">
													<span className="text-xs font-semibold">
														Vacíos (Entregas):
													</span>
													<span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
														{item.returnQty}
													</span>
												</div>
												<div className="flex justify-between items-center text-swapp-azul-petroleo mb-1">
													<span className="text-xs font-semibold">
														Llenos (Llevas):
													</span>
													<span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
														{item.receiveQty}
													</span>
												</div>
												<hr className="border-gray-200 my-1" />

												{(() => {
													const details = calculateCylinderDetails(item);
													return (
														<div className="flex flex-col gap-1 mt-1">
															{details.refills > 0 && (
																<div className="flex justify-between text-xs text-gray-500">
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
																<div className="flex justify-between text-xs text-swapp-turquesa-oscuro font-medium">
																	<span>{details.extras}x Envases Nuevos</span>
																	<span>
																		$
																		{details.extraPrice.toLocaleString("es-AR")}
																	</span>
																</div>
															)}
															<div className="flex justify-between items-center mt-2">
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
											<div className="flex flex-col gap-2">
												<div className="flex justify-between items-center text-swapp-azul-petroleo">
													<span className="text-xs font-semibold">
														Cantidad:
													</span>
													<span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
														{item.quantity}
													</span>
												</div>
												<hr className="border-gray-200 my-1" />
												<div className="flex justify-between items-center mt-1">
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
								</div>
							);
						})}
					</div>

					{/* Resumen Final de Compra */}
					<div className="bg-swapp-azul-petroleo text-white p-6 rounded-2xl mt-4 shadow-lg flex flex-col gap-3 relative overflow-hidden">
						<div className="absolute -top-10 -right-10 w-32 h-32 bg-swapp-azul-oceano rounded-full opacity-20 blur-2xl"></div>
						<h3 className="font-bold text-lg mb-1 relative z-10">
							Resumen de compra
						</h3>
						<div className="flex justify-between text-sm text-gray-300 relative z-10">
							<span>Productos ({totalItems})</span>
							<span>${totalAmount.toLocaleString("es-AR")}</span>
						</div>
						<div className="flex justify-between text-sm text-gray-300 relative z-10">
							<span>Envío</span>
							<span className="text-swapp-verde-agua font-semibold">
								Calculado en el checkout
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

					<button className="w-full bg-swapp-azul-oceano text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-2">
						Continuar al Checkout
					</button>
				</>
			)}
		</div>
	);
}

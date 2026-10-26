"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { PublicProduct } from "@/types/product";
import { Image as ImageIcon, Recycle, ShoppingCart } from "lucide-react";

export default function ProductCard({
	product: p,
}: {
	product: PublicProduct;
}) {
	const { addItem } = useCart();

	const mainImageUrl = p.media?.find(
		(m) => m.media_type === "image" && m.media_subtype === "main",
	)?.file_url;

	const fullName = `${p.name}${p.model ? ` - ${p.model}` : ""}`;
	const taxMultiplier = 1 + (p.tax_rate || 0) / 100;
	const standardBase = p.variants?.[0]?.price || 0;
	const roundToThousands = (val: number) => Math.round(val / 1000) * 1000;
	const standardFinal = roundToThousands(standardBase * taxMultiplier);

	const exchangeBase = p.exchange_option?.price || 0;
	const exchangeFinal = roundToThousands(exchangeBase * taxMultiplier);

	const format = (val: number) =>
		Number(val).toLocaleString("es-AR", { maximumFractionDigits: 0 });

	return (
		<Link href={`/product/${p.slug}`} className="block group">
			<article className="rounded-2xl bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md border border-swapp-azul-petroleo/15 dark:border-swapp-azul-petroleo/40 overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg hover:border-swapp-verde-pastel/50 h-full">
				<div>
					{/* Contenedor de Imagen OBS */}
					<div className="relative h-64 w-full bg-swapp-blanco dark:bg-swapp-azul-oscuro/60 flex items-center justify-center p-6 overflow-hidden">
						{p.is_returnable && (
							<span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-swapp-verde-pastel text-swapp-blanco dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro shadow-sm">
								<Recycle className="h-3.5 w-3.5" />
								Retornable
							</span>
						)}

						{mainImageUrl ? (
							<img
								src={mainImageUrl}
								alt={fullName}
								className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
							/>
						) : (
							<ImageIcon className="h-12 w-12 text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30" />
						)}
					</div>

					{/* Información del Producto */}
					<div className="p-6 flex flex-col gap-2">
						{p.brand?.name && (
							<span className="text-xs font-bold uppercase tracking-wider text-swapp-verde-pastel dark:text-swapp-verde-menta">
								{p.brand.name}
							</span>
						)}
						<h3 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
							{fullName}
						</h3>
						{(p.short_description || p.description) && (
							<p className="text-sm opacity-75 line-clamp-3 mt-1 leading-relaxed">
								{p.short_description || p.description}
							</p>
						)}
					</div>
				</div>

				{/* Bloque de Precios (Final vs. Base) */}
				<div className="p-6 pt-0 mt-2 flex flex-col gap-3">
					<div className="rounded-xl bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/20 p-3.5 border border-swapp-azul-petroleo/10 flex flex-col gap-2">
						{p.exchange_option ? (
							<>
								{/* OPCIÓN PRINCIPAL: NUEVO */}
								<div className="flex items-start justify-between">
									<span className="text-xs font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco mt-1">
										Llevar envase nuevo
									</span>
									<div className="flex flex-col items-end">
										<span className="text-lg font-extrabold text-swapp-azul-oscuro dark:text-swapp-blanco leading-none">
											${format(standardFinal)}
										</span>
										<span className="text-[10px] opacity-60 font-medium mt-1">
											${format(standardBase)} sin IVA
										</span>
									</div>
								</div>

								{/* OPCIÓN SECUNDARIA: RECAMBIO */}
								<div className="flex items-start justify-between border-t border-swapp-azul-petroleo/10 pt-2 mt-1 opacity-75">
									<span className="text-xs mt-1 flex items-center gap-1 text-swapp-verde-oscuro dark:text-swapp-verde-menta">
										<Recycle className="h-3 w-3" />
										Recambio
									</span>
									<div className="flex flex-col items-end">
										<span className="text-sm font-bold leading-none text-swapp-verde-oscuro dark:text-swapp-verde-menta">
											${format(exchangeFinal)}
										</span>
										<span className="text-[10px] opacity-60 font-medium mt-0.5">
											${format(exchangeBase)} sin IVA
										</span>
									</div>
								</div>

								<div className="flex gap-2 mt-2">
									<button
										onClick={(e) => {
											e.preventDefault();
											addItem({
												product_uuid: p.product_uuid,
												name: fullName,
												price: standardFinal,
												quantity: 1,
												type: "nuevo",
												image_url: mainImageUrl,
												standard_price: standardFinal, // Inyectamos precio base
												exchange_price: exchangeFinal, // Inyectamos precio recambio
											});
										}}
										className="flex-1 bg-swapp-azul-oscuro dark:bg-swapp-verde-pastel text-swapp-blanco dark:text-swapp-azul-oscuro py-2 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">
										Nuevo
									</button>
									<button
										onClick={(e) => {
											e.preventDefault();
											addItem({
												product_uuid: p.product_uuid,
												name: fullName,
												price: exchangeFinal,
												quantity: 1,
												type: "recambio",
												image_url: mainImageUrl,
												standard_price: standardFinal,
												exchange_price: exchangeFinal,
											});
										}}
										className="flex-1 bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta py-2 rounded-lg font-bold text-sm hover:bg-swapp-verde-oscuro/20 dark:hover:bg-swapp-verde-menta/20 transition-colors">
										Recambio
									</button>
								</div>
							</>
						) : (
							<>
								<div className="flex items-start justify-between">
									<span className="text-xs opacity-75 mt-1">Precio Final</span>
									<div className="flex flex-col items-end">
										<span className="text-lg font-extrabold text-swapp-azul-oscuro dark:text-swapp-blanco leading-none">
											${format(standardFinal)}
										</span>
										<span className="text-[10px] opacity-60 font-medium mt-1">
											${format(standardBase)} sin IVA
										</span>
									</div>
								</div>
								<button
									onClick={(e) => {
										e.preventDefault();
										addItem({
											product_uuid: p.product_uuid,
											name: fullName,
											price: standardFinal,
											quantity: 1,
											type: "nuevo",
											image_url: mainImageUrl,
											standard_price: standardFinal,
											exchange_price: 0,
										});
									}}
									className="w-full mt-2 bg-swapp-azul-oscuro dark:bg-swapp-verde-pastel text-swapp-blanco py-2 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">
									Agregar al Carrito
								</button>
							</>
						)}
					</div>
				</div>
			</article>
		</Link>
	);
}

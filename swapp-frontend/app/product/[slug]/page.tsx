"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CatalogService } from "@/services/product.service";
import { PublicProduct } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import {
	Image as ImageIcon,
	Recycle,
	ArrowLeft,
	Loader2,
	ShoppingCart,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

export default function ProductDetailPage() {
	const params = useParams();
	const router = useRouter();
	const slug = params.slug as string;
	const { addItem } = useCart();

	const [product, setProduct] = useState<PublicProduct | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);

	const images = product?.media?.filter((m) => m.media_type === "image") || [];
	const activeImageUrl = images[currentIndex]?.file_url || null;

	const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
	const prevImage = () =>
		setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const data = await CatalogService.getProductBySlug(slug);
				setProduct(data);
			} catch (error) {
				console.error("Error al cargar producto:", error);
			} finally {
				setLoading(false);
			}
		};
		if (slug) fetchProduct();
	}, [slug]);

	if (loading) {
		return (
			<div className="flex h-[60vh] items-center justify-center gap-3 text-swapp-azul-petroleo dark:text-swapp-verde-menta">
				<Loader2 className="h-8 w-8 animate-spin" />
				<span className="text-lg font-medium">Cargando producto...</span>
			</div>
		);
	}

	if (!product) {
		return (
			<div className="container mx-auto px-4 py-20 text-center max-w-2xl">
				<h2 className="text-2xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco mb-4">
					Producto no encontrado
				</h2>
				<button
					onClick={() => router.push("/")}
					className="text-swapp-verde-pastel hover:underline">
					Volver al catálogo
				</button>
			</div>
		);
	}

	const fullName = `${product.name}${product.model ? ` - ${product.model}` : ""}`;
	const taxMultiplier = 1 + (product.tax_rate || 0) / 100;
	const standardBase = product.variants?.[0]?.price || 0;

	const roundToThousands = (val: number) => Math.round(val / 1000) * 1000;

	const standardFinal = roundToThousands(standardBase * taxMultiplier);

	const exchangeBase = product.exchange_option?.price || 0;
	const exchangeFinal = roundToThousands(exchangeBase * taxMultiplier);

	const format = (val: number) =>
		Number(val).toLocaleString("es-AR", { maximumFractionDigits: 0 });

	return (
		<div className="container mx-auto px-4 py-12 max-w-6xl">
			<button
				onClick={() => router.push("/")}
				className="flex items-center gap-2 text-sm font-medium text-swapp-azul-petroleo/70 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/70 dark:hover:text-swapp-verde-menta mb-8 transition-colors">
				<ArrowLeft className="h-4 w-4" /> Volver al catálogo
			</button>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
				{/* Galería de Imágenes (Miniaturas a la izquierda, Principal a la derecha) */}
				<div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 md:w-full">
					{/* Carrusel de Miniaturas Vertical */}
					<div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar md:w-24 shrink-0 pb-2 md:pb-0 md:max-h-[500px]">
						{images.map((img, idx) => (
							<button
								key={img.media_uuid || idx} // <-- Corrección del key UUID
								onClick={() => setCurrentIndex(idx)}
								className={`relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 overflow-hidden transition-all ${
									currentIndex === idx
										? "border-swapp-verde-oscuro dark:border-swapp-verde-menta opacity-100 shadow-sm"
										: "border-transparent opacity-50 hover:opacity-100 bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20"
								}`}>
								<img
									src={img.file_url}
									alt={`Vista ${idx + 1}`}
									className="w-full h-full object-contain p-2"
								/>
							</button>
						))}
					</div>

					{/* Imagen Principal con Flechas de Navegación */}
					{/* Le agregué aspect-square y w-full para forzar el formato cuadrado perfecto */}
					<div className="relative w-full aspect-square bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/40 rounded-3xl border border-swapp-azul-petroleo/10 flex items-center justify-center p-8 group overflow-hidden">
						{product.is_returnable && (
							<span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-swapp-verde-pastel text-swapp-blanco dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro shadow-sm">
								<Recycle className="h-4 w-4" />
								Retornable
							</span>
						)}

						{/* Flechas (Solo visibles si hay más de 1 imagen y al pasar el mouse en desktop) */}
						{images.length > 1 && (
							<>
								<button
									onClick={prevImage}
									className="absolute left-4 z-10 p-2.5 rounded-full bg-swapp-blanco/90 dark:bg-swapp-azul-petroleo/90 backdrop-blur-sm shadow-md text-swapp-azul-oscuro dark:text-swapp-blanco md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-swapp-blanco">
									<ChevronLeft className="h-6 w-6" />
								</button>
								<button
									onClick={nextImage}
									className="absolute right-4 z-10 p-2.5 rounded-full bg-swapp-blanco/90 dark:bg-swapp-azul-petroleo/90 backdrop-blur-sm shadow-md text-swapp-azul-oscuro dark:text-swapp-blanco md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-swapp-blanco">
									<ChevronRight className="h-6 w-6" />
								</button>
							</>
						)}

						{activeImageUrl ? (
							<img
								src={activeImageUrl}
								alt={product.name}
								className="w-full h-full object-contain transition-transform duration-300"
							/>
						) : (
							<ImageIcon className="h-24 w-24 opacity-20" />
						)}
					</div>
				</div>

				{/* Columna Derecha: Información y Compra */}
				<div className="flex flex-col gap-6 pt-2">
					<div>
						{product.brand?.name && (
							<span className="text-sm font-bold uppercase tracking-widest text-swapp-verde-pastel dark:text-swapp-verde-menta">
								{product.brand.name}
							</span>
						)}
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-swapp-azul-oscuro dark:text-swapp-blanco mt-1">
							{fullName}
						</h1>
					</div>

					{/* Bloque de Precios y Call to Actions */}
					<div className="flex flex-col gap-4 bg-swapp-blanco/60 dark:bg-swapp-azul-petroleo/10 rounded-2xl p-6 border border-swapp-azul-petroleo/15 backdrop-blur-md shadow-sm">
						{product.exchange_option ? (
							<div className="flex flex-col gap-4">
								{/* OPCIÓN PRINCIPAL: NUEVO */}
								<div className="flex flex-col gap-2">
									<span className="text-sm font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco">
										Llevar cilindro nuevo
									</span>
									<div className="flex items-end gap-4 justify-between">
										<div className="flex flex-col">
											<span className="text-4xl font-black text-swapp-azul-oscuro dark:text-swapp-blanco leading-none">
												${format(standardFinal)}
											</span>
											<span className="text-sm opacity-60 font-medium mt-1">
												${format(standardBase)} sin IVA
											</span>
										</div>
										<button
											onClick={() =>
												addItem({
													product_uuid: product.product_uuid,
													name: fullName,
													price: standardFinal,
													quantity: 1,
													type: "nuevo",
													image_url: activeImageUrl || undefined,
												})
											}
											className="bg-swapp-azul-oscuro dark:bg-swapp-verde-pastel text-swapp-blanco dark:text-swapp-azul-oscuro px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 h-fit">
											<ShoppingCart className="h-5 w-5" /> Agregar Nuevo
										</button>
									</div>
								</div>

								<hr className="border-swapp-azul-petroleo/10 dark:border-swapp-tiza-verdoso/10" />

								{/* OPCIÓN SECUNDARIA: RECAMBIO */}
								<div className="flex items-center justify-between opacity-80">
									<span className="text-sm font-medium flex items-center gap-1 text-swapp-verde-oscuro dark:text-swapp-verde-menta">
										<Recycle className="h-4 w-4" /> Recambio (Entregando vacío)
									</span>
									<div className="flex items-center gap-4">
										<div className="flex flex-col items-end">
											<span className="text-xl font-bold leading-none text-swapp-verde-oscuro dark:text-swapp-verde-menta">
												${format(exchangeFinal)}
											</span>
											<span className="text-xs opacity-60 font-medium mt-0.5">
												${format(exchangeBase)} sin IVA
											</span>
										</div>
										<button
											onClick={() =>
												addItem({
													product_uuid: product.product_uuid,
													name: fullName,
													price: exchangeFinal,
													quantity: 1,
													type: "recambio",
													image_url: activeImageUrl || undefined,
												})
											}
											className="text-sm font-semibold bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta px-4 py-2 rounded-full hover:bg-swapp-verde-oscuro/20 transition-colors h-fit">
											Agregar Recambio
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<div className="flex flex-col">
									<span className="text-sm opacity-75 mb-1">Precio Final</span>
									<span className="text-4xl font-black text-swapp-azul-oscuro dark:text-swapp-blanco leading-none">
										${format(standardFinal)}
									</span>
									<span className="text-sm opacity-60 font-medium mt-1">
										${format(standardBase)} sin IVA
									</span>
								</div>
								<button
									onClick={() =>
										addItem({
											product_uuid: product.product_uuid,
											name: fullName,
											price: standardFinal,
											quantity: 1,
											type: "nuevo",
											image_url: activeImageUrl || undefined,
											standard_price: standardFinal,
											exchange_price: exchangeFinal,
										})
									}
									className="bg-swapp-azul-oscuro dark:bg-swapp-verde-pastel text-swapp-blanco px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 h-fit">
									<ShoppingCart className="h-5 w-5" /> Agregar al Carrito
								</button>
							</div>
						)}
					</div>

					{/* Descripciones (Corta y Larga) */}
					<div className="flex flex-col gap-6 mt-4">
						{product.short_description && (
							<div className="text-lg font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/90 leading-relaxed border-l-4 border-swapp-verde-pastel pl-4">
								{product.short_description}
							</div>
						)}

						{product.description && (
							<div className="prose prose-sm dark:prose-invert max-w-none text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/70">
								<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco mb-2">
									Acerca de este producto
								</h3>
								<p className="leading-relaxed whitespace-pre-wrap">
									{product.description}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

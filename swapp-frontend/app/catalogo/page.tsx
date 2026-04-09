"use client";

import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";

// --- 1. INTERFACES ACTUALIZADAS ---
interface Product {
	product_uuid: string;
	name: string;
	base_price: number;
	sale_price: number | null; // Nuevo
	stock_quantity: number; // Nuevo
	category_id: number | null; // Nuevo
	main_image_url: string | null;
	is_featured: boolean;
	sold_count: number;
	description: string | null;
	short_description: string | null; // Nuevo
}

interface Category {
	category_id: number; // Nuevo
	category_uuid: string;
	name: string;
	image_url: string | null;
	parent_id: number | null; // Nuevo para la jerarquía
}

export default function CatalogoPage() {
	const { addToCart } = useCart();
	const handleAddToCart = () => {
		if (!selectedProduct) return;

		if (isCylinder) {
			addToCart({
				type: "cylinder",
				product: selectedProduct,
				returnQty,
				receiveQty,
			});
		} else {
			addToCart({
				type: "normal",
				product: selectedProduct,
				quantity,
			});
		}
		setSelectedProduct(null); // Cierra el modal
	};
	const [searchTerm, setSearchTerm] = useState("");
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");

	// Ahora guardamos el ID numérico de la categoría, no el UUID
	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
		null,
	);

	const [quantity, setQuantity] = useState(1);
	const [returnQty, setReturnQty] = useState(1);
	const [receiveQty, setReceiveQty] = useState(1);

	const featuredScrollRef = useRef<HTMLDivElement>(null);
	const categoryScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const apiUrl =
					process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";
				const [productsRes, categoriesRes] = await Promise.all([
					fetch(`${apiUrl}/api/products/catalog`),
					fetch(`${apiUrl}/api/products/categories`),
				]);

				if (!productsRes.ok || !categoriesRes.ok)
					throw new Error("Error de servidor");

				const productsData = await productsRes.json();
				const categoriesData = await categoriesRes.json();

				setProducts(productsData);
				setCategories(categoriesData);
			} catch (err) {
				console.error("Error fetching data:", err);
				setError("No pudimos cargar el catálogo. Intenta nuevamente.");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		if (selectedProduct) {
			setQuantity(1);
			setReturnQty(1);
			setReceiveQty(1);
		}
	}, [selectedProduct]);

	// Controles de Scroll arrastrando
	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		const ele = e.currentTarget;
		ele.dataset.isDragging = "true";
		ele.dataset.startX = e.pageX.toString();
		ele.dataset.scrollLeft = ele.scrollLeft.toString();
	};
	const handleMouseLeaveOrUp = (e: React.MouseEvent<HTMLDivElement>) => {
		e.currentTarget.dataset.isDragging = "false";
	};
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const ele = e.currentTarget;
		if (ele.dataset.isDragging !== "true") return;
		e.preventDefault();
		const walk = (e.pageX - parseFloat(ele.dataset.startX || "0")) * 1.5;
		ele.scrollLeft = parseFloat(ele.dataset.scrollLeft || "0") - walk;
	};
	const handleWheel = (
		e: React.WheelEvent<HTMLDivElement>,
		ref: React.RefObject<HTMLDivElement>,
	) => {
		if (ref.current && e.deltaY !== 0) ref.current.scrollLeft += e.deltaY;
	};

	// --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
	const topSellers = [...products]
		.sort((a, b) => b.sold_count - a.sold_count)
		.slice(0, 5);
	let catalogProducts = [...products];

	if (searchTerm) {
		catalogProducts = catalogProducts.filter((p) =>
			p.name.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}

	// 1. FILTRO INTELIGENTE CON SUBCATEGORÍAS
	if (selectedCategoryId) {
		// Buscamos si esta categoría tiene "hijas" (ej: "Máquinas" tiene a "Soda")
		const childCategoryIds = categories
			.filter((c) => c.parent_id === selectedCategoryId)
			.map((c) => c.category_id);

		const validCategoryIds = [selectedCategoryId, ...childCategoryIds];

		catalogProducts = catalogProducts.filter(
			(p) => p.category_id && validCategoryIds.includes(p.category_id),
		);
	}

	// 2. ORDENAMIENTO USANDO PRECIO REAL (Oferta o Base)
	const getEffectivePrice = (p: Product) => p.sale_price ?? p.base_price;

	if (sortOrder === "asc") {
		catalogProducts.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
	} else if (sortOrder === "desc") {
		catalogProducts.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
	}

	// --- CÁLCULO DE PRECIOS PARA EL MODAL ---
	const isCylinder = selectedProduct?.name.toLowerCase().includes("cilindro");
	let finalPrice = 0;
	if (selectedProduct) {
		const baseToUse = selectedProduct.sale_price ?? selectedProduct.base_price;
		if (isCylinder) {
			const refills = Math.min(returnQty, receiveQty);
			const news = Math.max(0, receiveQty - returnQty);
			finalPrice = refills * baseToUse + news * (baseToUse * 2);
		} else {
			finalPrice = baseToUse * quantity;
		}
	}

	// Filtrar solo las categorías principales (Nivel 1 o 2 que queramos mostrar arriba)
	// Para no llenar la barra, mostramos solo las que no tienen parent_id (raíces)
	const displayCategories = categories.filter((c) => c.parent_id === null);

	return (
		<div className="absolute inset-0 z-10 bg-swapp-tiza overflow-y-auto px-5 pt-4 pb-[120px] flex flex-col gap-6">
			{/* Dirección, Búsqueda y Ordenamiento */}
			<div className="space-y-4">
				<div className="flex items-center gap-2 text-swapp-azul-petroleo font-medium">
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					<span className="text-sm">Guido 1955</span>
				</div>

				<div className="flex gap-2">
					<div className="relative flex-1">
						<input
							type="text"
							placeholder="Busca tu producto"
							className="w-full py-3 px-4 pr-12 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-swapp-azul-oceano text-swapp-azul-petroleo"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						<svg
							className="w-6 h-6 absolute right-4 top-1/2 -translate-y-1/2 text-swapp-azul-oceano"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>

					<select
						className="bg-swapp-blanco border border-gray-300 rounded-xl px-3 text-sm text-swapp-azul-petroleo shadow-sm focus:outline-none focus:ring-2 focus:ring-swapp-azul-oceano outline-none font-medium"
						value={sortOrder}
						onChange={(e) =>
							setSortOrder(e.target.value as "none" | "asc" | "desc")
						}>
						<option value="none">Ordenar</option>
						<option value="asc">Menor precio</option>
						<option value="desc">Mayor precio</option>
					</select>
				</div>
			</div>

			{isLoading && (
				<div className="flex justify-center items-center py-10">
					<p className="text-swapp-azul-petroleo font-medium">
						Cargando catálogo...
					</p>
				</div>
			)}

			{!isLoading && !error && (
				<>
					{/* Sección: Más vendidos */}
					{topSellers.length > 0 && (
						<div className="space-y-3">
							<h2 className="text-xl font-bold text-swapp-azul-petroleo">
								Mas vendidos
							</h2>
							<div
								ref={featuredScrollRef}
								onWheel={(e) => handleWheel(e, featuredScrollRef)}
								onMouseDown={handleMouseDown}
								onMouseLeave={handleMouseLeaveOrUp}
								onMouseUp={handleMouseLeaveOrUp}
								onMouseMove={handleMouseMove}
								className="bg-swapp-azul-petroleo rounded-xl p-4 flex flex-nowrap gap-4 overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing">
								{topSellers.map((product) => (
									<div
										key={product.product_uuid}
										onClick={() => setSelectedProduct(product)}
										className="bg-swapp-blanco rounded-xl p-3 min-w-[140px] flex-shrink-0 relative flex flex-col items-center shadow-md cursor-pointer hover:shadow-lg transition-shadow">
										{/* Badge de Oferta */}
										{product.sale_price && (
											<span className="absolute top-2 left-2 bg-swapp-turquesa-oscuro text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">
												OFERTA
											</span>
										)}

										<button
											onClick={(e) => e.stopPropagation()}
											className="absolute top-2 right-2 text-swapp-azul-oceano hover:scale-110 transition-transform z-10">
											<svg
												className="w-6 h-6"
												fill="currentColor"
												viewBox="0 0 24 24">
												<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
											</svg>
										</button>
										<img
											src={
												product.main_image_url ||
												"/product-image/placeholder.webp"
											}
											alt={product.name}
											className="h-24 w-auto object-contain mb-3"
											draggable={false}
											onError={(e) => {
												e.currentTarget.src =
													"https://via.placeholder.com/150?text=Sin+Imagen";
											}}
										/>
										<h3 className="text-xs font-semibold text-swapp-azul-petroleo text-center w-full truncate">
											{product.name}
										</h3>

										<div className="flex items-center gap-1 mt-1">
											{product.sale_price && (
												<p className="text-[10px] text-gray-400 line-through">
													${product.base_price.toLocaleString("es-AR")}
												</p>
											)}
											<p className="text-xs font-bold text-swapp-azul-petroleo">
												$
												{(
													product.sale_price ?? product.base_price
												).toLocaleString("es-AR")}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Sección: Categorías */}
					{displayCategories.length > 0 && (
						<div className="space-y-3">
							<h2 className="text-xl font-bold text-swapp-azul-petroleo">
								Categorias
							</h2>
							<div
								ref={categoryScrollRef}
								onWheel={(e) => handleWheel(e, categoryScrollRef)}
								onMouseDown={handleMouseDown}
								onMouseLeave={handleMouseLeaveOrUp}
								onMouseUp={handleMouseLeaveOrUp}
								onMouseMove={handleMouseMove}
								className="flex flex-nowrap gap-4 overflow-x-auto hide-scrollbar p-2 -m-2 cursor-grab active:cursor-grabbing">
								{displayCategories.map((cat) => (
									<div
										key={cat.category_uuid}
										onClick={() =>
											setSelectedCategoryId(
												selectedCategoryId === cat.category_id
													? null
													: cat.category_id,
											)
										}
										className={`rounded-xl p-3 min-w-[100px] flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
											selectedCategoryId === cat.category_id
												? "bg-swapp-blanco border-2 border-swapp-azul-petroleo shadow-md scale-105"
												: "bg-swapp-blanco border-2 border-transparent shadow-sm hover:bg-gray-50"
										}`}>
										<img
											src={cat.image_url || "/product-image/placeholder.webp"}
											alt={cat.name}
											className="h-12 w-auto object-contain mb-2"
											draggable={false}
											onError={(e) => {
												e.currentTarget.src =
													"https://via.placeholder.com/150?text=Sin+Imagen";
											}}
										/>
										<span
											className={`text-xs font-medium text-swapp-azul-petroleo ${selectedCategoryId === cat.category_id ? "font-bold" : ""}`}>
											{cat.name}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Sección: Grilla General */}
					<div className="grid grid-cols-2 gap-4 mt-2">
						{catalogProducts.length > 0 ? (
							catalogProducts.map((product) => (
								<div
									key={product.product_uuid}
									onClick={() => setSelectedProduct(product)}
									className={`bg-swapp-blanco rounded-xl p-4 relative flex flex-col items-center shadow-sm cursor-pointer hover:shadow-lg transition-shadow ${product.stock_quantity <= 0 ? "opacity-70" : ""}`}>
									{/* Badge Oferta o Agotado */}
									<div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
										{product.stock_quantity <= 0 ? (
											<span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
												AGOTADO
											</span>
										) : product.sale_price ? (
											<span className="bg-swapp-turquesa-oscuro text-white text-[10px] font-bold px-2 py-1 rounded-md">
												OFERTA
											</span>
										) : null}
									</div>

									<button
										onClick={(e) => e.stopPropagation()}
										className="absolute top-3 right-3 text-swapp-azul-oceano hover:scale-110 transition-transform z-10">
										<svg
											className="w-6 h-6"
											fill="currentColor"
											viewBox="0 0 24 24">
											<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
										</svg>
									</button>

									<img
										src={
											product.main_image_url ||
											"/product-image/placeholder.webp"
										}
										alt={product.name}
										className={`h-32 w-auto object-contain mb-3 ${product.stock_quantity <= 0 ? "grayscale" : ""}`}
										draggable={false}
										onError={(e) => {
											e.currentTarget.src =
												"https://via.placeholder.com/150?text=Sin+Imagen";
										}}
									/>
									<div className="w-full text-left mt-auto">
										<h3 className="text-sm font-semibold text-swapp-azul-petroleo leading-tight mb-1">
											{product.name}
										</h3>
										<div className="flex items-end gap-2">
											<p className="text-sm text-swapp-azul-petroleo font-bold">
												$
												{(
													product.sale_price ?? product.base_price
												).toLocaleString("es-AR")}
											</p>
											{product.sale_price && (
												<p className="text-[10px] text-gray-400 line-through mb-[2px]">
													${product.base_price.toLocaleString("es-AR")}
												</p>
											)}
										</div>
									</div>
								</div>
							))
						) : (
							<div className="col-span-2 py-8 text-center text-gray-500 text-sm">
								No se encontraron productos en esta categoría.
							</div>
						)}
					</div>
				</>
			)}

			{/* ========================================= */}
			{/* MODAL / POPUP DE DETALLE DE PRODUCTO      */}
			{/* ========================================= */}
			{selectedProduct && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
					<div
						className="absolute inset-0 bg-swapp-azul-petroleo/30 backdrop-blur-md transition-opacity"
						onClick={() => setSelectedProduct(null)}></div>

					<div className="relative bg-swapp-blanco w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
						<button
							onClick={() => setSelectedProduct(null)}
							className="absolute top-4 right-4 z-[70] bg-swapp-tiza p-2 rounded-full text-swapp-azul-petroleo hover:bg-gray-200 transition-colors">
							<svg
								className="w-5 h-5"
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

						<div className="overflow-y-auto p-6 flex flex-col items-center">
							<img
								src={
									selectedProduct.main_image_url ||
									"/product-image/placeholder.webp"
								}
								alt={selectedProduct.name}
								className="h-40 w-auto object-contain mb-4"
							/>

							{isCylinder && selectedProduct.stock_quantity > 0 ? (
								<span className="bg-swapp-verde-agua/20 text-swapp-turquesa-oscuro text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-2 relative z-10">
									Intercambio disponible
								</span>
							) : null}

							<h2 className="text-2xl font-bold text-swapp-azul-petroleo text-center mb-2 relative z-10">
								{selectedProduct.name}
							</h2>

							{selectedProduct.short_description && (
								<p className="text-xs font-medium text-swapp-turquesa-oscuro text-center mb-3">
									{selectedProduct.short_description}
								</p>
							)}

							<hr className="w-full border-gray-200 mb-3 relative z-10" />

							<p className="text-sm text-gray-500 text-center mb-4 leading-relaxed relative z-10">
								{selectedProduct.description || "Descripción no disponible."}
							</p>

							{/* Controles de cantidad solo si hay stock */}
							{selectedProduct.stock_quantity > 0 ? (
								isCylinder ? (
									<div className="w-full flex flex-col gap-2 mb-6">
										<div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
											<span className="text-sm font-semibold text-swapp-azul-petroleo">
												Entregas (Vacíos)
											</span>
											<div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
												<button
													onClick={() =>
														setReturnQty(Math.max(0, returnQty - 1))
													}
													className="text-xl font-bold text-swapp-azul-oceano w-6 text-center">
													-
												</button>
												<span className="font-bold text-swapp-azul-petroleo w-4 text-center">
													{returnQty}
												</span>
												<button
													onClick={() => setReturnQty(returnQty + 1)}
													className="text-xl font-bold text-swapp-azul-oceano w-6 text-center">
													+
												</button>
											</div>
										</div>
										<div className="flex justify-between items-center bg-swapp-azul-petroleo/5 p-3 rounded-xl border border-swapp-azul-petroleo/10">
											<span className="text-sm font-semibold text-swapp-azul-petroleo">
												Llevas (Llenos)
											</span>
											<div className="flex items-center gap-3 bg-white border border-swapp-azul-petroleo/20 rounded-lg px-2 py-1 shadow-sm">
												<button
													onClick={() =>
														setReceiveQty(Math.max(1, receiveQty - 1))
													}
													className="text-xl font-bold text-swapp-azul-oceano w-6 text-center">
													-
												</button>
												<span className="font-bold text-swapp-azul-petroleo w-4 text-center">
													{receiveQty}
												</span>
												<button
													onClick={() => setReceiveQty(receiveQty + 1)}
													className="text-xl font-bold text-swapp-azul-oceano w-6 text-center">
													+
												</button>
											</div>
										</div>
									</div>
								) : (
									<div className="w-full flex justify-between items-center bg-gray-50 p-3 rounded-xl mb-6">
										<span className="text-sm font-semibold text-swapp-azul-petroleo">
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
								)
							) : (
								<div className="w-full bg-red-50 p-3 rounded-xl mb-6 text-center">
									<p className="text-red-600 font-bold text-sm">
										Este producto se encuentra agotado momentáneamente.
									</p>
								</div>
							)}

							<div className="w-full flex items-center justify-between gap-4 mt-auto relative z-10">
								<div className="flex flex-col">
									<span className="text-xs text-gray-500 font-medium uppercase">
										Total
									</span>
									<span className="text-2xl font-black text-swapp-azul-petroleo">
										${finalPrice.toLocaleString("es-AR")}
									</span>
								</div>

								<button
									onClick={handleAddToCart}
									disabled={selectedProduct.stock_quantity <= 0}
									className={`flex-1 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg 
										${
											selectedProduct.stock_quantity > 0
												? "bg-swapp-azul-petroleo hover:bg-swapp-azul-oceano active:scale-95"
												: "bg-gray-400 cursor-not-allowed"
										}`}>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									{selectedProduct.stock_quantity > 0 ? "Agregar" : "Sin Stock"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

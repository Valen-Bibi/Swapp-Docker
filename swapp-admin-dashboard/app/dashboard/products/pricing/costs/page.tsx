"use client";

import React, { useEffect, useState } from "react";
import { ProductService } from "@/services/product.service";
import { api } from "@/lib/api";
import {
	DollarSign,
	Edit,
	TrendingUp,
	History,
	Layers,
	ChevronDown,
	ChevronRight,
	Image as ImageIcon,
	Tag,
} from "lucide-react";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import EditPricingModal from "@/components/products/EditPricingModal";
import PriceHistoryModal from "@/components/products/PriceHistoryModal";
import { Product, ProductVariant } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

// Expandimos el tipo para inyectar TODAS las ofertas activas correspondientes al producto
type ProductWithOffer = Product & { active_discounts?: any[] };

export default function CostsPage() {
	const [products, setProducts] = useState<ProductWithOffer[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedRows, setExpandedRows] = useState<string[]>([]);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] =
		useState<ProductWithOffer | null>(null);
	const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
		null,
	);

	const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
	const [historyProduct, setHistoryProduct] = useState<ProductWithOffer | null>(
		null,
	);
	const [historyVariant, setHistoryVariant] = useState<ProductVariant | null>(
		null,
	);

	const [searchTerm, setSearchTerm] = useState("");

	const fetchProducts = async () => {
		setLoading(true);
		try {
			// Usamos Promise.all como en la vista de Ofertas para traer todo en paralelo
			const [productsData, discountsRes] = await Promise.all([
				ProductService.getAll(),
				api.get("/api/products/admin/discounts").catch(() => ({ data: [] })),
			]);

			const discountsData = discountsRes.data;
			const now = new Date();

			const mergedProducts = productsData.map((p: Product) => {
				// Filtramos todas las ofertas vigentes que le pertenezcan a este producto padre
				const activeDiscounts = discountsData.filter(
					(d: any) =>
						d.product_uuid === p.product_uuid &&
						d.is_active &&
						new Date(d.start_date) <= now &&
						new Date(d.end_date) >= now,
				);

				return {
					...p,
					active_discounts: activeDiscounts,
				};
			});

			setProducts(mergedProducts);
		} catch (error) {
			console.error("Error obteniendo el catálogo:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	useEffect(() => {
		const handleClose = () => {
			setIsEditModalOpen(false);
			setIsHistoryModalOpen(false);
		};
		window.addEventListener("close-modals", handleClose);
		return () => window.removeEventListener("close-modals", handleClose);
	}, []);

	const toggleRow = (uuid: string) => {
		setExpandedRows((prev) =>
			prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
		);
	};

	const handleEditClick = (
		product: ProductWithOffer,
		variant: ProductVariant | null,
	) => {
		setSelectedProduct(product);
		setSelectedVariant(variant);
		setIsEditModalOpen(true);
	};

	const handleHistoryClick = (
		product: ProductWithOffer,
		variant: ProductVariant,
	) => {
		setHistoryProduct(product);
		setHistoryVariant(variant);
		setIsHistoryModalOpen(true);
	};

	const calculateMargin = (cost: number | null | undefined, price: number) =>
		!cost || cost === 0 || price === 0
			? null
			: Math.round(((price - cost) / price) * 100);

	const filteredProducts = products.filter((p) => {
		const searchLower = searchTerm.toLowerCase();
		const matchName = p.name.toLowerCase().includes(searchLower);
		const matchAnySku = p.variants?.some((v) =>
			v.sku?.toLowerCase().includes(searchLower),
		);
		return matchName || matchAnySku;
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Costos y Precios"
					description="Gestión de rentabilidad atómica (SKU) y márgenes"
					icon={DollarSign}
				/>
				<SearchBar
					searchTerm={searchTerm}
					onSearchChange={setSearchTerm}
					placeholder="Buscar por producto o SKU..."
				/>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold w-16">Imagen</th>
							<th className="px-6 py-4 font-semibold">Producto General</th>
							<th className="px-6 py-4 font-semibold">Variantes Físicas</th>
							<th className="px-6 py-4 font-semibold">Costo / Margen Ref.</th>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{filteredProducts.map((p) => {
							const mainImageUrl = p.media?.find(
								(m: any) =>
									m.media_type === "image" && m.media_subtype === "main",
							)?.file_url;

							const variantsCount = p.variants?.length || 0;
							const isExpanded = expandedRows.includes(p.product_uuid);

							// --- LÓGICA DE REFERENCIA PADRE ---
							const refCost =
								(p as any).reference_cost ?? p.variants?.[0]?.cost_price ?? 0;
							const refPriceBase =
								(p as any).reference_price ?? p.variants?.[0]?.price ?? 0;

							// Determinamos si la primera variante tiene una oferta para calcular el margen de referencia realista
							let refPriceFinal = refPriceBase;
							if (p.variants?.[0] && p.active_discounts) {
								const refDiscount = p.active_discounts.find((d: any) => {
									const isGlobal =
										!d.variant_uuids || d.variant_uuids.length === 0;
									return (
										isGlobal ||
										d.variant_uuids.includes(p.variants![0].variant_uuid)
									);
								});
								if (refDiscount) {
									refPriceFinal =
										refDiscount.discount_type === "percentage"
											? refPriceBase * (1 - refDiscount.value / 100)
											: Math.max(0, refPriceBase - refDiscount.value);
								}
							}

							const refMargin = calculateMargin(refCost, refPriceFinal);

							return (
								<React.Fragment key={p.product_uuid}>
									{/* Fila Principal (Padre) */}
									<tr
										className={`transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30 ${isExpanded ? "bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10" : ""}`}>
										<td className="px-6 py-4">
											{mainImageUrl ? (
												<img
													src={mainImageUrl}
													alt={`Imagen de ${p.name}`}
													className="h-10 w-10 rounded-md object-cover border border-swapp-tiza dark:border-swapp-azul-petroleo"
												/>
											) : (
												<div className="h-10 w-10 rounded-md bg-swapp-tiza dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30 transition-colors">
													<ImageIcon className="h-5 w-5" />
												</div>
											)}
										</td>
										<td className="px-6 py-4 font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
											{p.name}
										</td>
										<td className="px-6 py-4 font-mono text-xs">
											{variantsCount > 0 ? (
												<button
													onClick={() => toggleRow(p.product_uuid)}
													className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-turquesa-oscuro dark:text-swapp-menta font-sans font-medium">
													<Layers className="h-3.5 w-3.5" />
													{variantsCount === 1
														? "1 Variante"
														: `${variantsCount} Variantes`}
													{isExpanded ? (
														<ChevronDown className="h-4 w-4" />
													) : (
														<ChevronRight className="h-4 w-4" />
													)}
												</button>
											) : (
												<span className="text-swapp-azul-petroleo/40">
													Sin stock físico
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-xs">
											<div className="flex items-center gap-3">
												<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
													Costo: {refCost ? formatCurrency(refCost) : "-"}
												</span>
												{refMargin !== null && (
													<span
														className={`font-semibold ${refMargin > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
														({refMargin}%)
													</span>
												)}
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<button
												onClick={() => handleEditClick(p, null)}
												title="Ajustar valores de referencia"
												className="p-1.5 rounded-md text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
												<Edit className="h-4 w-4" />
											</button>
										</td>
									</tr>

									{/* Fila Desplegable (Hijos / Variantes Físicas) */}
									{isExpanded && variantsCount > 0 && (
										<tr className="bg-swapp-tiza/10 dark:bg-swapp-negro-azulado border-b border-swapp-tiza dark:border-swapp-azul-petroleo">
											{/* Ahora colSpan es 5 para cubrir toda la tabla */}
											<td colSpan={5} className="px-6 py-4">
												<div className="rounded-lg border border-swapp-tiza/50 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco dark:bg-swapp-negro-azulado/50">
													<table className="w-full text-xs text-left">
														<thead className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
															<tr>
																<th className="px-4 py-2 font-medium">
																	SKU Específico
																</th>
																<th className="px-4 py-2 font-medium">
																	Costo Interno
																</th>
																<th className="px-4 py-2 font-medium">
																	Precio Base
																</th>
																{/* NUEVA COLUMNA DE OFERTA */}
																<th className="px-4 py-2 font-medium">
																	Precio Oferta
																</th>
																<th className="px-4 py-2 font-medium">
																	Margen Neto
																</th>
																<th className="px-4 py-2 font-medium text-right">
																	Acciones
																</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-swapp-tiza/30 dark:divide-swapp-azul-petroleo/30">
															{p.variants?.map((v) => {
																// --- CÁLCULO DE OFERTA HÍBRIDA POR SKU ---
																const activeDiscount = p.active_discounts?.find(
																	(d: any) => {
																		const isGlobal =
																			!d.variant_uuids ||
																			d.variant_uuids.length === 0;
																		return (
																			isGlobal ||
																			d.variant_uuids.includes(v.variant_uuid)
																		);
																	},
																);

																let finalPrice = v.price;
																if (activeDiscount) {
																	if (
																		activeDiscount.discount_type ===
																		"percentage"
																	) {
																		finalPrice =
																			v.price *
																			(1 - activeDiscount.value / 100);
																	} else {
																		finalPrice = Math.max(
																			0,
																			v.price - activeDiscount.value,
																		);
																	}
																}

																// El margen ahora se calcula sobre el precio FINAL que pagará el cliente
																const marg = calculateMargin(
																	v.cost_price,
																	finalPrice,
																);

																return (
																	<tr
																		key={v.variant_uuid}
																		className="hover:bg-swapp-tiza/20 dark:hover:bg-swapp-azul-petroleo/20 transition-colors">
																		<td className="px-4 py-3 font-mono font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
																			{v.sku}
																		</td>
																		<td className="px-4 py-3 text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
																			{v.cost_price
																				? formatCurrency(v.cost_price)
																				: "-"}
																		</td>

																		{/* COLUMNA: Precio Base (tachado si hay oferta) */}
																		<td
																			className={`px-4 py-3 font-semibold ${activeDiscount ? "text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 line-through text-[10px]" : "text-swapp-turquesa-oscuro dark:text-swapp-menta"}`}>
																			{formatCurrency(v.price)}
																		</td>

																		{/* NUEVA COLUMNA: Precio Oferta */}
																		<td className="px-4 py-3">
																			{activeDiscount ? (
																				<div className="flex flex-col items-start gap-0.5">
																					<span className="font-bold text-emerald-600 dark:text-emerald-400">
																						{formatCurrency(finalPrice)}
																					</span>
																					<span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
																						<Tag className="h-2.5 w-2.5" />
																						{activeDiscount.name}
																					</span>
																				</div>
																			) : (
																				<span className="text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30">
																					-
																				</span>
																			)}
																		</td>

																		<td className="px-4 py-3">
																			{marg !== null ? (
																				<span
																					className={`inline-flex items-center gap-1 font-bold ${marg > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
																					<TrendingUp
																						className={`h-3 w-3 ${marg < 0 ? "rotate-180" : ""}`}
																					/>{" "}
																					{marg}%
																				</span>
																			) : (
																				<span className="text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30">
																					N/A
																				</span>
																			)}
																		</td>
																		<td className="px-4 py-3 text-right">
																			<div className="flex items-center justify-end gap-1.5">
																				<button
																					onClick={() =>
																						handleHistoryClick(p, v)
																					}
																					title="Ver historial de cambios"
																					className="p-1.5 rounded-md text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo hover:text-swapp-azul-oceano dark:hover:text-swapp-verde-agua transition-colors">
																					<History className="h-3.5 w-3.5" />
																				</button>
																				<button
																					onClick={() => handleEditClick(p, v)}
																					title="Ajustar precios y costos"
																					className="p-1.5 rounded-md text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
																					<Edit className="h-3.5 w-3.5" />
																				</button>
																			</div>
																		</td>
																	</tr>
																);
															})}
														</tbody>
													</table>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			</div>

			<EditPricingModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				product={selectedProduct}
				variant={selectedVariant}
				onSuccess={fetchProducts}
			/>

			{isHistoryModalOpen && (
				<PriceHistoryModal
					isOpen={isHistoryModalOpen}
					onClose={() => setIsHistoryModalOpen(false)}
					product={historyProduct}
					variant={historyVariant}
				/>
			)}
		</div>
	);
}

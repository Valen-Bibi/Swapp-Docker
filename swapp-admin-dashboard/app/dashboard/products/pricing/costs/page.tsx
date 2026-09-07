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
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import PriceHistoryModal from "@/components/products/PriceHistoryModal";
import { Product, ProductVariant } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

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
			const [productsData, discountsRes] = await Promise.all([
				ProductService.getAll(),
				api.get("/api/products/admin/discounts").catch(() => ({ data: [] })),
			]);

			const discountsData = discountsRes.data;
			const now = new Date();

			const mergedProducts = productsData.map((p: Product) => {
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
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Costos y Precios"
					description="Gestión de rentabilidad atómica (SKU) y márgenes"
					icon={DollarSign}
				/>
				<div className="flex items-center gap-4">
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar por producto o SKU..."
					/>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 select-none">
						<tr>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-16">Imagen</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Producto General</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Variantes Físicas</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Costo / Margen Ref.</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="">
						{filteredProducts.map((p) => {
							const mainImageUrl = p.media?.find(
								(m: any) =>
									m.media_type === "image" && m.media_subtype === "main",
							)?.file_url;

							const variantsCount = p.variants?.length || 0;
							const isExpanded = expandedRows.includes(p.product_uuid);

							const refCost =
								(p as any).reference_cost ?? p.variants?.[0]?.cost_price ?? 0;
							const refPriceBase =
								(p as any).reference_price ?? p.variants?.[0]?.price ?? 0;

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

							// Lógica visual estandarizada para filas
							const baseRowClasses = "border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200";
							const rowStatusStyle = p.is_active !== false
								? `hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20 ${isExpanded ? "bg-swapp-blanco/60 dark:bg-swapp-azul-petroleo/20" : ""}`
								: "opacity-60 bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/80 grayscale filter mix-blend-multiply dark:mix-blend-normal hover:bg-swapp-tiza-verdoso/50 dark:hover:bg-swapp-azul-oscuro/90";

							return (
								<React.Fragment key={p.product_uuid}>
									{/* Fila Principal (Padre) */}
									<tr className={`${baseRowClasses} ${rowStatusStyle}`}>
										<td className="px-6 py-4">
											{mainImageUrl ? (
												<img
													src={mainImageUrl}
													alt={`Imagen de ${p.name}`}
													className="h-10 w-10 rounded-md object-cover border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo"
												/>
											) : (
												<div className="h-10 w-10 rounded-md bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 transition-colors">
													<ImageIcon className="h-5 w-5" />
												</div>
											)}
										</td>
										<td className="px-6 py-4 font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
											{p.name}
										</td>
										<td className="px-6 py-4 font-mono text-xs">
											{variantsCount > 0 ? (
												<button
													onClick={() => toggleRow(p.product_uuid)}
													className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-verde-oscuro dark:text-swapp-verde-menta font-sans font-medium">
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
												<span className="text-swapp-azul-petroleo/60">
													Sin stock físico
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-xs">
											<div className="flex items-center gap-3">
												<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
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
											<SwappTooltip text="Ajustar Valores de Referencia">
												<button
													onClick={() => handleEditClick(p, null)}
													className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
													<Edit className="h-4 w-4" />
												</button>
											</SwappTooltip>
										</td>
									</tr>

									{/* Fila Desplegable (Hijos / Variantes Físicas) */}
									{isExpanded && variantsCount > 0 && (
										<tr className="bg-swapp-tiza-verdoso/10 dark:bg-swapp-azul-oscuro border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40">
											<td colSpan={5} className="px-6 py-4">
												<div className="rounded-lg border border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco dark:bg-swapp-azul-oscuro/50 shadow-sm">
													<table className="w-full text-xs text-left">
														<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50">
															<tr>
																<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																	SKU Específico
																</th>
																<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																	Costo Interno
																</th>
																<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																	Precio Base
																</th>
																<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																	Precio Oferta
																</th>
																<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																	Margen Neto
																</th>
																<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">
																	Acciones
																</th>
															</tr>
														</thead>
														<tbody className="">
															{p.variants?.map((v) => {
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

																const marg = calculateMargin(
																	v.cost_price,
																	finalPrice,
																);

																const baseVariantRowClasses = "border-b border-swapp-tiza-verdoso/30 dark:border-swapp-azul-petroleo/30 last:border-0 transition-all duration-200";
																const variantRowStatusStyle = v.is_active !== false
																	? "hover:bg-swapp-tiza-verdoso/30 dark:hover:bg-swapp-azul-petroleo/30"
																	: "opacity-60 bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/80 grayscale filter mix-blend-multiply dark:mix-blend-normal";

																return (
																	<tr
																		key={v.variant_uuid}
																		className={`${baseVariantRowClasses} ${variantRowStatusStyle}`}>
																		<td className="px-4 py-3 font-mono font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
																			{v.sku}
																		</td>
																		<td className="px-4 py-3 text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
																			{v.cost_price
																				? formatCurrency(v.cost_price)
																				: "-"}
																		</td>

																		<td
																			className={`px-4 py-3 font-semibold ${activeDiscount ? "text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 line-through text-[10px]" : "text-swapp-verde-oscuro dark:text-swapp-verde-menta"}`}>
																			{formatCurrency(v.price)}
																		</td>

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
																				<span className="text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30">
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
																				<span className="text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30">
																					N/A
																				</span>
																			)}
																		</td>
																		<td className="px-4 py-3 text-right">
																			<div className="flex items-center justify-end gap-1.5">
																				<SwappTooltip text="Ver Historial de Cambios">
																					<button
																						onClick={() =>
																							handleHistoryClick(p, v)
																						}
																						className="p-1.5 rounded-md text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo hover:text-swapp-azul-oceano dark:hover:text-swapp-verde-pastel transition-colors">
																						<History className="h-3.5 w-3.5" />
																					</button>
																				</SwappTooltip>
																				<SwappTooltip text="Ajustar Precios y Costos">
																					<button
																						onClick={() =>
																							handleEditClick(p, v)
																						}
																						className="p-1.5 rounded-md text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo hover:text-swapp-verde-oscuro dark:hover:text-swapp-verde-menta transition-colors">
																						<Edit className="h-3.5 w-3.5" />
																					</button>
																				</SwappTooltip>
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
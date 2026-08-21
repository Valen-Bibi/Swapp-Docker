"use client";

import React, { useEffect, useState } from "react";
import { ProductService } from "@/services/product.service";
import {
	Package,
	Plus,
	Minus,
	AlertTriangle,
	Layers,
	ChevronDown,
	ChevronRight,
	Edit,
	Check,
	X,
	Image as ImageIcon, // 1. Importación del ícono
} from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import StockMovementModal from "@/components/products/StockMovementModal";
import { Product, ProductVariant } from "@/types/product";

export default function StockPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// Estados del Modal de Movimientos
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
		null,
	);
	const [movementType, setMovementType] = useState<"ingreso" | "egreso">(
		"ingreso",
	);

	// Estados de Filtros y Acordeón
	const [searchTerm, setSearchTerm] = useState("");
	const [showLowStockOnly, setShowLowStockOnly] = useState(false);
	const [expandedRows, setExpandedRows] = useState<string[]>([]);

	// --- ESTADOS PARA EDICIÓN INLINE DEL UMBRAL ---
	const [editingThresholdId, setEditingThresholdId] = useState<string | null>(
		null,
	);
	const [draftThreshold, setDraftThreshold] = useState<number | "">("");
	const [isSavingThreshold, setIsSavingThreshold] = useState(false);

	const fetchProducts = async () => {
		try {
			const data = await ProductService.getAll();
			setProducts(data);
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
		const handleClose = () => setIsModalOpen(false);
		window.addEventListener("close-modals", handleClose);
		return () => window.removeEventListener("close-modals", handleClose);
	}, []);

	const toggleRow = (uuid: string) => {
		setExpandedRows((prev) =>
			prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
		);
	};

	const handleMovementClick = (
		product: Product,
		variant: ProductVariant,
		type: "ingreso" | "egreso",
	) => {
		setSelectedProduct(product);
		setSelectedVariant(variant);
		setMovementType(type);
		setIsModalOpen(true);
	};

	// --- LÓGICA DE EDICIÓN INLINE ---
	const startEditingThreshold = (variant: ProductVariant) => {
		setEditingThresholdId(variant.variant_uuid!);
		setDraftThreshold(variant.low_stock_threshold ?? 5);
	};

	const cancelEditingThreshold = () => {
		setEditingThresholdId(null);
		setDraftThreshold("");
	};

	const saveThreshold = async (productUuid: string, variantUuid: string) => {
		if (draftThreshold === "" || Number(draftThreshold) < 0) {
			toast.error("El umbral debe ser un número válido.");
			return;
		}

		setIsSavingThreshold(true);
		const toastId = toast.loading("Actualizando umbral...");

		try {
			await ProductService.updateVariant(productUuid, variantUuid, {
				low_stock_threshold: Number(draftThreshold),
			});
			toast.success("Umbral actualizado exitosamente", { id: toastId });
			setEditingThresholdId(null);
			fetchProducts();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar.", {
				id: toastId,
			});
		} finally {
			setIsSavingThreshold(false);
		}
	};

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.variants?.some((v) =>
				v.sku.toLowerCase().includes(searchTerm.toLowerCase()),
			);

		const hasLowStockVariant = product.variants?.some(
			(v) => v.stock_quantity <= (v.low_stock_threshold ?? 5),
		);
		const matchesLowStock = showLowStockOnly ? hasLowStockVariant : true;

		return matchesSearch && matchesLowStock;
	});

	const {
		sortedData: processedProducts,
		sortKey,
		sortDirection,
		handleSort,
	} = useTableSort(filteredProducts, {
		type: (p) => (p.is_returnable ? 1 : 0),
		stock: (p) =>
			p.variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0,
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Control de Inventario"
					description="Gestión atómica de ingresos y descartes físicos"
					icon={Package}
				/>

				<div className="flex flex-col sm:flex-row items-center gap-3">
					<button
						onClick={() => setShowLowStockOnly(!showLowStockOnly)}
						className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
							showLowStockOnly
								? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
								: "bg-swapp-blanco dark:bg-swapp-negro-azulado border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo"
						}`}>
						<AlertTriangle
							className={`h-4 w-4 ${showLowStockOnly ? "text-red-600 dark:text-red-400" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50"}`}
						/>
						{showLowStockOnly ? "Viendo Stock Crítico" : "Filtrar Stock Bajo"}
					</button>
					<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold w-16">Imagen</th>{" "}
							{/* 2. Nueva columna */}
							<SortableHeader
								label="Producto Padre"
								columnKey="name"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 font-semibold">Variantes Físicas</th>
							<SortableHeader
								label="Tipo"
								columnKey="type"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Stock Global"
								columnKey="stock"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{processedProducts.map((product) => {
							// 3. Extracción de la URL de la imagen principal
							const mainImageUrl = product.media?.find(
								(m: any) =>
									m.media_type === "image" && m.media_subtype === "main",
							)?.file_url;

							const variantsCount = product.variants?.length || 0;
							const isExpanded = expandedRows.includes(product.product_uuid);
							const totalStock =
								product.variants?.reduce(
									(acc, v) => acc + v.stock_quantity,
									0,
								) || 0;

							const hasAnyLowStock = product.variants?.some(
								(v) => v.stock_quantity <= (v.low_stock_threshold ?? 5),
							);

							return (
								<React.Fragment key={product.product_uuid}>
									{/* FILA PRINCIPAL (PADRE) */}
									<tr
										className={`transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30 ${isExpanded ? "bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10" : ""}`}>
										<td className="px-6 py-4">
											{" "}
											{/* 3. Renderizado de la imagen */}
											{mainImageUrl ? (
												<img
													src={mainImageUrl}
													alt={`Imagen de ${product.name}`}
													className="h-10 w-10 rounded-md object-cover border border-swapp-tiza dark:border-swapp-azul-petroleo"
												/>
											) : (
												<div className="h-10 w-10 rounded-md bg-swapp-tiza dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30 transition-colors">
													<ImageIcon className="h-5 w-5" />
												</div>
											)}
										</td>
										<td className="px-6 py-4 font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
											{product.name}
										</td>
										<td className="px-6 py-4 font-mono text-xs text-swapp-azul-petroleo dark:text-swapp-tiza">
											{variantsCount > 0 ? (
												<button
													onClick={() => toggleRow(product.product_uuid)}
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
												<span className="italic text-swapp-azul-petroleo/40">
													Sin variantes
												</span>
											)}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product.is_returnable ? "bg-swapp-azul-oceano/10 dark:bg-swapp-menta/10 text-swapp-azul-oceano dark:text-swapp-menta" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza"}`}>
												{product.is_returnable ? "Retornable" : "Estándar"}
											</span>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold ${!hasAnyLowStock ? "bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 text-swapp-turquesa-oscuro dark:text-swapp-menta" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"}`}>
												{totalStock} unidades globales
											</span>
										</td>
									</tr>

									{/* ACORDEÓN DESPLEGABLE (VARIANTES) */}
									{isExpanded && variantsCount > 0 && (
										<tr className="bg-swapp-tiza/10 dark:bg-swapp-negro-azulado border-b border-swapp-tiza dark:border-swapp-azul-petroleo">
											<td colSpan={5} className="px-6 py-4">
												{" "}
												{/* 4. Ajuste del colSpan a 5 */}
												<div className="rounded-lg border border-swapp-tiza/50 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco dark:bg-swapp-negro-azulado/50">
													<table className="w-full text-xs text-left">
														<thead className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
															<tr>
																<th className="px-4 py-3 font-medium w-1/5">
																	SKU Físico
																</th>
																<th className="px-4 py-3 font-medium w-1/5">
																	Atributos
																</th>
																<th className="px-4 py-3 font-medium w-1/5">
																	Umbral Mínimo
																</th>
																<th className="px-4 py-3 font-medium w-1/5">
																	Stock Individual
																</th>
																<th className="px-4 py-3 font-medium text-right w-1/5">
																	Acciones
																</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-swapp-tiza/30 dark:divide-swapp-azul-petroleo/30">
															{product.variants?.map((v) => {
																const isEditing =
																	editingThresholdId === v.variant_uuid;
																const isLowStock =
																	v.stock_quantity <=
																	(v.low_stock_threshold ?? 5);

																return (
																	<tr
																		key={v.variant_uuid}
																		className="hover:bg-swapp-tiza/20 dark:hover:bg-swapp-azul-petroleo/20">
																		<td className="px-4 py-3 font-mono text-swapp-negro-azulado dark:text-swapp-blanco font-medium">
																			{v.sku}
																		</td>
																		<td className="px-4 py-3">
																			{v.variant_attributes ? (
																				<div className="flex flex-wrap gap-1">
																					{Object.entries(
																						v.variant_attributes,
																					).map(([key, val]) => (
																						<span
																							key={key}
																							className="inline-block bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza px-1.5 py-0.5 rounded text-[10px] font-medium border border-swapp-tiza/50 dark:border-swapp-azul-petroleo/50">
																							{key}: {String(val)}
																						</span>
																					))}
																				</div>
																			) : (
																				<span className="text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 italic">
																					Sin atributos
																				</span>
																			)}
																		</td>
																		<td className="px-4 py-3">
																			{isEditing ? (
																				<input
																					type="number"
																					min="0"
																					className="w-20 rounded-md border border-swapp-turquesa-oscuro dark:border-swapp-menta bg-swapp-blanco dark:bg-swapp-negro-azulado px-2 py-1 text-xs text-swapp-negro-azulado dark:text-swapp-blanco outline-none shadow-sm focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta transition-all"
																					value={draftThreshold}
																					onChange={(e) =>
																						setDraftThreshold(
																							e.target.value === ""
																								? ""
																								: parseInt(e.target.value),
																						)
																					}
																				/>
																			) : (
																				<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
																					{v.low_stock_threshold ?? 5} un.
																				</span>
																			)}
																		</td>
																		<td className="px-4 py-3">
																			<span
																				className={`font-semibold ${!isLowStock ? "text-swapp-verde-agua dark:text-swapp-menta" : "text-red-600 dark:text-red-400"}`}>
																				{v.stock_quantity} un.
																			</span>
																		</td>
																		<td className="px-4 py-2 text-right">
																			{isEditing ? (
																				<div className="flex items-center justify-end gap-1.5">
																					<button
																						onClick={() =>
																							saveThreshold(
																								product.product_uuid,
																								v.variant_uuid!,
																							)
																						}
																						disabled={isSavingThreshold}
																						className="p-1.5 rounded-md bg-swapp-verde-agua/20 text-swapp-turquesa-oscuro dark:bg-swapp-menta/20 dark:text-swapp-menta hover:bg-swapp-verde-agua/40 transition-colors"
																						title="Guardar">
																						<Check className="h-4 w-4" />
																					</button>
																					<button
																						onClick={cancelEditingThreshold}
																						disabled={isSavingThreshold}
																						className="p-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
																						title="Cancelar">
																						<X className="h-4 w-4" />
																					</button>
																				</div>
																			) : (
																				<div className="flex items-center justify-end gap-2">
																					<button
																						onClick={() =>
																							startEditingThreshold(v)
																						}
																						className="p-1.5 text-swapp-azul-petroleo/50 hover:text-swapp-turquesa-oscuro dark:text-swapp-tiza/50 dark:hover:text-swapp-menta transition-colors"
																						title="Editar Umbral Mínimo">
																						<Edit className="h-3.5 w-3.5" />
																					</button>
																					<div className="w-px h-4 bg-swapp-tiza dark:bg-swapp-azul-petroleo mx-1" />
																					<button
																						onClick={() =>
																							handleMovementClick(
																								product,
																								v,
																								"ingreso",
																							)
																						}
																						className="p-1.5 text-swapp-turquesa-oscuro dark:text-swapp-menta bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 rounded-md hover:bg-swapp-verde-agua/20 dark:hover:bg-swapp-menta/20 transition-colors"
																						title="Registrar Ingreso">
																						<Plus className="h-4 w-4" />
																					</button>
																					<button
																						onClick={() =>
																							handleMovementClick(
																								product,
																								v,
																								"egreso",
																							)
																						}
																						className="p-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
																						title="Registrar Egreso / Descarte">
																						<Minus className="h-4 w-4" />
																					</button>
																				</div>
																			)}
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

			<StockMovementModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				product={selectedProduct}
				variant={selectedVariant}
				movementType={movementType}
				onSuccess={fetchProducts}
			/>
		</div>
	);
}

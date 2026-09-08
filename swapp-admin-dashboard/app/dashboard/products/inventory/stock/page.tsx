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
	Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import StockMovementModal from "@/components/products/modals/StockMovementModal";
import { Product, ProductVariant } from "@/types/product";
import { useSearchParams } from "next/navigation";

// --- NUEVOS COMPONENTES ESTANDARIZADOS ---
import GlassTableWrapper from "@/components/tables/GlassTableWrapper";
import GlassTableHead, { GlassTh } from "@/components/tables/GlassTableHead";
import TableActionIcon from "@/components/tables/TableActionIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import GlassFilterToggle from "@/components/ui/GlassFilterToggle";
import AnimatedTableRow from "@/components/tables/AnimatedTableRow";

export default function StockPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
		null,
	);
	const [movementType, setMovementType] = useState<"ingreso" | "egreso">(
		"ingreso",
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [showLowStockOnly, setShowLowStockOnly] = useState(false);
	const [expandedRows, setExpandedRows] = useState<string[]>([]);

	const searchParams = useSearchParams();

	useEffect(() => {
		if (searchParams.get("low_stock") === "true") {
			setShowLowStockOnly(true);
		}
	}, [searchParams]);

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
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Control de Inventario"
					description="Gestión atómica de ingresos y descartes físicos"
					icon={Package}
				/>

				<div className="flex items-center gap-4">
					{/* TOGGLE ESTANDARIZADO */}
					<GlassFilterToggle
						id="toggle-low-stock"
						icon={AlertTriangle}
						iconActiveColor="text-red-500"
						labelOn="Viendo Stock Crítico"
						labelOff="Filtrar Stock Bajo"
						checked={showLowStockOnly}
						onChange={setShowLowStockOnly}
					/>

					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar por nombre o SKU..."
					/>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA MODULARIZADO */}
			<GlassTableWrapper>
				<GlassTableHead>
					<GlassTh className="w-16">Imagen</GlassTh>
					<SortableHeader
						label="Producto Padre"
						columnKey="name"
						currentSortKey={sortKey}
						currentDirection={sortDirection}
						onSort={handleSort}
					/>
					<GlassTh>Variantes Físicas</GlassTh>
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
				</GlassTableHead>

				<tbody>
					{processedProducts.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
								No se encontraron productos en el inventario.
							</td>
						</tr>
					) : (
						processedProducts.map((product) => {
							const mainImageUrl = product.media?.find(
								(m: any) =>
									m.media_type === "image" && m.media_subtype === "main",
							)?.file_url;

							const variantsCount = product.variants?.length || 0;
							const isExpanded = expandedRows.includes(product.product_uuid!);
							const totalStock =
								product.variants?.reduce(
									(acc, v) => acc + v.stock_quantity,
									0,
								) || 0;

							const hasAnyLowStock = product.variants?.some(
								(v) => v.stock_quantity <= (v.low_stock_threshold ?? 5),
							);

							const baseRowClasses =
								"border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";
							const rowStatusStyle = `hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30 ${isExpanded ? "bg-swapp-blanco/80 dark:bg-swapp-azul-petroleo/30" : ""}`;

							return (
								<React.Fragment key={product.product_uuid}>
									{/* FILA PRINCIPAL (PADRE) */}
									<tr className={`${baseRowClasses} ${rowStatusStyle}`}>
										{/* IMAGEN DE PRODUCTO */}
										<td className="px-6 py-4">
											{mainImageUrl ? (
												<img
													src={mainImageUrl}
													alt={`Imagen de ${product.name}`}
													className="h-10 w-10 rounded-md object-cover bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo shadow-sm p-0.5"
												/>
											) : (
												<div className="h-10 w-10 rounded-md bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/40 border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 transition-colors shadow-sm">
													<ImageIcon className="h-5 w-5" />
												</div>
											)}
										</td>

										{/* NOMBRE DEL PRODUCTO */}
										<td className="px-6 py-4 font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
											{product.name}
										</td>

										{/* DESPLEGABLE DE VARIANTES */}
										<td className="px-6 py-4 font-mono text-xs text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
											{variantsCount > 0 ? (
												<button
													onClick={() => toggleRow(product.product_uuid!)}
													className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-verde-oscuro dark:text-swapp-verde-menta font-sans font-bold shadow-sm">
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
												<span className="text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40">
													-
												</span>
											)}
										</td>

										{/* TIPO CON STATUS BADGE */}
										<td className="px-6 py-4">
											<StatusBadge
												variant={product.is_returnable ? "info" : "neutral"}
												className="uppercase !text-[10px]">
												{product.is_returnable ? "Retornable" : "Estándar"}
											</StatusBadge>
										</td>

										{/* STOCK GLOBAL CON STATUS BADGE */}
										<td className="px-6 py-4">
											<StatusBadge
												variant={hasAnyLowStock ? "danger" : "primary"}>
												{totalStock} unidades globales
											</StatusBadge>
										</td>
									</tr>

									{/* ACORDEÓN DESPLEGABLE (VARIANTES) - MODULARIZADO */}
									{variantsCount > 0 && (
										<AnimatedTableRow isExpanded={isExpanded} colSpan={5}>
											<table className="w-full text-xs text-left">
												{/* CABECERA VARIANTES */}
												<thead className="bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50">
													<tr>
														<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5">
															SKU Físico
														</th>
														<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5">
															Atributos
														</th>
														<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5">
															Umbral Mínimo
														</th>
														<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5">
															Stock Individual
														</th>
														<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-right w-1/5">
															Acciones
														</th>
													</tr>
												</thead>

												<tbody>
													{product.variants?.map((v) => {
														const isEditing =
															editingThresholdId === v.variant_uuid;
														const isLowStock =
															v.stock_quantity <= (v.low_stock_threshold ?? 5);

														const baseVariantRowClasses =
															"border-b border-swapp-azul-petroleo/5 dark:border-swapp-azul-petroleo/20 last:border-0 transition-all duration-200";
														const variantRowStatusStyle =
															"hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20";

														return (
															<tr
																key={v.variant_uuid}
																className={`${baseVariantRowClasses} ${variantRowStatusStyle}`}>
																{/* SKU */}
																<td className="px-4 py-3 font-mono text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/90 font-medium">
																	{v.sku}
																</td>

																{/* ATRIBUTOS */}
																<td className="px-4 py-3">
																	{v.variant_attributes ? (
																		<div className="flex flex-wrap gap-1.5">
																			{Object.entries(v.variant_attributes).map(
																				([key, val]) => (
																					<span
																						key={key}
																						className="inline-block bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/40 text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso px-1.5 py-0.5 rounded-md text-[10px] font-medium shadow-sm">
																						{key}: {String(val)}
																					</span>
																				),
																			)}
																		</div>
																	) : (
																		<span className="text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 italic">
																			Sin atributos
																		</span>
																	)}
																</td>

																{/* UMBRAL */}
																<td className="px-4 py-3 align-middle">
																	{isEditing ? (
																		<input
																			type="number"
																			min="0"
																			className="w-20 rounded-md border border-swapp-verde-oscuro dark:border-swapp-verde-menta bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-2 py-1 text-xs text-swapp-azul-oscuro dark:text-swapp-blanco outline-none shadow-sm focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
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
																		<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 font-medium">
																			{v.low_stock_threshold ?? 5} un.
																		</span>
																	)}
																</td>

																{/* STOCK INDIVIDUAL */}
																<td className="px-4 py-3 align-middle">
																	<span
																		className={`font-bold ${!isLowStock ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-red-600 dark:text-red-400"}`}>
																		{v.stock_quantity} un.
																	</span>
																</td>

																{/* ACCIONES DE LA VARIANTE */}
																<td className="px-4 py-2 text-right align-middle">
																	{isEditing ? (
																		<div className="flex items-center justify-end gap-1.5">
																			<TableActionIcon
																				icon={Check}
																				tooltip="Guardar"
																				variant="glass-success"
																				size="sm"
																				disabled={isSavingThreshold}
																				onClick={() =>
																					saveThreshold(
																						product.product_uuid!,
																						v.variant_uuid!,
																					)
																				}
																			/>
																			<TableActionIcon
																				icon={X}
																				tooltip="Cancelar"
																				variant="glass-danger"
																				size="sm"
																				disabled={isSavingThreshold}
																				onClick={cancelEditingThreshold}
																			/>
																		</div>
																	) : (
																		<div className="flex items-center justify-end gap-2">
																			<TableActionIcon
																				icon={Edit}
																				tooltip="Editar Umbral Mínimo"
																				size="sm"
																				onClick={() => startEditingThreshold(v)}
																			/>
																			<div className="w-px h-4 bg-swapp-azul-petroleo/20 dark:bg-swapp-azul-petroleo mx-1" />
																			<TableActionIcon
																				icon={Plus}
																				tooltip="Registrar Ingreso"
																				variant="glass-primary"
																				size="sm"
																				onClick={() =>
																					handleMovementClick(
																						product,
																						v,
																						"ingreso",
																					)
																				}
																			/>
																			<TableActionIcon
																				icon={Minus}
																				tooltip="Registrar Egreso / Descarte"
																				variant="glass-danger"
																				size="sm"
																				onClick={() =>
																					handleMovementClick(
																						product,
																						v,
																						"egreso",
																					)
																				}
																			/>
																		</div>
																	)}
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</AnimatedTableRow>
									)}
								</React.Fragment>
							);
						})
					)}
				</tbody>
			</GlassTableWrapper>

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

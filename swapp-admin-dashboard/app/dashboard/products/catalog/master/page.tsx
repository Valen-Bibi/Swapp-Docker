"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product.service";
import {
	Box,
	Plus,
	Edit,
	Image as ImageIcon,
	ChevronDown,
	ChevronRight,
	Layers,
	PlusSquare,
	Check,
	X,
	Archive,
	RotateCcw,
	Copy,
	Recycle,
	ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import EditStructureModal from "@/components/products/EditStructureModal";
import NewVariantModal from "@/components/products/NewVariantModal";
import { SwappToggle } from "@/components/ui/SwappToggle";
import {
	SwappAttributeBuilder,
	AttributePair,
} from "@/components/ui/SwappAttributeBuilder";
import { useTableSort } from "@/hooks/useTableSort";
import { Product, Brand, Category, TaxClass } from "@/types/product";

export default function MasterCatalogPage() {
	const router = useRouter();
	const [products, setProducts] = useState<Product[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
	const [loading, setLoading] = useState(true);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

	const [expandedRows, setExpandedRows] = useState<string[]>([]);
	const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
	const [draftSku, setDraftSku] = useState("");
	const [draftAttributes, setDraftAttributes] = useState<AttributePair[]>([]);
	const [isSavingVariant, setIsSavingVariant] = useState(false);
	const [showInactiveVariants, setShowInactiveVariants] = useState<
		Record<string, boolean>
	>({});

	// --- ESTADO PARA EL MAPEO FOTOGRÁFICO ---
	const [imagePickerVariant, setImagePickerVariant] = useState<{
		productUuid: string;
		variantUuid: string;
		media: any[];
	} | null>(null);

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

	const fetchInitialData = async () => {
		try {
			const [brandsData, categoriesData, taxesData] = await Promise.all([
				ProductService.getBrands(),
				ProductService.getCategories(),
				ProductService.getTaxes(),
			]);
			setBrands(brandsData);
			setCategories(categoriesData);
			setTaxClasses(taxesData);
		} catch (error) {
			console.error("Error obteniendo datos iniciales:", error);
			toast.error("Error al cargar marcas, categorías o impuestos.");
		}
	};

	useEffect(() => {
		fetchProducts();
		fetchInitialData();
	}, []);

	useEffect(() => {
		const handleClose = () => setIsEditModalOpen(false);
		window.addEventListener("close-modals", handleClose);
		return () => window.removeEventListener("close-modals", handleClose);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.altKey && e.key.toLowerCase() === "n") {
				e.preventDefault();
				const activeTag = document.activeElement?.tagName;
				const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA";
				if (!isTyping) {
					router.push("/dashboard/products/catalog/master/new");
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [router]);

	const toggleRow = (uuid: string) => {
		setExpandedRows((prev) =>
			prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
		);
	};

	const handleCopySku = (sku: string) => {
		navigator.clipboard.writeText(sku);
		toast.success(`SKU ${sku} copiado`, { position: "top-center" });
	};

	const startEditingVariant = (variant: any) => {
		setEditingVariantId(variant.variant_uuid);
		setDraftSku(variant.sku || "");
		if (variant.variant_attributes) {
			const attrArray = Object.entries(variant.variant_attributes).map(
				([key, value]) => ({
					key,
					value: String(value),
				}),
			);
			setDraftAttributes(attrArray);
		} else {
			setDraftAttributes([]);
		}
	};

	const cancelEditingVariant = () => {
		setEditingVariantId(null);
		setDraftSku("");
		setDraftAttributes([]);
	};

	const saveVariant = async (productUuid: string, variantUuid: string) => {
		if (!draftSku.trim()) {
			toast.error("El SKU es obligatorio.");
			return;
		}

		const parsedVariants = draftAttributes.reduce(
			(acc: Record<string, string>, curr) => {
				if (curr.key.trim() !== "") {
					acc[curr.key.trim()] = curr.value.trim();
				}
				return acc;
			},
			{},
		);

		const finalAttributes =
			Object.keys(parsedVariants).length > 0 ? parsedVariants : null;

		setIsSavingVariant(true);
		const toastId = toast.loading("Actualizando variante...");

		try {
			await ProductService.updateVariant(productUuid, variantUuid, {
				sku: draftSku,
				variant_attributes: finalAttributes,
			});
			toast.success("Variante actualizada exitosamente", { id: toastId });
			setEditingVariantId(null);
			fetchProducts();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar.", {
				id: toastId,
			});
		} finally {
			setIsSavingVariant(false);
		}
	};

	const toggleVariantStatus = async (
		productUuid: string,
		variantUuid: string,
		currentStatus: boolean,
	) => {
		const isDeactivating = currentStatus;
		const toastId = toast.loading(
			isDeactivating ? "Archivando variante..." : "Restaurando variante...",
		);

		try {
			await ProductService.updateVariant(productUuid, variantUuid, {
				is_active: !isDeactivating,
			});
			toast.success(
				isDeactivating
					? "Variante archivada exitosamente"
					: "Variante restaurada",
				{ id: toastId },
			);
			fetchProducts();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al modificar el estado.",
				{ id: toastId },
			);
		}
	};

	// --- ASIGNAR IMAGEN A VARIANTE ---
	const assignVariantImage = async (imageUrl: string) => {
		if (!imagePickerVariant) return;

		const toastId = toast.loading("Enlazando fotografía...");
		try {
			await ProductService.updateVariant(
				imagePickerVariant.productUuid,
				imagePickerVariant.variantUuid,
				{
					image_url: imageUrl,
				},
			);
			toast.success("Fotografía asignada correctamente", { id: toastId });
			setImagePickerVariant(null);
			fetchProducts();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al asignar la imagen.",
				{ id: toastId },
			);
		}
	};

	const filteredProducts = products.filter((p) => {
		const searchLower = searchTerm.toLowerCase();
		const matchName = p.name.toLowerCase().includes(searchLower);
		const matchAnySku = p.variants?.some((v) =>
			v.sku?.toLowerCase().includes(searchLower),
		);
		return matchName || matchAnySku;
	});

	const {
		sortedData: processedProducts,
		sortKey,
		sortDirection,
		handleSort,
	} = useTableSort(filteredProducts, {
		returnable: (p) => (p.is_returnable ? 1 : 0),
		status: (p) => (p.is_published ? 1 : 0),
		sku: (p) => p.variants?.[0]?.sku || "",
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Catálogo Maestro"
					description="Gestión de identidad y multimedia"
					icon={Box}
				/>
				<div className="flex items-center gap-3">
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar por nombre o SKU..."
					/>
					<SwappTooltip text="Crear un nuevo ítem" shortcut="Alt + N">
						<button
							onClick={() =>
								router.push("/dashboard/products/catalog/master/new")
							}
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua transition-colors">
							<Plus className="h-4 w-4" /> Nuevo Producto
						</button>
					</SwappTooltip>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold">Imagen</th>
							<SortableHeader
								label="Producto e Identidad"
								columnKey="name"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="SKU / Variantes"
								columnKey="sku"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Logística (IA)"
								columnKey="returnable"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Estado"
								columnKey="status"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{processedProducts.map((p) => {
							const mainImageUrl = p.media?.find(
								(m: any) =>
									m.media_type === "image" && m.media_subtype === "main",
							)?.file_url;

							const totalVariantsCount = p.variants?.length || 0;
							const isShowingInactive = !!showInactiveVariants[p.product_uuid];
							const visibleVariants =
								p.variants?.filter((v) => isShowingInactive || v.is_active) ||
								[];
							const isExpanded = expandedRows.includes(p.product_uuid);

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
													className="h-12 w-12 rounded-md object-cover border border-swapp-tiza dark:border-swapp-azul-petroleo"
												/>
											) : (
												<div className="h-12 w-12 rounded-md bg-swapp-tiza dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30 transition-colors">
													<ImageIcon className="h-6 w-6" />
												</div>
											)}
										</td>
										<td className="px-6 py-4">
											<div className="font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
												{p.name}
											</div>
											<div className="text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 flex items-center gap-1 mt-0.5">
												{p.brand?.name && (
													<>
														<span className="font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta">
															{p.brand.name}
														</span>
														<span>•</span>
													</>
												)}
												<span>/{p.slug}</span>
											</div>
										</td>
										<td className="px-6 py-4 font-mono text-xs text-swapp-azul-petroleo dark:text-swapp-tiza">
											{totalVariantsCount > 0 ? (
												<button
													onClick={() => toggleRow(p.product_uuid)}
													className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-turquesa-oscuro dark:text-swapp-menta font-sans font-medium">
													<Layers className="h-3.5 w-3.5" />
													{totalVariantsCount === 1
														? "1 Variante"
														: `${totalVariantsCount} Variantes`}
													{isExpanded ? (
														<ChevronDown className="h-4 w-4" />
													) : (
														<ChevronRight className="h-4 w-4" />
													)}
												</button>
											) : (
												"-"
											)}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.is_returnable ? "bg-swapp-azul-oceano/10 dark:bg-swapp-menta/10 text-swapp-azul-oceano dark:text-swapp-menta" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza"}`}>
												{p.is_returnable ? "Retornable" : "Estándar"}
											</span>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${p.is_published ? "bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 text-swapp-turquesa-oscuro dark:text-swapp-menta" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza"}`}>
												{p.is_published ? "Publicado" : "Borrador"}
											</span>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<SwappTooltip text="Añadir Variante Física">
													<button
														onClick={() => {
															setSelectedProduct(p);
															setIsNewVariantModalOpen(true);
														}}
														className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
														<PlusSquare className="h-4 w-4" />
													</button>
												</SwappTooltip>
												<SwappTooltip text="Editar Estructura General">
													<button
														onClick={() => {
															setEditingProduct(p);
															setIsEditModalOpen(true);
														}}
														className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-azul-oceano dark:hover:text-swapp-verde-agua transition-colors">
														<Edit className="h-4 w-4" />
													</button>
												</SwappTooltip>
											</div>
										</td>
									</tr>

									{/* Fila Desplegable (Hijos / Variantes) */}
									{isExpanded && totalVariantsCount > 0 && (
										<tr className="bg-swapp-tiza/10 dark:bg-swapp-negro-azulado border-b border-swapp-tiza dark:border-swapp-azul-petroleo">
											<td colSpan={6} className="px-6 py-4">
												<div className="rounded-lg border border-swapp-tiza/50 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco dark:bg-swapp-negro-azulado/50">
													<table className="w-full text-xs text-left">
														<thead className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
															<tr>
																<th className="px-4 py-2 font-medium w-12 text-center">
																	Img
																</th>
																<th className="px-4 py-2 font-medium w-1/4">
																	<div className="flex items-center gap-2">
																		<SwappTooltip
																			text={
																				isShowingInactive
																					? "Ocultar Archivados"
																					: "Mostrar Archivados"
																			}>
																			<div className="scale-[0.80] origin-left flex items-center">
																				<SwappToggle
																					checked={isShowingInactive}
																					onChange={(val) =>
																						setShowInactiveVariants((prev) => ({
																							...prev,
																							[p.product_uuid]: val,
																						}))
																					}
																					id={`toggle-${p.product_uuid}`}
																				/>
																			</div>
																		</SwappTooltip>
																		<span>SKU Específico</span>
																	</div>
																</th>
																<th className="px-4 py-2 font-medium w-2/4">
																	Atributos
																</th>
																<th className="px-4 py-2 font-medium">
																	Precio
																</th>
																<th className="px-4 py-2 font-medium">
																	Stock Físico
																</th>
																<th className="px-4 py-2 font-medium text-right">
																	Acciones
																</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-swapp-tiza/30 dark:divide-swapp-azul-petroleo/30">
															{visibleVariants.length === 0 ? (
																<tr>
																	<td
																		colSpan={6}
																		className="px-4 py-6 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 italic">
																		Todas las variantes están archivadas.
																		Encendé el switch para verlas.
																	</td>
																</tr>
															) : (
																visibleVariants.map((v: any) => {
																	const isEditing =
																		editingVariantId === v.variant_uuid;
																	const rowStatusStyle = v.is_active
																		? "hover:bg-swapp-tiza/20 dark:hover:bg-swapp-azul-petroleo/20"
																		: "opacity-60 bg-swapp-tiza/40 dark:bg-swapp-negro-azulado/80 grayscale filter mix-blend-multiply dark:mix-blend-normal";

																	return (
																		<tr
																			key={v.variant_uuid}
																			className={`transition-all ${rowStatusStyle}`}>
																			{/* --- NUEVA COLUMNA FOTOGRÁFICA --- */}
																			<td className="px-4 py-2 align-middle text-center">
																				<SwappTooltip text="Asignar fotografía">
																					<button
																						onClick={() =>
																							setImagePickerVariant({
																								productUuid: p.product_uuid!,
																								variantUuid: v.variant_uuid,
																								media: p.media || [],
																							})
																						}
																						className="group relative h-8 w-8 overflow-hidden rounded bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/50 border border-swapp-tiza dark:border-swapp-azul-petroleo flex items-center justify-center hover:border-swapp-turquesa-oscuro dark:hover:border-swapp-menta transition-colors">
																						{v.image_url ? (
																							<>
																								<img
																									src={v.image_url}
																									alt={v.sku}
																									className="h-full w-full object-cover"
																								/>
																								<div className="absolute inset-0 bg-swapp-negro-azulado/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
																									<ImagePlus className="h-4 w-4 text-swapp-blanco" />
																								</div>
																							</>
																						) : (
																							<ImageIcon className="h-4 w-4 text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30 group-hover:text-swapp-turquesa-oscuro dark:group-hover:text-swapp-menta" />
																						)}
																					</button>
																				</SwappTooltip>
																			</td>

																			<td className="px-4 py-2.5 font-mono text-swapp-negro-azulado dark:text-swapp-blanco align-middle">
																				{isEditing ? (
																					<input
																						type="text"
																						className="w-full rounded-md border border-swapp-turquesa-oscuro dark:border-swapp-menta bg-swapp-blanco dark:bg-swapp-negro-azulado px-2 py-1 text-xs text-swapp-negro-azulado dark:text-swapp-blanco outline-none shadow-sm focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta transition-all"
																						value={draftSku}
																						onChange={(e) =>
																							setDraftSku(e.target.value)
																						}
																						placeholder="Ej: SKU-123"
																					/>
																				) : (
																					<div className="flex items-center gap-2 group/sku">
																						<span
																							className={
																								!v.is_active
																									? "line-through opacity-70"
																									: ""
																							}>
																							{v.sku}
																						</span>

																						{p.is_returnable && (
																							<SwappTooltip text="Activo Circulante (Logística Inversa habilitada)">
																								<Recycle className="h-4 w-4 text-swapp-verde-agua dark:text-swapp-menta/90" />
																							</SwappTooltip>
																						)}

																						{v.sku && (
																							<SwappTooltip text="Copiar al portapapeles">
																								<button
																									onClick={() =>
																										handleCopySku(v.sku)
																									}
																									className="opacity-0 group-hover/sku:opacity-100 p-1 rounded-md text-swapp-azul-petroleo/40 hover:text-swapp-turquesa-oscuro dark:text-swapp-tiza/40 dark:hover:text-swapp-menta hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-all">
																									<Copy className="h-3.5 w-3.5" />
																								</button>
																							</SwappTooltip>
																						)}
																					</div>
																				)}
																			</td>
																			<td className="px-4 py-2.5 align-middle">
																				{isEditing ? (
																					<div className="min-w-[250px] scale-[0.90] origin-left">
																						<SwappAttributeBuilder
																							attributes={draftAttributes}
																							onChange={setDraftAttributes}
																						/>
																					</div>
																				) : v.variant_attributes ? (
																					<div className="flex flex-wrap gap-1">
																						{Object.entries(
																							v.variant_attributes,
																						).map(([key, val]) => (
																							<span
																								key={key}
																								className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${v.is_active ? "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza border-swapp-tiza/50 dark:border-swapp-azul-petroleo/50" : "bg-transparent border-swapp-azul-petroleo/30 dark:border-swapp-tiza/30 text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60"}`}>
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
																			<td className="px-4 py-2.5 font-medium text-swapp-turquesa-oscuro dark:text-swapp-menta align-middle">
																				$
																				{Number(v.price).toLocaleString(
																					"es-AR",
																				)}
																			</td>
																			<td className="px-4 py-2.5 align-middle">
																				<span
																					className={`font-medium ${v.stock_quantity > 0 ? "text-swapp-verde-agua dark:text-swapp-menta" : "text-red-500"}`}>
																					{v.stock_quantity} un.
																				</span>
																			</td>
																			<td className="px-4 py-2.5 text-right align-middle">
																				{isEditing ? (
																					<div className="flex items-center justify-end gap-1.5">
																						<button
																							onClick={() =>
																								saveVariant(
																									p.product_uuid!,
																									v.variant_uuid!,
																								)
																							}
																							disabled={isSavingVariant}
																							className="p-1.5 rounded-md bg-swapp-verde-agua/20 text-swapp-turquesa-oscuro dark:bg-swapp-menta/20 dark:text-swapp-menta hover:bg-swapp-verde-agua/40 transition-colors"
																							title="Guardar">
																							<Check className="h-4 w-4" />
																						</button>
																						<button
																							onClick={cancelEditingVariant}
																							disabled={isSavingVariant}
																							className="p-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
																							title="Cancelar">
																							<X className="h-4 w-4" />
																						</button>
																					</div>
																				) : (
																					<div className="flex items-center justify-end gap-1">
																						{v.is_active ? (
																							<>
																								<button
																									onClick={() =>
																										startEditingVariant(v)
																									}
																									className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-turquesa-oscuro dark:text-swapp-tiza/50 dark:hover:text-swapp-menta hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors"
																									title="Editar atributos">
																									<Edit className="h-3.5 w-3.5" />
																								</button>
																								<button
																									onClick={() =>
																										toggleVariantStatus(
																											p.product_uuid!,
																											v.variant_uuid!,
																											v.is_active,
																										)
																									}
																									className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza/40 hover:bg-red-500/10 transition-colors"
																									title="Archivar Variante">
																									<Archive className="h-3.5 w-3.5" />
																								</button>
																							</>
																						) : (
																							<button
																								onClick={() =>
																									toggleVariantStatus(
																										p.product_uuid!,
																										v.variant_uuid!,
																										v.is_active,
																									)
																								}
																								className="p-1.5 rounded-md text-swapp-azul-petroleo/60 hover:text-swapp-verde-agua dark:text-swapp-tiza/60 dark:hover:text-swapp-menta hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors"
																								title="Restaurar Variante">
																								<RotateCcw className="h-3.5 w-3.5" />
																							</button>
																						)}
																					</div>
																				)}
																			</td>
																		</tr>
																	);
																})
															)}
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

			<EditStructureModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				product={editingProduct}
				brands={brands}
				categories={categories}
				taxClasses={taxClasses}
				onSuccess={fetchProducts}
			/>

			<NewVariantModal
				isOpen={isNewVariantModalOpen}
				onClose={() => setIsNewVariantModalOpen(false)}
				product={selectedProduct}
				onSuccess={fetchProducts}
			/>

			{/* MODAL DE SELECCIÓN DE IMAGEN PARA VARIANTE */}
			{imagePickerVariant && (
				<div className="fixed inset-0 z-[999] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
					<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
								Asignar Fotografía
							</h3>
							<button
								onClick={() => setImagePickerVariant(null)}
								className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
								<X className="h-5 w-5" />
							</button>
						</div>

						{imagePickerVariant.media.length === 0 ? (
							<p className="text-sm text-center text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 py-6">
								La carcasa de este producto no tiene imágenes subidas.
							</p>
						) : (
							<div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
								{imagePickerVariant.media.map((m: any) => (
									<button
										key={m.media_uuid}
										onClick={() => assignVariantImage(m.file_url)}
										className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-swapp-turquesa-oscuro dark:hover:border-swapp-menta transition-all focus:outline-none focus:ring-2 focus:ring-swapp-turquesa-oscuro focus:ring-offset-2">
										<img
											src={m.file_url}
											alt="Gallery item"
											className="h-full w-full object-cover"
										/>
										<div className="absolute inset-0 bg-swapp-turquesa-oscuro/20 dark:bg-swapp-menta/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<Check className="h-6 w-6 text-swapp-blanco drop-shadow-md" />
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

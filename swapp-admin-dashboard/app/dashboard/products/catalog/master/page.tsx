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
	Loader2,
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
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";
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
	const [isSavingVariant, setIsSavingVariant] = useState(false);

	const [draftValues, setDraftValues] = useState<Record<string, string>>({});
	const [activePimSchema, setActivePimSchema] = useState<any[]>([]);
	const [isLoadingPim, setIsLoadingPim] = useState(false);

	const [showInactiveVariants, setShowInactiveVariants] = useState<
		Record<string, boolean>
	>({});
	const [showInactiveProducts, setShowInactiveProducts] = useState(false);

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

	const startEditingVariant = async (variant: any, p: Product) => {
		setEditingVariantId(variant.variant_uuid);
		setDraftSku(variant.sku || "");
		setDraftValues(variant.variant_attributes || {});

		if (!p.category_id) {
			setActivePimSchema([]);
			return;
		}

		setIsLoadingPim(true);
		try {
			const [globalAttrs, linkedAttrs] = await Promise.all([
				ProductService.getAttributes(),
				ProductService.getCategoryAttributes(p.category_id),
			]);

			const variantLinkedAttrs = linkedAttrs.filter((l: any) => l.is_variant);
			const enrichedAttrs = variantLinkedAttrs.map((linked: any) => {
				const globalAttr = globalAttrs.find(
					(g: any) => g.attribute_id === linked.attribute_id,
				);
				return {
					...linked,
					values: globalAttr ? globalAttr.values : [],
				};
			});
			setActivePimSchema(enrichedAttrs);
		} catch (error) {
			toast.error("Error al cargar reglas del PIM.");
		} finally {
			setIsLoadingPim(false);
		}
	};

	const cancelEditingVariant = () => {
		setEditingVariantId(null);
		setDraftSku("");
		setDraftValues({});
		setActivePimSchema([]);
	};

	const saveVariant = async (productUuid: string, variantUuid: string) => {
		if (!draftSku.trim()) {
			toast.error("El SKU es obligatorio.");
			return;
		}

		// Validar PIM
		const missingRequired = activePimSchema.some(
			(attr) => attr.is_required && !draftValues[attr.name],
		);
		if (missingRequired) {
			toast.error("Faltan completar atributos obligatorios.");
			return;
		}

		const cleanAttributes = Object.entries(draftValues).reduce(
			(acc: Record<string, string>, [key, val]) => {
				if (val && val.trim() !== "") {
					acc[key] = val.trim();
				}
				return acc;
			},
			{},
		);

		const finalAttributes =
			Object.keys(cleanAttributes).length > 0 ? cleanAttributes : null;

		setIsSavingVariant(true);
		const toastId = toast.loading("Actualizando variante...");

		try {
			await ProductService.updateVariant(productUuid, variantUuid, {
				sku: draftSku,
				variant_attributes: finalAttributes,
			});
			toast.success("Variante actualizada exitosamente", { id: toastId });
			cancelEditingVariant();
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

	const toggleProductStatus = async (
		productUuid: string,
		currentStatus: boolean,
	) => {
		const isDeactivating = currentStatus;
		const toastId = toast.loading(
			isDeactivating
				? "Archivando producto base..."
				: "Restaurando producto base...",
		);

		try {
			await ProductService.update(productUuid, {
				is_active: !isDeactivating,
			});
			toast.success(
				isDeactivating
					? "Producto archivado exitosamente"
					: "Producto restaurado",
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

	const assignVariantImage = async (imageUrl: string) => {
		if (!imagePickerVariant) return;

		const toastId = toast.loading("Enlazando fotografía...");
		try {
			await ProductService.updateVariant(
				imagePickerVariant.productUuid,
				imagePickerVariant.variantUuid,
				{ image_url: imageUrl },
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
		if (!showInactiveProducts && !p.is_active) return false;
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

	const calculateHealthScore = (p: Product) => {
		let score = 0;
		if (p.short_description) score += 10;
		if (p.description) score += 10;
		if (
			p.media?.some(
				(m: any) => m.media_type === "image" && m.media_subtype === "main",
			)
		)
			score += 20;
		if (p.variants && p.variants.length > 0) score += 20;
		if (p.weight && p.weight > 0) score += 10;
		if (p.dimensions && Object.keys(p.dimensions).length > 0) score += 10;
		if (p.meta_title) score += 10;
		if (p.meta_description) score += 10;

		return score;
	};

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Catálogo Maestro"
					description="Gestión de identidad y multimedia"
					icon={Box}
				/>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/30 px-3 py-1.5 rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors">
						<span className="text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
							Ver Productos Archivados
						</span>
						<SwappToggle
							checked={showInactiveProducts}
							onChange={setShowInactiveProducts}
							id="toggle-inactive-products"
						/>
					</div>

					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar por nombre o SKU..."
					/>
					<SwappTooltip text="Crear un nuevo ítem">
						<button
							onClick={() =>
								router.push("/dashboard/products/catalog/master/new")
							}
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-colors">
							<Plus className="h-4 w-4" /> Nuevo Producto
						</button>
					</SwappTooltip>
				</div>
			</div>

			<div
				className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-visible sm:overflow-auto"
				style={{ paddingBottom: editingVariantId ? "12rem" : "0" }}>
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 select-none">
						<tr>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Imagen</th>
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
								label="Estado y Salud"
								columnKey="status"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">Acciones</th>
						</tr>
					</thead>
					{/* Eliminamos divide-y para manejar bordes fila por fila */}
					<tbody className="">
						{processedProducts.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
									No se encontraron productos con esos filtros.
								</td>
							</tr>
						) : (
							processedProducts.map((p) => {
								const mainImageUrl = p.media?.find(
									(m: any) =>
										m.media_type === "image" && m.media_subtype === "main",
								)?.file_url;
								const totalVariantsCount = p.variants?.length || 0;
								const isShowingInactive =
									!!showInactiveVariants[p.product_uuid];
								const visibleVariants =
									p.variants?.filter((v) => isShowingInactive || v.is_active) ||
									[];
								const isExpanded = expandedRows.includes(p.product_uuid);

								// Base para todas las filas
								const baseRowClasses = "border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200";
								
								// Comportamiento del Hover y Active states
								const parentRowStatusStyle = p.is_active
									? `hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20 ${isExpanded ? "bg-swapp-blanco/60 dark:bg-swapp-azul-petroleo/20" : ""}`
									: "opacity-60 bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/80 grayscale filter mix-blend-multiply dark:mix-blend-normal hover:bg-swapp-tiza-verdoso/50 dark:hover:bg-swapp-azul-oscuro/90";

								return (
									<React.Fragment key={p.product_uuid}>
										<tr className={`${baseRowClasses} ${parentRowStatusStyle}`}>
											<td className="px-6 py-4">
												{mainImageUrl ? (
													<img
														src={mainImageUrl}
														alt={`Imagen de ${p.name}`}
														className="h-12 w-12 rounded-md object-cover border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo"
													/>
												) : (
													<div className="h-12 w-12 rounded-md bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 transition-colors">
														<ImageIcon className="h-6 w-6" />
													</div>
												)}
											</td>
											<td className="px-6 py-4">
												<div
													className={`font-medium text-swapp-azul-oscuro dark:text-swapp-blanco ${!p.is_active ? "line-through" : ""}`}>
													{p.name}
												</div>
												<div className="text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 flex items-center gap-1 mt-0.5">
													{p.brand?.name && (
														<>
															<span className="text-swapp-verde-oscuro dark:text-swapp-verde-menta">
																{p.brand.name}
															</span>
															<span>•</span>
														</>
													)}
													<span>/{p.slug}</span>
												</div>
											</td>
											<td className="px-6 py-4 font-mono text-xs text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
												{totalVariantsCount > 0 ? (
													<button
														onClick={() => toggleRow(p.product_uuid)}
														className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-verde-oscuro dark:text-swapp-verde-menta font-sans font-medium">
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
													className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.is_returnable ? "bg-swapp-azul-oceano/10 dark:bg-swapp-verde-menta/10 text-swapp-azul-oceano dark:text-swapp-verde-menta" : "bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso"}`}>
													{p.is_returnable ? "Retornable" : "Estándar"}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="flex flex-col gap-2.5 items-start">
													<span
														className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.is_published ? "bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso"}`}>
														{p.is_published ? "Publicado" : "Borrador"}
													</span>
													
													{/* BARRA DE SCORING */}
													<SwappTooltip text="Nivel de completitud de la Ficha Técnica">
														<div className="flex items-center gap-2 w-24">
															<div className="h-1.5 w-full bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo rounded-full overflow-hidden">
																<div
																	className="h-full rounded-full bg-swapp-verde-oscuro dark:bg-swapp-verde-menta transition-all duration-500"
																	style={{
																		width: `${calculateHealthScore(p)}%`,
																	}}
																/>
															</div>
															<span className="text-[10px] font-bold text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
																{calculateHealthScore(p)}%
															</span>
														</div>
													</SwappTooltip>
												</div>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-1">
													{p.is_active ? (
														<>
															<SwappTooltip text="Añadir Variante Física">
																<button
																	onClick={() => {
																		setSelectedProduct(p);
																		setIsNewVariantModalOpen(true);
																	}}
																	className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																	<PlusSquare className="h-4 w-4" />
																</button>
															</SwappTooltip>
															<SwappTooltip text="Editar Estructura General">
																<button
																	onClick={() => {
																		setEditingProduct(p);
																		setIsEditModalOpen(true);
																	}}
																	className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																	<Edit className="h-4 w-4" />
																</button>
															</SwappTooltip>
															<SwappTooltip text="Archivar Producto Base">
																<button
																	onClick={() =>
																		toggleProductStatus(
																			p.product_uuid!,
																			p.is_active,
																		)
																	}
																	className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10 transition-colors">
																	<Archive className="h-4 w-4" />
																</button>
															</SwappTooltip>
														</>
													) : (
														<SwappTooltip text="Restaurar Producto Base">
															<button
																onClick={() =>
																	toggleProductStatus(
																		p.product_uuid!,
																		p.is_active,
																	)
																}
																className="p-1.5 rounded-md text-swapp-azul-petroleo/60 hover:text-swapp-verde-pastel dark:text-swapp-tiza-verdoso/60 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																<RotateCcw className="h-4 w-4" />
															</button>
														</SwappTooltip>
													)}
												</div>
											</td>
										</tr>

										{isExpanded && totalVariantsCount > 0 && (
											<tr className="bg-swapp-tiza-verdoso/10 dark:bg-swapp-azul-oscuro border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40">
												<td colSpan={6} className="px-6 py-4">
													<div className="rounded-lg border border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50 overflow-visible bg-swapp-blanco dark:bg-swapp-azul-oscuro/50 shadow-sm">
														<table className="w-full text-xs text-left">
															<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50">
																<tr>
																	<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-12 text-center">
																		Img
																	</th>
																	<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/4">
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
																							setShowInactiveVariants(
																								(prev) => ({
																									...prev,
																									[p.product_uuid]: val,
																								}),
																							)
																						}
																						id={`toggle-${p.product_uuid}`}
																					/>
																				</div>
																			</SwappTooltip>
																			<span>SKU Específico</span>
																		</div>
																	</th>
																	<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-2/4">
																		Atributos (PIM)
																	</th>
																	<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																		Precio
																	</th>
																	<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																		Stock Físico
																	</th>
																	<th className="px-4 py-3 text-[10px] tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">
																		Acciones
																	</th>
																</tr>
															</thead>
															<tbody className="">
																{visibleVariants.length === 0 ? (
																	<tr>
																		<td
																			colSpan={6}
																			className="px-4 py-6 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 italic">
																			Todas las variantes están archivadas.
																			Encendé el switch para verlas.
																		</td>
																	</tr>
																) : (
																	visibleVariants.map((v: any) => {
																		const isEditing =
																			editingVariantId === v.variant_uuid;
																		
																		// Clases para el hover de las variantes anidadas
																		const baseVariantRowClasses = "border-b border-swapp-tiza-verdoso/30 dark:border-swapp-azul-petroleo/30 last:border-0 transition-all duration-200";
																		const rowStatusStyle = v.is_active
																			? "hover:bg-swapp-tiza-verdoso/30 dark:hover:bg-swapp-azul-petroleo/30"
																			: "opacity-60 bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/80 grayscale filter mix-blend-multiply dark:mix-blend-normal";

																		return (
																			<tr
																				key={v.variant_uuid}
																				className={`${baseVariantRowClasses} ${rowStatusStyle}`}>
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
																							className="group relative h-8 w-8 overflow-hidden rounded bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/50 border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo flex items-center justify-center hover:border-swapp-verde-oscuro dark:hover:border-swapp-verde-menta transition-colors">
																							{v.image_url ? (
																								<>
																									<img
																										src={v.image_url}
																										alt={v.sku}
																										className="h-full w-full object-cover"
																									/>
																									<div className="absolute inset-0 bg-swapp-azul-oscuro/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
																										<ImagePlus className="h-4 w-4 text-swapp-blanco" />
																									</div>
																								</>
																							) : (
																								<ImageIcon className="h-4 w-4 text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 group-hover:text-swapp-verde-oscuro dark:group-hover:text-swapp-verde-menta" />
																							)}
																						</button>
																					</SwappTooltip>
																				</td>

																				<td className="px-4 py-2.5 font-mono text-swapp-azul-oscuro dark:text-swapp-blanco align-middle">
																					{isEditing ? (
																						<input
																							type="text"
																							className="w-full rounded-md border border-swapp-verde-oscuro dark:border-swapp-verde-menta bg-swapp-blanco dark:bg-swapp-azul-oscuro px-2 py-1 text-xs text-swapp-azul-oscuro dark:text-swapp-blanco outline-none shadow-sm focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
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
																									<Recycle className="h-4 w-4 text-swapp-verde-pastel dark:text-swapp-verde-menta/90" />
																								</SwappTooltip>
																							)}
																							{v.sku && (
																								<SwappTooltip text="Copiar al portapapeles">
																									<button
																										onClick={() =>
																											handleCopySku(v.sku)
																										}
																										className="opacity-0 group-hover/sku:opacity-100 p-1 rounded-md text-swapp-azul-petroleo/40 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/40 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-all">
																										<Copy className="h-3.5 w-3.5" />
																									</button>
																								</SwappTooltip>
																							)}
																						</div>
																					)}
																				</td>

																				<td className="px-4 py-2.5 align-middle relative overflow-visible">
																					{isEditing ? (
																						isLoadingPim ? (
																							<div className="flex items-center gap-2 text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
																								<Loader2 className="h-3 w-3 animate-spin text-swapp-verde-oscuro dark:text-swapp-verde-menta" />{" "}
																								Cargando reglas...
																							</div>
																						) : activePimSchema.length === 0 ? (
																							<span className="text-xs text-red-500">
																								Sin reglas en subcategoría.
																							</span>
																						) : (
																							<div className="flex flex-col gap-3 min-w-[200px] py-1">
																								{activePimSchema.map((attr) => {
																									const formatOptions =
																										attr.values.map(
																											(v: any) => ({
																												label: v.value,
																												value: v.value,
																											}),
																										);
																									return (
																										<div
																											key={attr.attribute_id}
																											className="flex flex-col gap-1">
																											<span className="text-[10px] text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 uppercase">
																												{attr.name}{" "}
																												{attr.is_required && (
																													<span className="text-red-500">
																														*
																													</span>
																												)}
																											</span>
																											<SwappSearchableSelect
																												options={formatOptions}
																												value={
																													draftValues[
																														attr.name
																													] || ""
																												}
																												onChange={(val) =>
																													setDraftValues({
																														...draftValues,
																														[attr.name]: val,
																													})
																												}
																												placeholder={`Buscar ${attr.name}...`}
																											/>
																										</div>
																									);
																								})}
																							</div>
																						)
																					) : v.variant_attributes ? (
																						<div className="flex flex-wrap gap-1">
																							{Object.entries(
																								v.variant_attributes,
																							).map(([key, val]) => (
																								<span
																									key={key}
																									className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${v.is_active ? "bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50" : "bg-transparent border-swapp-azul-petroleo/30 dark:border-swapp-tiza-verdoso/30 text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60"}`}>
																									{key}: {String(val)}
																								</span>
																							))}
																						</div>
																					) : (
																						<span className="text-swapp-azul-petroleo/60">
																							Sin atributos
																						</span>
																					)}
																				</td>

																				<td className="px-4 py-2.5 font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta align-middle">
																					$
																					{Number(v.price).toLocaleString(
																						"es-AR",
																					)}
																				</td>
																				<td className="px-4 py-2.5 align-middle">
																					<span
																						className={`font-medium ${v.stock_quantity > 0 ? "text-swapp-verde-pastel dark:text-swapp-verde-menta" : "text-red-500"}`}>
																						{v.stock_quantity} un.
																					</span>
																				</td>
																				<td className="px-4 py-2.5 text-right align-middle">
																					{isEditing ? (
																						<div className="flex items-center justify-end gap-1.5">
																							<SwappTooltip text="Guardar">
																								<button
																									onClick={() =>
																										saveVariant(
																											p.product_uuid!,
																											v.variant_uuid!,
																										)
																									}
																									disabled={isSavingVariant}
																									className="p-1.5 rounded-md bg-swapp-verde-pastel/20 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/20 dark:text-swapp-verde-menta hover:bg-swapp-verde-pastel/40 transition-colors">
																									<Check className="h-4 w-4" />
																								</button>
																							</SwappTooltip>
																							<SwappTooltip text="Cancelar">
																								<button
																									onClick={cancelEditingVariant}
																									disabled={isSavingVariant}
																									className="p-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
																									<X className="h-4 w-4" />
																								</button>
																							</SwappTooltip>
																						</div>
																					) : (
																						<div className="flex items-center justify-end gap-1">
																							{v.is_active ? (
																								<>
																									<SwappTooltip text="Editar Atributos">
																										<button
																											onClick={() =>
																												startEditingVariant(
																													v,
																													p,
																												)
																											}
																											className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																											<Edit className="h-3.5 w-3.5" />
																										</button>
																									</SwappTooltip>
																									<SwappTooltip text="Archivar Variante">
																										<button
																											onClick={() =>
																												toggleVariantStatus(
																													p.product_uuid!,
																													v.variant_uuid!,
																													v.is_active,
																												)
																											}
																											className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10 transition-colors">
																											<Archive className="h-3.5 w-3.5" />
																										</button>
																									</SwappTooltip>
																								</>
																							) : (
																								<SwappTooltip text="Restaurar Variante">
																									<button
																										onClick={() =>
																											toggleVariantStatus(
																												p.product_uuid!,
																												v.variant_uuid!,
																												v.is_active,
																											)
																										}
																										className="p-1.5 rounded-md text-swapp-azul-petroleo/60 hover:text-swapp-verde-pastel dark:text-swapp-tiza-verdoso/60 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																										<RotateCcw className="h-3.5 w-3.5" />
																									</button>
																								</SwappTooltip>
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
							})
						)}
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

			{imagePickerVariant && (
				<div className="fixed inset-0 z-[999] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
					<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
								Asignar Fotografía
							</h3>
							<button
								onClick={() => setImagePickerVariant(null)}
								className="text-swapp-azul-petroleo/50 hover:text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-blanco transition-colors">
								<X className="h-5 w-5" />
							</button>
						</div>

						{imagePickerVariant.media.length === 0 ? (
							<p className="text-sm text-center text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 py-6">
								La carcasa de este producto no tiene imágenes subidas.
							</p>
						) : (
							<div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
								{imagePickerVariant.media.map((m: any) => (
									<button
										key={m.media_uuid}
										onClick={() => assignVariantImage(m.file_url)}
										className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-swapp-verde-oscuro dark:hover:border-swapp-verde-menta transition-all focus:outline-none focus:ring-2 focus:ring-swapp-verde-oscuro focus:ring-offset-2">
										<img
											src={m.file_url}
											alt="Gallery item"
											className="h-full w-full object-cover"
										/>
										<div className="absolute inset-0 bg-swapp-verde-oscuro/20 dark:bg-swapp-verde-menta/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
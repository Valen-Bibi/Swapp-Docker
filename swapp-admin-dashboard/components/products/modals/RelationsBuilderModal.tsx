"use client";

import React, { useState, useEffect } from "react";
import {
	X,
	Save,
	GripVertical,
	Search,
	Plus,
	Trash2,
	Network,
	PackageOpen,
	ArrowRight,
	ArrowDown,
	Recycle,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { Product } from "@/types/product";
import { createPortal } from "react-dom";

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragStartEvent,
	useDraggable,
	useDroppable,
	DragOverlay,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- TIPOS Y CONSTANTES ---
const RELATIONSHIP_OPTIONS = [
	{ value: "container_return", label: "📦 Envase Retornable (Logística Inversa)" },
	{ value: "cross_sell", label: "🔗 Venta Cruzada (Cross-Selling)" },
	{ value: "complementary", label: "🤝 Accesorios / Complementos" },
	{ value: "substitute", label: "⚖️ Sustituto" },
];

interface RelationItem {
	target_product_uuid: string;
	target_product_name: string;
	relationship_type: string;
	priority: number;
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	parentProduct: Product | null;
	onSuccess: () => void;
}

// --- SUB-COMPONENTE: ITEM ARRASTRABLE DEL CATÁLOGO (IZQUIERDA) ---
function DraggableCatalogItem({
	product,
	onAdd,
}: {
	product: Product;
	onAdd: (p: Product) => void;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `catalog-${product.product_uuid}`,
		data: { product },
	});

	const isInternal = Boolean((product as any).is_internal);

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={`flex flex-col p-3 rounded-lg border transition-all touch-none ${
				isDragging
					? "opacity-50 border-swapp-verde-oscuro dark:border-swapp-verde-menta bg-swapp-verde-oscuro/10"
					: "bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo hover:border-swapp-verde-oscuro/40 dark:hover:border-swapp-verde-menta/40 cursor-grab shadow-sm"
			}`}>
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col flex-1 truncate">
					<span className="font-bold text-sm text-swapp-azul-oscuro dark:text-swapp-blanco truncate">
						{product.name} {product.model ? `- ${product.model}` : ""}
					</span>
					<div className="flex items-center gap-2 mt-1">
						<span
							className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
								isInternal
									? "bg-swapp-azul-petroleo/10 text-swapp-azul-petroleo dark:bg-swapp-tiza-verdoso/10 dark:text-swapp-tiza-verdoso"
									: "bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta"
							}`}>
							{isInternal ? "Interno" : "Estándar"}
						</span>
						<span className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
							{product.variants && product.variants.length > 0
								? product.variants.length === 1
									? product.variants[0].sku
									: `${product.variants.length} Variantes`
								: "Sin SKU"}
						</span>
					</div>
				</div>
				<button
					type="button"
					onPointerDown={(e) => e.stopPropagation()}
					onClick={() => onAdd(product)}
					className="p-1.5 shrink-0 rounded-md text-swapp-azul-petroleo/50 hover:bg-swapp-verde-oscuro hover:text-swapp-blanco dark:text-swapp-tiza-verdoso/50 dark:hover:bg-swapp-verde-menta dark:hover:text-swapp-azul-oscuro transition-colors">
					<Plus className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

// --- SUB-COMPONENTE: TARJETA DE RELACIÓN ORDENABLE (LISTA MÚLTIPLE) ---
function SortableRelationItem({
	relation,
	onRemove,
}: {
	relation: RelationItem;
	onRemove: (uuid: string) => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: relation.target_product_uuid,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 50 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-colors touch-none ${
				isDragging
					? "bg-swapp-verde-oscuro/20 dark:bg-swapp-verde-menta/20 border-swapp-verde-oscuro/50 dark:border-swapp-verde-menta/50 backdrop-blur-md shadow-2xl scale-[1.02]"
					: "bg-swapp-blanco/60 dark:bg-swapp-azul-petroleo/20 border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo shadow-sm hover:border-swapp-verde-oscuro/30"
			}`}>
			<div className="flex items-center gap-3 flex-1 overflow-hidden">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab hover:text-swapp-verde-oscuro dark:hover:text-swapp-verde-menta p-1 -ml-1">
					<GripVertical className="h-5 w-5 text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 transition-colors" />
				</div>
				<span className="font-bold text-sm text-swapp-azul-oscuro dark:text-swapp-blanco truncate">
					{relation.target_product_name}
				</span>
			</div>
			<button
				type="button"
				onClick={() => onRemove(relation.target_product_uuid)}
				className="p-1.5 shrink-0 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 hover:bg-red-500/10 transition-colors">
				<Trash2 className="h-4 w-4" />
			</button>
		</div>
	);
}

// --- MODAL PRINCIPAL ---
export default function RelationsBuilderModal({
	isOpen,
	onClose,
	parentProduct,
	onSuccess,
}: Props) {
	const [catalog, setCatalog] = useState<Product[]>([]);
	const [relations, setRelations] = useState<RelationItem[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [loadingData, setLoadingData] = useState(false);

	// Workspace Activo
	const [activeRelType, setActiveRelType] = useState("container_return");
	const isReturnableMode = activeRelType === "container_return";

	const [activeDragId, setActiveDragId] = useState<string | null>(null);
	const [activeDragProduct, setActiveDragProduct] = useState<Product | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	useEffect(() => {
		const loadData = async () => {
			if (!isOpen || !parentProduct) return;
			setLoadingData(true);
			try {
				const catalogData = await ProductService.getAll();
				setCatalog(catalogData);

				const currentRelations = await ProductService.getProductRelationships(
					parentProduct.product_uuid,
				);
				setRelations(
					currentRelations.map((r: any) => ({
						target_product_uuid: r.target_product_uuid,
						target_product_name: r.target_product_name,
						relationship_type: r.relationship_type,
						priority: r.priority,
					})),
				);
			} catch (error) {
				toast.error("Error al cargar la red de relaciones.");
			} finally {
				setLoadingData(false);
			}
		};
		loadData();
	}, [isOpen, parentProduct]);

	// Filtramos las relaciones que se muestran en el Workspace actual
	const activeRelations = relations.filter(
		(r) => r.relationship_type === activeRelType,
	);

	// DROPZONES ESPECÍFICOS PARA CORREGIR EL BUG DEL DROP VACÍO
	// Zona 1: Para el envase retornable (1 a 1)
	const { setNodeRef: setWorkspaceARef, isOver: isOverWA } = useDroppable({
		id: "workspace-a-drop",
	});

	// Zona 2: Para las listas múltiples (Accesorios, Cross-sell)
	const { setNodeRef: setWorkspaceBRef, isOver: isOverWB } = useDroppable({
		id: "workspace-b-drop",
	});

	if (!isOpen || !parentProduct) return null;

	const handleAddRelation = (product: Product) => {
		const isInternal = Boolean((product as any).is_internal);

		if (relations.some((r) => r.target_product_uuid === product.product_uuid)) {
			return toast.error("Este producto ya está vinculado.");
		}

		if (isReturnableMode) {
			if (activeRelations.length >= 1) {
				return toast.error("Solo se permite vincular 1 envase retornable. Eliminá el actual primero.");
			}
			if (!isInternal) {
				return toast.error("El envase de recambio debe ser un Producto Interno.");
			}
		} else {
			if (isInternal) {
				return toast.error("Los productos internos solo se usan para logística inversa.");
			}
		}

		setRelations((prev) => [
			...prev,
			{
				target_product_uuid: product.product_uuid,
				target_product_name: `${product.name} ${product.model ? `- ${product.model}` : ""}`,
				relationship_type: activeRelType,
				priority: prev.length,
			},
		]);
	};

	const handleRemoveRelation = (uuid: string) => {
		setRelations((prev) => prev.filter((r) => r.target_product_uuid !== uuid));
	};

	const handleDragStart = (event: DragStartEvent) => {
		setActiveDragId(String(event.active.id));
		if (String(event.active.id).startsWith("catalog-")) {
			const uuid = String(event.active.id).replace("catalog-", "");
			const prod = catalog.find((p) => p.product_uuid === uuid);
			setActiveDragProduct(prod || null);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDragId(null);
		setActiveDragProduct(null);
		const { active, over } = event;

		if (!over) return;

		const isOverSortableItem = activeRelations.some((r) => r.target_product_uuid === over.id);

		// Validamos si soltó en la zona correcta (lista vacía o sobre un ítem existente)
		const isValidDrop = 
			(isReturnableMode && over.id === "workspace-a-drop") ||
			(!isReturnableMode && (over.id === "workspace-b-drop" || isOverSortableItem));

		// ESCENARIO 1: Viene del catálogo y lo suelta en la derecha
		if (String(active.id).startsWith("catalog-") && isValidDrop) {
			const productUuid = String(active.id).replace("catalog-", "");
			const draggedProduct = catalog.find((p) => p.product_uuid === productUuid);
			if (draggedProduct) handleAddRelation(draggedProduct);
			return;
		}

		// ESCENARIO 2: Reordenamiento interno en la derecha (solo listas múltiples)
		if (
			!String(active.id).startsWith("catalog-") &&
			relations.some((r) => r.target_product_uuid === active.id) &&
			!isReturnableMode
		) {
			if (active.id !== over.id) {
				setRelations((items) => {
					const oldIndex = items.findIndex((i) => i.target_product_uuid === active.id);
					const newIndex = items.findIndex((i) => i.target_product_uuid === over.id);
					return arrayMove(items, oldIndex, newIndex);
				});
			}
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		const toastId = toast.loading("Sincronizando red de productos...");

		const payload = {
			relationships: relations.map((r) => ({
				target_product_uuid: r.target_product_uuid,
				relationship_type: r.relationship_type,
			})),
		};

		try {
			await ProductService.updateProductRelationships(
				parentProduct.product_uuid,
				payload,
			);
			toast.success("Reglas de negocio guardadas", { id: toastId });
			onSuccess();
			onClose();
		} catch (error) {
			toast.error("Fallo al guardar las relaciones.", { id: toastId });
		} finally {
			setIsSaving(false);
		}
	};

	// Catálogo filtrado con las reglas solicitadas
	const filteredCatalog = catalog
		.filter((p) => p.product_uuid !== parentProduct.product_uuid)
		.filter((p) => {
			// REGLA MAESTRA: Si estamos en Envase, mostrar solo internos. Si no, ocultar internos.
			const isInternal = Boolean((p as any).is_internal);
			return isReturnableMode ? isInternal : !isInternal;
		})
		.filter((p) => {
			const searchLower = searchTerm.toLowerCase();
			const matchName = p.name.toLowerCase().includes(searchLower);
			const matchModel = p.model?.toLowerCase().includes(searchLower) || false;
			const matchSku = p.variants?.some((v) =>
				v.sku?.toLowerCase().includes(searchLower),
			);
			return matchName || matchModel || matchSku;
		});

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-5xl h-[85vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				
				{/* HEADER PRINCIPAL */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<Network className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Arquitectura de Relaciones
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1 font-medium transition-colors">
							Trazando vínculos para:{" "}
							<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{parentProduct.name} {parentProduct.model ? `- ${parentProduct.model}` : ""}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 hover:bg-red-500/10 hover:text-red-500 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* SELECTOR GLOBAL DE WORKSPACE */}
				<div className="flex items-center gap-4 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 px-6 py-3 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 shrink-0">
					<span className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
						Tipo de Relación:
					</span>
					<select
						value={activeRelType}
						onChange={(e) => setActiveRelType(e.target.value)}
						className="rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-4 py-2 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta transition-colors cursor-pointer shadow-sm">
						{RELATIONSHIP_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{/* CUERPO CENTRAL (DND CONTEXT) */}
				<div className="flex-1 min-h-0 overflow-hidden">
					{loadingData ? (
						<div className="h-full flex items-center justify-center">
							<div className="animate-pulse text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 font-medium">
								Escaneando catálogo...
							</div>
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}>
							
							<div className="h-full grid grid-cols-1 md:grid-cols-12">
								
								{/* PANEL IZQUIERDO: CATÁLOGO DISPONIBLE */}
								<div className="h-full md:col-span-4 flex flex-col border-r border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/30 dark:bg-transparent overflow-hidden">
									<div className="p-4 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo shrink-0">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50" />
											<input
												type="text"
												placeholder="Buscar nombre o SKU..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="w-full pl-9 pr-4 py-2 bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo rounded-lg text-sm outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta transition-colors shadow-sm"
											/>
										</div>
									</div>
									<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
										{filteredCatalog.length === 0 ? (
											<p className="text-center text-xs text-swapp-azul-petroleo/50 mt-10">
												No hay productos compatibles con este modo.
											</p>
										) : (
											filteredCatalog.map((prod) => (
												<DraggableCatalogItem
													key={prod.product_uuid}
													product={prod}
													onAdd={handleAddRelation}
												/>
											))
										)}
									</div>
								</div>

								{/* PANEL DERECHO: WORKSPACES DINÁMICOS */}
								<div className="h-full md:col-span-8 flex flex-col bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/10 transition-colors">
									
									<div className="p-6 pb-2 flex items-center justify-between shrink-0">
										<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
											Reglas Activas
										</h3>
										<span className="text-xs font-semibold bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta px-2 py-1 rounded-full">
											{activeRelations.length} Vínculos
										</span>
									</div>

									<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
										{/* WORKSPACE A: ENVASE RETORNABLE (Diseño Split 1 a 1) */}
										{isReturnableMode && (
											<div className="h-full flex flex-col items-center justify-start sm:justify-center">
												
												<div className="flex items-center gap-2 mb-6 text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/80 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/50 p-2.5 rounded-lg border border-swapp-azul-petroleo/10 shadow-sm">
													<AlertCircle className="h-4 w-4 shrink-0 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
													<p className="text-xs font-medium">
														Conectá el producto estándar (izq) con <strong className="font-bold">1 envase interno</strong> (der).
													</p>
												</div>

												<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl">
													
													{/* CAJA 1: PRODUCTO ORIGINAL (BLOQUEADO) */}
													<div className="flex-1 w-full p-4 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 shadow-sm flex flex-col items-center text-center opacity-80 pointer-events-none">
														<PackageOpen className="h-6 w-6 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 mb-2" />
														<span className="text-[9px] font-bold uppercase tracking-wider text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 mb-1">
															Producto Estándar
														</span>
														<p className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco text-xs">
															{parentProduct.name} {parentProduct.model ? `- ${parentProduct.model}` : ""}
														</p>
													</div>

													<ArrowRight className="h-6 w-6 text-swapp-verde-oscuro dark:text-swapp-verde-menta shrink-0 hidden sm:block" />

													{/* CAJA 2: DROPZONE DEL ENVASE (INYECCIÓN DE EVENTO VACÍO) */}
													<div 
														ref={setWorkspaceARef}
														className={`flex-1 w-full p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center relative min-h-[140px] ${
															activeRelations.length > 0 
																? "border-swapp-verde-oscuro bg-swapp-blanco dark:border-swapp-verde-menta dark:bg-swapp-azul-oscuro shadow-md"
																: isOverWA
																? "border-swapp-verde-oscuro bg-swapp-verde-oscuro/10 border-dashed"
																: "border-dashed border-swapp-azul-petroleo/30 bg-swapp-azul-petroleo/5 dark:border-swapp-azul-petroleo dark:bg-swapp-negro-azulado/40"
														}`}>
														{activeRelations.length > 0 ? (
															<>
																<Recycle className="h-6 w-6 text-swapp-verde-oscuro dark:text-swapp-verde-menta mb-2" />
																<span className="text-[9px] font-bold uppercase tracking-wider text-swapp-verde-oscuro dark:text-swapp-verde-menta mb-1">
																	Envase Asignado
																</span>
																<p className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco text-xs mb-3">
																	{activeRelations[0].target_product_name}
																</p>
																<button
																	onClick={() => handleRemoveRelation(activeRelations[0].target_product_uuid)}
																	className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-bold">
																	<Trash2 className="h-3 w-3" /> Quitar
																</button>
															</>
														) : (
															<>
																<div className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 pointer-events-none transition-colors ${isOverWA ? 'bg-swapp-verde-oscuro text-swapp-blanco' : 'bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/30 text-swapp-azul-petroleo/50'}`}>
																	<Plus className="h-4 w-4" />
																</div>
																<p className="text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 font-medium px-2 pointer-events-none">
																	Arrastrá un <strong className="font-bold">producto interno</strong> hasta acá.
																</p>
															</>
														)}
													</div>
												</div>
											</div>
										)}

										{/* WORKSPACE B: LISTAS MÚLTIPLES (Cross-sell, Accesorios, etc.) */}
										{!isReturnableMode && (
											<div className="h-full flex flex-col">
												{/* ENCABEZADO FIJO DE PADRE PARA MÚLTIPLES */}
												<div className="flex flex-col items-center mb-6 shrink-0">
													<div className="w-full sm:w-2/3 p-3 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 shadow-sm flex items-center justify-center gap-3 opacity-80 pointer-events-none text-center">
														<PackageOpen className="h-5 w-5 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 shrink-0" />
														<div className="flex flex-col">
															<span className="text-[9px] font-bold uppercase tracking-wider text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
																Producto Padre
															</span>
															<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco text-xs">
																{parentProduct.name} {parentProduct.model ? `- ${parentProduct.model}` : ""}
															</span>
														</div>
													</div>
													<ArrowDown className="h-5 w-5 text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 mt-2" />
												</div>

												{/* ZONA DE CAÍDA MÚLTIPLE (INYECCIÓN DE EVENTO VACÍO) */}
												<div 
													ref={setWorkspaceBRef}
													className={`flex-1 flex flex-col min-h-[150px] rounded-xl transition-colors ${
														activeRelations.length === 0 
															? "border-2 border-dashed border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo items-center justify-center text-center px-4" 
															: ""
													} ${isOverWB && activeRelations.length === 0 ? "bg-swapp-verde-oscuro/5 dark:bg-swapp-verde-menta/5 border-swapp-verde-oscuro dark:border-swapp-verde-menta" : ""}`}>
													
													{activeRelations.length === 0 ? (
														<div className="pointer-events-none">
															<Network className="h-8 w-8 mb-2 mx-auto opacity-20 text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso" />
															<p className="text-xs font-medium text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40">Aún no hay vínculos.</p>
															<p className="text-[10px] mt-1 text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40">Arrastrá opciones desde el catálogo.</p>
														</div>
													) : (
														<SortableContext
															items={activeRelations.map((r) => r.target_product_uuid)}
															strategy={verticalListSortingStrategy}>
															<div className="flex flex-col gap-2 pb-10 w-full">
																{activeRelations.map((rel) => (
																	<SortableRelationItem
																		key={rel.target_product_uuid}
																		relation={rel}
																		onRemove={handleRemoveRelation}
																	/>
																))}
															</div>
														</SortableContext>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* GHOST RENDER (Lo que sostiene el usuario mientras arrastra) */}
							{typeof document !== "undefined"
								? createPortal(
										<DragOverlay dropAnimation={null}>
											{activeDragId && activeDragId.startsWith("catalog-") && activeDragProduct ? (
												<div className="opacity-95 shadow-2xl bg-swapp-verde-oscuro dark:bg-swapp-verde-menta text-swapp-blanco dark:text-swapp-azul-oscuro p-3 rounded-lg flex items-center justify-between w-64 pointer-events-none cursor-grabbing">
													<span className="font-bold text-sm truncate">
														{activeDragProduct.name} {activeDragProduct.model ? `- ${activeDragProduct.model}` : ""}
													</span>
													<Plus className="h-4 w-4 shrink-0" />
												</div>
											) : null}
										</DragOverlay>,
										document.body,
									)
								: null}
						</DndContext>
					)}
				</div>

				{/* FOOTER */}
				<div className="p-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex justify-end gap-3 shrink-0 bg-swapp-blanco/30 dark:bg-swapp-azul-oscuro/50 transition-colors">
					<button
						onClick={onClose}
						className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						Cancelar
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving || loadingData}
						className="flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-azul-petroleo dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-md">
						<Save className="h-4 w-4" />
						{isSaving ? "Guardando..." : "Guardar Relaciones"}
					</button>
				</div>
			</div>
		</div>
	);
}
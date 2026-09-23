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
	{ value: "container_return", label: "📦 Envase Retornable (Logística)" },
	{ value: "bundle_component", label: "🎁 Componente de Combo" },
	{ value: "complementary", label: "🤝 Complementario" },
	{ value: "substitute", label: "⚖️ Sustituto" },
	{ value: "cross_sell", label: "🔗 Venta Cruzada" },
	{ value: "up_sell", label: "🚀 Gama Superior" },
	{ value: "co_branding", label: "✨ Co-Branding" },
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

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={`flex items-center justify-between p-3 rounded-lg border transition-all touch-none ${
				isDragging
					? "opacity-50 border-swapp-verde-oscuro dark:border-swapp-verde-menta bg-swapp-verde-oscuro/10"
					: "bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo hover:border-swapp-verde-oscuro/40 dark:hover:border-swapp-verde-menta/40 cursor-grab"
			}`}>
			<div className="flex flex-col">
				<span className="font-semibold text-sm text-swapp-azul-oscuro dark:text-swapp-blanco">
					{product.name}
				</span>
				<span className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
					{product.variants && product.variants.length > 0
						? product.variants.length === 1
							? product.variants[0].sku
							: `${product.variants.length} Variantes`
						: "Sin SKU"}
				</span>
			</div>
			{/* OnPointerDown stopPropagation evita que el click en '+' dispare el Drag */}
			<button
				type="button"
				onPointerDown={(e) => e.stopPropagation()}
				onClick={() => onAdd(product)}
				className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:bg-swapp-verde-oscuro hover:text-swapp-blanco dark:text-swapp-tiza-verdoso/50 dark:hover:bg-swapp-verde-menta dark:hover:text-swapp-azul-oscuro transition-colors">
				<Plus className="h-4 w-4" />
			</button>
		</div>
	);
}

// --- SUB-COMPONENTE: TARJETA DE RELACIÓN ORDENABLE (DERECHA) ---
function SortableRelationItem({
	relation,
	onRemove,
	onChangeType,
}: {
	relation: RelationItem;
	onRemove: (uuid: string) => void;
	onChangeType: (uuid: string, type: string) => void;
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
		zIndex: isDragging ? 50 : 1, //
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`relative flex flex-col gap-2 p-3.5 rounded-xl border transition-colors touch-none ${
				isDragging
					? "bg-swapp-verde-oscuro/20 dark:bg-swapp-verde-menta/20 border-swapp-verde-oscuro/50 dark:border-swapp-verde-menta/50 backdrop-blur-md shadow-2xl scale-[1.02]" //[cite: 8]
					: "bg-swapp-blanco/60 dark:bg-swapp-azul-petroleo/20 border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo shadow-sm" //[cite: 8]
			}`}>
			<div className="flex items-center gap-3">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab hover:text-swapp-verde-oscuro dark:hover:text-swapp-verde-menta">
					<GripVertical className="h-5 w-5 text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 transition-colors" />
				</div>
				<span className="font-bold text-sm text-swapp-azul-oscuro dark:text-swapp-blanco flex-1 truncate">
					{relation.target_product_name}
				</span>
				<button
					type="button"
					onClick={() => onRemove(relation.target_product_uuid)}
					className="p-1 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 hover:bg-red-500/10 transition-colors">
					<Trash2 className="h-4 w-4" />
				</button>
			</div>

			<div className="pl-8">
				<select
					value={relation.relationship_type}
					onChange={(e) =>
						onChangeType(relation.target_product_uuid, e.target.value)
					}
					className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-1.5 text-xs font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta transition-colors cursor-pointer">
					{RELATIONSHIP_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>
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

	const [activeDragId, setActiveDragId] = useState<string | null>(null);
	const [activeDragProduct, setActiveDragProduct] = useState<Product | null>(
		null,
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}), //[cite: 8]
	);

	useEffect(() => {
		const loadData = async () => {
			if (!isOpen || !parentProduct) return;
			setLoadingData(true);
			try {
				// Cargar catálogo completo para el buscador
				const catalogData = await ProductService.getAll();
				setCatalog(catalogData);

				// Cargar relaciones actuales del producto
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

	// Configuración de la Dropzone Derecha
	const { setNodeRef: setDropzoneRef, isOver: isOverDropzone } = useDroppable({
		id: "relations-dropzone",
	});

	if (!isOpen || !parentProduct) return null;

	const handleAddRelation = (product: Product) => {
		if (relations.some((r) => r.target_product_uuid === product.product_uuid)) {
			toast.error("Este producto ya está vinculado.");
			return;
		}
		setRelations((prev) => [
			...prev,
			{
				target_product_uuid: product.product_uuid,
				target_product_name: product.name,
				relationship_type: "complementary", // Default lógico
				priority: prev.length,
			},
		]);
	};

	const handleRemoveRelation = (uuid: string) => {
		setRelations((prev) => prev.filter((r) => r.target_product_uuid !== uuid));
	};

	const handleChangeRelationType = (uuid: string, newType: string) => {
		setRelations((prev) =>
			prev.map((r) =>
				r.target_product_uuid === uuid
					? { ...r, relationship_type: newType }
					: r,
			),
		);
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

		const isDropzoneOrInside =
			over.id === "relations-dropzone" ||
			relations.some((r) => r.target_product_uuid === over.id);

		// ESCENARIO 1: Viene del catálogo y lo suelta en la derecha
		if (String(active.id).startsWith("catalog-") && isDropzoneOrInside) {
			const productUuid = String(active.id).replace("catalog-", "");
			const draggedProduct = catalog.find(
				(p) => p.product_uuid === productUuid,
			);
			if (draggedProduct) handleAddRelation(draggedProduct);
			return;
		}

		// ESCENARIO 2: Reordenamiento interno en la derecha (Priority)
		if (
			!String(active.id).startsWith("catalog-") &&
			relations.some((r) => r.target_product_uuid === active.id)
		) {
			if (active.id !== over.id) {
				setRelations((items) => {
					const oldIndex = items.findIndex(
						(i) => i.target_product_uuid === active.id,
					);
					const newIndex = items.findIndex(
						(i) => i.target_product_uuid === over.id,
					);
					return arrayMove(items, oldIndex, newIndex); //[cite: 8]
				});
			}
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		const toastId = toast.loading("Sincronizando red neuronal de productos...");

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

	const filteredCatalog = catalog
		.filter((p) => p.product_uuid !== parentProduct.product_uuid)
		.filter((p) => {
			const searchLower = searchTerm.toLowerCase();
			const matchName = p.name.toLowerCase().includes(searchLower);
			const matchSku = p.variants?.some((v) =>
				v.sku?.toLowerCase().includes(searchLower),
			);
			return matchName || matchSku;
		});

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-5xl h-[85vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<Network className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Arquitectura de Relaciones
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1 font-medium transition-colors">
							Trazando vínculos para:{" "}
							<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{parentProduct.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 hover:bg-red-500/10 hover:text-red-500 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* CUERPO CENTRAL (DND CONTEXT) */}
				<div className="flex-1 overflow-hidden">
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
							<div className="h-full grid grid-cols-1 md:grid-cols-2">
								{/* PANEL IZQUIERDO: CATÁLOGO DISPONIBLE */}
								<div className="h-full flex flex-col border-r border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/30 dark:bg-transparent">
									<div className="p-4 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50" />
											<input
												type="text"
												placeholder="Buscar por nombre o SKU..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="w-full pl-9 pr-4 py-2 bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo rounded-lg text-sm outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta transition-colors"
											/>
										</div>
									</div>
									<div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
										{filteredCatalog.length === 0 ? (
											<p className="text-center text-xs text-swapp-azul-petroleo/50 mt-10">
												No se encontraron productos.
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

								{/* PANEL DERECHO: DROPZONE DE RELACIONES */}
								<div className="h-full flex flex-col p-4 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/10">
									<div className="mb-4 flex items-center justify-between">
										<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
											Nodo de Conexiones
										</h3>
										<span className="text-xs font-semibold bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta px-2 py-1 rounded-full">
											{relations.length} Vínculos
										</span>
									</div>

									{/* CONTENEDOR DROPPABLE */}
									<div
										ref={setDropzoneRef}
										className={`flex-1 overflow-y-auto custom-scrollbar rounded-xl border-2 border-dashed transition-colors p-3 ${
											isOverDropzone
												? "border-swapp-verde-oscuro bg-swapp-verde-oscuro/5 dark:border-swapp-verde-menta dark:bg-swapp-verde-menta/5"
												: "border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo"
										}`}>
										{relations.length === 0 ? (
											<div className="h-full flex flex-col items-center justify-center text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 pointer-events-none">
												<Network className="h-10 w-10 mb-3 opacity-20" />
												<p className="text-sm text-center max-w-[250px]">
													Arrastrá productos desde el catálogo para crear reglas
													de negocio.
												</p>
											</div>
										) : (
											<SortableContext
												items={relations.map((r) => r.target_product_uuid)}
												strategy={verticalListSortingStrategy}>
												<div className="flex flex-col gap-2">
													{relations.map((rel) => (
														<SortableRelationItem
															key={rel.target_product_uuid}
															relation={rel}
															onRemove={handleRemoveRelation}
															onChangeType={handleChangeRelationType}
														/>
													))}
												</div>
											</SortableContext>
										)}
									</div>
								</div>
							</div>

							{/* GHOST RENDER (Lo que sostiene el usuario mientras arrastra) */}
							{typeof document !== "undefined"
								? createPortal(
										<DragOverlay dropAnimation={null}>
											{activeDragId &&
											activeDragId.startsWith("catalog-") &&
											activeDragProduct ? (
												<div className="opacity-90 shadow-2xl bg-swapp-verde-oscuro text-swapp-blanco p-3 rounded-lg flex items-center justify-between border-2 border-swapp-verde-menta w-64 pointer-events-none cursor-grabbing">
													<span className="font-bold text-sm truncate">
														{activeDragProduct.name}
													</span>
													<Plus className="h-4 w-4 opacity-50 shrink-0" />
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
						className="flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-azul-petroleo dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
						<Save className="h-4 w-4" />
						{isSaving ? "Guardando..." : "Guardar Relaciones"}
					</button>
				</div>
			</div>
		</div>
	);
}

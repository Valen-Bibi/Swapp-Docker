"use client";

import React, { useState, useEffect } from "react";
import { X, Save, GripVertical, ArrowUpDown, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { Category } from "@/types/product";
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableCategoryItem({ category }: { category: Category }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: category.category_id as number });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		// Subimos el z-index dinámicamente si se está arrastrando
		zIndex: isDragging ? 50 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-colors touch-none ${
				isDragging
					? "bg-swapp-verde-oscuro/20 dark:bg-swapp-verde-menta/20 border-swapp-verde-oscuro/50 dark:border-swapp-verde-menta/50 backdrop-blur-md shadow-2xl scale-[1.02] cursor-grabbing"
					: "bg-swapp-blanco/40 dark:bg-transparent border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/30 hover:border-swapp-verde-oscuro/40 dark:hover:border-swapp-verde-menta/40 cursor-grab shadow-sm"
			}`}>
			<GripVertical
				className={`h-5 w-5 shrink-0 transition-colors ${
					isDragging
						? "text-swapp-verde-oscuro dark:text-swapp-verde-menta"
						: "text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40"
				}`}
			/>
			<span
				className={`font-semibold select-none transition-colors ${
					isDragging
						? "text-swapp-verde-oscuro dark:text-swapp-verde-menta"
						: "text-swapp-azul-oscuro dark:text-swapp-blanco"
				}`}>
				{category.name}
			</span>
		</div>
	);
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	categories: Category[];
	onSuccess: () => void;
}

export default function ReorderCategoriesModal({
	isOpen,
	onClose,
	categories,
	onSuccess,
}: Props) {
	const [activeView, setActiveView] = useState<string>("parents");
	const [activeItems, setActiveItems] = useState<Category[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) return;

		let itemsToOrder: Category[] = [];
		if (activeView === "parents") {
			itemsToOrder = categories.filter(
				(c) => c.parent_id === null && c.is_active,
			);
		} else {
			itemsToOrder = categories.filter(
				(c) => c.parent_id === Number(activeView) && c.is_active,
			);
		}

		itemsToOrder.sort(
			(a, b) => (a.display_order || 0) - (b.display_order || 0),
		);
		setActiveItems(itemsToOrder);
	}, [isOpen, activeView, categories]);

	if (!isOpen) return null;

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setActiveItems((items) => {
				const oldIndex = items.findIndex((i) => i.category_id === active.id);
				const newIndex = items.findIndex((i) => i.category_id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (activeItems.length === 0) return;

		setIsSaving(true);
		const toastId = toast.loading("Guardando nuevo orden...");

		const payload = {
			categories: activeItems.map((cat, index) => ({
				category_id: cat.category_id as number,
				display_order: index,
			})),
		};

		try {
			await ProductService.reorderCategories(payload);
			toast.success("Catálogo reordenado exitosamente", { id: toastId });
			onSuccess();
			onClose();
		} catch (error) {
			toast.error("Error al reordenar las categorías.", { id: toastId });
		} finally {
			setIsSaving(false);
		}
	};

	const viewOptions = [
		{ label: "Categorías Principales", value: "parents" },
		...categories
			.filter((c) => c.parent_id === null && c.is_active)
			.map((c) => ({
				label: `Subcategorías de: ${c.name}`,
				value: String(c.category_id),
			})),
	];

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR PRINCIPAL */}
			<div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER ESTANDARIZADO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<ArrowUpDown className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Reordenar Catálogo
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1.5 font-medium transition-colors">
							Arrastrá las fichas para establecer la prioridad visual.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
					{/* SELECTOR DE NIVEL */}
					<div className="space-y-2">
						<label className="block text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
							Seleccioná el Nivel a ordenar
						</label>
						<SwappSearchableSelect
							options={viewOptions}
							value={activeView}
							onChange={setActiveView}
							placeholder="Elegir nivel..."
						/>
					</div>

					{/* EL LIENZO DE DRAG & DROP HOMOLOGADO */}
					<div className="bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/10 p-4 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 transition-colors">
						{activeItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 animate-in fade-in">
								<LayoutList className="h-8 w-8 mb-2 opacity-50" />
								<p className="text-sm">No hay categorías en este nivel.</p>
							</div>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}>
								<SortableContext
									items={activeItems.map((c) => c.category_id as number)}
									strategy={verticalListSortingStrategy}>
									<div className="flex flex-col gap-2 relative">
										{activeItems.map((category) => (
											<SortableCategoryItem
												key={category.category_id}
												category={category}
											/>
										))}
									</div>
								</SortableContext>
							</DndContext>
						)}
					</div>

					{/* FOOTER ESTANDARIZADO */}
					<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-6 transition-colors">
						<button
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
							Cancelar
						</button>
						<button
							onClick={handleSave}
							disabled={isSaving || activeItems.length === 0}
							className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
							<Save className="h-4 w-4" />
							{isSaving ? "Guardando..." : "Guardar Orden"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import {
	FolderTree,
	Plus,
	Edit,
	PlusSquare,
	Lock,
	Archive,
	RotateCcw,
	Ban,
	ArrowUpDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableSkeleton from "@/components/tables/TableSkeleton";
import NewCategoryModal from "@/components/products/modals/NewCategoryModal";
import NewSubcategoryModal from "@/components/products/modals/NewSubcategoryModal";
import CategoryAttributesModal from "@/components/products/modals/CategoryAttributesModal";
import ReorderCategoriesModal from "@/components/products/modals/ReorderCategoriesModal";
import ArchiveCategoryModal from "@/components/products/modals/ArchiveCategoryModal";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { ProductService } from "@/services/product.service";
import { Category } from "@/types/product";

// --- NUEVOS COMPONENTES ESTANDARIZADOS ---
import GlassTableWrapper from "@/components/tables/GlassTableWrapper";
import GlassTableHead, { GlassTh } from "@/components/tables/GlassTableHead";
import TableActionIcon from "@/components/tables/TableActionIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import GlassFilterToggle from "@/components/ui/GlassFilterToggle";

export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	const [showInactive, setShowInactive] = useState(false);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editingCat, setEditingCat] = useState<Partial<Category>>({
		name: "",
		slug: "",
		parent_id: null,
		display_order: 0,
		is_active: true,
	});

	const [isSubModalOpen, setIsSubModalOpen] = useState(false);
	const [selectedParent, setSelectedParent] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

	const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
	const [categoryToArchive, setCategoryToArchive] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [activeProductsCount, setActiveProductsCount] = useState(0);

	const [isLockModalOpen, setIsLockModalOpen] = useState(false);
	const [selectedCategoryForLock, setSelectedCategoryForLock] = useState<{
		id: number;
		name: string;
	} | null>(null);

	const fetchCategories = async (includeInactive = showInactive) => {
		setLoading(true);
		try {
			const data = await ProductService.getCategories(includeInactive);
			setCategories(Array.isArray(data) ? data : []);
		} catch (error) {
			toast.error("Error al cargar las categorías.");
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories(showInactive);
	}, [showInactive]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		const toastId = toast.loading(
			editingCat.category_id ? "Actualizando..." : "Creando...",
		);
		try {
			if (editingCat.category_id) {
				await api.put(
					`/api/products/admin/categories/${editingCat.category_id}`,
					{ ...editingCat, display_order: 0 },
				);
			} else {
				await ProductService.createCategory({
					name: editingCat.name!,
					slug: editingCat.slug!,
					parent_id: editingCat.parent_id,
					is_active: editingCat.is_active,
					display_order: 0,
				});
			}
			toast.success("Operación exitosa", { id: toastId });
			setIsModalOpen(false);
			fetchCategories();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al procesar", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleToggleStatus = async (
		categoryId: number,
		currentStatus: boolean,
		categoryName: string,
	) => {
		const isDeactivating = currentStatus;

		if (isDeactivating) {
			const toastId = toast.loading("Verificando dependencias...");
			try {
				const res = await ProductService.getCategoryProductsCount(categoryId);
				toast.dismiss(toastId);

				if (res.active_products_count > 0) {
					setCategoryToArchive({ id: categoryId, name: categoryName });
					setActiveProductsCount(res.active_products_count);
					setIsArchiveModalOpen(true);
					return;
				} else {
					const confirmed = window.confirm(
						`¿Estás seguro de que querés archivar la categoría "${categoryName}"?`,
					);
					if (!confirmed) return;
				}
			} catch (error) {
				toast.dismiss(toastId);
				toast.error("Error al verificar dependencias.");
				return;
			}
		}

		const actionText = isDeactivating ? "archivar" : "restaurar";
		const actionToastId = toast.loading(
			isDeactivating ? "Archivando categoría..." : "Restaurando categoría...",
		);

		try {
			await api.put(`/api/products/admin/categories/${categoryId}`, {
				is_active: !isDeactivating,
			});

			toast.success(
				isDeactivating
					? "Categoría archivada exitosamente"
					: "Categoría restaurada",
				{ id: actionToastId },
			);
			fetchCategories();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || `Error al ${actionText} la categoría.`,
				{ id: actionToastId },
			);
		}
	};

	const lowerSearchTerm = (searchTerm || "").toLowerCase();
	const matchingIds = new Set<number>();

	categories.forEach((c) => {
		if ((c.name || "").toLowerCase().includes(lowerSearchTerm)) {
			matchingIds.add(c.category_id as number);

			if (!c.parent_id) {
				categories
					.filter((child) => child.parent_id === c.category_id)
					.forEach((child) => matchingIds.add(child.category_id as number));
			} else {
				matchingIds.add(c.parent_id);
			}
		}
	});

	const filteredCategories: Category[] = [];
	const parentCategories = categories.filter((c) => !c.parent_id);

	parentCategories.forEach((parent) => {
		if (matchingIds.has(parent.category_id as number)) {
			filteredCategories.push(parent);

			const children = categories.filter(
				(c) => c.parent_id === parent.category_id,
			);
			children.forEach((child) => {
				if (matchingIds.has(child.category_id as number)) {
					filteredCategories.push(child);
				}
			});
		}
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Árbol de Categorías"
					description="Clasificación jerárquica del catálogo y nodos finales"
					icon={FolderTree}
				/>
				<div className="flex items-center gap-4">
					{/* TOGGLE ESTANDARIZADO */}
					<GlassFilterToggle
						id="toggle-inactive-cats"
						icon={Archive}
						iconActiveColor="text-swapp-verde-oscuro dark:text-swapp-verde-menta"
						labelOn="Viendo Archivadas"
						labelOff="Ver Archivadas"
						checked={showInactive}
						onChange={setShowInactive}
					/>

					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar categoría..."
					/>

					<SwappTooltip text="Modificar el orden visual del catálogo">
						<button
							onClick={() => setIsReorderModalOpen(true)}
							className="inline-flex items-center gap-2 rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco transition-colors hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo shadow-sm">
							<ArrowUpDown className="h-4 w-4 text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70" />{" "}
							Reordenar
						</button>
					</SwappTooltip>
					<SwappTooltip text="Crear una nueva categoría principal">
						<button
							onClick={() => {
								setEditingCat({
									name: "",
									slug: "",
									parent_id: null,
									display_order: 0,
									is_active: true,
								});
								setIsModalOpen(true);
							}}
							className="inline-flex items-center gap-2 rounded-xl bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-sm">
							<Plus className="h-4 w-4" /> Nueva Categoría
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA MODULARIZADO */}
			<GlassTableWrapper>
				<GlassTableHead>
					<GlassTh className="w-24">Orden</GlassTh>
					<GlassTh>Categoría (Slug)</GlassTh>
					<GlassTh>Jerarquía</GlassTh>
					<GlassTh>Estado</GlassTh>
					<GlassTh align="right">Acciones</GlassTh>
				</GlassTableHead>

				<tbody>
					{filteredCategories.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
								No se encontraron categorías.
							</td>
						</tr>
					) : (
						filteredCategories.map((c) => {
							const isChild = !!c.parent_id;

							const parentCategory = isChild
								? categories.find((p) => p.category_id === c.parent_id)
								: null;
							const isParentArchived = parentCategory
								? !parentCategory.is_active
								: false;

							const baseRowClasses =
								"border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";

							const rowStatusStyle =
								c.is_active && !isParentArchived
									? `hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30 ${isChild ? "bg-swapp-azul-petroleo/2 dark:bg-swapp-azul-petroleo/10" : ""}`
									: "opacity-60 bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-oscuro/80 hover:bg-swapp-azul-petroleo/20 dark:hover:bg-swapp-azul-oscuro/90";

							return (
								<tr
									key={c.category_id}
									className={`${baseRowClasses} ${rowStatusStyle}`}>
									<td className="px-6 py-4 font-mono font-medium text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/50">
										{c.display_order}
									</td>

									<td className="px-6 py-4">
										{/* SEPARACIÓN DE JERARQUÍA */}
										<div
											className={`flex items-center gap-2 ${
												isChild
													? "pl-6 border-l-2 border-swapp-verde-oscuro dark:border-swapp-verde-menta font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/90"
													: "font-bold text-swapp-azul-oscuro dark:text-swapp-blanco"
											} ${!c.is_active || isParentArchived ? "line-through text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60" : ""}`}>
											{isChild && (
												<span className="text-swapp-verde-oscuro/40 dark:text-swapp-verde-menta/60 font-normal">
													↳
												</span>
											)}
											{c.name}
										</div>
										<div
											className={`text-xs font-medium text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5 ${isChild ? "pl-6" : ""}`}>
											/{c.slug}
										</div>
									</td>

									<td className="px-6 py-4">
										{/* JERARQUÍA CON STATUS BADGE */}
										<StatusBadge variant={isChild ? "primary" : "neutral"}>
											{isChild ? "Subcategoría" : "Principal"}
										</StatusBadge>
									</td>

									<td className="px-6 py-4">
										{/* ESTADO CON STATUS BADGE */}
										{!c.is_active ? (
											<StatusBadge variant="danger">Oculta</StatusBadge>
										) : isParentArchived ? (
											<SwappTooltip
												text={`El padre "${parentCategory?.name}" está oculto.`}>
												<div className="w-fit">
													<StatusBadge
														variant="neutral"
														className="cursor-help">
														Bloqueada
													</StatusBadge>
												</div>
											</SwappTooltip>
										) : (
											<StatusBadge variant="primary">Activa</StatusBadge>
										)}
									</td>

									<td className="px-6 py-4 text-right">
										{/* ACCIONES CON TABLE ACTION ICON */}
										<div className="flex items-center justify-end gap-1">
											{isParentArchived ? (
												<TableActionIcon
													icon={Ban}
													tooltip={`Restaurá la categoría principal "${parentCategory?.name}" para interactuar con esta subcategoría.`}
													onClick={() => {}}
													disabled={true}
												/>
											) : c.is_active ? (
												<>
													{isChild && (
														<TableActionIcon
															icon={Lock}
															tooltip="Atributos de la Subcategoría"
															onClick={() => {
																setSelectedCategoryForLock({
																	id: c.category_id as number,
																	name: c.name,
																});
																setIsLockModalOpen(true);
															}}
														/>
													)}
													{!isChild && (
														<TableActionIcon
															icon={PlusSquare}
															tooltip="Añadir Subcategoría"
															onClick={() => {
																setSelectedParent({
																	id: c.category_id as number,
																	name: c.name,
																});
																setIsSubModalOpen(true);
															}}
														/>
													)}
													<TableActionIcon
														icon={Edit}
														tooltip="Editar Categoría"
														onClick={() => {
															setEditingCat(c);
															setIsModalOpen(true);
														}}
													/>
													<TableActionIcon
														icon={Archive}
														tooltip="Archivar Categoría"
														variant="danger"
														onClick={() =>
															handleToggleStatus(
																c.category_id as number,
																c.is_active,
																c.name,
															)
														}
													/>
												</>
											) : (
												<TableActionIcon
													icon={RotateCcw}
													tooltip="Restaurar Categoría"
													onClick={() =>
														handleToggleStatus(
															c.category_id as number,
															c.is_active,
															c.name,
														)
													}
												/>
											)}
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</GlassTableWrapper>

			{/* MODALES */}
			<NewCategoryModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				editingCat={editingCat}
				setEditingCat={setEditingCat}
				categories={categories}
				onSubmit={handleSubmit}
				isSaving={isSaving}
			/>
			<NewSubcategoryModal
				isOpen={isSubModalOpen}
				onClose={() => setIsSubModalOpen(false)}
				onSuccess={() => fetchCategories()}
				parentCategory={selectedParent}
			/>
			<CategoryAttributesModal
				isOpen={isLockModalOpen}
				onClose={() => setIsLockModalOpen(false)}
				category={selectedCategoryForLock}
			/>
			<ArchiveCategoryModal
				isOpen={isArchiveModalOpen}
				onClose={() => setIsArchiveModalOpen(false)}
				category={categoryToArchive}
				activeProductsCount={activeProductsCount}
				categories={categories}
				onSuccess={() => fetchCategories()}
			/>
			<ReorderCategoriesModal
				isOpen={isReorderModalOpen}
				onClose={() => setIsReorderModalOpen(false)}
				categories={categories}
				onSuccess={() => fetchCategories()}
			/>
		</div>
	);
}

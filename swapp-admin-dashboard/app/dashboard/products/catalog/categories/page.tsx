"use client";

import { useEffect, useState } from "react";
import { FolderTree, Plus, Edit, PlusSquare, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableSkeleton from "@/components/tables/TableSkeleton";
import NewCategoryModal from "@/components/products/NewCategoryModal";
import NewSubcategoryModal from "@/components/products/NewSubcategoryModal";
import CategoryAttributesModal from "@/components/products/CategoryAttributesModal";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { ProductService } from "@/services/product.service";
import { Category } from "@/types/product";

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
					editingCat,
				);
			} else {
				await ProductService.createCategory({
					name: editingCat.name!,
					slug: editingCat.slug!,
					parent_id: editingCat.parent_id,
					is_active: editingCat.is_active,
					display_order: editingCat.display_order,
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

	const parentCategories = categories.filter((c) => !c.parent_id);
	const hierarchicalCategories: Category[] = [];

	parentCategories.forEach((parent) => {
		hierarchicalCategories.push(parent);
		const children = categories.filter(
			(c) => c.parent_id === parent.category_id,
		);
		hierarchicalCategories.push(...children);
	});

	const filteredCategories = hierarchicalCategories.filter((c) =>
		(c.name || "").toLowerCase().includes((searchTerm || "").toLowerCase()),
	);

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
					<div className="flex items-center gap-2 bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/30 px-3 py-1.5 rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors">
						<span className="text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
							Ver Categorías Archivadas
						</span>
						<SwappToggle
							checked={showInactive}
							onChange={setShowInactive}
							id="toggle-inactive-cats"
						/>
					</div>

					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar categoría..."
					/>

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
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-colors whitespace-nowrap">
							<Plus className="h-4 w-4" /> Nueva Categoría
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 select-none">
						<tr>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Categoría (Slug)</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Jerarquía</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Orden</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Estado</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="">
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

								// Lógica visual estandarizada para filas
								const baseRowClasses = "border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200";
								
								const rowStatusStyle = c.is_active
									? `hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20 ${isChild ? "bg-swapp-tiza-verdoso/10 dark:bg-swapp-azul-petroleo/10" : ""}`
									: "opacity-60 bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/80 grayscale filter mix-blend-multiply dark:mix-blend-normal hover:bg-swapp-tiza-verdoso/50 dark:hover:bg-swapp-azul-oscuro/90";

								return (
									<tr
										key={c.category_id}
										className={`${baseRowClasses} ${rowStatusStyle}`}>
										<td className="px-6 py-4">
											<div
												className={`font-medium flex items-center gap-2 text-swapp-azul-oscuro dark:text-swapp-blanco ${isChild ? "pl-6 border-l-2 border-swapp-verde-oscuro dark:border-swapp-verde-menta" : ""} ${!c.is_active ? "line-through" : ""}`}>
												{isChild && (
													<span className="text-swapp-verde-menta/60">↳</span>
												)}
												{c.name}
											</div>
											<div
												className={`text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 ${isChild ? "pl-6" : ""}`}>
												/{c.slug}
											</div>
										</td>
										<td className="px-6 py-4 text-xs">
											{isChild ? (
												<span className="inline-flex items-center gap-1 rounded-full bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 px-2.5 py-1 font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
													Subcategoría
												</span>
											) : (
												<span className="inline-flex items-center gap-1 rounded-full bg-swapp-azul-petroleo/10 dark:bg-swapp-tiza-verdoso/10 px-2.5 py-1 font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
													Principal
												</span>
											)}
										</td>
										<td className="px-6 py-4">{c.display_order}</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${c.is_active ? "bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
												{c.is_active ? "Activa" : "Oculta"}
											</span>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-1">
												{isChild && (
													<SwappTooltip text="Candado de Atributos">
														<button
															onClick={() => {
																setSelectedCategoryForLock({
																	id: c.category_id,
																	name: c.name,
																});
																setIsLockModalOpen(true);
															}}
															className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
															<Lock className="h-4 w-4" />
														</button>
													</SwappTooltip>
												)}
												{!isChild && (
													<SwappTooltip text="Añadir Subcategoría">
														<button
															onClick={() => {
																setSelectedParent({
																	id: c.category_id,
																	name: c.name,
																});
																setIsSubModalOpen(true);
															}}
															className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
															<PlusSquare className="h-4 w-4" />
														</button>
													</SwappTooltip>
												)}
												<SwappTooltip text="Editar Categoría">
													<button
														onClick={() => {
															setEditingCat(c);
															setIsModalOpen(true);
														}}
														className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
														<Edit className="h-4 w-4" />
													</button>
												</SwappTooltip>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

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
		</div>
	);
}
"use client";

import { useEffect, useState } from "react";
import { FolderTree, Plus, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableSkeleton from "@/components/tables/TableSkeleton";
import NewCategoryModal from "@/components/products/NewCategoryModal";
import { Category } from "@/types/product";

export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editingCat, setEditingCat] = useState<Partial<Category>>({
		name: "",
		slug: "",
		parent_id: null,
		display_order: 0,
		is_active: true,
	});

	const fetchCategories = async () => {
		try {
			const { data } = await api.get("/api/products/admin/categories");
			setCategories(data);
		} catch (error) {
			toast.error("Error al cargar las categorías.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

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
				await api.post("/api/products/admin/categories", editingCat);
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

	// Agregamos el sort dinámico para respetar la prioridad en el cliente
	const filteredCategories = categories
		.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Árbol de Categorías"
					description="Clasificación jerárquica del catálogo"
					icon={FolderTree}
				/>
				<div className="flex items-center gap-3">
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar categoría..."
					/>
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
						className="inline-flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua transition-colors">
						<Plus className="h-4 w-4" /> Nueva Categoría
					</button>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold">Categoría (Slug)</th>
							<th className="px-6 py-4 font-semibold">Categoría Padre</th>
							<th className="px-6 py-4 font-semibold">Orden</th>
							<th className="px-6 py-4 font-semibold">Estado</th>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{filteredCategories.map((c) => (
							<tr
								key={c.category_id}
								className="transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30">
								<td className="px-6 py-4">
									<div className="font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
										{c.name}
									</div>
									<div className="text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50">
										/{c.slug}
									</div>
								</td>
								<td className="px-6 py-4 text-swapp-turquesa-oscuro dark:text-swapp-menta font-medium text-xs">
									{c.parent_id
										? categories.find((p) => p.category_id === c.parent_id)
												?.name
										: "— Principal —"}
								</td>
								<td className="px-6 py-4">{c.display_order}</td>
								<td className="px-6 py-4">
									<span
										className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${c.is_active ? "bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 text-swapp-turquesa-oscuro dark:text-swapp-menta" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
										{c.is_active ? "Activa" : "Oculta"}
									</span>
								</td>
								<td className="px-6 py-4 text-right">
									<button
										onClick={() => {
											setEditingCat(c);
											setIsModalOpen(true);
										}}
										className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
										<Edit className="h-4 w-4" />
									</button>
								</td>
							</tr>
						))}
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
		</div>
	);
}

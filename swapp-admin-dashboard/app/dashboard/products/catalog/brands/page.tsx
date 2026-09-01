"use client";

import { useEffect, useState } from "react";
import { Bookmark, Plus, Edit, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableSkeleton from "@/components/tables/TableSkeleton";
import NewBrandModal from "@/components/products/NewBrandModal";
import { Brand } from "@/types/product";

export default function BrandsPage() {
	const [brands, setBrands] = useState<Brand[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editingBrand, setEditingBrand] = useState<Partial<Brand>>({
		name: "",
		slug: "",
		display_order: 0,
		is_active: true,
		featured: false,
	});

	const fetchBrands = async () => {
		try {
			const { data } = await api.get("/api/products/admin/brands");
			setBrands(data);
		} catch (error) {
			toast.error("Error al cargar las marcas.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBrands();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		const toastId = toast.loading(
			editingBrand.brand_id ? "Actualizando marca..." : "Creando marca...",
		);
		try {
			if (editingBrand.brand_id) {
				await api.put(
					`/api/products/admin/brands/${editingBrand.brand_id}`,
					editingBrand,
				);
			} else {
				await api.post("/api/products/admin/brands", editingBrand);
			}
			toast.success("Operación exitosa", { id: toastId });
			setIsModalOpen(false);
			fetchBrands();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al procesar la solicitud",
				{ id: toastId },
			);
		} finally {
			setIsSaving(false);
		}
	};

	const filteredBrands = brands
		.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Marcas Registradas"
					description="Administración de fabricantes y patentes"
					icon={Bookmark}
				/>
				<div className="flex items-center gap-3">
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar marca..."
					/>
					<button
						onClick={() => {
							setEditingBrand({
								name: "",
								slug: "",
								display_order: 0,
								is_active: true,
								featured: false,
							});
							setIsModalOpen(true);
						}}
						className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-colors">
						<Plus className="h-4 w-4" /> Nueva Marca
					</button>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/30 text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso select-none">
						<tr>
							<th className="px-6 py-4 font-semibold">Logo</th>
							<th className="px-6 py-4 font-semibold">Nombre y Slug</th>
							<th className="px-6 py-4 font-semibold">Orden</th>
							<th className="px-6 py-4 font-semibold">Estado</th>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza-verdoso dark:divide-swapp-azul-petroleo">
						{filteredBrands.map((b) => (
							<tr
								key={b.brand_id}
								className="transition-colors hover:bg-swapp-tiza-verdoso/30 dark:hover:bg-swapp-azul-petroleo/30">
								<td className="px-6 py-4">
									{b.logo_url ? (
										<img
											src={b.logo_url}
											className="h-10 w-10 rounded-md object-contain bg-white border border-swapp-tiza-verdoso"
										/>
									) : (
										<div className="h-10 w-10 rounded-md bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30">
											<ImageIcon className="h-5 w-5" />
										</div>
									)}
								</td>
								<td className="px-6 py-4">
									<div className="font-medium text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
										{b.name}
										{b.featured && (
											<span className="text-[10px] bg-swapp-verde-oscuro/20 text-swapp-verde-oscuro dark:text-swapp-verde-menta px-2 py-0.5 rounded-full uppercase font-bold">
												Destacada
											</span>
										)}
									</div>
									<div className="text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
										/{b.slug}
									</div>
								</td>
								<td className="px-6 py-4">{b.display_order}</td>
								<td className="px-6 py-4">
									<span
										className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${b.is_active ? "bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
										{b.is_active ? "Activa" : "Inactiva"}
									</span>
								</td>
								<td className="px-6 py-4 text-right">
									<button
										onClick={() => {
											setEditingBrand(b);
											setIsModalOpen(true);
										}}
										className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
										<Edit className="h-4 w-4" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<NewBrandModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				editingBrand={editingBrand}
				setEditingBrand={setEditingBrand}
				onSubmit={handleSubmit}
				isSaving={isSaving}
			/>
		</div>
	);
}

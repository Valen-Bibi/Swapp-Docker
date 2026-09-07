"use client";

import { useEffect, useState } from "react";
import { Bookmark, Plus, Edit, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableSkeleton from "@/components/tables/TableSkeleton";
import NewBrandModal from "@/components/products/NewBrandModal";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { Brand } from "@/types/product";

export default function BrandsPage() {
	const [brands, setBrands] = useState<Brand[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	
	// Agregamos el estado del toggle para estandarizar con las otras vistas
	const [showInactive, setShowInactive] = useState(false);

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

	// Filtramos también por el estado activo/inactivo
	const filteredBrands = brands
		.filter((b) => {
			if (!showInactive && !b.is_active) return false;
			return b.name.toLowerCase().includes(searchTerm.toLowerCase());
		})
		.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Marcas Registradas"
					description="Administración de fabricantes y patentes"
					icon={Bookmark}
				/>
				<div className="flex items-center gap-4">
					{/* Contenedor del Toggle estandarizado */}
					<div className="flex items-center gap-2 bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/30 px-3 py-1.5 rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors">
						<span className="text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
							Ver Marcas Archivadas
						</span>
						<SwappToggle
							checked={showInactive}
							onChange={setShowInactive}
							id="toggle-inactive-brands"
						/>
					</div>

					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar marca..."
					/>
					
					<SwappTooltip text="Registrar una nueva marca">
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
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-colors whitespace-nowrap">
							<Plus className="h-4 w-4" /> Nueva Marca
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 select-none">
						<tr>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Logo</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Nombre y Slug</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Orden</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">Estado</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="">
						{filteredBrands.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
									No se encontraron marcas con esos filtros.
								</td>
							</tr>
						) : (
							filteredBrands.map((b) => {
								// Lógica visual estandarizada para filas
								const baseRowClasses = "border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200";
								
								const rowStatusStyle = b.is_active
									? "hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20"
									: "opacity-60 bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/80 grayscale filter mix-blend-multiply dark:mix-blend-normal hover:bg-swapp-tiza-verdoso/50 dark:hover:bg-swapp-azul-oscuro/90";

								return (
									<tr
										key={b.brand_id}
										className={`${baseRowClasses} ${rowStatusStyle}`}>
										<td className="px-6 py-4">
											{b.logo_url ? (
												<img
													src={b.logo_url}
													className="h-10 w-10 rounded-md object-contain bg-swapp-blanco border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo"
													alt={`Logo de ${b.name}`}
												/>
											) : (
												<div className="h-10 w-10 rounded-md bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 transition-colors">
													<ImageIcon className="h-5 w-5" />
												</div>
											)}
										</td>
										<td className="px-6 py-4">
											<div className={`font-medium text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2 ${!b.is_active ? "line-through" : ""}`}>
												{b.name}
												{b.featured && (
													<span className="text-[10px] bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
														Destacada
													</span>
												)}
											</div>
											<div className="text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 mt-0.5">
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
											<div className="flex items-center justify-end">
												<SwappTooltip text="Editar Marca">
													<button
														onClick={() => {
															setEditingBrand(b);
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
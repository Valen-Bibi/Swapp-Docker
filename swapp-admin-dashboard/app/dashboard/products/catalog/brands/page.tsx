"use client";

import { useEffect, useState } from "react";
import {
	Bookmark,
	Plus,
	Edit,
	Image as ImageIcon,
	Archive,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableSkeleton from "@/components/tables/TableSkeleton";
import NewBrandModal from "@/components/products/modals/NewBrandModal";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { Brand } from "@/types/product";

// --- NUEVOS COMPONENTES ESTANDARIZADOS ---
import GlassTableWrapper from "@/components/tables/GlassTableWrapper";
import GlassTableHead, { GlassTh } from "@/components/tables/GlassTableHead";
import TableActionIcon from "@/components/tables/TableActionIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import GlassFilterToggle from "@/components/ui/GlassFilterToggle";

export default function BrandsPage() {
	const [brands, setBrands] = useState<Brand[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

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
					{/* NUEVO TOGGLE MODULARIZADO */}
					<GlassFilterToggle
						id="toggle-inactive-brands"
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
							className="inline-flex items-center gap-2 rounded-xl bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-sm">
							<Plus className="h-4 w-4" /> Nueva Marca
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA MODULARIZADO */}
			<GlassTableWrapper>
				<GlassTableHead>
					<GlassTh className="w-24">Orden</GlassTh>
					<GlassTh>Logo</GlassTh>
					<GlassTh>Nombre y Slug</GlassTh>
					<GlassTh>Estado</GlassTh>
					<GlassTh align="right">Acciones</GlassTh>
				</GlassTableHead>

				<tbody>
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
							const baseRowClasses =
								"border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";

							const rowStatusStyle = b.is_active
								? "hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30"
								: "opacity-60 bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-oscuro/80 hover:bg-swapp-azul-petroleo/20 dark:hover:bg-swapp-azul-oscuro/90";

							return (
								<tr
									key={b.brand_id}
									className={`${baseRowClasses} ${rowStatusStyle}`}>
									{/* ORDEN */}
									<td className="px-6 py-4 font-mono font-medium text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/50">
										{b.display_order}
									</td>

									{/* LOGO */}
									<td className="px-6 py-4">
										{b.logo_url ? (
											<img
												src={b.logo_url}
												className="h-10 w-10 rounded-md object-contain bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo shadow-sm p-0.5"
												alt={`Logo de ${b.name}`}
											/>
										) : (
											<div className="h-10 w-10 rounded-md bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/40 border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 transition-colors shadow-sm">
												<ImageIcon className="h-5 w-5" />
											</div>
										)}
									</td>

									{/* NOMBRE Y SLUG */}
									<td className="px-6 py-4">
										<div
											className={`font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2 ${!b.is_active ? "line-through text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60" : ""}`}>
											{b.name}
											{b.featured && (
												<StatusBadge
													variant="info"
													className="uppercase tracking-wider !px-1.5 !py-0.5 !text-[10px]">
													Destacada
												</StatusBadge>
											)}
										</div>
										<div className="text-xs font-medium text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5">
											/{b.slug}
										</div>
									</td>

									{/* ESTADO CON STATUS BADGE */}
									<td className="px-6 py-4">
										<StatusBadge variant={b.is_active ? "primary" : "danger"}>
											{b.is_active ? "Activa" : "Inactiva"}
										</StatusBadge>
									</td>

									{/* ACCIONES CON TABLE ACTION ICON */}
									<td className="px-6 py-4 text-right">
										<div className="flex items-center justify-end">
											<TableActionIcon
												icon={Edit}
												tooltip="Editar Marca"
												onClick={() => {
													setEditingBrand(b);
													setIsModalOpen(true);
												}}
											/>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</GlassTableWrapper>

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

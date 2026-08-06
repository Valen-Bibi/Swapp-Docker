"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { Box, Plus, Edit, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import EditStructureModal from "@/components/products/EditStructureModal";
import { useTableSort } from "@/hooks/useTableSort";
import { Product, Brand } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

export default function MasterCatalogPage() {
	const router = useRouter();
	const [products, setProducts] = useState<Product[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [loading, setLoading] = useState(true);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

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

	const fetchBrands = async () => {
		try {
			const data = await ProductService.getBrands();
			setBrands(data);
		} catch (error) {
			console.error("Error obteniendo las marcas:", error);
		}
	};

	useEffect(() => {
		fetchProducts();
		fetchBrands();
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

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingProduct) return;
		setIsSaving(true);
		const toastId = toast.loading("Actualizando...");

		try {
			// Separamos la media para que no viaje en el payload de actualización y rompa el esquema de Pydantic
			const { media, ...safeUpdateData } = editingProduct as any;

			await ProductService.update(editingProduct.product_uuid, {
				...safeUpdateData,
				brand_id: safeUpdateData.brand_id || null,
			});

			setIsEditModalOpen(false);
			await fetchProducts();
			toast.success("Actualizado correctamente", { id: toastId });
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar.", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const filteredProducts = products.filter(
		(p) =>
			p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const {
		sortedData: processedProducts,
		sortKey,
		sortDirection,
		handleSort,
	} = useTableSort(filteredProducts, {
		returnable: (p) => (p.is_returnable ? 1 : 0),
		status: (p) => (p.is_published ? 1 : 0),
		sku: (p) => p.sku || "",
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Catálogo Maestro"
					description="Gestión de identidad y multimedia"
					icon={Box}
				/>
				<div className="flex items-center gap-3">
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar por nombre o SKU..."
					/>
					<SwappTooltip text="Crear un nuevo ítem" shortcut="Alt + N">
						<button
							onClick={() =>
								router.push("/dashboard/products/catalog/master/new")
							}
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua transition-colors">
							<Plus className="h-4 w-4" /> Nuevo Producto
						</button>
					</SwappTooltip>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold">Imagen</th>
							<SortableHeader
								label="Producto e Identidad"
								columnKey="name"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="SKU"
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
								label="Estado"
								columnKey="status"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{processedProducts.map((p) => {
							const mainImageUrl = p.media?.find(
								(m: any) =>
									m.media_type === "image" && m.media_subtype === "main",
							)?.file_url;

							return (
								<tr
									key={p.product_uuid}
									className="transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30">
									<td className="px-6 py-4">
										{mainImageUrl ? (
											<img
												src={mainImageUrl}
												alt={`Imagen principal de ${p.name}`}
												className="h-12 w-12 rounded-md object-cover border border-swapp-tiza dark:border-swapp-azul-petroleo"
											/>
										) : (
											<div className="h-12 w-12 rounded-md bg-swapp-tiza dark:bg-swapp-azul-petroleo flex items-center justify-center text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30 transition-colors">
												<ImageIcon className="h-6 w-6" />
											</div>
										)}
									</td>
									<td className="px-6 py-4">
										<div className="font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
											{p.name}
										</div>
										<div className="text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 flex items-center gap-1 mt-0.5">
											{p.brand?.name && (
												<>
													<span className="font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta">
														{p.brand.name}
													</span>
													<span>•</span>
												</>
											)}
											<span>/{p.slug}</span>
										</div>
									</td>
									<td className="px-6 py-4 font-mono text-xs text-swapp-azul-petroleo dark:text-swapp-tiza">
										{p.sku || "-"}
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.is_returnable ? "bg-swapp-azul-oceano/10 dark:bg-swapp-menta/10 text-swapp-azul-oceano dark:text-swapp-menta" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza"}`}>
											{p.is_returnable ? "Retornable" : "Estándar"}
										</span>
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${p.is_published ? "bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 text-swapp-turquesa-oscuro dark:text-swapp-menta" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza"}`}>
											{p.is_published ? "Publicado" : "Borrador"}
										</span>
									</td>
									<td className="px-6 py-4 text-right">
										<button
											onClick={() => {
												setEditingProduct(p);
												setIsEditModalOpen(true);
											}}
											className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
											<Edit className="h-4 w-4" />
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<EditStructureModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				product={editingProduct}
				brands={brands}
				onSuccess={fetchProducts}
			/>
		</div>
	);
}

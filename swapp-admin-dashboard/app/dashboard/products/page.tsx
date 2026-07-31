"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { Package, Plus, Edit, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { useTableSort } from "@/hooks/useTableSort";
import { Product } from "@/types/product";

interface Brand {
	brand_id: number;
	name: string;
}

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
					router.push("/dashboard/products/new");
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
			await ProductService.update(editingProduct.product_uuid, {
				...editingProduct,
				brand_id: editingProduct.brand_id || null,
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
					icon={Package}
				/>
				<div className="flex items-center gap-3">
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar por nombre o SKU..."
					/>
					<SwappTooltip text="Crear un nuevo ítem" shortcut="Alt + N">
						{/* Ahora este botón navega directamente usando el router */}
						<button
							onClick={() => router.push("/dashboard/products/new")}
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
						{processedProducts.map((p) => (
							<tr
								key={p.product_uuid}
								className="transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30">
								<td className="px-6 py-4">
									{p.main_image_url ? (
										<img
											src={p.main_image_url}
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
						))}
					</tbody>
				</table>
			</div>

			{/* Modal de edición rápida conservado aquí... */}
			{isEditModalOpen && editingProduct && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta transition-colors">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
								Editar Estructura
							</h2>
							<button
								onClick={() => setIsEditModalOpen(false)}
								className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco transition-colors">
								<X className="h-5 w-5" />
							</button>
						</div>

						<form onSubmit={handleEditSubmit} className="space-y-4">
							<SwappInput
								label="Nombre Comercial"
								required
								value={editingProduct.name}
								onChange={(e) =>
									setEditingProduct({
										...editingProduct,
										name: e.target.value,
									})
								}
							/>

							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									Marca Registrada
								</label>
								<select
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
									value={editingProduct.brand_id || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											brand_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}>
									<option value="" className="dark:bg-swapp-negro-azulado">
										Sin marca asignada
									</option>
									{brands.map((b) => (
										<option
											key={b.brand_id}
											value={b.brand_id}
											className="dark:bg-swapp-negro-azulado">
											{b.name}
										</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<SwappInput
									label="URL Amigable (Slug)"
									required
									value={editingProduct.slug}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											slug: e.target.value,
										})
									}
								/>
								<SwappInput
									label="SKU"
									value={editingProduct.sku || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											sku: e.target.value,
										})
									}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 transition-colors">
								<SwappInput
									label="Costo de Adquisición ($)"
									type="number"
									step="0.01"
									min="0"
									value={editingProduct.cost_price || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											cost_price: parseFloat(e.target.value) || 0,
										})
									}
								/>
								<SwappInput
									label="Precio Base ($)"
									type="number"
									step="0.01"
									min="0"
									required
									value={editingProduct.base_price || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											base_price: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>

							<SwappInput
								label="URL de la Imagen"
								helpText="(Temporal hasta enlazar Bucket)"
								placeholder="https://..."
								value={editingProduct.main_image_url || ""}
								onChange={(e) =>
									setEditingProduct({
										...editingProduct,
										main_image_url: e.target.value,
									})
								}
							/>

							<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 space-y-3 transition-colors">
								<SwappCheckbox
									label="Envase Retornable"
									id="edit_is_returnable"
									checked={editingProduct.is_returnable}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											is_returnable: e.target.checked,
										})
									}
								/>
								<SwappCheckbox
									label="Publicado (Visible en tienda)"
									id="edit_is_published"
									checked={editingProduct.is_published}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											is_published: e.target.checked,
										})
									}
								/>
							</div>

							<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
								<button
									type="button"
									onClick={() => setIsEditModalOpen(false)}
									className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSaving}
									className="rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua disabled:opacity-50">
									{isSaving ? "Guardando..." : "Guardar Cambios"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

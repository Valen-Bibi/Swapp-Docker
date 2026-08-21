"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tag, Plus, Edit, Power, Layers } from "lucide-react";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { ProductService } from "@/services/product.service";
import NewDiscountModal, {
	ProductDiscount,
} from "@/components/products/NewDiscountModal";

export default function OffersPage() {
	const [discounts, setDiscounts] = useState<ProductDiscount[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	const [showHistory, setShowHistory] = useState(false);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingDiscount, setEditingDiscount] =
		useState<ProductDiscount | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			let fetchedDiscounts: ProductDiscount[] = [];
			let fetchedProducts: Product[] = [];

			// 1. Intentamos cargar los descuentos de forma aislada
			try {
				const discountsRes = await api.get("/api/products/admin/discounts");
				fetchedDiscounts = [...discountsRes.data];

				// Si el switch está encendido, buscamos el historial y lo sumamos
				if (showHistory) {
					const historyRes = await api.get(
						"/api/products/admin/discounts/history",
					);
					fetchedDiscounts = [...fetchedDiscounts, ...historyRes.data];
				}
			} catch (err) {
				console.error("Error cargando descuentos:", err);
				toast.error("Error al cargar la tabla de ofertas.");
			}

			// 2. Intentamos cargar los productos de forma aislada
			try {
				// ProductService ya devuelve Product[], por lo que no lleva .data
				fetchedProducts = await ProductService.getAll();
			} catch (err) {
				console.error("Error cargando catálogo de productos:", err);
				toast.error("Error al cargar los productos para el selector.");
			}

			// 3. Procesamos y guardamos lo que haya sobrevivido
			const sortedDiscounts = fetchedDiscounts.sort((a, b) => {
				if (a.is_active && !b.is_active) return -1;
				if (!a.is_active && b.is_active) return 1;
				return (
					new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
				);
			});

			setDiscounts(sortedDiscounts);
			setProducts(fetchedProducts);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [showHistory]);

	const handleToggleActive = async (discount: ProductDiscount) => {
		const newStatus = !discount.is_active;

		if (newStatus) {
			const newStart = new Date(discount.start_date);
			const newEnd = new Date(discount.end_date);

			const overlapping = discounts.find((d) => {
				if (d.discount_id === discount.discount_id) return false;
				if (d.product_uuid !== discount.product_uuid) return false;
				if (!d.is_active) return false;

				const datesOverlap =
					newStart < new Date(d.end_date) && newEnd > new Date(d.start_date);
				if (!datesOverlap) return false;

				const dIsGlobal = !d.variant_uuids || d.variant_uuids.length === 0;
				const thisIsGlobal =
					!discount.variant_uuids || discount.variant_uuids.length === 0;

				if (dIsGlobal || thisIsGlobal) return true;

				return d.variant_uuids!.some((uuid) =>
					discount.variant_uuids!.includes(uuid),
				);
			});

			if (overlapping) {
				const startStr = new Date(overlapping.start_date).toLocaleDateString();
				const endStr = new Date(overlapping.end_date).toLocaleDateString();

				toast.error(
					`Conflicto: Choca con "${overlapping.name}" (Activa del ${startStr} al ${endStr}). Desactívala o edita el alcance primero.`,
					{ duration: 5000 },
				);
				return;
			}
		}

		const toastId = toast.loading("Actualizando estado...");
		try {
			await api.patch(
				`/api/products/admin/discounts/${discount.discount_id}/toggle`,
				{
					is_active: newStatus,
				},
			);

			setDiscounts((prev) => {
				const updated = prev.map((d) =>
					d.discount_id === discount.discount_id
						? { ...d, is_active: newStatus }
						: d,
				);

				return updated.sort((a, b) => {
					if (a.is_active && !b.is_active) return -1;
					if (!a.is_active && b.is_active) return 1;
					return (
						new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
					);
				});
			});

			toast.success(newStatus ? "Oferta activada" : "Oferta pausada", {
				id: toastId,
			});
		} catch (error) {
			toast.error("Error al cambiar el estado", { id: toastId });
		}
	};

	const openModal = (discount?: ProductDiscount) => {
		if (discount) {
			setEditingDiscount(discount);
		} else {
			setEditingDiscount(null);
		}
		setIsModalOpen(true);
	};

	const filteredDiscounts = discounts.filter(
		(d) =>
			d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			d.product_name?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Gestión de Ofertas"
					description="Administración de descuentos temporales e híbridos"
					icon={Tag}
				/>
				<div className="flex gap-4 items-center">
					<SwappToggle
						checked={showHistory}
						onChange={setShowHistory}
						label="Ver historial"
						id="history-toggle"
					/>

					<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
					<button
						onClick={() => openModal()}
						className="flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2.5 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado hover:bg-swapp-azul-oceano transition-colors whitespace-nowrap">
						<Plus className="h-4 w-4" /> Nueva Oferta
					</button>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold">Producto / Alcance</th>
							<th className="px-6 py-4 font-semibold">Campaña</th>
							<th className="px-6 py-4 font-semibold">Descuento</th>
							<th className="px-6 py-4 font-semibold">Validez</th>
							<th className="px-6 py-4 font-semibold text-center">Estado</th>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{filteredDiscounts.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-6 py-8 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50">
									No se encontraron ofertas.
								</td>
							</tr>
						) : (
							filteredDiscounts.map((d) => {
								const isGlobal =
									!d.variant_uuids || d.variant_uuids.length === 0;

								return (
									<tr
										key={d.discount_id}
										className={`transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30 ${new Date(d.end_date) < new Date() ? "opacity-60" : ""}`}>
										{/* NUEVA COLUMNA CON BADGES DE ALCANCE */}
										<td className="px-6 py-4">
											<div className="flex flex-col gap-1.5">
												<span className="font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
													{d.product_name || `ID: ${d.product_id}`}
												</span>
												{isGlobal ? (
													<span className="w-fit inline-flex items-center gap-1 rounded-md bg-emerald-100/60 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
														<Layers className="h-3 w-3" /> Catálogo Completo
													</span>
												) : (
													<div className="flex flex-wrap gap-1">
														{d.variant_uuids?.map((uuid) => {
															// Buscamos el SKU cruzando datos con el catálogo maestro
															const product = products.find(
																(p) => p.product_uuid === d.product_uuid,
															);
															const sku =
																product?.variants?.find(
																	(v) => v.variant_uuid === uuid,
																)?.sku || "...";

															return (
																<span
																	key={uuid}
																	className="inline-flex items-center rounded-md bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/40 px-2 py-0.5 text-[10px] font-mono font-medium text-swapp-azul-petroleo dark:text-swapp-tiza border border-swapp-tiza dark:border-swapp-azul-petroleo/50">
																	SKU: {sku}
																</span>
															);
														})}
													</div>
												)}
											</div>
										</td>

										<td className="px-6 py-4 font-medium">{d.name}</td>
										<td className="px-6 py-4">
											<span className="inline-flex items-center gap-1 font-bold text-swapp-turquesa-oscuro dark:text-swapp-menta bg-swapp-turquesa-oscuro/10 dark:bg-swapp-menta/10 px-2 py-1 rounded-md">
												<Tag className="h-3.5 w-3.5" />
												{d.discount_type === "percentage"
													? `${d.value}% OFF`
													: formatCurrency(d.value)}
											</span>
										</td>
										<td className="px-6 py-4 text-xs">
											<div className="flex flex-col gap-1 text-swapp-azul-petroleo/80 dark:text-swapp-tiza/80">
												<span>
													<span className="font-medium">Inicio:</span>{" "}
													{new Date(d.start_date).toLocaleDateString()}
												</span>
												<span>
													<span className="font-medium">Fin:</span>{" "}
													{new Date(d.end_date).toLocaleDateString()}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 text-center">
											<button
												onClick={() => handleToggleActive(d)}
												title={d.is_active ? "Desactivar" : "Activar"}
												disabled={new Date(d.end_date) < new Date()}
												className={`inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
													d.is_active
														? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400"
														: "bg-swapp-tiza text-swapp-azul-petroleo/40 hover:bg-swapp-tiza/80 dark:bg-swapp-azul-petroleo dark:text-swapp-tiza/40"
												} disabled:cursor-not-allowed`}>
												<Power className="h-4 w-4" />
											</button>
										</td>
										<td className="px-6 py-4 text-right">
											<button
												onClick={() => openModal(d)}
												title="Editar Oferta"
												className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
												<Edit className="h-4 w-4" />
											</button>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			<NewDiscountModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				editingDiscount={editingDiscount}
				products={products}
				allDiscounts={discounts}
				onSuccess={fetchData}
			/>
		</div>
	);
}

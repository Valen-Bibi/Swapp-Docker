"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tag, Plus, Edit, Power, Layers } from "lucide-react";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { ProductService } from "@/services/product.service";
import NewDiscountModal, {
	ProductDiscount,
} from "@/components/products/modals/NewDiscountModal";

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
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Gestión de Ofertas"
					description="Administración de descuentos temporales e híbridos"
					icon={Tag}
				/>
				<div className="flex items-center gap-4">
					{/* Toggle Control con Glassmorphism */}
					<div className="flex items-center gap-3 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors shadow-sm">
						<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
							Ver Historial de Ofertas
						</span>
						<SwappToggle
							checked={showHistory}
							onChange={setShowHistory}
							id="history-toggle"
						/>
					</div>

					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						placeholder="Buscar producto u oferta..."
					/>

					<SwappTooltip text="Crear una nueva oferta">
						<button
							onClick={() => openModal()}
							className="inline-flex items-center gap-2 rounded-xl bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-sm">
							<Plus className="h-4 w-4" /> Nueva Oferta
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA ESTANDARIZADO (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-xl transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-oscuro dark:text-swapp-blanco">
					{/* CABECERA ENTERPRISE GRID MÁS OSCURA */}
					<thead className="bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo select-none">
						<tr>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Producto / Alcance
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Campaña
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Descuento
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Validez
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-center">
								Estado
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-right">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="">
						{filteredDiscounts.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
									No se encontraron ofertas.
								</td>
							</tr>
						) : (
							filteredDiscounts.map((d) => {
								const isGlobal =
									!d.variant_uuids || d.variant_uuids.length === 0;
								const isExpired = new Date(d.end_date) < new Date();

								const baseRowClasses =
									"border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";

								// Lógica unificada para el estado de la fila
								const rowStatusStyle =
									!d.is_active || isExpired
										? "opacity-60 bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-oscuro/80 hover:bg-swapp-azul-petroleo/20 dark:hover:bg-swapp-azul-oscuro/90"
										: "hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30";

								return (
									<tr
										key={d.discount_id}
										className={`${baseRowClasses} ${rowStatusStyle}`}>
										{/* PRODUCTO / ALCANCE */}
										<td className="px-6 py-4">
											<div className="flex flex-col gap-2">
												<span
													className={`font-bold ${!d.is_active || isExpired ? "line-through text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
													{d.product_name || `ID: ${d.product_id}`}
												</span>
												{isGlobal ? (
													<span className="w-fit inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shadow-sm">
														<Layers className="h-3 w-3" /> Catálogo Completo
													</span>
												) : (
													<div className="flex flex-wrap gap-1">
														{d.variant_uuids?.map((uuid) => {
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
																	className="inline-flex items-center rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/40 bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 px-2 py-0.5 text-[10px] font-mono font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso shadow-sm">
																	SKU: {sku}
																</span>
															);
														})}
													</div>
												)}
											</div>
										</td>

										{/* CAMPAÑA */}
										<td className="px-6 py-4 font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco">
											{d.name}
										</td>

										{/* DESCUENTO */}
										<td className="px-6 py-4">
											<span className="inline-flex items-center gap-1 font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 px-2.5 py-1 rounded-md shadow-sm">
												<Tag className="h-3.5 w-3.5" />
												{d.discount_type === "percentage"
													? `${d.value}% OFF`
													: formatCurrency(d.value)}
											</span>
										</td>

										{/* VALIDEZ */}
										<td className="px-6 py-4 text-xs">
											<div className="flex flex-col gap-1.5 text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/80 font-medium">
												<span>
													<span className="font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
														Inicio:
													</span>{" "}
													{new Date(d.start_date).toLocaleDateString()}
												</span>
												<span className={isExpired ? "text-red-500" : ""}>
													<span className="font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
														Fin:
													</span>{" "}
													{new Date(d.end_date).toLocaleDateString()}
												</span>
											</div>
										</td>

										{/* ESTADO (BOTÓN POWER) */}
										<td className="px-6 py-4 text-center">
											<SwappTooltip
												text={
													d.is_active ? "Desactivar Oferta" : "Activar Oferta"
												}>
												<button
													onClick={() => handleToggleActive(d)}
													disabled={isExpired}
													className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-300 shadow-sm ${
														d.is_active
															? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
															: "bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/40 text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 hover:bg-swapp-azul-petroleo/10 dark:hover:bg-swapp-azul-petroleo/40"
													} disabled:cursor-not-allowed`}>
													<Power className="h-4 w-4" />
												</button>
											</SwappTooltip>
										</td>

										{/* ACCIONES */}
										<td className="px-6 py-4 text-right">
											<SwappTooltip text="Editar Oferta">
												<button
													onClick={() => openModal(d)}
													className="p-2 rounded-lg text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors">
													<Edit className="h-4 w-4" />
												</button>
											</SwappTooltip>
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

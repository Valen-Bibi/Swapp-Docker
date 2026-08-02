"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tag, Plus, Edit, Power } from "lucide-react";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import { SwappToggle } from "@/components/ui/SwappToggle"; // Importamos tu nuevo componente
import { toast } from "sonner";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import NewDiscountModal, {
	ProductDiscount,
} from "@/components/products/NewDiscountModal";

export default function OffersPage() {
	const [discounts, setDiscounts] = useState<ProductDiscount[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	// Estado para controlar el switch del historial
	const [showHistory, setShowHistory] = useState(false);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingDiscount, setEditingDiscount] =
		useState<ProductDiscount | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			// Preparamos el array de promesas. Por defecto pedimos activas y catálogo.
			const endpoints = [
				api.get("/api/products/admin/discounts"),
				api.get("/api/products/admin"),
			];

			// Si el switch está encendido, sumamos el endpoint del historial a la cola
			if (showHistory) {
				endpoints.push(api.get("/api/products/admin/discounts/history"));
			}

			const responses = await Promise.all(endpoints);
			const activeDiscountsRes = responses[0];
			const productsRes = responses[1];
			const historyDiscountsRes = showHistory ? responses[2] : { data: [] };

			// Combinamos los resultados
			const combinedDiscounts = [
				...activeDiscountsRes.data,
				...historyDiscountsRes.data,
			];

			// ORDENAMIENTO: Activas primero, y luego por fecha más nueva
			const sortedDiscounts = combinedDiscounts.sort(
				(a: ProductDiscount, b: ProductDiscount) => {
					if (a.is_active && !b.is_active) return -1;
					if (!a.is_active && b.is_active) return 1;
					return (
						new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
					);
				},
			);

			setDiscounts(sortedDiscounts);
			setProducts(productsRes.data);
		} catch (error) {
			console.error("Error obteniendo datos:", error);
			toast.error("Error al cargar las ofertas.");
		} finally {
			setLoading(false);
		}
	};

	// Agregamos showHistory como dependencia. Cada vez que toques el toggle, se vuelve a ejecutar fetchData.
	useEffect(() => {
		fetchData();
	}, [showHistory]);

	const handleToggleActive = async (discount: ProductDiscount) => {
		const newStatus = !discount.is_active;

		if (newStatus) {
			const newStart = new Date(discount.start_date);
			const newEnd = new Date(discount.end_date);

			const overlapping = discounts.find(
				(d) =>
					d.discount_id !== discount.discount_id &&
					d.product_id === discount.product_id &&
					d.is_active &&
					newStart < new Date(d.end_date) &&
					newEnd > new Date(d.start_date),
			);

			if (overlapping) {
				const startStr = new Date(overlapping.start_date).toLocaleDateString();
				const endStr = new Date(overlapping.end_date).toLocaleDateString();

				toast.error(
					`Conflicto: Choca con "${overlapping.name}" (Activa del ${startStr} al ${endStr}). Desactívala o edita las fechas primero.`,
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
					description="Administración de descuentos temporales (ABM)"
					icon={Tag}
				/>
				<div className="flex gap-4 items-center">
					{/* Agregamos el componente SwappToggle aquí */}
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
							<th className="px-6 py-4 font-semibold">Producto</th>
							<th className="px-6 py-4 font-semibold">Campaña / Nombre</th>
							<th className="px-6 py-4 font-semibold">Descuento</th>
							<th className="px-6 py-4 font-semibold">Validez</th>
							<th className="px-6 py-4 font-semibold text-center">
								Estado (Activa)
							</th>
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
							filteredDiscounts.map((d) => (
								<tr
									key={d.discount_id}
									className={`transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30 ${new Date(d.end_date) < new Date() ? "opacity-60" : ""}`}>
									<td className="px-6 py-4 font-medium">
										{d.product_name || `ID: ${d.product_id}`}
									</td>
									<td className="px-6 py-4">{d.name}</td>
									<td className="px-6 py-4 font-bold text-swapp-turquesa-oscuro dark:text-swapp-menta">
										{d.discount_type === "percentage"
											? `${d.value}%`
											: formatCurrency(d.value)}
									</td>
									<td className="px-6 py-4 text-xs">
										<div className="flex flex-col gap-1">
											<span>
												Desde: {new Date(d.start_date).toLocaleDateString()}
											</span>
											<span>
												Hasta: {new Date(d.end_date).toLocaleDateString()}
											</span>
										</div>
									</td>
									<td className="px-6 py-4 text-center">
										<button
											onClick={() => handleToggleActive(d)}
											title={d.is_active ? "Desactivar" : "Activar"}
											disabled={new Date(d.end_date) < new Date()} // Evita activar ofertas vencidas
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
							))
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

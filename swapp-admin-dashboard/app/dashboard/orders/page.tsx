"use client";

import React, { useEffect, useState } from "react";
import { OrderService } from "@/services/order.service";
import { ProductService } from "@/services/product.service";
import {
	ListOrdered,
	ChevronDown,
	ChevronRight,
	MapPin,
	Phone,
	Clock,
	CheckCircle2,
	XCircle,
	Recycle,
	Calendar,
	MessageCircle,
	FileText,
	Edit,
} from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { formatCurrency } from "@/lib/utils";
import ConfirmOrderModal from "@/components/orders/ConfirmOrderModal";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { SwappToggle } from "@/components/ui/SwappToggle";
import EditOrderModal from "@/components/orders/EditOrderModal";
import { Order } from "@/types/order";
import { Product } from "@/types/product";

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);

	// Filtros y Acordeón
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showTodayOnly, setShowTodayOnly] = useState(false);
	const [expandedRows, setExpandedRows] = useState<string[]>([]);

	// Estados del Modal de Estado
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [selectedOrderUuid, setSelectedOrderUuid] = useState<string | null>(
		null,
	);
	const [actionType, setActionType] = useState<"complete" | "cancel" | null>(
		null,
	);
	const [isUpdating, setIsUpdating] = useState(false);

	const fetchData = async () => {
		try {
			const [ordersData, productsData] = await Promise.all([
				OrderService.getOrders(),
				ProductService.getAll(),
			]);
			setOrders(ordersData);
			setProducts(productsData);
		} catch (error) {
			console.error("Error obteniendo los datos:", error);
			toast.error("No se pudieron cargar los pedidos o el catálogo.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const toggleRow = (uuid: string) => {
		setExpandedRows((prev) =>
			prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
		);
	};

	const handleStatusClick = (
		orderUuid: string,
		type: "complete" | "cancel",
	) => {
		setSelectedOrderUuid(orderUuid);
		setActionType(type);
		setIsConfirmModalOpen(true);
	};

	const confirmStatusUpdate = async () => {
		if (!selectedOrderUuid || !actionType) return;
		setIsUpdating(true);

		const newStatus = actionType === "complete" ? "completed" : "cancelled";
		const toastId = toast.loading(`Actualizando estado...`);

		try {
			await OrderService.updateOrderStatus(selectedOrderUuid, newStatus);
			toast.success(
				newStatus === "completed"
					? "Pedido completado exitosamente."
					: "Pedido cancelado. El stock se ha reintegrado.",
				{ id: toastId },
			);
			fetchData();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar", {
				id: toastId,
			});
		} finally {
			setIsUpdating(false);
			setIsConfirmModalOpen(false);
		}
	};

	const filteredOrders = orders.filter((order) => {
		const matchesSearch =
			order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.customer_phone.includes(searchTerm) ||
			order.order_uuid.includes(searchTerm);

		const matchesStatus =
			statusFilter === "all" || order.status === statusFilter;

		let matchesDate = true;
		if (showTodayOnly) {
			if (!order.scheduled_delivery_date) {
				matchesDate = false;
			} else {
				const today = new Date().toISOString().split("T")[0];
				const orderDate = new Date(order.scheduled_delivery_date)
					.toISOString()
					.split("T")[0];
				matchesDate = today === orderDate;
			}
		}

		return matchesSearch && matchesStatus && matchesDate;
	});

	const {
		sortedData: processedOrders,
		sortKey,
		sortDirection,
		handleSort,
	} = useTableSort(filteredOrders, {
		date: (o) => new Date(o.scheduled_delivery_date || o.created_at).getTime(),
		total: (o) => o.total_amount,
		status: (o) => o.status,
	});

	// --- BADGES ESTANDARIZADOS (GLASSMORPHISM) ---
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-600 dark:text-yellow-500 shadow-sm">
						<Clock className="h-3.5 w-3.5" /> En Proceso
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm">
						<CheckCircle2 className="h-3.5 w-3.5" /> Entregado
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400 shadow-sm">
						<XCircle className="h-3.5 w-3.5" /> Cancelado
					</span>
				);
			default:
				return <span className="text-xs uppercase">{status}</span>;
		}
	};

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Gestión de Pedidos"
					description="Listado general y logística puerta a puerta"
					icon={ListOrdered}
				/>

				<div className="flex flex-wrap items-center gap-4">
					{/* Toggle estandarizado para Entregas de Hoy */}
					<div className="flex items-center gap-3 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors shadow-sm">
						<Calendar
							className={`h-4 w-4 transition-colors ${showTodayOnly ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50"}`}
						/>
						<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso whitespace-nowrap">
							{showTodayOnly ? "Entregas de Hoy" : "Filtrar por Hoy"}
						</span>
						<SwappToggle
							checked={showTodayOnly}
							onChange={setShowTodayOnly}
							id="toggle-today-orders"
						/>
					</div>

					<div className="flex items-center gap-3">
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-sm px-3 py-1.5 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors">
							<option value="all">Todos los estados</option>
							<option value="pending">En Proceso</option>
							<option value="completed">Entregados</option>
							<option value="cancelled">Cancelados</option>
						</select>

						<SearchBar
							searchTerm={searchTerm}
							onSearchChange={setSearchTerm}
							placeholder="Buscar cliente o teléfono..."
						/>
					</div>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA ESTANDARIZADO (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-xl transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-oscuro dark:text-swapp-blanco min-w-[800px]">
					{/* CABECERA ENTERPRISE GRID MÁS OSCURA */}
					<thead className="bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo select-none">
						<tr>
							<SortableHeader
								label="Cliente / Contacto"
								columnKey="customer_name"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Ubicación de Entrega
							</th>
							<SortableHeader
								label="Fechas y Estado"
								columnKey="date"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Total"
								columnKey="total"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-right">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="">
						{processedOrders.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
									No se encontraron pedidos.
								</td>
							</tr>
						) : (
							processedOrders.map((order) => {
								const itemsCount = order.items?.length || 0;
								const isExpanded = expandedRows.includes(order.order_uuid);

								const totalExpectedReturns = order.items?.reduce(
									(acc, item) => acc + (item.expected_return_qty || 0),
									0,
								);
								const cleanPhone = order.customer_phone.replace(/\D/g, "");

								const baseRowClasses =
									"border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";

								// Si el pedido está cancelado, aplicamos estilo tenue
								const rowStatusStyle =
									order.status === "cancelled"
										? "opacity-60 bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-oscuro/80 hover:bg-swapp-azul-petroleo/20 dark:hover:bg-swapp-azul-oscuro/90"
										: `hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30 ${isExpanded ? "bg-swapp-blanco/80 dark:bg-swapp-azul-petroleo/30" : ""}`;

								return (
									<React.Fragment key={order.order_uuid}>
										{/* FILA PRINCIPAL (PEDIDO) */}
										<tr className={`${baseRowClasses} ${rowStatusStyle}`}>
											<td className="px-6 py-4">
												<div className="flex flex-col gap-1.5">
													<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco text-base">
														{order.customer_name}
													</span>
													<div className="flex items-center gap-2 text-xs">
														<span className="font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
															{order.customer_phone}
														</span>
														<SwappTooltip text="WhatsApp Cliente">
															<a
																href={`https://web.whatsapp.com/send?phone=${cleanPhone}&text=Hola%20${order.customer_name},%20te%20escribimos%20de%20Swapp%20por%20tu%20pedido.`}
																target="_blank"
																rel="noopener noreferrer"
																className="text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-1 rounded-md transition-colors shadow-sm">
																<MessageCircle className="h-3.5 w-3.5" />
															</a>
														</SwappTooltip>
													</div>
												</div>
											</td>

											<td className="px-6 py-4">
												<div className="flex flex-col gap-1.5">
													<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
														{order.delivery_zone || "Zona no especificada"}
													</span>
													<div className="flex items-start gap-1.5 text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
														<MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
														<SwappTooltip text="Ver Ubicación en Maps">
															<a
																href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.delivery_address}${order.delivery_zone ? ", " + order.delivery_zone : ""}, Argentina`)}`}
																target="_blank"
																rel="noopener noreferrer"
																className="max-w-[200px] truncate hover:text-swapp-verde-oscuro dark:hover:text-swapp-verde-menta transition-colors cursor-pointer">
																{order.delivery_address}
															</a>
														</SwappTooltip>
													</div>
												</div>
											</td>

											<td className="px-6 py-4">
												<div className="flex flex-col items-start gap-2">
													{getStatusBadge(order.status)}

													<div className="flex flex-col gap-0.5 mt-1">
														<span className="text-[11px] text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 font-medium">
															Creado:{" "}
															{new Date(order.created_at).toLocaleDateString(
																"es-AR",
															)}
														</span>
														{order.scheduled_delivery_date ? (
															<span className="text-xs font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
																Entrega:{" "}
																{new Date(
																	order.scheduled_delivery_date,
																).toLocaleString("es-AR", {
																	day: "2-digit",
																	month: "short",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</span>
														) : (
															<span className="text-swapp-azul-petroleo/60 italic text-xs">
																Sin fecha de entrega
															</span>
														)}
													</div>
												</div>
											</td>

											<td className="px-6 py-4">
												<div className="flex flex-col gap-2">
													<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta text-lg">
														{formatCurrency(order.total_amount)}
													</span>
													{totalExpectedReturns > 0 &&
														order.status === "pending" && (
															<span className="inline-flex items-center gap-1 text-[10px] font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 px-2 py-0.5 rounded-md border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 shadow-sm w-fit">
																<Recycle className="h-3 w-3" /> Traer:{" "}
																{totalExpectedReturns} un.
															</span>
														)}
												</div>
											</td>

											<td className="px-6 py-4">
												<div className="flex items-center justify-end gap-2">
													{/* Botón Acordeón */}
													<button
														onClick={() => toggleRow(order.order_uuid)}
														className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-verde-oscuro dark:text-swapp-verde-menta font-sans font-bold text-xs shadow-sm">
														<ListOrdered className="h-3.5 w-3.5" />
														{isExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</button>

													{order.status === "pending" && (
														<>
															<div className="w-px h-5 bg-swapp-azul-petroleo/20 dark:bg-swapp-azul-petroleo mx-1" />
															<SwappTooltip text="Pedido Completado">
																<button
																	onClick={() =>
																		handleStatusClick(
																			order.order_uuid,
																			"complete",
																		)
																	}
																	className="p-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-sm">
																	<CheckCircle2 className="h-4 w-4" />
																</button>
															</SwappTooltip>
															<SwappTooltip text="Cancelar Pedido">
																<button
																	onClick={() =>
																		handleStatusClick(
																			order.order_uuid,
																			"cancel",
																		)
																	}
																	className="p-1.5 rounded-md border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors shadow-sm">
																	<XCircle className="h-4 w-4" />
																</button>
															</SwappTooltip>
															<SwappTooltip text="Editar Logística">
																<button
																	onClick={() => {
																		setEditingOrder(order);
																		setIsEditModalOpen(true);
																	}}
																	className="p-2 rounded-lg text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors">
																	<Edit className="h-4 w-4" />
																</button>
															</SwappTooltip>
														</>
													)}
												</div>
											</td>
										</tr>

										{/* ACORDEÓN DESPLEGABLE ANIMADO CON CSS GRID Y FONDO AL 2% */}
										{itemsCount > 0 && (
											<tr
												className={`bg-swapp-azul-petroleo/2 dark:bg-swapp-azul-petroleo/10 transition-colors duration-300 ${isExpanded ? "border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50" : "border-b-0"}`}>
												<td colSpan={5} className="p-0">
													<div
														className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
														<div className="overflow-hidden">
															<div className="px-6 py-4 flex flex-col gap-4">
																{/* Notas del Repartidor */}
																{order.logistics_notes && (
																	<div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 dark:bg-yellow-500/5 border border-yellow-500/20 shadow-sm backdrop-blur-sm">
																		<FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
																		<div>
																			<p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide">
																				Notas para el Repartidor
																			</p>
																			<p className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso mt-0.5">
																				{order.logistics_notes}
																			</p>
																		</div>
																	</div>
																)}

																{/* Tabla de Productos Anidada */}
																<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-sm">
																	<table className="w-full text-xs text-left">
																		<thead className="bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50">
																			<tr>
																				<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-2/5">
																					Producto y SKU
																				</th>
																				<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5 text-center">
																					Cantidad
																				</th>
																				<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5">
																					Logística Inversa
																				</th>
																				<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-right w-1/5">
																					Subtotal
																				</th>
																			</tr>
																		</thead>
																		<tbody className="">
																			{order.items.map((item, idx) => {
																				const productInfo = products.find(
																					(p) =>
																						p.product_id === item.product_id,
																				);
																				const variantInfo =
																					productInfo?.variants?.find(
																						(v) =>
																							v.variant_id === item.variant_id,
																					);

																				const baseVariantRowClasses =
																					"border-b border-swapp-azul-petroleo/5 dark:border-swapp-azul-petroleo/20 last:border-0 transition-all duration-200";
																				const variantRowStatusStyle =
																					order.status === "cancelled"
																						? ""
																						: "hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20";

																				return (
																					<tr
																						key={idx}
																						className={`${baseVariantRowClasses} ${variantRowStatusStyle}`}>
																						<td className="px-4 py-3">
																							<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco block">
																								{productInfo?.name ||
																									`Producto ID: ${item.product_id}`}
																							</span>
																							{item.variant_id && (
																								<span className="font-mono font-medium text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5 block">
																									SKU:{" "}
																									{variantInfo?.sku ||
																										`Var ID: ${item.variant_id}`}
																								</span>
																							)}
																						</td>
																						<td className="px-4 py-3 text-center font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
																							{item.quantity} x{" "}
																							{formatCurrency(item.unit_price)}
																						</td>
																						<td className="px-4 py-3">
																							{item.requires_return ? (
																								<div className="inline-flex items-center gap-1 text-[10px] text-swapp-verde-oscuro dark:text-swapp-verde-menta font-bold bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 px-2 py-1 rounded-md border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 shadow-sm">
																									<Recycle className="h-3 w-3" />
																									Recuperar:{" "}
																									{item.expected_return_qty} un.
																								</div>
																							) : (
																								<span className="text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 italic">
																									No aplica
																								</span>
																							)}
																						</td>
																						<td className="px-4 py-3 text-right font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
																							{formatCurrency(item.subtotal)}
																						</td>
																					</tr>
																				);
																			})}
																		</tbody>
																	</table>
																</div>
															</div>
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								);
							})
						)}
					</tbody>
				</table>
				<EditOrderModal
					isOpen={isEditModalOpen}
					onClose={() => {
						setIsEditModalOpen(false);
						setEditingOrder(null);
					}}
					order={editingOrder}
					onSuccess={fetchData}
				/>
			</div>

			<ConfirmOrderModal
				isOpen={isConfirmModalOpen}
				onClose={() => setIsConfirmModalOpen(false)}
				onConfirm={confirmStatusUpdate}
				actionType={actionType}
				isLoading={isUpdating}
			/>
		</div>
	);
}

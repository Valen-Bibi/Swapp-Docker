"use client";

import React, { useEffect, useState } from "react";
import { OrderService } from "@/services/order.service";
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
import EditOrderModal from "@/components/orders/EditOrderModal";
import { OrderItem, Order } from "@/types/order";

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);

	// Filtros y Acordeón
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showTodayOnly, setShowTodayOnly] = useState(false);
	const [expandedRows, setExpandedRows] = useState<string[]>([]);

	// Estados del Modal
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [selectedOrderUuid, setSelectedOrderUuid] = useState<string | null>(
		null,
	);
	const [actionType, setActionType] = useState<"complete" | "cancel" | null>(
		null,
	);
	const [isUpdating, setIsUpdating] = useState(false);

	const fetchOrders = async () => {
		try {
			const data = await OrderService.getOrders();
			setOrders(data);
		} catch (error) {
			console.error("Error obteniendo los pedidos:", error);
			toast.error("No se pudieron cargar los pedidos.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const toggleRow = (uuid: string) => {
		setExpandedRows((prev) =>
			prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
		);
	};

	// --- MANEJO DEL MODAL DE ESTADO ---
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
			fetchOrders();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar", {
				id: toastId,
			});
		} finally {
			setIsUpdating(false);
			setIsConfirmModalOpen(false);
		}
	};

	// --- FILTROS ---
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
				// Compara fechas ignorando la hora
				const today = new Date().toISOString().split("T")[0];
				const orderDate = new Date(order.scheduled_delivery_date)
					.toISOString()
					.split("T")[0];
				matchesDate = today === orderDate;
			}
		}

		return matchesSearch && matchesStatus && matchesDate;
	});

	// --- ORDENAMIENTO ---
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

	// --- AYUDANTES VISUALES ---
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-800 dark:text-yellow-500">
						<Clock className="h-3.5 w-3.5" /> En Proceso
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 px-2.5 py-1 text-xs font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
						<CheckCircle2 className="h-3.5 w-3.5" /> Entregado
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
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
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<PageHeader
					title="Gestión de Pedidos"
					description="Listado general y logística puerta a puerta"
					icon={ListOrdered}
				/>

				<div className="flex flex-col sm:flex-row items-center gap-3">
					{/* Botón: Entregas de Hoy */}
					<button
						onClick={() => setShowTodayOnly(!showTodayOnly)}
						className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
							showTodayOnly
								? "bg-swapp-verde-oscuro/10 border-swapp-verde-oscuro/30 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:border-swapp-verde-menta/30 dark:text-swapp-verde-menta"
								: "bg-swapp-blanco dark:bg-swapp-azul-oscuro border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo"
						}`}>
						<Calendar
							className={`h-4 w-4 ${showTodayOnly ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : ""}`}
						/>
						{showTodayOnly
							? "Viendo Entregas de Hoy"
							: "Filtrar Entregas de Hoy"}
					</button>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-4 py-2 text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso outline-none focus:ring-1 focus:ring-swapp-verde-oscuro transition-colors">
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

			<div className="overflow-hidden rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro shadow-sm transition-colors overflow-x-auto">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso min-w-[800px]">
					<thead className="bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/30 text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso select-none">
						<tr>
							<SortableHeader
								label="Cliente / Contacto"
								columnKey="customer_name"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 font-semibold">Ubicación de Entrega</th>
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
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza-verdoso dark:divide-swapp-azul-petroleo">
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

								// Cálculo Global de Logística Inversa
								const totalExpectedReturns = order.items?.reduce(
									(acc, item) => acc + (item.expected_return_qty || 0),
									0,
								);
								const cleanPhone = order.customer_phone.replace(/\D/g, ""); // Limpia para API de WhatsApp

								return (
									<React.Fragment key={order.order_uuid}>
										{/* FILA PRINCIPAL (PEDIDO) */}
										<tr
											className={`transition-colors hover:bg-swapp-tiza-verdoso/30 dark:hover:bg-swapp-azul-petroleo/30 ${isExpanded ? "bg-swapp-tiza-verdoso/10 dark:bg-swapp-azul-petroleo/10" : ""}`}>
											<td className="px-6 py-4">
												<div className="flex flex-col gap-1.5">
													<span className="font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco text-base">
														{order.customer_name}
													</span>
													<div className="flex items-center gap-2 text-xs">
														<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
															{order.customer_phone}
														</span>
														{/* ACTUALIZADO: Forzamos la apertura directa de WhatsApp Web */}
														<SwappTooltip text="WhatsApp Cliente">
															<a
																href={`https://web.whatsapp.com/send?phone=${cleanPhone}&text=Hola%20${order.customer_name},%20te%20escribimos%20de%20Swapp%20por%20tu%20pedido.`}
																target="_blank"
																rel="noopener noreferrer"
																className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 p-1 rounded-md transition-colors">
																<MessageCircle className="h-3.5 w-3.5" />
															</a>
														</SwappTooltip>
													</div>
												</div>
											</td>

											<td className="px-6 py-4">
												<div className="flex flex-col gap-1.5">
													<span className="font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
														{order.delivery_zone || "Zona no especificada"}
													</span>
													<div className="flex items-start gap-1.5 text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
														<MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />

														{/* ACTUALIZADO: Link directo a búsqueda en Google Maps */}
														<SwappTooltip text="Ver Ubicacion en Maps">
															<a
																href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.delivery_address}${order.delivery_zone ? ", " + order.delivery_zone : ""}, Argentina`)}`}
																target="_blank"
																rel="noopener noreferrer"
																className="max-w-[200px] truncate hover:text-swapp-verde-oscuro dark:hover:text-swapp-verde-menta hover:underline transition-all cursor-pointer">
																{order.delivery_address}
															</a>
														</SwappTooltip>
													</div>
												</div>
											</td>

											<td className="px-6 py-4">
												<div className="flex flex-col items-start gap-2">
													{getStatusBadge(order.status)}

													<div className="flex flex-col gap-0.5">
														<span className="text-[11px] text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 font-medium">
															Creado:{" "}
															{new Date(order.created_at).toLocaleDateString(
																"es-AR",
															)}
														</span>
														{order.scheduled_delivery_date ? (
															<span className="text-xs font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
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
															<span className="text-swapp-azul-petroleo/60">
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
													{/* Indicador Global de Logística Inversa */}
													{totalExpectedReturns > 0 &&
														order.status === "pending" && (
															<span className="inline-flex items-center gap-1 text-[10px] font-medium text-swapp-verde-pastel dark:text-swapp-verde-menta bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 px-2 py-0.5 rounded-full border border-swapp-verde-pastel/20 w-fit">
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
														className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-verde-oscuro dark:text-swapp-verde-menta font-sans font-medium text-xs">
														<ListOrdered className="h-3.5 w-3.5" />
														{isExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</button>

													{order.status === "pending" && (
														<>
															<div className="w-px h-5 bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo mx-1" />
															<SwappTooltip text="Pedido Completado">
																<button
																	onClick={() =>
																		handleStatusClick(
																			order.order_uuid,
																			"complete",
																		)
																	}
																	className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-azul-oceano dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-pastel hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																	<CheckCircle2 className="h-4 w-4" />
																</button>
															</SwappTooltip>
															<SwappTooltip text="Cancelar Pedido">
																{/* Botón Cancelar */}
																<button
																	onClick={() =>
																		handleStatusClick(
																			order.order_uuid,
																			"cancel",
																		)
																	}
																	className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10 transition-colors">
																	<XCircle className="h-4 w-4" />
																</button>
															</SwappTooltip>
															<SwappTooltip text="Editar Logística">
																<button
																	onClick={() => {
																		setEditingOrder(order);
																		setIsEditModalOpen(true);
																	}}
																	className="p-1.5 rounded-md text-swapp-azul-petroleo/50 hover:text-swapp-azul-oceano dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-pastel hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
																	<Edit className="h-4 w-4" />
																</button>
															</SwappTooltip>
														</>
													)}
												</div>
											</td>
										</tr>

										{/* ACORDEÓN DESPLEGABLE */}
										{isExpanded && (
											<tr className="bg-swapp-tiza-verdoso/10 dark:bg-swapp-azul-oscuro border-b border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo">
												<td colSpan={5} className="px-6 py-4">
													<div className="flex flex-col gap-4">
														{/* Notas del Repartidor */}
														{order.logistics_notes && (
															<div className="flex items-start gap-2 p-3 rounded-lg bg-swapp-blanco dark:bg-swapp-azul-petroleo/30 border border-yellow-200 dark:border-yellow-900/30">
																<FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
																<div>
																	<p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wide">
																		Notas para el Repartidor
																	</p>
																	<p className="text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mt-0.5">
																		{order.logistics_notes}
																	</p>
																</div>
															</div>
														)}

														{/* Tabla de Productos */}
														<div className="rounded-lg border border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco dark:bg-swapp-azul-oscuro/50">
															<table className="w-full text-xs text-left">
																<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
																	<tr>
																		<th className="px-4 py-3 font-medium w-2/5">
																			ID y Variante
																		</th>
																		<th className="px-4 py-3 font-medium w-1/5 text-center">
																			Cantidad
																		</th>
																		<th className="px-4 py-3 font-medium w-1/5">
																			Logística Inversa
																		</th>
																		<th className="px-4 py-3 font-medium text-right w-1/5">
																			Subtotal
																		</th>
																	</tr>
																</thead>
																<tbody className="divide-y divide-swapp-tiza-verdoso/30 dark:divide-swapp-azul-petroleo/30">
																	{order.items.map((item, idx) => (
																		<tr
																			key={idx}
																			className="hover:bg-swapp-tiza-verdoso/20 dark:hover:bg-swapp-azul-petroleo/20 transition-colors">
																			<td className="px-4 py-3">
																				<span className="font-medium text-swapp-azul-oscuro dark:text-swapp-blanco block">
																					ID Prod: {item.product_id}
																				</span>
																				{item.variant_id && (
																					<span className="font-mono text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5 block">
																						Variante ID: {item.variant_id}
																					</span>
																				)}
																			</td>
																			<td className="px-4 py-3 text-center font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
																				{item.quantity} x{" "}
																				{formatCurrency(item.unit_price)}
																			</td>
																			<td className="px-4 py-3">
																				{item.requires_return ? (
																					<div className="inline-flex items-center gap-1 text-[10px] text-swapp-verde-pastel dark:text-swapp-verde-menta font-medium bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 px-2 py-1 rounded-full border border-swapp-verde-pastel/20 dark:border-swapp-verde-menta/20">
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
																			<td className="px-4 py-3 text-right font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
																				{formatCurrency(item.subtotal)}
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
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
					onSuccess={fetchOrders}
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

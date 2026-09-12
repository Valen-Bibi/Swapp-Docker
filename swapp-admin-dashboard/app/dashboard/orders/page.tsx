"use client";

import React, { useEffect, useState } from "react";
import { OrderService } from "@/services/order.service";
import { ProductService } from "@/services/product.service";
import {
	ListOrdered,
	ChevronDown,
	ChevronRight,
	MapPin,
	Clock,
	CheckCircle2,
	XCircle,
	Recycle,
	Calendar,
	MessageCircle,
	FileText,
	Edit,
	DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { formatCurrency } from "@/lib/utils";
import ConfirmOrderModal from "@/components/orders/ConfirmOrderModal";
import EditOrderModal from "@/components/orders/EditOrderModal";
import PaymentModal from "@/components/orders/PaymentModal";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { Order } from "@/types/order";
import { Product } from "@/types/product";

// --- NUEVOS COMPONENTES ESTANDARIZADOS ---
import GlassTableWrapper from "@/components/tables/GlassTableWrapper";
import GlassTableHead, { GlassTh } from "@/components/tables/GlassTableHead";
import TableActionIcon from "@/components/tables/TableActionIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import GlassFilterToggle from "@/components/ui/GlassFilterToggle";
import AnimatedTableRow from "@/components/tables/AnimatedTableRow";

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// Estados de Modales
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);

	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

	// Filtros y Acordeón
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showTodayOnly, setShowTodayOnly] = useState(false);
	const [expandedRows, setExpandedRows] = useState<string[]>([]);

	// Estados del Modal de Estado
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [selectedOrderUuid, setSelectedOrderUuid] = useState<string | null>(null);
	const [actionType, setActionType] = useState<"complete" | "cancel" | null>(null);
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

	const handleStatusClick = (orderUuid: string, type: "complete" | "cancel") => {
		setSelectedOrderUuid(orderUuid);
		setActionType(type);
		setIsConfirmModalOpen(true);
	};

	const confirmStatusUpdate = async (actualReturns?: Record<number, number>) => {
		if (!selectedOrderUuid || !actionType) return;
		setIsUpdating(true);

		const newStatus = actionType === "complete" ? "completed" : "cancelled";
		const toastId = toast.loading(`Actualizando estado y procesando...`);

		try {
			await OrderService.updateOrderStatus(selectedOrderUuid, newStatus, actualReturns);
			toast.success(
				newStatus === "completed"
					? "Pedido completado y retornos registrados exitosamente."
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

	// Filtros
	const filteredOrders = orders.filter((order) => {
		const clientFullName = `${order.client?.first_name || ""} ${order.client?.last_name || ""}`.toLowerCase();
		const clientPhone = order.client?.whatsapp_number || "";

		const matchesSearch =
			clientFullName.includes(searchTerm.toLowerCase()) ||
			clientPhone.includes(searchTerm) ||
			order.order_uuid.includes(searchTerm);

		const matchesStatus = statusFilter === "all" || order.status === statusFilter;

		let matchesDate = true;
		if (showTodayOnly) {
			if (!order.scheduled_delivery_date) {
				matchesDate = false;
			} else {
				const today = new Date().toISOString().split("T")[0];
				const orderDate = new Date(order.scheduled_delivery_date).toISOString().split("T")[0];
				matchesDate = today === orderDate;
			}
		}

		return matchesSearch && matchesStatus && matchesDate;
	});

	// Ordenamiento
	const { sortedData: processedOrders, sortKey, sortDirection, handleSort } = useTableSort(filteredOrders, {
		client: (o) => `${o.client?.first_name} ${o.client?.last_name}`,
		date: (o) => new Date(o.scheduled_delivery_date || o.created_at).getTime(),
		total: (o) => o.total_amount,
		status: (o) => o.status,
	});

	// Badge estandarizado
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return <StatusBadge variant="warning" icon={Clock}>En Proceso</StatusBadge>;
			case "completed":
				return <StatusBadge variant="success" icon={CheckCircle2}>Entregado</StatusBadge>;
			case "cancelled":
				return <StatusBadge variant="danger" icon={XCircle}>Cancelado</StatusBadge>;
			default:
				return <StatusBadge variant="neutral" className="uppercase">{status}</StatusBadge>;
		}
	};

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Gestión de Pedidos"
					description="Listado general y logística puerta a puerta"
					icon={ListOrdered}
				/>

				<div className="flex flex-wrap items-center gap-4">
					{/* TOGGLE ESTANDARIZADO */}
					<GlassFilterToggle
						id="toggle-today-orders"
						icon={Calendar}
						labelOn="Entregas de Hoy"
						labelOff="Filtrar por Hoy"
						checked={showTodayOnly}
						onChange={setShowTodayOnly}
					/>

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

			{/* TABLA ESTANDARIZADA */}
			<GlassTableWrapper>
				<GlassTableHead>
					<SortableHeader label="Cliente / Contacto" columnKey="client" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
					<GlassTh>Ubicación de Entrega</GlassTh>
					<SortableHeader label="Fechas y Estado" columnKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
					<SortableHeader label="Total" columnKey="total" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
					<GlassTh align="right">Acciones</GlassTh>
				</GlassTableHead>
				
				<tbody>
					{processedOrders.length === 0 ? (
						<tr>
							<td colSpan={5} className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
								No se encontraron pedidos.
							</td>
						</tr>
					) : (
						processedOrders.map((order) => {
							const itemsCount = order.items?.length || 0;
							const isExpanded = expandedRows.includes(order.order_uuid);
							const totalExpectedReturns = order.items?.reduce((acc, item) => acc + (item.expected_return_qty || 0), 0);

							const clientFullName = `${order.client?.first_name || ""} ${order.client?.last_name || ""}`.trim() || "Cliente Desconocido";
							const cleanPhone = (order.client?.whatsapp_number || "").replace(/\D/g, "");

							const activePayments = order.payments?.filter((p: any) => p.payment_status === "completed") || [];
							const totalPaid = activePayments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
							const remainingDebt = Number(order.total_amount) - totalPaid;
							const isFullyPaid = remainingDebt <= 0;

							const baseRowClasses = "border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";
							const rowStatusStyle = order.status === "cancelled"
								? "opacity-60 bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-oscuro/80 hover:bg-swapp-azul-petroleo/20 dark:hover:bg-swapp-azul-oscuro/90"
								: `hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30 ${isExpanded ? "bg-swapp-blanco/80 dark:bg-swapp-azul-petroleo/30" : ""}`;

							return (
								<React.Fragment key={order.order_uuid}>
									<tr className={`${baseRowClasses} ${rowStatusStyle}`}>
										<td className="px-6 py-4">
											<div className="flex flex-col gap-1.5">
												<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco text-base">{clientFullName}</span>
												<div className="flex items-center gap-2 text-xs">
													<span className="font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">{order.client?.whatsapp_number || "Sin teléfono"}</span>
													{cleanPhone && (
														<SwappTooltip text="WhatsApp Cliente">
															<a
																href={`https://web.whatsapp.com/send?phone=${cleanPhone}&text=Hola%20${order.client?.first_name || ""},%20te%20escribimos%20de%20Swapp%20por%20tu%20pedido.`}
																target="_blank"
																rel="noopener noreferrer"
																className="text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-1 rounded-md transition-colors shadow-sm">
																<MessageCircle className="h-3.5 w-3.5" />
															</a>
														</SwappTooltip>
													)}
												</div>
											</div>
										</td>

										<td className="px-6 py-4">
											<div className="flex flex-col gap-1.5">
												<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">{order.delivery_zone || "Zona no especificada"}</span>
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
														Creado: {new Date(order.created_at).toLocaleDateString("es-AR")}
													</span>
													{order.scheduled_delivery_date ? (
														<span className="text-xs font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
															Entrega: {new Date(order.scheduled_delivery_date).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
														</span>
													) : (
														<span className="text-swapp-azul-petroleo/60 italic text-xs">Sin fecha de entrega</span>
													)}
												</div>
											</div>
										</td>

										<td className="px-6 py-4">
											<div className="flex flex-col gap-2">
												<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta text-lg">
													{formatCurrency(order.total_amount)}
												</span>
												
												<div className="flex flex-wrap gap-1.5 mt-0.5">
													{/* Indicador de Pago Estandarizado */}
													{order.status !== 'cancelled' && (
														<StatusBadge variant={isFullyPaid ? "success" : "danger"} icon={DollarSign} className="!text-[10px]">
															{isFullyPaid ? "Pagado" : `Debe ${formatCurrency(remainingDebt)}`}
														</StatusBadge>
													)}

													{/* Indicador de Retornos Estandarizado */}
													{totalExpectedReturns > 0 && order.status === "pending" && (
														<StatusBadge variant="primary" icon={Recycle} className="!text-[10px]">
															Traer: {totalExpectedReturns} un.
														</StatusBadge>
													)}
												</div>
											</div>
										</td>

										<td className="px-6 py-4">
											<div className="flex items-center justify-end gap-2">
												<button
													onClick={() => toggleRow(order.order_uuid)}
													className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors text-swapp-verde-oscuro dark:text-swapp-verde-menta font-sans font-bold text-xs shadow-sm">
													<ListOrdered className="h-3.5 w-3.5" />
													{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
												</button>

												<div className="w-px h-5 bg-swapp-azul-petroleo/20 dark:bg-swapp-azul-petroleo mx-1" />

												{order.status !== "cancelled" && (
													<TableActionIcon
														icon={DollarSign}
														tooltip="Tesorería y Pagos"
														variant={isFullyPaid ? "glass-success" : "glass-warning"}
														onClick={() => {
															setPaymentOrder(order);
															setIsPaymentModalOpen(true);
														}}
													/>
												)}

												{order.status === "pending" && (
													<>
														<TableActionIcon
															icon={CheckCircle2}
															tooltip="Pedido Completado"
															variant="glass-success"
															onClick={() => handleStatusClick(order.order_uuid, "complete")}
														/>
														<TableActionIcon
															icon={XCircle}
															tooltip="Cancelar Pedido"
															variant="glass-danger"
															onClick={() => handleStatusClick(order.order_uuid, "cancel")}
														/>
														<TableActionIcon
															icon={Edit}
															tooltip="Editar Logística"
															onClick={() => {
																setEditingOrder(order);
																setIsEditModalOpen(true);
															}}
														/>
													</>
												)}
											</div>
										</td>
									</tr>

									{/* ACORDEÓN MODULARIZADO */}
									{itemsCount > 0 && (
										<AnimatedTableRow isExpanded={isExpanded} colSpan={5}>
											<div className="flex flex-col gap-4">
												{order.logistics_notes && (
													<div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 dark:bg-yellow-500/5 border border-yellow-500/20 shadow-sm backdrop-blur-sm">
														<FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
														<div>
															<p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide">Notas para el Repartidor</p>
															<p className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso mt-0.5">{order.logistics_notes}</p>
														</div>
													</div>
												)}

												<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-sm">
													<table className="w-full text-xs text-left">
														<thead className="bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50">
															<tr>
																<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-2/5">Producto y SKU</th>
																<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5 text-center">Cantidad</th>
																<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 w-1/5">Logística Inversa</th>
																<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-right w-1/5">Subtotal</th>
															</tr>
														</thead>
														<tbody className="">
															{order.items.map((item, idx) => {
																const productInfo = products.find((p) => p.product_id === item.product_id);
																const variantInfo = productInfo?.variants?.find((v) => v.variant_id === item.variant_id);

																return (
																	<tr key={idx} className="border-b border-swapp-azul-petroleo/5 dark:border-swapp-azul-petroleo/20 last:border-0 hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20">
																		<td className="px-4 py-3">
																			<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco block">{productInfo?.name || `Producto ID: ${item.product_id}`}</span>
																			{item.variant_id && (
																				<span className="font-mono font-medium text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5 block">SKU: {variantInfo?.sku || `Var ID: ${item.variant_id}`}</span>
																			)}
																		</td>
																		<td className="px-4 py-3 text-center font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
																			{item.quantity} x {formatCurrency(item.unit_price)}
																		</td>
																		<td className="px-4 py-3">
																			{item.requires_return ? (
																				<StatusBadge variant="primary" icon={Recycle} className="!text-[10px]">
																					Recuperar: {item.expected_return_qty} un.
																				</StatusBadge>
																			) : (
																				<span className="text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 italic">No aplica</span>
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
										</AnimatedTableRow>
									)}
								</React.Fragment>
							);
						})
					)}
				</tbody>
			</GlassTableWrapper>

			{/* MODALES AHORA ESTÁN CORRECTAMENTE FUERA DEL WRAPPER BLURREADO */}
			<EditOrderModal
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setEditingOrder(null);
				}}
				order={editingOrder}
				onSuccess={fetchData}
			/>

			<PaymentModal
				isOpen={isPaymentModalOpen}
				onClose={() => {
					setIsPaymentModalOpen(false);
					setPaymentOrder(null);
				}}
				order={paymentOrder}
				onSuccess={fetchData}
			/>

			<ConfirmOrderModal
				isOpen={isConfirmModalOpen}
				onClose={() => setIsConfirmModalOpen(false)}
				onConfirm={confirmStatusUpdate}
				actionType={actionType}
				isLoading={isUpdating}
				order={orders.find(o => o.order_uuid === selectedOrderUuid)}
				products={products}
			/>
		</div>
	);
}
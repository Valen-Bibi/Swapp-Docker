"use client";

import React, { useEffect, useState } from "react";
import {
	Users,
	UserPlus,
	Phone,
	MapPin,
	Edit,
	Power,
	IdCard,
	Mail,
} from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { ClientService } from "@/services/client.service";
import ClientModal from "@/components/clients/modals/ClientModal";

export default function ClientsPage() {
	const [clients, setClients] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingClient, setEditingClient] = useState<any | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("active");

	const fetchClients = async () => {
		setLoading(true);
		try {
			const isActive =
				statusFilter === "all" ? undefined : statusFilter === "active";
			const data = await ClientService.getAll(searchTerm, isActive);
			setClients(data);
		} catch (error) {
			console.error("Error obteniendo clientes:", error);
			toast.error("No se pudieron cargar los clientes.");
		} finally {
			setLoading(false);
		}
	};

	// Debounce simple para la búsqueda
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchClients();
		}, 300);
		return () => clearTimeout(timeoutId);
	}, [searchTerm, statusFilter]);

	const openModal = (client?: any) => {
		setEditingClient(client || null);
		setIsModalOpen(true);
	};

	const handleToggleStatus = async (uuid: string) => {
		const toastId = toast.loading("Actualizando estado...");
		try {
			await ClientService.toggleStatus(uuid);
			toast.success("Estado del cliente actualizado", { id: toastId });
			fetchClients();
		} catch (error) {
			toast.error("Error al actualizar estado", { id: toastId });
		}
	};

	if (loading && clients.length === 0) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Directorio de Clientes"
					description="Gestión del CRM y direcciones predeterminadas"
					icon={Users}
				/>

				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-3">
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-sm px-3 py-2 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors">
							<option value="active">Clientes Activos</option>
							<option value="inactive">Inactivos</option>
							<option value="all">Todos</option>
						</select>

						<SearchBar
							searchTerm={searchTerm}
							onSearchChange={setSearchTerm}
							placeholder="Buscar nombre, DNI o WhatsApp..."
						/>

						<button
							onClick={() => openModal()}
							className="inline-flex items-center gap-2 rounded-xl bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-4 py-2 text-sm font-bold text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-pastel dark:hover:bg-swapp-tiza-verdoso transition-all shadow-sm">
							<UserPlus className="h-4 w-4" /> Nuevo Cliente
						</button>
					</div>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-xl transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-oscuro dark:text-swapp-blanco min-w-[800px]">
					<thead className="bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo select-none">
						<tr>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Cliente
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Contacto
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70">
								Ubicación por Defecto
							</th>
							<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 text-right">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{clients.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 font-medium">
									No se encontraron clientes.
								</td>
							</tr>
						) : (
							clients.map((client) => {
								const cleanPhone = client.whatsapp_number.replace(/\D/g, "");

								return (
									<tr
										key={client.client_uuid}
										className={`border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200 hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30 ${!client.is_active ? "opacity-50 grayscale-[50%]" : ""}`}>
										{/* Nombre y DNI */}
										<td className="px-6 py-4">
											<div className="flex flex-col gap-1">
												<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco text-base">
													{client.first_name} {client.last_name}
												</span>
												<div className="flex items-center gap-1.5 text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
													<IdCard className="h-3.5 w-3.5" />
													{client.dni || "Sin DNI"}
												</div>
											</div>
										</td>

										{/* Contacto */}
										<td className="px-6 py-4">
											<div className="flex flex-col gap-1.5">
												<div className="flex items-center gap-2">
													<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
														{client.whatsapp_number}
													</span>
													<SwappTooltip text="Enviar WhatsApp">
														<a
															href={`https://web.whatsapp.com/send?phone=${cleanPhone}`}
															target="_blank"
															rel="noopener noreferrer"
															className="text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-1 rounded-md transition-colors shadow-sm inline-flex">
															<Phone className="h-3 w-3" />
														</a>
													</SwappTooltip>
												</div>
												{client.email && (
													<div className="flex items-center gap-1.5 text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
														<Mail className="h-3.5 w-3.5" /> {client.email}
													</div>
												)}
											</div>
										</td>

										{/* Ubicación */}
										<td className="px-6 py-4">
											<div className="flex flex-col gap-1.5">
												<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
													{client.default_delivery_zone}
												</span>
												<div className="flex items-start gap-1.5 text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
													<MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
													<SwappTooltip text="Ver en Maps">
														<a
															href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.default_delivery_address}, ${client.default_delivery_zone}, Argentina`)}`}
															target="_blank"
															rel="noopener noreferrer"
															className="max-w-[200px] truncate hover:text-swapp-verde-oscuro dark:hover:text-swapp-verde-menta transition-colors cursor-pointer">
															{client.default_delivery_address}
														</a>
													</SwappTooltip>
												</div>
											</div>
										</td>

										{/* Acciones */}
										<td className="px-6 py-4">
											<div className="flex items-center justify-end gap-2">
												<SwappTooltip
													text={client.is_active ? "Desactivar" : "Activar"}>
													<button
														onClick={() =>
															handleToggleStatus(client.client_uuid)
														}
														className={`p-1.5 rounded-lg border transition-colors shadow-sm ${
															client.is_active
																? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
																: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
														}`}>
														<Power className="h-4 w-4" />
													</button>
												</SwappTooltip>

												<div className="w-px h-5 bg-swapp-azul-petroleo/20 dark:bg-swapp-azul-petroleo mx-1" />

												<SwappTooltip text="Editar Cliente">
													<button
														onClick={() => openModal(client)}
														className="p-2 rounded-lg text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors">
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

			<ClientModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingClient(null);
				}}
				client={editingClient}
				onSuccess={fetchClients}
			/>
		</div>
	);
}

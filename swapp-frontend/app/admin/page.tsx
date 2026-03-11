"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// Iconos
import { CheckCircle, XCircle, Clock } from "lucide-react";

// URL de tu Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

interface Solicitud {
	id: string;
	producto: { nombre: string; sku: string };
	usuario: { email: string };
	confianza: number;
	estado: string;
	foto_url: string;
	fecha_hora: string;
}

export default function AdminPage() {
	const { user, isAuthenticated, token } = useAuth();
	const router = useRouter();
	const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
	const [loading, setLoading] = useState(true);

	// 1. PROTECCIÓN DE RUTA 🛡️
	useEffect(() => {
		// Si no hay usuario o no es admin, redirigir al Home
		if (!loading && (!isAuthenticated || user?.rol !== "admin")) {
			alert("⛔ Acceso restringido a Administradores");
			router.push("/");
		}
	}, [isAuthenticated, user, loading, router]);

	// 2. CARGAR DATOS (Solo si es admin)
	useEffect(() => {
		if (isAuthenticated && user?.rol === "admin") {
			fetchSolicitudes();
		} else {
			setLoading(false); // Terminar carga si no es admin (para que actúe la protección)
		}
	}, [isAuthenticated, user]);

	const fetchSolicitudes = async () => {
		try {
			const res = await fetch(`${API_URL}/historial`, {
				headers: { Authorization: `Bearer ${token}` }, // Enviar token si tu backend lo pide
			});
			if (res.ok) {
				const data = await res.json();
				setSolicitudes(data);
			}
		} catch (error) {
			console.error("Error cargando historial admin", error);
		} finally {
			setLoading(false);
		}
	};

	// 3. CAMBIAR ESTADO (Aprobar/Rechazar)
	const handleUpdateStatus = async (id: string, nuevoEstado: string) => {
		try {
			const res = await fetch(`${API_URL}/actualizar/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					// Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ estado: nuevoEstado }),
			});

			if (res.ok) {
				// Actualizar UI localmente
				setSolicitudes((prev) =>
					prev.map((sol) =>
						sol.id === id ? { ...sol, estado: nuevoEstado } : sol,
					),
				);
			}
		} catch (error) {
			alert("Error al actualizar");
		}
	};

	if (loading)
		return (
			<div className="p-10 text-center text-swapp-mint">
				Verificando permisos...
			</div>
		);
	if (!isAuthenticated || user?.rol !== "admin") return null; // No mostrar nada mientras redirige

	return (
		<div className="p-6 pb-24">
			<h1 className="text-2xl font-bold text-swapp-dark mb-6">
				Panel de Control 🛠️
			</h1>

			<div className="space-y-4">
				{solicitudes.length === 0 ? (
					<p className="text-gray-500 text-center">
						No hay solicitudes pendientes.
					</p>
				) : (
					solicitudes.map((sol) => (
						<div
							key={sol.id}
							className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col gap-3">
							{/* Cabecera: Producto y Estado */}
							<div className="flex justify-between items-start">
								<div>
									<h3 className="font-bold text-lg text-swapp-navy">
										{sol.producto.nombre}
									</h3>
									<p className="text-xs text-gray-400 font-mono">
										{sol.producto.sku}
									</p>
									<p className="text-xs text-gray-500 mt-1">
										Usuario: {sol.usuario?.email}
									</p>
								</div>
								<span
									className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                            ${
															sol.estado === "aprobado"
																? "bg-green-100 text-green-700"
																: sol.estado === "rechazado"
																	? "bg-red-100 text-red-700"
																	: "bg-yellow-100 text-yellow-700"
														}
                        `}>
									{sol.estado}
								</span>
							</div>

							{/* Foto y Detalles */}
							<div className="flex gap-4">
								<div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
									{/* Usamos la URL del backend */}
									<img
										src={`${API_URL}${sol.foto_url}`}
										alt="Evidencia"
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="flex-1 flex flex-col justify-center text-sm gap-1">
									<p className="flex items-center gap-2">
										<span className="font-semibold">Confianza IA:</span>
										<span
											className={
												sol.confianza > 0.85
													? "text-green-600 font-bold"
													: "text-orange-500"
											}>
											{(sol.confianza * 100).toFixed(1)}%
										</span>
									</p>
									<p className="text-gray-400 text-xs">
										{new Date(sol.fecha_hora).toLocaleDateString()} -{" "}
										{new Date(sol.fecha_hora).toLocaleTimeString()}
									</p>
								</div>
							</div>

							{/* Botones de Acción */}
							<div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
								<button
									onClick={() => handleUpdateStatus(sol.id, "aprobado")}
									className="flex-1 bg-swapp-mint/10 text-swapp-mint hover:bg-swapp-mint hover:text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
									<CheckCircle size={16} /> Aprobar
								</button>
								<button
									onClick={() => handleUpdateStatus(sol.id, "rechazado")}
									className="flex-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
									<XCircle size={16} /> Rechazar
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

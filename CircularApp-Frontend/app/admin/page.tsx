"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"; // 👇 Usamos el cerebro global

interface RegistroIA {
	id: string; // OJO: En tu DB los IDs son UUID (strings), no numbers
	etiqueta: string; // Esto vendrá del "producto.nombre"
	confianza: number;
	estado: string;
	imagen_url: string | null;
	fecha: string | null;
}

export default function AdminDashboard() {
	const { token, user, login, logout, isAuthenticated } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const [registros, setRegistros] = useState<RegistroIA[]>([]);

	const API_URL = "http://127.0.0.1:7860";

	useEffect(() => {
		if (isAuthenticated) {
			fetchHistorial();
		}
	}, [isAuthenticated]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg("");

		try {
			const formData = new URLSearchParams();
			formData.append("username", email);
			formData.append("password", password);

			const res = await fetch(`${API_URL}/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: formData,
			});

			if (!res.ok) throw new Error("Credenciales incorrectas");

			const data = await res.json();
			login(data.access_token); // 👇 Usamos la función del contexto global!
		} catch (err) {
			setErrorMsg("Acceso denegado. Verifica tus datos.");
		} finally {
			setLoading(false);
		}
	};

	const fetchHistorial = async () => {
		try {
			const res = await fetch(`${API_URL}/historial`); // ⚠️ ESTO FALTA EN BACKEND
			if (res.ok) {
				const data = await res.json();
				// Mapeamos los datos del backend a la interfaz del frontend
				const datosFormateados = data.map((item: any) => ({
					id: item.id,
					etiqueta: item.producto.nombre, // Accedemos al objeto anidado
					confianza: item.confianza,
					estado: item.estado,
					imagen_url: item.foto_url ? `${API_URL}${item.foto_url}` : null,
					fecha: item.fecha_hora,
				}));
				setRegistros(datosFormateados);
			}
		} catch (error) {
			console.error("Error fetching data", error);
		}
	};

	const cambiarEstado = async (id: string, estadoActual: string) => {
		const nuevoEstado = estadoActual === "aprobado" ? "rechazado" : "aprobado";

		try {
			const res = await fetch(`${API_URL}/actualizar/${id}`, {
				// ⚠️ ESTO FALTA EN BACKEND
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ estado: nuevoEstado }),
			});

			if (res.ok) {
				// Actualizar localmente
				setRegistros((prev) =>
					prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r)),
				);
			}
		} catch (error) {
			alert("Error al actualizar");
		}
	};

	// --- VISTA LOGIN ---
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
				<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
					<h1 className="text-2xl font-bold text-center mb-6">
						Admin Bucle ♻️
					</h1>
					<form onSubmit={handleLogin} className="space-y-4">
						<input
							type="email"
							placeholder="Email Admin"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full p-3 border rounded"
							required
						/>
						<input
							type="password"
							placeholder="Contraseña"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full p-3 border rounded"
							required
						/>
						{errorMsg && (
							<p className="text-red-500 text-sm text-center">{errorMsg}</p>
						)}
						<button
							disabled={loading}
							className="w-full bg-gray-900 text-white py-3 rounded hover:bg-black">
							{loading ? "Entrando..." : "Iniciar Sesión"}
						</button>
					</form>
				</div>
			</div>
		);
	}

	// --- VISTA DASHBOARD ---
	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<header className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
					<div className="flex items-center gap-4">
						<span className="text-gray-600">Hola, {user?.sub}</span>
						<button
							onClick={logout}
							className="text-red-600 font-medium hover:underline">
							Salir
						</button>
					</div>
				</header>

				<div className="bg-white rounded-xl shadow overflow-hidden">
					<table className="w-full">
						<thead className="bg-gray-100 border-b">
							<tr>
								<th className="p-4 text-left">Producto</th>
								<th className="p-4 text-left">Foto</th>
								<th className="p-4 text-left">Confianza</th>
								<th className="p-4 text-left">Estado</th>
								<th className="p-4 text-left">Acción</th>
							</tr>
						</thead>
						<tbody>
							{registros.map((reg) => (
								<tr key={reg.id} className="border-b hover:bg-gray-50">
									<td className="p-4 font-medium">{reg.etiqueta}</td>
									<td className="p-4">
										{reg.imagen_url && (
											<img
												src={reg.imagen_url}
												alt="evidencia"
												className="w-16 h-16 object-cover rounded"
											/>
										)}
									</td>
									<td className="p-4 text-sm text-gray-500">
										{(reg.confianza * 100).toFixed(1)}%
									</td>
									<td className="p-4">
										<span
											className={`px-2 py-1 rounded text-xs font-bold uppercase ${reg.estado === "aprobado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
											{reg.estado}
										</span>
									</td>
									<td className="p-4">
										<button
											onClick={() => cambiarEstado(reg.id, reg.estado)}
											className="text-blue-600 hover:underline text-sm font-semibold">
											Cambiar
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{registros.length === 0 && (
						<p className="text-center p-8 text-gray-500">
							No hay solicitudes pendientes.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

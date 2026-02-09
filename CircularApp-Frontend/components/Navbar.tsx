"use client";

import { useAuth } from "../app/context/AuthContext";

export default function Navbar() {
	const { user, logout, isAuthenticated } = useAuth();

	// Si no hay nadie logueado, no mostramos nada (la barra es invisible)
	if (!isAuthenticated) return null;

	return (
		<nav className="bg-gray-900 text-white p-4 shadow-md mb-4">
			<div className="max-w-7xl mx-auto flex justify-between items-center">
				{/* Lado Izquierdo: Logo o Nombre */}
				<div className="font-bold text-xl tracking-tight">Bucle App ♻️</div>

				{/* Lado Derecho: Info Usuario + Botón */}
				<div className="flex items-center gap-4">
					<div className="hidden md:block text-sm text-gray-300">
						Hola, <span className="font-bold text-white">{user?.sub}</span>
					</div>

					<button
						onClick={logout}
						className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded transition-colors">
						Cerrar Sesión
					</button>
				</div>
			</div>
		</nav>
	);
}

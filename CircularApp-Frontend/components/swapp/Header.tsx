"use client";

import { useAuth } from "@/context/AuthContext";

export default function Header() {
	const { user, logout, isAuthenticated } = useAuth();

	return (
		<header className="bg-swapp-navy text-white p-4 flex justify-between items-center z-10 shadow-md">
			<div className="flex items-center gap-3">
				{/* Avatar / Icono de Usuario */}
				<div
					className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors
            ${isAuthenticated ? "border-swapp-mint bg-swapp-mint/10" : "border-gray-500 bg-gray-700"}
        `}>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
				</div>

				{/* Información del Usuario */}
				<div className="flex flex-col">
					<span className="text-xs text-gray-400">
						{isAuthenticated ? "Hola," : "Bienvenido"}
					</span>
					<span className="text-sm font-bold text-white leading-tight">
						{isAuthenticated
							? user?.email?.split("@")[0] || "Usuario"
							: "Invitado"}
					</span>
				</div>
			</div>

			{/* Botón de Acción (Logout o nada) */}
			<div className="flex items-center">
				{isAuthenticated ? (
					<button
						onClick={logout}
						className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1.5 rounded-lg border border-red-500/30 transition flex items-center gap-1"
						title="Cerrar Sesión">
						<span>Salir</span>
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
					</button>
				) : (
					<span className="text-xl font-bold tracking-tight text-swapp-mint">
						Swapp
					</span>
				)}
			</div>
		</header>
	);
}

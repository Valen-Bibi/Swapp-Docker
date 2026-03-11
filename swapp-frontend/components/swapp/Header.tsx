"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
	const { user, logout, isAuthenticated } = useAuth();
	const pathname = usePathname();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// Ocultamos el Header en la raíz, login y registro
	if (pathname === "/" || pathname === "/login" || pathname === "/registro") {
		return null;
	}

	if (!isAuthenticated) return null;

	// FUNCIÓN MÁGICA PARA FORMATEAR EL NOMBRE
	const formatName = (fullName?: string) => {
		if (!fullName) return "Usuario";

		// 1. Si es un email (valentinbibiloni@...), cortamos en el @
		// 2. Si es un nombre completo (Valentin Bibiloni), cortamos en el primer espacio
		const firstPart = fullName.split("@")[0].split(" ")[0].trim();

		// 3. Ponemos la primera en mayúscula y el resto en minúscula
		return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
	};

	const displayName = user?.first_name || formatName(user?.name || user?.email);

	return (
		<header className="bg-swapp-navy text-white p-4 flex justify-between items-center z-50 shadow-md relative">
			{/* LADO IZQUIERDO: Info del Usuario y Dropdown */}
			<div className="relative">
				<button
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					className="flex items-center gap-3 text-left focus:outline-none hover:opacity-80 transition-opacity">
					{/* Avatar / Icono */}
					<div className="w-10 h-10 rounded-full border-2 border-swapp-mint bg-swapp-mint/10 flex items-center justify-center transition-colors">
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
						<span className="text-xs text-gray-400">Hola,</span>
						{/* ACÁ APLICAMOS LA FUNCIÓN */}
						<span className="text-sm font-bold text-white leading-tight">
							{displayName}
						</span>
					</div>

					{/* Flechita indicadora */}
					<svg
						className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{/* EL MENÚ DESPLEGABLE */}
				{isDropdownOpen && (
					<>
						<div
							className="fixed inset-0 z-40"
							onClick={() => setIsDropdownOpen(false)}></div>
						<div className="absolute left-0 mt-3 w-48 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100">
							<div className="p-2">
								<button
									onClick={() => {
										setIsDropdownOpen(false);
										logout();
									}}
									className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2 font-semibold">
									<svg
										className="w-4 h-4"
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
									Cerrar Sesión
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			{/* LADO DERECHO: Logotipo */}
			<div className="flex items-center">
				<img
					src="/svgs/Logotipo.svg"
					alt="Swapp Logo"
					className="h-6 w-auto object-contain"
				/>
			</div>
		</header>
	);
}

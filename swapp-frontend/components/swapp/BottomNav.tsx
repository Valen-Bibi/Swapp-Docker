"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
	const pathname = usePathname();

	// Ocultamos la barra en las pantallas de inicio, login y registro
	if (pathname === "/" || pathname === "/login" || pathname === "/registro") {
		return null;
	}

	return (
		<div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none drop-shadow-[0_-5px_15px_rgba(0,0,0,0.15)]">
			<div className="relative max-w-md mx-auto pointer-events-auto flex flex-col justify-end h-[100px]">
				{/* 1. TU SVG PERSONALIZADO COMO FONDO */}
				<img
					src="/svgs/bottom_nav.svg"
					alt="Fondo de Navegación"
					className="absolute bottom-0 left-0 w-full h-[115px] object-fill pointer-events-none"
				/>

				{/* 2. CONTENEDOR DE ÍCONOS SUPERPUESTOS */}
				<div className="relative z-10 flex justify-between items-end h-[75px] px-8 pb-4">
					{/* BOTÓN IZQUIERDO: Inicio (Home) */}
					<Link
						href="/hub"
						className="text-swapp-navy hover:text-swapp-teal transition p-2">
						<svg
							className="w-8 h-8"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
					</Link>

					{/* BOTÓN CENTRAL FLOTANTE (El carrito) */}
					{/* Si el botón no queda centrado exactamente en tu "montañita", ajustá el valor de '-top-8' */}
					<div className="absolute left-1/2 -translate-x-1/2 -top-8">
						<button className="w-16 h-16 rounded-full bg-gradient-to-tr from-swapp-teal to-swapp-navy shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform">
							<svg
								className="w-8 h-8"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</button>
					</div>

					{/* BOTÓN DERECHO: Menú */}
					<button className="text-swapp-navy hover:text-swapp-teal transition p-2">
						<svg
							className="w-8 h-8"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

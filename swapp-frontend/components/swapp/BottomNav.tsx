"use client";

import Link from "next/link";

export default function BottomNav() {
	return (
		<div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none drop-shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
			<div className="relative max-w-md mx-auto pointer-events-auto">
				{/* EL SVG CORREGIDO: Totalmente simétrico, centro exacto en X=200 */}
				<svg
					className="absolute bottom-0 w-full h-[75px] text-[#e5e7eb]" // Color gris clarito tipo Tailwind gray-200
					viewBox="0 0 400 75"
					fill="currentColor"
					preserveAspectRatio="none">
					<path
						d="M0,20 
                   C0,9 9,0 20,0 
                   L140,0 
                   C152,0 157,6 162,16 
                   C173,38 183,44 200,44 
                   C217,44 227,38 238,16 
                   C243,6 248,0 260,0 
                   L380,0 
                   C391,0 400,9 400,20 
                   L400,75 
                   L0,75 
                   Z"
					/>
				</svg>

				<div className="relative flex justify-between items-center h-[75px] px-8">
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

					{/* BOTÓN CENTRAL FLOTANTE */}
					<div className="absolute left-1/2 -translate-x-1/2 -top-6">
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

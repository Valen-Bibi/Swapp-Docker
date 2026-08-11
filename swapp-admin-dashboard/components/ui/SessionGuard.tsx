"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";

export default function SessionGuard() {
	const [isExpired, setIsExpired] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const lastActivity = useRef<number>(Date.now());

	useEffect(() => {
		// Si estamos en la página de login, apagamos el guardián
		if (pathname === "/login") return;

		// 1. Sensor de actividad: Actualiza el reloj interno al mover el mouse o teclear
		const updateActivity = () => {
			lastActivity.current = Date.now();
		};

		window.addEventListener("mousemove", updateActivity);
		window.addEventListener("keydown", updateActivity);
		window.addEventListener("click", updateActivity);

		// 2. Sensor del Interceptor: Escucha si el backend rechazó alguna petición
		const handleSessionExpired = () => setIsExpired(true);
		window.addEventListener("session_expired", handleSessionExpired);

		// 3. El Motor del Latido (Se ejecuta cada 60 segundos)
		const heartbeatInterval = setInterval(async () => {
			const now = Date.now();
			const timeSinceLastActivity = now - lastActivity.current;

			if (timeSinceLastActivity >= 300000) {
				setIsExpired(true);
			} else if (!isExpired) {
				try {
					const response = await api.post("/api/auth/staff/heartbeat");
					if (response.data.access_token) {
						Cookies.set("admin_token", response.data.access_token);
					}
				} catch (error) {
					console.error(
						"El latido falló. La sesión expiró del lado del servidor.",
					);
				}
			}
		}, 60000);

		return () => {
			window.removeEventListener("mousemove", updateActivity);
			window.removeEventListener("keydown", updateActivity);
			window.removeEventListener("click", updateActivity);
			window.removeEventListener("session_expired", handleSessionExpired);
			clearInterval(heartbeatInterval);
		};
	}, [isExpired, pathname]);

	if (!isExpired) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 text-center border border-zinc-200 dark:border-zinc-800">
				<div className="mb-5 text-red-500 flex justify-center">
					<svg
						className="w-16 h-16"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
					Usuario Inactivo
				</h2>
				<p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
					Superaste el tiempo de inactividad permitido en el panel. Por favor,
					vuelva a iniciar sesión.
				</p>
				<button
					onClick={() => {
						Cookies.remove("admin_token");
						router.push("/login");
						setIsExpired(false); // Reseteamos el estado por si acaso
					}}
					className="w-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white font-semibold py-3 px-4 rounded-lg transition-colors">
					Ir al LogIn
				</button>
			</div>
		</div>
	);
}

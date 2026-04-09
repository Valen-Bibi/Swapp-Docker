"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/context/AuthContext";

export default function LandingPage() {
	const { isAuthenticated, isFirstTimeUser, isLoading } = useAuth();
	const router = useRouter();

	// Bandera extra para asegurar que el navegador ya cargó todo
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		// 1. Si todavía está leyendo el localStorage o no se montó, no hacemos nada
		if (!isMounted || isLoading) return;

		// 2. Le damos un pequeño respiro de 100ms a Next.js para que termine sus
		// tareas de desarrollo antes de disparar el push.
		const redirectTimer = setTimeout(() => {
			if (isAuthenticated) {
				router.push("/hub");
			} else if (isFirstTimeUser) {
				router.push("/tutorial");
			} else {
				router.push("/login");
			}
		}, 100);

		// Limpiamos el timer por seguridad
		return () => clearTimeout(redirectTimer);
	}, [isAuthenticated, isFirstTimeUser, isLoading, router, isMounted]);

	// 3. Pantalla de carga mientras se resuelve la redirección
	return (
		<div className="fixed inset-0 bg-black flex items-center justify-center z-[70] overflow-hidden">
			<div className="relative w-full h-full sm:w-[400px] sm:h-[850px] sm:max-h-[90vh] bg-swapp-negro sm:rounded-[32px] overflow-hidden flex flex-col items-center justify-center">
				<div className="w-14 h-14 border-4 border-swapp-verde-agua/30 border-t-swapp-verde-agua rounded-full animate-spin drop-shadow-[0_0_10px_rgba(1,195,142,0.8)]"></div>
			</div>
		</div>
	);
}

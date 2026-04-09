"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import MainScannerApp from "@/components/swapp/MainScannerApp";

export default function HubPage() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-swapp-verde-agua border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	// Si no está autenticado, no renderizamos nada (evita un parpadeo de la cámara antes del redireccionamiento)
	if (!isAuthenticated) return null;

	return <MainScannerApp />;
}

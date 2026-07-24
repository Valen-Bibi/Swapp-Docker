"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainScannerApp from "@/components/swapp/MainScannerApp";

export default function HubPage() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading || !isAuthenticated) {
		return (
			<div className="flex-1 flex items-center justify-center h-[calc(100vh-115px)] bg-swapp-tiza">
				<div className="w-8 h-8 border-4 border-swapp-verde-agua border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-[calc(100vh-195px)] bg-swapp-tiza px-5 pt-4 pb-2">
			<div className="flex-1 w-full bg-black rounded-[36px] overflow-hidden relative shadow-2xl">
				{/* Simplemente instanciamos el componente sin pasarle propiedades */}
				<MainScannerApp />
			</div>
		</div>
	);
}

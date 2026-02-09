"use client";

import { useRouter } from "next/navigation";
// Usamos ruta relativa para el componente
import Scanner from "../components/Scanner";

export default function ClienteApp() {
	const router = useRouter();

	const handleProductDetected = (
		productoDetectado: string,
		confianza: number,
		imagen: string | null,
	) => {
		console.log(`✅ Producto: ${productoDetectado}`);

		if (typeof navigator !== "undefined" && navigator.vibrate) {
			navigator.vibrate(200);
		}

		if (imagen) {
			localStorage.setItem("tempScanImage", imagen);
		}

		// REDIRECCIÓN: Aquí te manda al otro archivo (tramite/page.tsx)
		router.push(
			`/tramite?scan=${productoDetectado}&conf=${confianza.toFixed(2)}`,
		);
	};

	return (
		<main className="flex min-h-screen flex-col items-center bg-white">
			<div className="w-full bg-green-600 p-4 shadow-md flex justify-center mb-8 sticky top-0 z-50">
				<h1 className="text-white font-bold text-xl tracking-wide">Bucle</h1>
			</div>

			<div className="px-6 w-full max-w-md flex flex-col items-center pb-10">
				<h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
					Devolver un envase
				</h2>
				<p className="text-gray-500 text-center mb-8 text-sm">
					Apunta con tu cámara al producto.
					<br />
					La IA lo reconocerá.
				</p>

				<div className="w-full aspect-[3/4] mb-8 relative bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
					<Scanner onScan={handleProductDetected} />
				</div>
			</div>
		</main>
	);
}

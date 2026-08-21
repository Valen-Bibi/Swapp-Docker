import { Toaster } from "sonner";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen w-full bg-swapp-tiza dark:bg-swapp-azul-petroleo overflow-hidden transition-colors duration-300">
			{/* Sidebar Modularizado */}
			<Sidebar />

			<main className="flex-1 overflow-y-auto bg-swapp-blanco dark:bg-swapp-negro-azulado relative transition-colors duration-300">
				{children}
			</main>

			<Toaster position="bottom-right" richColors closeButton theme="system" />
		</div>
	);
}

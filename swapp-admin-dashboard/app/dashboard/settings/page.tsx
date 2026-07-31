"use client";

import { useState } from "react";
import { Settings, Palette, Shield } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState("ui");

	return (
		<div className="p-6 relative max-w-6xl mx-auto">
			<div className="mb-8">
				<PageHeader
					title="Configuración del Sistema"
					description="Ajustes de interfaz, seguridad y preferencias del panel"
					icon={Settings}
				/>
			</div>

			<div className="flex flex-col md:flex-row gap-6">
				{/* Menú Lateral de Pestañas */}
				<div className="w-full md:w-64 flex-shrink-0 space-y-2">
					<button
						onClick={() => setActiveTab("ui")}
						className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
							activeTab === "ui"
								? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-md shadow-swapp-turquesa-oscuro/20 dark:shadow-none"
								: "bg-swapp-blanco dark:bg-swapp-negro-azulado text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-petroleo border border-swapp-tiza dark:border-swapp-azul-petroleo"
						}`}>
						<Palette className="h-5 w-5" />
						Interfaz y Tema
					</button>

					<button
						onClick={() => setActiveTab("security")}
						className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
							activeTab === "security"
								? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-md shadow-swapp-turquesa-oscuro/20 dark:shadow-none"
								: "bg-swapp-blanco dark:bg-swapp-negro-azulado text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-petroleo border border-swapp-tiza dark:border-swapp-azul-petroleo"
						}`}>
						<Shield className="h-5 w-5" />
						Seguridad
					</button>
				</div>

				{/* Contenido Principal */}
				<div className="flex-1 bg-swapp-blanco dark:bg-swapp-negro-azulado border border-swapp-tiza dark:border-swapp-azul-petroleo rounded-2xl p-6 min-h-[400px] shadow-sm transition-colors">
					{activeTab === "ui" && (
						<div className="animate-in fade-in slide-in-from-right-4 duration-300">
							<div className="border-b border-swapp-tiza dark:border-swapp-azul-petroleo pb-4 mb-6">
								<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
									Personalización Visual
								</h2>
								<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
									Ajusta los colores y la experiencia de lectura del panel.
								</p>
							</div>

							<div className="space-y-6">
								{/* Tarjeta de Tema */}
								<div className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 border border-swapp-tiza dark:border-swapp-azul-petroleo p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors">
									<div>
										<h4 className="font-semibold text-swapp-negro-azulado dark:text-swapp-blanco flex items-center gap-2">
											<Palette className="h-4 w-4 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
											Modo de Color
										</h4>
										<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1 max-w-md">
											Elige entre el tema claro para el día, el oscuro para
											reducir la fatiga visual, o sincronízalo con tu sistema
											operativo.
										</p>
									</div>
									<div className="flex-shrink-0">
										<ThemeToggle />
									</div>
								</div>
							</div>
						</div>
					)}

					{activeTab === "security" && (
						<div className="animate-in fade-in slide-in-from-right-4 duration-300">
							<div className="border-b border-swapp-tiza dark:border-swapp-azul-petroleo pb-4 mb-6">
								<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
									Seguridad de la Cuenta
								</h2>
								<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
									Gestiona tus accesos y permisos.
								</p>
							</div>

							<div className="flex flex-col items-center justify-center h-48 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10 rounded-xl border border-dashed border-swapp-tiza dark:border-swapp-azul-petroleo">
								<Shield className="h-10 w-10 mb-3 opacity-30" />
								<p className="text-sm font-medium">
									Opciones de seguridad en desarrollo.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

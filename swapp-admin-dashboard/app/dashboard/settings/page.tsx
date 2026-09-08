"use client";

import { useState } from "react";
import { Settings, Palette, Shield } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState("ui");

	const tabs = [
		{ id: "ui", label: "Interfaz y Tema", icon: Palette },
		{ id: "security", label: "Seguridad", icon: Shield },
	];

	const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);

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
				{/* MENÚ LATERAL CON LÍNEA DE GUÍA (ASCENSOR ANIMADO) */}
				<div className="w-full md:w-64 flex-shrink-0 relative flex flex-col gap-2 pl-[14px]">
					{/* Línea de guía (Riel) */}
					<div className="absolute left-0 top-0 bottom-0 w-[2px] bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 rounded-full" />

					{/* Pastilla indicadora (El Ascensor Glassmorphism) */}
					{activeTabIndex >= 0 && (
						<div
							className="absolute left-[14px] right-0 top-0 h-[48px] z-10 rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 shadow-md transition-transform duration-300 ease-out pointer-events-none"
							style={{
								// 48px de alto + 8px de gap (gap-2) = 56px de desplazamiento por ítem
								transform: `translateY(${activeTabIndex * 56}px)`,
							}}>
							<span className="absolute -left-[14px] top-1/2 -translate-y-1/2 h-3/5 w-[2px] bg-swapp-verde-oscuro dark:bg-swapp-verde-menta rounded-full shadow-[0_0_8px_rgba(29,61,43,0.4)] dark:shadow-[0_0_8px_rgba(141,201,160,0.4)]" />
						</div>
					)}

					{/* Botones de Pestañas */}
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`relative z-20 w-full flex items-center gap-3 px-4 h-[48px] rounded-xl text-sm font-bold transition-all duration-300 ${
									isActive
										? "text-swapp-verde-oscuro dark:text-swapp-verde-menta"
										: "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 hover:text-swapp-azul-oscuro dark:hover:text-swapp-blanco hover:bg-swapp-blanco/40 dark:hover:bg-swapp-azul-oscuro/40"
								}`}>
								<tab.icon
									className={`h-5 w-5 transition-colors ${isActive ? "" : "opacity-70"}`}
								/>
								{tab.label}
							</button>
						);
					})}
				</div>

				{/* CONTENIDO PRINCIPAL (GLASSMORPHISM ESTANDARIZADO) */}
				<div className="flex-1 rounded-2xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md p-6 sm:p-8 min-h-[400px] shadow-xl transition-all duration-300">
					{activeTab === "ui" && (
						<div className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
							<div className="border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/40 pb-4 mb-8">
								<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
									Personalización Visual
								</h2>
								<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1.5">
									Ajusta los colores y la experiencia de lectura del panel.
								</p>
							</div>

							<div className="space-y-6">
								{/* Tarjeta de Tema */}
								<div className="bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 backdrop-blur-sm border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/40 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors shadow-sm">
									<div>
										<h4 className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
											<Palette className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
											Modo de Color
										</h4>
										<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1 max-w-md leading-relaxed">
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
						<div className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
							<div className="border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/40 pb-4 mb-8">
								<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
									Seguridad de la Cuenta
								</h2>
								<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1.5">
									Gestiona tus accesos y permisos.
								</p>
							</div>

							<div className="flex flex-col items-center justify-center h-48 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 rounded-xl border border-dashed border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/40 transition-colors">
								<Shield className="h-10 w-10 mb-3 opacity-30" />
								<p className="text-sm font-bold uppercase tracking-wider opacity-60">
									Opciones de seguridad en desarrollo
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

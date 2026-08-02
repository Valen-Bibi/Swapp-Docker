"use client";

import Link from "next/link";
import {
	Package,
	Box,
	DollarSign,
	Users,
	Settings,
	LogOut,
	UserCircle,
	ChevronDown,
	Tag,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface UserData {
	first_name: string;
	last_name: string;
	email: string;
	role: string;
}

export default function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const [userData, setUserData] = useState<UserData | null>(null);

	// Estado para controlar si el menú de Precios está expandido
	const [isPricingExpanded, setIsPricingExpanded] = useState(
		pathname.includes("/dashboard/products/pricing"),
	);

	useEffect(() => {
		const token = Cookies.get("admin_token");
		if (token) {
			try {
				const decoded = jwtDecode<UserData>(token);
				setUserData(decoded);
			} catch (error) {
				console.error("Error al decodificar el token:", error);
			}
		}
	}, []);

	// Sincronizar la expansión del menú si la ruta cambia desde otro lado
	useEffect(() => {
		if (pathname.includes("/dashboard/products/pricing")) {
			setIsPricingExpanded(true);
		}
	}, [pathname]);

	const handleLogout = () => {
		Cookies.remove("admin_token");
		router.push("/login");
	};

	const productLinks = [
		{
			name: "Catálogo Maestro",
			href: "/dashboard/products",
			icon: Box,
			exact: true,
		},
		{
			name: "Inventarios",
			href: "/dashboard/products/stock",
			icon: Package,
			exact: false,
		},
	];

	return (
		<aside className="w-64 flex-shrink-0 bg-swapp-blanco dark:bg-swapp-negro-azulado border-r border-swapp-tiza dark:border-none flex flex-col overflow-y-auto transition-colors">
			{/* LOGO */}
			<Link
				href="/dashboard"
				className="block p-6 border-b border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-oceano"
				title="Ir al Resumen">
				<h2 className="text-2xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco tracking-tight">
					Swapp<span className="text-swapp-verde-agua">.</span>
				</h2>
				<p className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
					Panel de Administración
				</p>
			</Link>

			<nav className="flex-1 p-4 space-y-6">
				{/* PRODUCTOS */}
				<div>
					<p className="px-3 text-xs font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta uppercase tracking-wider mb-2">
						Productos
					</p>
					<div className="space-y-1">
						{/* Enlaces simples */}
						{productLinks.map((link) => {
							const isActive = link.exact
								? pathname === link.href
								: pathname.startsWith(link.href);

							return (
								<Link
									key={link.href}
									href={link.href}
									className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
										isActive
											? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-sm"
											: "text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<link.icon
										className={`h-5 w-5 ${isActive ? "text-swapp-blanco" : ""}`}
									/>
									{link.name}
								</Link>
							);
						})}

						{/* Menú Expandible: Costos y Precios */}
						<div className="flex flex-col gap-1 pt-1">
							<button
								onClick={() => setIsPricingExpanded(!isPricingExpanded)}
								className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
									pathname.includes("/dashboard/products/pricing")
										? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-sm"
										: "text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
								}`}>
								<div className="flex items-center gap-3">
									<DollarSign
										className={`h-5 w-5 ${pathname.includes("/dashboard/products/pricing") ? "text-swapp-blanco" : ""}`}
									/>
									<span className="font-medium">Precios</span>
								</div>
								<ChevronDown
									className={`h-4 w-4 transition-transform duration-200 ${isPricingExpanded ? "rotate-180" : ""}`}
								/>
							</button>

							{/* Sub-enlaces */}
							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out pl-9 pr-2 flex flex-col gap-1 ${
									isPricingExpanded
										? "max-h-24 opacity-100 mt-1"
										: "max-h-0 opacity-0"
								}`}>
								<Link
									href="/dashboard/products/pricing/costs"
									className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
										pathname === "/dashboard/products/pricing/costs"
											? "bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta font-medium"
											: "text-swapp-azul-petroleo/70 hover:bg-swapp-tiza dark:text-swapp-tiza/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<DollarSign className="h-4 w-4" />
									Costos y Precios (ABM)
								</Link>
								<Link
									href="/dashboard/products/pricing/discounts"
									className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
										pathname === "/dashboard/products/pricing/discounts"
											? "bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta font-medium"
											: "text-swapp-azul-petroleo/70 hover:bg-swapp-tiza dark:text-swapp-tiza/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<Tag className="h-4 w-4" />
									Ofertas (ABM)
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* USUARIOS */}
				<div>
					<p className="px-3 text-xs font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta uppercase tracking-wider mb-2">
						Usuarios
					</p>
					<div className="space-y-1">
						<Link
							href="#"
							className="flex items-center gap-3 px-3 py-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 rounded-lg cursor-not-allowed">
							<Users className="h-5 w-5" />
							Clientes (Próximamente)
						</Link>
					</div>
				</div>
			</nav>

			{/* SECCIÓN INFERIOR */}
			<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo p-4 bg-swapp-tiza/20 dark:bg-black/10">
				<div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 border border-swapp-tiza dark:border-none">
					<UserCircle className="h-8 w-8 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
					<div className="flex flex-col overflow-hidden">
						{userData ? (
							<>
								<span className="text-sm font-medium text-swapp-negro-azulado dark:text-swapp-blanco truncate">
									{userData.first_name || "Usuario"} {userData.last_name || ""}
								</span>
								<span className="text-xs text-swapp-azul-petroleo/80 dark:text-swapp-tiza/70 truncate capitalize">
									{userData.role ? userData.role.replace("_", " ") : "Staff"}
								</span>
							</>
						) : (
							<>
								<div className="h-4 w-20 bg-swapp-azul-petroleo/10 dark:bg-swapp-tiza/20 rounded animate-pulse mb-1"></div>
								<div className="h-3 w-12 bg-swapp-azul-petroleo/5 dark:bg-swapp-tiza/10 rounded animate-pulse"></div>
							</>
						)}
					</div>
				</div>

				{userData?.role === "super_admin" && (
					<div>
						<p className="px-3 text-xs font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta uppercase tracking-wider mb-2 mt-4">
							Super Admin
						</p>
						<div className="space-y-1">
							<Link
								href="/dashboard/staff/new"
								className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
									pathname === "/dashboard/staff/new"
										? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-sm"
										: "text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco"
								}`}>
								<Settings
									className={`h-5 w-5 ${pathname === "/dashboard/staff/new" ? "text-swapp-blanco" : ""}`}
								/>
								Alta de Personal
							</Link>
						</div>
					</div>
				)}

				<Link
					href="/dashboard/settings"
					className={`flex w-full items-center gap-3 px-3 py-2 mb-1 mt-2 text-sm rounded-lg transition-colors ${
						pathname.includes("/dashboard/settings")
							? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-sm"
							: "text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco"
					}`}>
					<Settings
						className={`h-4 w-4 ${pathname.includes("/dashboard/settings") ? "text-swapp-blanco" : ""}`}
					/>
					Configuración
				</Link>

				<button
					onClick={handleLogout}
					className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors">
					<LogOut className="h-4 w-4" />
					Cerrar sesión
				</button>
			</div>
		</aside>
	);
}

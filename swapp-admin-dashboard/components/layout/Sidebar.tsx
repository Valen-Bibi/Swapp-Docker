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
	FolderTree,
	Bookmark,
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

	const [isCatalogExpanded, setIsCatalogExpanded] = useState(
		pathname.includes("/dashboard/products/catalog"),
	);
	const [isPricingExpanded, setIsPricingExpanded] = useState(
		pathname.includes("/dashboard/products/pricing"),
	);
	const [isInventoryExpanded, setIsInventoryExpanded] = useState(
		pathname.includes("/dashboard/products/inventory"),
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

	useEffect(() => {
		if (pathname.includes("/dashboard/products/catalog"))
			setIsCatalogExpanded(true);
		if (pathname.includes("/dashboard/products/pricing"))
			setIsPricingExpanded(true);
		if (pathname.includes("/dashboard/products/inventory"))
			setIsInventoryExpanded(true);
	}, [pathname]);

	const handleLogout = () => {
		Cookies.remove("admin_token");
		router.push("/login");
	};

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
						{/* Menú Expandible: Catálogo */}
						<div className="flex flex-col gap-1 pt-1">
							<button
								onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
								className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
									pathname.includes("/dashboard/products/catalog")
										? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-sm"
										: "text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
								}`}>
								<div className="flex items-center gap-3">
									<Box
										className={`h-5 w-5 ${pathname.includes("/dashboard/products/catalog") ? "text-swapp-blanco" : ""}`}
									/>
									<span className="font-medium">Catálogo</span>
								</div>
								<ChevronDown
									className={`h-4 w-4 transition-transform duration-200 ${isCatalogExpanded ? "rotate-180" : ""}`}
								/>
							</button>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out pl-9 pr-2 flex flex-col gap-1 ${
									isCatalogExpanded
										? "max-h-40 opacity-100 mt-1"
										: "max-h-0 opacity-0"
								}`}>
								<Link
									href="/dashboard/products/catalog/master"
									className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
										pathname.includes("/dashboard/products/catalog/master")
											? "bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta font-medium"
											: "text-swapp-azul-petroleo/70 hover:bg-swapp-tiza dark:text-swapp-tiza/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<Box className="h-4 w-4" />
									Catálogo Maestro (ABM)
								</Link>
								<Link
									href="/dashboard/products/catalog/categories"
									className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
										pathname.includes("/dashboard/products/catalog/categories")
											? "bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta font-medium"
											: "text-swapp-azul-petroleo/70 hover:bg-swapp-tiza dark:text-swapp-tiza/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<FolderTree className="h-4 w-4" />
									Categorías (ABM)
								</Link>
								<Link
									href="/dashboard/products/catalog/brands"
									className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
										pathname.includes("/dashboard/products/catalog/brands")
											? "bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta font-medium"
											: "text-swapp-azul-petroleo/70 hover:bg-swapp-tiza dark:text-swapp-tiza/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<Bookmark className="h-4 w-4" />
									Marcas Registradas (ABM)
								</Link>
							</div>
						</div>

						{/* Menú Expandible: Inventarios */}
						<div className="flex flex-col gap-1 pt-1">
							<button
								onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
								className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
									pathname.includes("/dashboard/products/inventory")
										? "bg-swapp-turquesa-oscuro text-swapp-blanco shadow-sm"
										: "text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
								}`}>
								<div className="flex items-center gap-3">
									<Package
										className={`h-5 w-5 ${pathname.includes("/dashboard/products/inventory") ? "text-swapp-blanco" : ""}`}
									/>
									<span className="font-medium">Inventarios</span>
								</div>
								<ChevronDown
									className={`h-4 w-4 transition-transform duration-200 ${isInventoryExpanded ? "rotate-180" : ""}`}
								/>
							</button>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out pl-9 pr-2 flex flex-col gap-1 ${
									isInventoryExpanded
										? "max-h-24 opacity-100 mt-1"
										: "max-h-0 opacity-0"
								}`}>
								<Link
									href="/dashboard/products/inventory/stock"
									className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
										pathname === "/dashboard/products/inventory/stock"
											? "bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta font-medium"
											: "text-swapp-azul-petroleo/70 hover:bg-swapp-tiza dark:text-swapp-tiza/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
									}`}>
									<Box className="h-4 w-4" />
									Control de Stock (ABM)
								</Link>
							</div>
						</div>

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

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out pl-9 pr-2 flex flex-col gap-1 ${
									isPricingExpanded
										? "max-h-32 opacity-100 mt-1"
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

"use client";

import Link from "next/link";
import Image from "next/image";
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
	ShoppingCart,
	ListOrdered,
	PlusSquare,
	PanelLeftClose,
	PanelLeft,
} from "lucide-react";
import { SwappLogo } from "../ui/SwappLogo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { SwappTooltip } from "../ui/SwappTooltip";

interface UserData {
	first_name: string;
	last_name: string;
	email: string;
	role: string;
}

export default function Sidebar() {
	const pathname = usePathname();
	const safePathname = pathname || "";

	const router = useRouter();
	const [userData, setUserData] = useState<UserData | null>(null);

	// Estado para colapsar/expandir el sidebar general
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Estados de expansión de submenús
	const [isOrdersExpanded, setIsOrdersExpanded] = useState(
		safePathname.includes("/dashboard/orders"),
	);
	const [isCatalogExpanded, setIsCatalogExpanded] = useState(
		safePathname.includes("/dashboard/products/catalog"),
	);
	const [isPricingExpanded, setIsPricingExpanded] = useState(
		safePathname.includes("/dashboard/products/pricing"),
	);
	const [isInventoryExpanded, setIsInventoryExpanded] = useState(
		safePathname.includes("/dashboard/products/inventory"),
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
		if (safePathname.includes("/dashboard/orders")) setIsOrdersExpanded(true);
		if (safePathname.includes("/dashboard/products/catalog"))
			setIsCatalogExpanded(true);
		if (safePathname.includes("/dashboard/products/pricing"))
			setIsPricingExpanded(true);
		if (safePathname.includes("/dashboard/products/inventory"))
			setIsInventoryExpanded(true);
	}, [safePathname]);

	const handleLogout = () => {
		Cookies.remove("admin_token");
		router.push("/login");
	};

	const handleMenuClick = (
		isExpandedState: boolean,
		setExpandedState: (val: boolean) => void,
	) => {
		if (isCollapsed) {
			setIsCollapsed(false);
			setExpandedState(true);
		} else {
			setExpandedState(!isExpandedState);
		}
	};

	const getNavButtonClasses = (isActive: boolean) =>
		`flex items-center justify-between w-full p-2 rounded-lg transition-all duration-300 ${
			isActive
				? "bg-swapp-verde-oscuro text-swapp-blanco shadow-sm"
				: "text-swapp-azul-petroleo border border-transparent hover:bg-swapp-tiza-verdoso dark:text-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
		} ${isCollapsed ? "justify-center" : "px-3"}`;

	const getNavLinkClasses = (isActive: boolean) =>
		`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
			isActive
				? "bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-petroleo/40 backdrop-blur-md border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 text-swapp-verde-oscuro dark:text-swapp-verde-menta font-bold shadow-sm relative overflow-hidden"
				: "text-swapp-azul-petroleo/70 border border-transparent hover:bg-swapp-tiza-verdoso dark:text-swapp-tiza-verdoso/70 dark:hover:bg-swapp-azul-petroleo dark:hover:text-swapp-blanco"
		}`;

	const getBottomLinkClasses = (isActive: boolean) =>
		`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
			isActive
				? "bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-petroleo/40 backdrop-blur-md border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 text-swapp-verde-oscuro dark:text-swapp-verde-menta font-bold shadow-sm relative overflow-hidden"
				: "text-swapp-azul-petroleo border border-transparent hover:bg-swapp-tiza-verdoso dark:text-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo hover:text-swapp-azul-oscuro dark:hover:text-swapp-blanco"
		} ${isCollapsed ? "justify-center" : "px-3 py-2"}`;

	const ActiveIndicator = () => (
		<span className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-swapp-verde-oscuro dark:bg-swapp-verde-menta rounded-r-full animate-in slide-in-from-left-2 duration-300" />
	);

	return (
		<aside
			className={`flex-shrink-0 bg-swapp-blanco dark:bg-swapp-azul-oscuro border-r border-swapp-tiza-verdoso dark:border-none flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out relative z-20 custom-scrollbar ${
				isCollapsed ? "w-20" : "w-64"
			}`}>
			{/* HEADER & TOGGLE */}
			<div className="flex items-center justify-between p-4 border-b border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors h-[89px]">
				<Link
					href="/dashboard"
					className={`flex items-center overflow-hidden transition-all duration-300 ${
						isCollapsed
							? "w-0 opacity-0 hidden"
							: "w-auto opacity-100 flex-1 hover:bg-swapp-tiza-verdoso/50 dark:hover:bg-swapp-azul-oceano p-2 rounded-lg"
					}`}>
					<SwappLogo className="text-swapp-azul-oscuro dark:text-swapp-blanco transition-colors" />
				</Link>

				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className={`p-2 rounded-lg text-swapp-azul-petroleo/70 hover:text-swapp-azul-oscuro hover:bg-swapp-tiza-verdoso dark:text-swapp-tiza-verdoso/70 dark:hover:text-swapp-blanco dark:hover:bg-swapp-azul-petroleo transition-colors shrink-0 ${
						isCollapsed ? "mx-auto" : ""
					}`}>
					{isCollapsed ? (
						<PanelLeft className="h-5 w-5" />
					) : (
						<PanelLeftClose className="h-5 w-5" />
					)}
				</button>
			</div>

			<nav className="flex-1 p-4 space-y-6">
				{/* PRODUCTOS */}
				<div>
					{isCollapsed ? (
						<hr className="mx-2 mb-2 border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-all duration-300" />
					) : (
						<p className="px-3 text-xs font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-2 animate-in fade-in duration-300">
							Catálogo
						</p>
					)}
					<div className="space-y-1">
						{/* Menú Expandible: Catálogo */}
						<div className="flex flex-col gap-1 pt-1">
							<SwappTooltip text={isCollapsed ? "Catálogo" : ""}>
								<button
									onClick={() =>
										handleMenuClick(isCatalogExpanded, setIsCatalogExpanded)
									}
									className={getNavButtonClasses(
										safePathname.includes("/dashboard/products/catalog"),
									)}>
									<div className="flex items-center gap-3">
										<Box
											className={`h-5 w-5 shrink-0 ${safePathname.includes("/dashboard/products/catalog") ? "text-swapp-blanco" : ""}`}
										/>
										{!isCollapsed && (
											<span className="font-medium whitespace-nowrap">
												Identidad
											</span>
										)}
									</div>
									{!isCollapsed && (
										<ChevronDown
											className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isCatalogExpanded ? "rotate-180" : ""}`}
										/>
									)}
								</button>
							</SwappTooltip>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out flex flex-col gap-1 ${!isCollapsed && isCatalogExpanded ? "max-h-64 opacity-100 mt-1 pl-9 pr-2" : "max-h-0 opacity-0"}`}>
								<Link
									href="/dashboard/products/catalog/master"
									className={getNavLinkClasses(
										safePathname.includes("/dashboard/products/catalog/master"),
									)}>
									{safePathname.includes(
										"/dashboard/products/catalog/master",
									) && <ActiveIndicator />}
									<Box className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Catálogo Maestro</span>
								</Link>
								<Link
									href="/dashboard/products/catalog/categories"
									className={getNavLinkClasses(
										safePathname.includes(
											"/dashboard/products/catalog/categories",
										),
									)}>
									{safePathname.includes(
										"/dashboard/products/catalog/categories",
									) && <ActiveIndicator />}
									<FolderTree className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Categorías</span>
								</Link>
								<Link
									href="/dashboard/products/catalog/brands"
									className={getNavLinkClasses(
										safePathname.includes("/dashboard/products/catalog/brands"),
									)}>
									{safePathname.includes(
										"/dashboard/products/catalog/brands",
									) && <ActiveIndicator />}
									<Bookmark className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Marcas Registradas</span>
								</Link>
								<Link
									href="/dashboard/products/catalog/attributes"
									className={getNavLinkClasses(
										safePathname.includes(
											"/dashboard/products/catalog/attributes",
										),
									)}>
									{safePathname.includes(
										"/dashboard/products/catalog/attributes",
									) && <ActiveIndicator />}
									<Tag className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Atributos (PIM)</span>
								</Link>
							</div>
						</div>

						{/* Menú Expandible: Inventarios */}
						<div className="flex flex-col gap-1 pt-1">
							<SwappTooltip text={isCollapsed ? "Inventarios" : ""}>
								<button
									onClick={() =>
										handleMenuClick(isInventoryExpanded, setIsInventoryExpanded)
									}
									className={getNavButtonClasses(
										safePathname.includes("/dashboard/products/inventory"),
									)}>
									<div className="flex items-center gap-3">
										<Package
											className={`h-5 w-5 shrink-0 ${safePathname.includes("/dashboard/products/inventory") ? "text-swapp-blanco" : ""}`}
										/>
										{!isCollapsed && (
											<span className="font-medium whitespace-nowrap">
												Inventarios
											</span>
										)}
									</div>
									{!isCollapsed && (
										<ChevronDown
											className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isInventoryExpanded ? "rotate-180" : ""}`}
										/>
									)}
								</button>
							</SwappTooltip>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out flex flex-col gap-1 ${!isCollapsed && isInventoryExpanded ? "max-h-24 opacity-100 mt-1 pl-9 pr-2" : "max-h-0 opacity-0"}`}>
								<Link
									href="/dashboard/products/inventory/stock"
									className={getNavLinkClasses(
										safePathname === "/dashboard/products/inventory/stock",
									)}>
									{safePathname === "/dashboard/products/inventory/stock" && (
										<ActiveIndicator />
									)}
									<Box className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Control de Stock</span>
								</Link>
							</div>
						</div>

						{/* Menú Expandible: Costos y Precios */}
						<div className="flex flex-col gap-1 pt-1">
							<SwappTooltip text={isCollapsed ? "Precios" : ""}>
								<button
									onClick={() =>
										handleMenuClick(isPricingExpanded, setIsPricingExpanded)
									}
									className={getNavButtonClasses(
										safePathname.includes("/dashboard/products/pricing"),
									)}>
									<div className="flex items-center gap-3">
										<DollarSign
											className={`h-5 w-5 shrink-0 ${safePathname.includes("/dashboard/products/pricing") ? "text-swapp-blanco" : ""}`}
										/>
										{!isCollapsed && (
											<span className="font-medium whitespace-nowrap">
												Precios
											</span>
										)}
									</div>
									{!isCollapsed && (
										<ChevronDown
											className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isPricingExpanded ? "rotate-180" : ""}`}
										/>
									)}
								</button>
							</SwappTooltip>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out flex flex-col gap-1 ${!isCollapsed && isPricingExpanded ? "max-h-32 opacity-100 mt-1 pl-9 pr-2" : "max-h-0 opacity-0"}`}>
								<Link
									href="/dashboard/products/pricing/costs"
									className={getNavLinkClasses(
										safePathname === "/dashboard/products/pricing/costs",
									)}>
									{safePathname === "/dashboard/products/pricing/costs" && (
										<ActiveIndicator />
									)}
									<DollarSign className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Costos y Precios</span>
								</Link>
								<Link
									href="/dashboard/products/pricing/discounts"
									className={getNavLinkClasses(
										safePathname === "/dashboard/products/pricing/discounts",
									)}>
									{safePathname === "/dashboard/products/pricing/discounts" && (
										<ActiveIndicator />
									)}
									<Tag className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Ofertas Especiales</span>
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* OPERACIONES */}
				<div>
					{isCollapsed ? (
						<hr className="mx-2 mb-2 border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-all duration-300" />
					) : (
						<p className="px-3 text-xs font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-2 animate-in fade-in duration-300">
							Operaciones
						</p>
					)}
					<div className="space-y-1">
						{/* Menú Expandible: Pedidos */}
						<div className="flex flex-col gap-1 pt-1">
							<SwappTooltip text={isCollapsed ? "Pedidos" : ""}>
								<button
									onClick={() =>
										handleMenuClick(isOrdersExpanded, setIsOrdersExpanded)
									}
									className={getNavButtonClasses(
										safePathname.includes("/dashboard/orders"),
									)}>
									<div className="flex items-center gap-3">
										<ShoppingCart
											className={`h-5 w-5 shrink-0 ${safePathname.includes("/dashboard/orders") ? "text-swapp-blanco" : ""}`}
										/>
										{!isCollapsed && (
											<span className="font-medium whitespace-nowrap">
												Pedidos
											</span>
										)}
									</div>
									{!isCollapsed && (
										<ChevronDown
											className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOrdersExpanded ? "rotate-180" : ""}`}
										/>
									)}
								</button>
							</SwappTooltip>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out flex flex-col gap-1 ${!isCollapsed && isOrdersExpanded ? "max-h-32 opacity-100 mt-1 pl-9 pr-2" : "max-h-0 opacity-0"}`}>
								<Link
									href="/dashboard/orders"
									className={getNavLinkClasses(
										safePathname === "/dashboard/orders",
									)}>
									{safePathname === "/dashboard/orders" && <ActiveIndicator />}
									<ListOrdered className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Todos los Pedidos</span>
								</Link>
								<Link
									href="/dashboard/orders/new"
									className={getNavLinkClasses(
										safePathname === "/dashboard/orders/new",
									)}>
									{safePathname === "/dashboard/orders/new" && (
										<ActiveIndicator />
									)}
									<PlusSquare className="h-4 w-4 shrink-0" />
									<span className="whitespace-nowrap">Carga Manual</span>
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* USUARIOS */}
				<div>
					{isCollapsed ? (
						<hr className="mx-2 mb-2 border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-all duration-300" />
					) : (
						<p className="px-3 text-xs font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-2 animate-in fade-in duration-300">
							Usuarios
						</p>
					)}
					<div className="space-y-1">
						<SwappTooltip text={isCollapsed ? "Clientes (Próximamente)" : ""}>
							<Link
								href="#"
								className={`flex items-center gap-3 p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40 rounded-lg cursor-not-allowed ${
									isCollapsed ? "justify-center" : "px-3 py-2"
								}`}>
								<Users className="h-5 w-5 shrink-0" />
								{!isCollapsed && (
									<span className="whitespace-nowrap">
										Clientes (Próximamente)
									</span>
								)}
							</Link>
						</SwappTooltip>
					</div>
				</div>
			</nav>

			{/* SECCIÓN INFERIOR */}
			<div
				className={`border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-all duration-300 bg-swapp-tiza-verdoso/20 dark:bg-black/10 ${isCollapsed ? "p-2" : "p-4"}`}>
				<SwappTooltip
					text={
						isCollapsed && userData
							? `${userData.first_name} ${userData.last_name}`
							: ""
					}>
					<div
						className={`flex items-center gap-3 mb-2 rounded-lg bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/30 border border-swapp-tiza-verdoso dark:border-none ${isCollapsed ? "p-2 justify-center" : "px-3 py-3"}`}>
						<UserCircle className="h-8 w-8 shrink-0 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						{!isCollapsed && (
							<div className="flex flex-col overflow-hidden animate-in fade-in">
								{userData ? (
									<>
										<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco truncate whitespace-nowrap">
											{userData.first_name || "Usuario"}{" "}
											{userData.last_name || ""}
										</span>
										<span className="text-xs text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/70 truncate capitalize whitespace-nowrap">
											{userData.role
												? userData.role.replace("_", " ")
												: "Staff"}
										</span>
									</>
								) : (
									<>
										<div className="h-4 w-20 bg-swapp-azul-petroleo/10 dark:bg-swapp-tiza-verdoso/20 rounded animate-pulse mb-1"></div>
										<div className="h-3 w-12 bg-swapp-azul-petroleo/5 dark:bg-swapp-tiza-verdoso/10 rounded animate-pulse"></div>
									</>
								)}
							</div>
						)}
					</div>
				</SwappTooltip>

				{userData?.role === "super_admin" && (
					<div>
						{!isCollapsed && (
							<p className="px-3 text-xs font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-2 mt-4 animate-in fade-in">
								Super Admin
							</p>
						)}
						<div className={`space-y-1 ${isCollapsed ? "mt-2" : ""}`}>
							<SwappTooltip text={isCollapsed ? "Alta de Personal" : ""}>
								<Link
									href="/dashboard/staff/new"
									className={getBottomLinkClasses(
										safePathname === "/dashboard/staff/new",
									)}>
									{safePathname === "/dashboard/staff/new" && (
										<ActiveIndicator />
									)}
									<Settings className="h-5 w-5 shrink-0" />
									{!isCollapsed && (
										<span className="whitespace-nowrap">Alta de Personal</span>
									)}
								</Link>
							</SwappTooltip>
						</div>
					</div>
				)}

				<SwappTooltip text={isCollapsed ? "Configuración" : ""}>
					<Link
						href="/dashboard/settings"
						className={getBottomLinkClasses(
							safePathname.includes("/dashboard/settings"),
						)}>
						{safePathname.includes("/dashboard/settings") && (
							<ActiveIndicator />
						)}
						<Settings className="h-4 w-4 shrink-0" />
						{!isCollapsed && (
							<span className="whitespace-nowrap">Configuración</span>
						)}
					</Link>
				</SwappTooltip>

				<SwappTooltip text={isCollapsed ? "Cerrar sesión" : ""}>
					<button
						onClick={handleLogout}
						className={`flex items-center gap-3 p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors w-full ${
							isCollapsed ? "justify-center" : "px-3 py-2"
						}`}>
						<LogOut className="h-4 w-4 shrink-0" />
						{!isCollapsed && (
							<span className="whitespace-nowrap">Cerrar sesión</span>
						)}
					</button>
				</SwappTooltip>
			</div>
		</aside>
	);
}

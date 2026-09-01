"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);
	if (!mounted) return null;

	return (
		<div className="flex items-center gap-1 p-1 bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/50 border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo rounded-lg w-fit transition-colors">
			<button
				onClick={() => setTheme("light")}
				className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
					theme === "light"
						? "bg-swapp-blanco text-swapp-verde-oscuro shadow-sm border border-swapp-tiza-verdoso dark:border-none"
						: "text-swapp-azul-petroleo/70 hover:text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 dark:hover:text-swapp-tiza-verdoso"
				}`}>
				<Sun className="h-4 w-4" />
				<span>Claro</span>
			</button>

			<button
				onClick={() => setTheme("dark")}
				className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
					theme === "dark"
						? "bg-swapp-azul-oscuro text-swapp-verde-menta shadow-sm border border-swapp-negro"
						: "text-swapp-azul-petroleo/70 hover:text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 dark:hover:text-swapp-tiza-verdoso"
				}`}>
				<Moon className="h-4 w-4" />
				<span>Oscuro</span>
			</button>

			<button
				onClick={() => setTheme("system")}
				className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
					theme === "system"
						? "bg-swapp-blanco dark:bg-swapp-azul-oscuro text-swapp-verde-oscuro dark:text-swapp-verde-menta shadow-sm border border-swapp-tiza-verdoso dark:border-swapp-negro"
						: "text-swapp-azul-petroleo/70 hover:text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 dark:hover:text-swapp-tiza-verdoso"
				}`}>
				<Monitor className="h-4 w-4" />
				<span>Sistema</span>
			</button>
		</div>
	);
}

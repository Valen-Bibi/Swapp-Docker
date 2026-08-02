"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Box, DollarSign } from "lucide-react";

export default function CommandPalette() {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	const actions = useMemo(
		() => [
			{
				id: 1,
				name: "Ir al Catálogo Maestro",
				shortcut: "C",
				url: "/dashboard/products",
				icon: Box,
			},
			{
				id: 2,
				name: "Control de Inventario",
				shortcut: "I",
				url: "/dashboard/products/stock",
				icon: Package,
			},
			{
				id: 3,
				name: "Ajustar Precios",
				shortcut: "P",
				url: "/dashboard/products/pricing",
				icon: DollarSign,
			},
		],
		[],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				e.stopPropagation();
				setIsOpen((open) => !open);
				return;
			}

			if (e.key === "Escape") {
				setIsOpen(false);
				window.dispatchEvent(new CustomEvent("close-modals"));
				return;
			}

			const activeTag = document.activeElement?.tagName;
			const isTyping =
				activeTag === "INPUT" ||
				activeTag === "TEXTAREA" ||
				activeTag === "SELECT";

			if (isTyping) return;

			const key = e.key.toUpperCase();
			const action = actions.find((a) => a.shortcut === key);

			if (action) {
				e.preventDefault();
				setIsOpen(false);
				router.push(action.url);
			}
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });

		return () =>
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
	}, [actions, router]);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		} else {
			setSearch("");
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const filteredActions = actions.filter((action) =>
		action.name.toLowerCase().includes(search.toLowerCase()),
	);

	const handleSelect = (url: string) => {
		setIsOpen(false);
		router.push(url);
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-swapp-negro-azulado/60 backdrop-blur-sm p-4">
			<div className="w-full max-w-xl overflow-hidden rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-2xl ring-1 ring-swapp-azul-petroleo/10 dark:ring-swapp-azul-petroleo border border-transparent dark:border-swapp-azul-petroleo">
				<div className="flex items-center border-b border-swapp-tiza dark:border-swapp-azul-petroleo px-4">
					<Search className="h-5 w-5 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50" />
					<input
						ref={inputRef}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar una acción rápida..."
						className="flex-1 bg-transparent p-4 text-swapp-negro-azulado dark:text-swapp-blanco focus:outline-none placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40"
					/>
					<kbd className="hidden rounded bg-swapp-tiza dark:bg-swapp-azul-petroleo px-2 py-1 font-mono text-[10px] font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza sm:block">
						ESC
					</kbd>
				</div>

				<div className="max-h-72 overflow-y-auto p-2">
					{filteredActions.length > 0 ? (
						filteredActions.map((action) => (
							<button
								key={action.id}
								onClick={() => handleSelect(action.url)}
								className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-swapp-turquesa-oscuro/10 dark:hover:bg-swapp-menta/10 hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta text-swapp-azul-petroleo dark:text-swapp-tiza group">
								<div className="flex items-center gap-3">
									<action.icon className="h-5 w-5 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 group-hover:text-swapp-turquesa-oscuro dark:group-hover:text-swapp-menta transition-colors" />
									<span className="font-medium">{action.name}</span>
								</div>
								{action.shortcut && (
									<kbd className="rounded border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado px-2.5 py-1 font-mono text-[10px] font-bold text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 shadow-sm">
										{action.shortcut}
									</kbd>
								)}
							</button>
						))
					) : (
						<div className="p-8 text-center text-sm text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50">
							No se encontraron resultados para "{search}".
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

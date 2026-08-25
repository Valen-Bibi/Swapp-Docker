"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface Option {
	label: string;
	value: string;
}

interface Props {
	options: Option[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function SwappSearchableSelect({
	options,
	value,
	onChange,
	placeholder = "Seleccionar...",
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Cerrar el dropdown al hacer clic afuera
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Filtrar las opciones según el buscador
	const filteredOptions = options.filter((opt) =>
		opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<div ref={wrapperRef} className="relative w-full">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full flex items-center justify-between rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta`}>
				<span className={selectedOption ? "" : "text-swapp-azul-petroleo/50"}>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown
					className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute z-[100] mt-1 w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-xl animate-in fade-in zoom-in-95">
					<div className="p-2 border-b border-swapp-tiza dark:border-swapp-azul-petroleo flex items-center gap-2">
						<Search className="h-4 w-4 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 shrink-0" />
						<input
							type="text"
							className="w-full bg-transparent text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none placeholder:text-swapp-azul-petroleo/50 dark:placeholder:text-swapp-tiza/50"
							placeholder="Buscar..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
						{filteredOptions.length === 0 ? (
							<div className="p-3 text-sm text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 text-center">
								No se encontraron resultados
							</div>
						) : (
							filteredOptions.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => {
										onChange(opt.value);
										setIsOpen(false);
										setSearchTerm("");
									}}
									className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left ${
										value === opt.value
											? "bg-swapp-turquesa-oscuro/10 dark:bg-swapp-menta/10 text-swapp-turquesa-oscuro dark:text-swapp-menta font-medium"
											: "text-swapp-negro-azulado dark:text-swapp-blanco hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-petroleo/50"
									}`}>
									{opt.label}
									{value === opt.value && (
										<Check className="h-4 w-4 shrink-0" />
									)}
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}

"use client"; // Obligatorio porque ahora usamos Hooks de estado

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SwappTooltipProps {
	children: React.ReactNode;
	text: string;
	shortcut?: string;
}

export function SwappTooltip({ children, text, shortcut }: SwappTooltipProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [coords, setCoords] = useState({ left: 0, top: 0 });
	const triggerRef = useRef<HTMLDivElement>(null);

	// Estado para evitar errores de hidratación en Next.js (SSR)
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Función que calcula la posición exacta del botón en la pantalla
	const updatePosition = () => {
		if (triggerRef.current) {
			const rect = triggerRef.current.getBoundingClientRect();

			// Calculamos el centro horizontal del botón y le restamos 8px de altura
			setCoords({
				left: rect.left + rect.width / 2,
				top: rect.top - 8,
			});
		}
	};

	const handleMouseEnter = () => {
		updatePosition();
		setIsVisible(true);
	};

	const handleMouseLeave = () => {
		setIsVisible(false);
	};

	// Recalcula la posición si el usuario hace scroll mientras mantiene el mouse arriba
	useEffect(() => {
		if (!isVisible) return;

		const handleScrollOrResize = () => updatePosition();

		// El tercer parámetro 'true' (fase de captura) es clave para interceptar
		// el scroll dentro de contenedores internos como tu tabla.
		window.addEventListener("scroll", handleScrollOrResize, true);
		window.addEventListener("resize", handleScrollOrResize);

		return () => {
			window.removeEventListener("scroll", handleScrollOrResize, true);
			window.removeEventListener("resize", handleScrollOrResize);
		};
	}, [isVisible]);

	return (
		<>
			{/* Elemento Disparador (El botón) */}
			<div
				ref={triggerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onFocus={handleMouseEnter} // Soporte para navegación por teclado
				onBlur={handleMouseLeave}
				className="inline-flex">
				{children}
			</div>

			{/* El Tooltip Flotante (Renderizado mágicamente en el <body>) */}
			{mounted &&
				isVisible &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[99999] flex -translate-x-1/2 -translate-y-full items-center gap-2 whitespace-nowrap rounded-md bg-swapp-negro-azulado dark:bg-swapp-tiza px-2.5 py-1.5 text-xs text-swapp-blanco dark:text-swapp-negro-azulado shadow-lg animate-in fade-in zoom-in-95 duration-200"
						style={{
							left: coords.left,
							top: coords.top,
						}}>
						<span>{text}</span>
						{shortcut && (
							<kbd className="rounded border border-swapp-tiza/20 dark:border-swapp-azul-petroleo/20 bg-swapp-azul-petroleo/50 dark:bg-swapp-azul-petroleo/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-swapp-tiza dark:text-swapp-azul-petroleo">
								{shortcut}
							</kbd>
						)}
						<div className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-swapp-negro-azulado dark:border-t-swapp-tiza"></div>
					</div>,
					document.body,
				)}
		</>
	);
}

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
		// BLOQUEO: Si el texto está vacío, no disparamos el tooltip
		if (!text || text.trim() === "") return;

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

	// Efecto de seguridad: Si el tooltip está abierto pero el padre cambia
	// el prop "text" a vacío de forma reactiva, lo ocultamos inmediatamente.
	useEffect(() => {
		if (isVisible && (!text || text.trim() === "")) {
			setIsVisible(false);
		}
	}, [text, isVisible]);

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
				text &&
				text.trim() !== "" &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[99999] flex -translate-x-1/2 -translate-y-full items-center gap-2 whitespace-nowrap rounded-md bg-swapp-blanco/70 dark:bg-swapp-azul-oscuro/70 backdrop-blur-md border border-swapp-azul-petroleo/10 dark:border-swapp-tiza-verdoso/10 px-2.5 py-1.5 text-xs text-swapp-azul-oscuro dark:text-swapp-blanco shadow-lg animate-in fade-in zoom-in-95 duration-200"
						style={{
							left: coords.left,
							top: coords.top,
						}}>
						<span>{text}</span>
						{shortcut && (
							<kbd className="rounded border border-swapp-azul-petroleo/20 dark:border-swapp-tiza-verdoso/20 bg-swapp-azul-petroleo/5 dark:bg-swapp-tiza-verdoso/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
								{shortcut}
							</kbd>
						)}
					</div>,
					document.body,
				)}
		</>
	);
}

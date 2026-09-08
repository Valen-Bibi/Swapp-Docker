import React, { ReactNode } from "react";

interface GlassTableWrapperProps {
	children: ReactNode;
	containerClassName?: string;
	tableClassName?: string;
}

export default function GlassTableWrapper({
	children,
	containerClassName = "",
	tableClassName = "",
}: GlassTableWrapperProps) {
	return (
		<div
			className={`rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-xl transition-all duration-300 overflow-visible sm:overflow-auto ${containerClassName}`}>
			<table
				className={`w-full text-left text-sm text-swapp-azul-oscuro dark:text-swapp-blanco ${tableClassName}`}>
				{children}
			</table>
		</div>
	);
}

import React, { ReactNode } from "react";

interface GlassTableHeadProps {
	children: ReactNode;
}

export default function GlassTableHead({ children }: GlassTableHeadProps) {
	return (
		<thead className="bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo select-none">
			<tr>{children}</tr>
		</thead>
	);
}

interface GlassThProps {
	children: ReactNode;
	className?: string;
	align?: "left" | "center" | "right";
}

export function GlassTh({
	children,
	className = "",
	align = "left",
}: GlassThProps) {
	const alignClass =
		align === "right"
			? "text-right"
			: align === "center"
				? "text-center"
				: "text-left";

	return (
		<th
			className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/70 ${alignClass} ${className}`}>
			{children}
		</th>
	);
}

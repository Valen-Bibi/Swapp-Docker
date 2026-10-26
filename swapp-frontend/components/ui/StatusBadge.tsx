import React from "react";
import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
	children: React.ReactNode;
	variant?: "success" | "warning" | "danger" | "primary" | "info" | "neutral";
	icon?: LucideIcon;
	className?: string;
}

export default function StatusBadge({
	children,
	variant = "neutral",
	icon: Icon,
	className = "",
}: StatusBadgeProps) {
	const baseClasses =
		"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm transition-colors whitespace-nowrap";

	const variantClasses = {
		success:
			"border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
		warning:
			"border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
		danger: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
		primary:
			"border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta",
		info: "border-swapp-azul-oceano/20 bg-swapp-azul-oceano/10 text-swapp-azul-oceano dark:text-swapp-verde-menta",
		neutral:
			"border-swapp-azul-petroleo/20 bg-swapp-azul-petroleo/10 text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso",
	};

	return (
		<span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
			{Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
			{children}
		</span>
	);
}

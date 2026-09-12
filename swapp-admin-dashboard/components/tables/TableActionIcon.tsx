import React from "react";
import { LucideIcon } from "lucide-react";
import { SwappTooltip } from "@/components/ui/SwappTooltip";

interface TableActionIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: LucideIcon;
	tooltip: string;
	// 1. ACÁ AGREGAMOS "glass-warning" AL TIPO:
	variant?: "default" | "danger" | "glass-primary" | "glass-success" | "glass-danger" | "glass-warning";
	size?: "sm" | "md";
}

export default function TableActionIcon({
	icon: Icon,
	tooltip,
	variant = "default",
	size = "md",
	className = "",
	...props
}: TableActionIconProps) {
	const baseClasses = "rounded-md transition-colors shadow-sm flex items-center justify-center";
	
	const sizeClasses = {
		sm: "p-1.5",
		md: "p-2",
	};

	const variantClasses = {
		default: "text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo",
		danger: "text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10",
		"glass-primary": "border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta hover:bg-swapp-verde-oscuro/20 dark:hover:bg-swapp-verde-menta/20",
		"glass-success": "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
		"glass-danger": "border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
        "glass-warning": "border border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/20",
	};

	return (
		<SwappTooltip text={tooltip}>
			<button
				className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
				{...props}
			>
				<Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
			</button>
		</SwappTooltip>
	);
}
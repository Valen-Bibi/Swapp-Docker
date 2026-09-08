import React from "react";
import { LucideIcon } from "lucide-react";
import { SwappTooltip } from "@/components/ui/SwappTooltip";

interface TableActionIconProps {
	icon: LucideIcon;
	tooltip: string;
	onClick: (e?: React.MouseEvent) => void;
	variant?:
		| "default"
		| "danger"
		| "glass-success"
		| "glass-danger"
		| "glass-primary";
	size?: "sm" | "md";
	disabled?: boolean;
}

export default function TableActionIcon({
	icon: Icon,
	tooltip,
	onClick,
	variant = "default",
	size = "md",
	disabled = false,
}: TableActionIconProps) {
	const baseClasses =
		"rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

	const paddingClasses = size === "md" ? "p-2" : "p-1.5";
	const iconClasses = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

	const variantClasses = {
		default:
			"text-swapp-azul-petroleo/50 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-verde-menta hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo",
		danger:
			"text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10",
		"glass-success":
			"border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm",
		"glass-danger":
			"border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 shadow-sm",
		"glass-primary":
			"border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 text-swapp-verde-oscuro dark:text-swapp-verde-menta hover:bg-swapp-verde-oscuro/20 dark:hover:bg-swapp-verde-menta/20 shadow-sm",
	};

	return (
		<SwappTooltip text={tooltip}>
			<button
				type="button"
				onClick={onClick}
				disabled={disabled}
				className={`${baseClasses} ${paddingClasses} ${variantClasses[variant]}`}>
				<Icon className={iconClasses} />
			</button>
		</SwappTooltip>
	);
}

import React from "react";
import { LucideIcon } from "lucide-react";
import { SwappToggle } from "@/components/ui/SwappToggle"; // Asumo que este ya existe en tu proyecto

interface GlassFilterToggleProps {
	id: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	labelOn: string;
	labelOff?: string;
	icon?: LucideIcon;
	iconActiveColor?: string;
}

export default function GlassFilterToggle({
	id,
	checked,
	onChange,
	labelOn,
	labelOff,
	icon: Icon,
	iconActiveColor = "text-swapp-verde-oscuro dark:text-swapp-verde-menta",
}: GlassFilterToggleProps) {
	const currentLabel = checked ? labelOn : labelOff || labelOn;
	const iconInactiveColor =
		"text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50";
	const currentIconColor = checked ? iconActiveColor : iconInactiveColor;

	return (
		<div className="flex items-center gap-3 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors shadow-sm">
			{Icon && (
				<Icon className={`h-4 w-4 transition-colors ${currentIconColor}`} />
			)}
			<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso whitespace-nowrap transition-colors">
				{currentLabel}
			</span>
			<SwappToggle checked={checked} onChange={onChange} id={id} />
		</div>
	);
}

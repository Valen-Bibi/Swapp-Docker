import React from "react";

interface Option {
	value: string | number;
	label: string;
}

interface SwappSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	options: Option[];
	placeholder?: string;
}

export function SwappSelect({
	label,
	options,
	placeholder = "Seleccione una opción...",
	className = "",
	...props
}: SwappSelectProps) {
	return (
		<div className={className}>
			{label && (
				<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-1 transition-colors">
					{label}
				</label>
			)}
			<select
				{...props}
				className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/30 p-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco focus:outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors">
				<option
					value=""
					className="bg-swapp-tiza-verdoso dark:bg-swapp-azul-oscuro text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
					{placeholder}
				</option>
				{options.map((opt) => (
					<option
						key={opt.value}
						value={opt.value}
						className="bg-swapp-tiza-verdoso dark:bg-swapp-azul-oscuro text-swapp-azul-oscuro dark:text-swapp-blanco">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

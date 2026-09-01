import React from "react";

interface Option {
	value: string | number;
	label: string;
}

interface SwappSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label: string;
	options: Option[];
}

export function SwappSelect({
	label,
	options,
	className = "",
	...props
}: SwappSelectProps) {
	return (
		<div className={className}>
			<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-1 transition-colors">
				{label}
			</label>
			<select
				{...props}
				className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro p-2.5 text-swapp-azul-oscuro dark:text-swapp-blanco focus:outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors">
				<option value="" disabled hidden className="dark:bg-swapp-azul-oscuro">
					Seleccione una opción...
				</option>
				{options.map((opt) => (
					<option
						key={opt.value}
						value={opt.value}
						className="dark:bg-swapp-azul-oscuro">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

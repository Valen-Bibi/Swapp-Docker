import React from "react";

interface SwappCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

export function SwappCheckbox({
	label,
	className = "",
	...props
}: SwappCheckboxProps) {
	return (
		<div className={`flex items-center ${className}`}>
			<input
				{...props}
				type="checkbox"
				className="h-4 w-4 rounded border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo text-swapp-turquesa-oscuro dark:text-swapp-menta focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta bg-swapp-blanco dark:bg-swapp-negro-azulado transition-colors cursor-pointer"
			/>
			<label
				htmlFor={props.id}
				className="ml-2 text-sm text-swapp-azul-petroleo dark:text-swapp-tiza font-medium cursor-pointer select-none transition-colors">
				{label}
			</label>
		</div>
	);
}

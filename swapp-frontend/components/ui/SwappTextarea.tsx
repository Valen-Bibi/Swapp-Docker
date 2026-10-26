import React from "react";

interface SwappTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string;
}

export function SwappTextarea({
	label,
	className = "",
	...props
}: SwappTextareaProps) {
	return (
		<div className={className}>
			<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-1 transition-colors">
				{label}
			</label>
			<textarea
				{...props}
				className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro p-2.5 text-swapp-azul-oscuro dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40 focus:outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors resize-y min-h-[80px]"
			/>
		</div>
	);
}

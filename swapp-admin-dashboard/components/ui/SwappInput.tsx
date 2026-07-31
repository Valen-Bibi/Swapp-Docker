import React from "react";

interface SwappInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	helpText?: string;
}

export function SwappInput({
	label,
	helpText,
	className = "",
	...props
}: SwappInputProps) {
	return (
		<div className={className}>
			<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza mb-1 transition-colors">
				{label}
			</label>
			<input
				{...props}
				className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-2.5 text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 focus:outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta transition-colors disabled:bg-swapp-tiza/50 dark:disabled:bg-swapp-azul-petroleo/50 disabled:text-swapp-azul-petroleo/50 dark:disabled:text-swapp-tiza/50"
			/>
			{helpText && (
				<p className="mt-1 text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 transition-colors">
					{helpText}
				</p>
			)}
		</div>
	);
}

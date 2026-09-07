import React from "react";
import { Check } from "lucide-react";

interface SwappCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

export function SwappCheckbox({
	label,
	className = "",
	...props
}: SwappCheckboxProps) {
	return (
		<label
			className={`flex items-start gap-2.5 cursor-pointer group w-fit ${className}`}>
			{/* Contenedor relativo que mantiene juntos el input y el ícono */}
			<div className="relative flex items-center justify-center shrink-0 mt-[2px]">
				<input
					{...props}
					type="checkbox"
					className="peer h-4 w-4 appearance-none rounded-[4px] border-2 border-swapp-azul-petroleo/20 bg-swapp-blanco dark:border-swapp-azul-petroleo dark:bg-swapp-azul-oscuro/50 group-hover:border-swapp-verde-oscuro/50 dark:group-hover:border-swapp-verde-menta/50 checked:!bg-swapp-verde-oscuro checked:!border-swapp-verde-oscuro dark:checked:!bg-swapp-verde-menta dark:checked:!border-swapp-verde-menta focus:outline-none focus:ring-2 focus:ring-swapp-verde-oscuro/20 dark:focus:ring-swapp-verde-menta/20 transition-all cursor-pointer m-0"
				/>

				{/* Ícono absoluto que "escucha" al peer. Agregamos un efecto de escala (scale-50 a 100) para un "pop" animado */}
				<Check
					className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 h-3 w-3 text-swapp-blanco dark:text-swapp-azul-oscuro transition-all duration-200 scale-50 peer-checked:scale-100"
					strokeWidth={4}
				/>
			</div>

			<span className="text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso font-medium select-none transition-colors">
				{label}
			</span>
		</label>
	);
}

import React, { ReactNode } from "react";

interface AnimatedTableRowProps {
	isExpanded: boolean;
	colSpan: number;
	children: ReactNode;
}

export default function AnimatedTableRow({
	isExpanded,
	colSpan,
	children,
}: AnimatedTableRowProps) {
	return (
		<tr
			className={`bg-swapp-azul-petroleo/2 dark:bg-swapp-azul-petroleo/10 transition-colors duration-300 ${
				isExpanded
					? "border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50"
					: "border-b-0"
			}`}>
			<td colSpan={colSpan} className="p-0">
				{/* MAGIA DEL ACORDEÓN: De 0fr a 1fr */}
				<div
					className={`grid transition-all duration-300 ease-in-out ${
						isExpanded
							? "grid-rows-[1fr] opacity-100"
							: "grid-rows-[0fr] opacity-0"
					}`}>
					<div className="overflow-hidden">
						{/* ESPACIADO INTERNO */}
						<div className="px-6 py-4 flex flex-col gap-4">
							{/* CONTENEDOR GLASSMORPHISM ESTANDARIZADO PARA LA SUB-TABLA */}
							<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 overflow-hidden bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-sm">
								{children}
							</div>
						</div>
					</div>
				</div>
			</td>
		</tr>
	);
}

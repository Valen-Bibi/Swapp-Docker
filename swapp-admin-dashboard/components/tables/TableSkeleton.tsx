export default function TableSkeleton() {
	return (
		<div className="p-6 relative">
			{/* MOCK DEL HEADER (Para mantener la estructura visual durante la carga) */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-lg bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo animate-pulse"></div>
					<div className="space-y-2">
						<div className="h-6 w-48 rounded bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo animate-pulse"></div>
						<div className="h-4 w-32 rounded bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/50 animate-pulse"></div>
					</div>
				</div>
				<div className="h-10 w-32 rounded-lg bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo animate-pulse hidden sm:block"></div>
			</div>

			{/* CONTENEDOR DE LA TABLA: Le aplicamos el efecto Glassmorphism y bordes más sutiles */}
			<div className="overflow-hidden rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					
					{/* THEAD: Fondo muy sutil para diferenciar de los datos */}
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60">
						<tr>
							{[...Array(6)].map((_, i) => (
								<th 
									key={i} 
									className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60"
								>
									{/* Hacemos la barrita del esqueleto más fina (h-3) para reflejar que el texto del título es más pequeño */}
									<div className="h-3 w-20 rounded bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo animate-pulse"></div>
								</th>
							))}
						</tr>
					</thead>

					{/* TBODY: Eliminé el 'divide-y' del padre para controlar mejor el hover y los bordes directamente en la fila */}
					<tbody>
						{[...Array(6)].map((_, rowIndex) => (
							<tr 
								key={rowIndex}
								// PUNTO 2: Efecto Hover sobre la fila + Líneas divisorias.
								// El 'last:border-0' evita que se dibuje una línea extra debajo de la última fila.
								className="border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20 transition-colors duration-200 last:border-0"
							>
								{[...Array(6)].map((_, colIndex) => (
									<td key={colIndex} className="px-6 py-4">
										{/* Barritas de datos ligeramente atenuadas para un pulso menos agresivo */}
										<div className="h-4 w-full max-w-[120px] rounded bg-swapp-tiza-verdoso/70 dark:bg-swapp-azul-petroleo/50 animate-pulse"></div>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
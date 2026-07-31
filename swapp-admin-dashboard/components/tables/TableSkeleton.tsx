export default function TableSkeleton() {
	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-lg bg-swapp-tiza dark:bg-swapp-azul-petroleo animate-pulse"></div>
					<div className="space-y-2">
						<div className="h-6 w-48 rounded bg-swapp-tiza dark:bg-swapp-azul-petroleo animate-pulse"></div>
						<div className="h-4 w-32 rounded bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/50 animate-pulse"></div>
					</div>
				</div>
				<div className="h-10 w-32 rounded-lg bg-swapp-tiza dark:bg-swapp-azul-petroleo animate-pulse hidden sm:block"></div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza dark:border-swapp-azul-petroleo">
						<tr>
							{[...Array(6)].map((_, i) => (
								<th key={i} className="px-6 py-4">
									<div className="h-4 w-24 rounded bg-swapp-tiza dark:bg-swapp-azul-petroleo animate-pulse"></div>
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza/50 dark:divide-swapp-azul-petroleo/50">
						{[...Array(6)].map((_, rowIndex) => (
							<tr key={rowIndex}>
								{[...Array(6)].map((_, colIndex) => (
									<td key={colIndex} className="px-6 py-4">
										<div className="h-4 w-full max-w-[120px] rounded bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/50 animate-pulse"></div>
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

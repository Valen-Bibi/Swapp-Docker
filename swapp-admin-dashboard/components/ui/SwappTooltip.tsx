import React from "react";

interface SwappTooltipProps {
	children: React.ReactNode;
	text: string;
	shortcut?: string;
}

export function SwappTooltip({ children, text, shortcut }: SwappTooltipProps) {
	return (
		<div className="group relative inline-flex">
			{children}

			<div className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md bg-swapp-negro-azulado dark:bg-swapp-tiza px-2.5 py-1.5 text-xs text-swapp-blanco dark:text-swapp-negro-azulado opacity-0 shadow-lg transition-all group-hover:opacity-100 z-50">
				<span>{text}</span>
				{shortcut && (
					<kbd className="rounded border border-swapp-tiza/20 dark:border-swapp-azul-petroleo/20 bg-swapp-azul-petroleo/50 dark:bg-swapp-azul-petroleo/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-swapp-tiza dark:text-swapp-azul-petroleo">
						{shortcut}
					</kbd>
				)}
				<div className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-swapp-negro-azulado dark:border-t-swapp-tiza"></div>
			</div>
		</div>
	);
}

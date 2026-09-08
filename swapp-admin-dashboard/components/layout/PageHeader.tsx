"use client";

import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface PageHeaderProps {
	title: string;
	description: string;
	icon: LucideIcon;
}

export default function PageHeader({
	title,
	description,
	icon: Icon,
}: PageHeaderProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(false);

		const timer = setTimeout(() => setIsMounted(true), 50);

		return () => clearTimeout(timer);
	}, [title]);

	return (
		<div
			className={`flex items-center gap-4 transition-all duration-500 ease-out transform ${
				isMounted ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
			}`}>
			<div className="rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md p-2.5 text-swapp-verde-oscuro dark:text-swapp-verde-menta shadow-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 transition-colors">
				<Icon className="h-6 w-6" />
			</div>
			<div className="flex flex-col">
				<h1 className="text-3xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight transition-colors">
					{title}
				</h1>
				<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-0.5 transition-colors">
					{description}
				</p>
			</div>
		</div>
	);
}

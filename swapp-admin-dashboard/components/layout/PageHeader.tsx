import { LucideIcon } from "lucide-react";

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
	return (
		<div className="flex items-center gap-3">
			<div className="rounded-lg bg-swapp-blanco dark:bg-swapp-azul-oscuro p-2 text-swapp-verde-oscuro dark:text-swapp-verde-menta shadow-sm border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo">
				<Icon className="h-6 w-6" />
			</div>
			<div>
				<h1 className="text-3xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
					{title}
				</h1>
				<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
					{description}
				</p>
			</div>
		</div>
	);
}

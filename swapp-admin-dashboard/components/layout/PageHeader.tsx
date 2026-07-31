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
			<div className="rounded-lg bg-swapp-blanco dark:bg-swapp-negro-azulado p-2 text-swapp-turquesa-oscuro dark:text-swapp-menta shadow-sm border border-swapp-tiza dark:border-swapp-azul-petroleo">
				<Icon className="h-6 w-6" />
			</div>
			<div>
				<h1 className="text-3xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
					{title}
				</h1>
				<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
					{description}
				</p>
			</div>
		</div>
	);
}

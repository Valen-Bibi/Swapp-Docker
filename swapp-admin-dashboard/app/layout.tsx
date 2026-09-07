import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Swapp | Panel Administrativo",
	description: "Sistema inteligente de gestión de envases y catálogo maestro",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{children}

					{/* TOASTER GLOBAL CON ESTÉTICA DE CRISTAL (GLASSMORPHISM) */}
					<Toaster
						position="bottom-right"
						toastOptions={{
							classNames: {
								toast:
									"group flex w-full items-center justify-between space-x-4 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo p-4 shadow-2xl backdrop-blur-md transition-all font-sans",

								title:
									"text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco",
								description:
									"text-xs text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/80",
								default: "bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40",
								success:
									"bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 border-l-4 border-l-swapp-verde-oscuro dark:border-l-swapp-verde-menta",
								error:
									"bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 border-l-4 border-l-red-500",
								actionButton:
									"bg-swapp-verde-pastel dark:bg-swapp-verde-menta text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-oscuro transition-colors",
								cancelButton:
									"bg-transparent text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 transition-colors",
							},
						}}
					/>
				</ThemeProvider>
			</body>
		</html>
	);
}

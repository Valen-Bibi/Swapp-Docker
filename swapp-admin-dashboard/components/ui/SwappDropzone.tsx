"use client";

import React, { useCallback } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { UploadCloud, FileImage, Loader2 } from "lucide-react";

interface SwappDropzoneProps {
	onDropAction: (acceptedFiles: File[]) => void;
	label?: string;
	helpText?: string;
	maxFiles?: number;
	maxSize?: number; // Tamaño en bytes
	accept?: DropzoneOptions["accept"];
	isUploading?: boolean;
	className?: string;
}

export function SwappDropzone({
	onDropAction,
	label = "Subir imagen",
	helpText = "Arrastrá y soltá tus imágenes acá, o hacé clic para buscar en tu equipo.",
	maxFiles = 1,
	maxSize = 5242880, // 5MB por defecto para proteger el backend
	accept = {
		"image/jpeg": [".jpg", ".jpeg"],
		"image/png": [".png"],
		"image/webp": [".webp"],
	},
	isUploading = false,
	className = "",
}: SwappDropzoneProps) {
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles.length > 0) {
				onDropAction(acceptedFiles);
			}
		},
		[onDropAction],
	);

	const { getRootProps, getInputProps, isDragActive, isDragReject } =
		useDropzone({
			onDrop,
			accept,
			maxFiles,
			maxSize,
			disabled: isUploading,
		});

	return (
		<div className={`space-y-2 ${className}`}>
			{label && (
				<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza transition-colors">
					{label}
				</label>
			)}
			<div
				{...getRootProps()}
				className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl outline-none transition-all duration-200 ease-in-out
				${
					isUploading
						? "bg-swapp-tiza/50 border-swapp-azul-petroleo/20 dark:bg-swapp-azul-petroleo/30 dark:border-swapp-tiza/20 cursor-not-allowed"
						: isDragReject
							? "bg-red-50 border-red-500 dark:bg-red-900/10"
							: isDragActive
								? "bg-swapp-turquesa-oscuro/10 border-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:border-swapp-menta cursor-copy"
								: "bg-swapp-blanco border-swapp-azul-petroleo/30 dark:bg-swapp-negro-azulado dark:border-swapp-tiza/30 hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-petroleo/50 hover:border-swapp-turquesa-oscuro dark:hover:border-swapp-menta cursor-pointer"
				}
				`}>
				<input {...getInputProps()} />

				{isUploading ? (
					<div className="flex flex-col items-center text-swapp-turquesa-oscuro dark:text-swapp-menta">
						<Loader2 className="h-10 w-10 animate-spin mb-3" />
						<p className="text-sm font-medium">Optimizando y subiendo...</p>
					</div>
				) : (
					<div className="flex flex-col items-center text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60">
						{isDragActive && !isDragReject ? (
							<UploadCloud className="h-10 w-10 mb-3 text-swapp-turquesa-oscuro dark:text-swapp-menta animate-bounce" />
						) : (
							<FileImage className="h-10 w-10 mb-3" />
						)}

						<p className="text-sm font-medium text-center">
							{isDragReject
								? "Formato o peso no soportado."
								: isDragActive
									? "Soltá la imagen acá..."
									: "Hacé clic o arrastrá tus archivos"}
						</p>
						<p className="text-xs mt-2 text-center max-w-xs">{helpText}</p>
					</div>
				)}
			</div>
		</div>
	);
}

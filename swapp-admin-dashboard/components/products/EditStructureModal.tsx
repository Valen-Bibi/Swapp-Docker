"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import { Product, Brand } from "@/types/product";

interface EditStructureModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	brands: Brand[];
	onSuccess: () => void;
}

export default function EditStructureModal({
	isOpen,
	onClose,
	product,
	brands,
	onSuccess,
}: EditStructureModalProps) {
	const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
	const [isSaving, setIsSaving] = useState(false);

	const [newImageFile, setNewImageFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [mainMediaUuid, setMainMediaUuid] = useState<string | null>(null);

	const [existingGallery, setExistingGallery] = useState<any[]>([]);
	const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
	const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

	// NUEVO ESTADO: Cola de imágenes para borrar solo si se guarda
	const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

	useEffect(() => {
		if (isOpen && product) {
			setEditingProduct(product);

			setNewImageFile(null);
			setNewGalleryFiles([]);
			setNewGalleryPreviews([]);
			setMediaToDelete([]); // Reiniciamos la cola al abrir el modal

			const mainMedia = product.media?.find(
				(m: any) =>
					m.media_type === "image" && m.media_subtype === "main" && m.is_active,
			);
			setPreviewUrl(mainMedia ? mainMedia.file_url : null);
			setMainMediaUuid(mainMedia ? mainMedia.media_uuid : null);

			const galleryMedia = product.media?.filter(
				(m: any) =>
					m.media_type === "image" &&
					m.media_subtype === "gallery" &&
					m.is_active,
			);
			setExistingGallery(galleryMedia || []);
		}
	}, [isOpen, product]);

	if (!isOpen || !product) return null;

	const handleImageDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;

		if (previewUrl) {
			const userConfirmed = window.confirm(
				"Esta nueva imagen reemplazará a la actual como imagen principal del producto en la tienda. ¿Deseas continuar?",
			);
			if (!userConfirmed) return;

			// Si el usuario sube una foto nueva, mandamos la vieja a la cola de borrado
			if (mainMediaUuid && !mediaToDelete.includes(mainMediaUuid)) {
				setMediaToDelete((prev) => [...prev, mainMediaUuid]);
			}
		}

		setNewImageFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	// AHORA ES SÍNCRONO: Solo oculta y encola
	const handleRemoveImage = () => {
		const userConfirmed = window.confirm(
			"¿Estás seguro de que querés eliminar la imagen principal? El producto quedará sin foto en la tienda.",
		);
		if (!userConfirmed) return;

		if (mainMediaUuid && !mediaToDelete.includes(mainMediaUuid)) {
			setMediaToDelete((prev) => [...prev, mainMediaUuid]);
		}

		setNewImageFile(null);
		setPreviewUrl(null);
	};

	const handleGalleryDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;

		setNewGalleryFiles((prev) => [...prev, ...acceptedFiles]);
		const tempUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
		setNewGalleryPreviews((prev) => [...prev, ...tempUrls]);
	};

	const removeNewGalleryImage = (indexToRemove: number) => {
		setNewGalleryFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
		setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
	};

	// AHORA ES SÍNCRONO: Solo oculta y encola
	const removeExistingGalleryImage = (media_uuid: string) => {
		const userConfirmed = window.confirm(
			"¿Seguro que querés eliminar esta imagen de la galería?",
		);
		if (!userConfirmed) return;

		if (!mediaToDelete.includes(media_uuid)) {
			setMediaToDelete((prev) => [...prev, media_uuid]);
		}

		setExistingGallery((prev) =>
			prev.filter((m) => m.media_uuid !== media_uuid),
		);
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingProduct || !editingProduct.product_uuid) return;

		setIsSaving(true);
		const toastId = toast.loading("Procesando actualización...");

		try {
			// 1. EJECUTAR LOS BORRADOS ENCOLADOS PRIMERO
			if (mediaToDelete.length > 0) {
				toast.loading("Limpiando imágenes eliminadas...", { id: toastId });
				// Usamos Promise.all para que todas las peticiones DELETE se hagan en paralelo
				await Promise.all(
					mediaToDelete.map((uuid) =>
						ProductService.deleteMedia(editingProduct.product_uuid!, uuid),
					),
				);
			}

			if (newImageFile) {
				toast.loading("Actualizando imagen principal...", { id: toastId });
				await ProductService.uploadMainImage(
					editingProduct.product_uuid,
					newImageFile,
				);
			}

			if (newGalleryFiles.length > 0) {
				toast.loading(
					`Subiendo ${newGalleryFiles.length} imágenes a la galería...`,
					{ id: toastId },
				);
				await ProductService.uploadGalleryImages(
					editingProduct.product_uuid,
					newGalleryFiles,
				);
			}

			toast.loading("Guardando información general...", { id: toastId });
			const { media, ...safeUpdateData } = editingProduct as any;

			await ProductService.update(editingProduct.product_uuid, {
				...safeUpdateData,
				brand_id: safeUpdateData.brand_id || null,
			});

			toast.success("Producto actualizado completamente", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar.", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta transition-colors">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						Editar Producto: {editingProduct.name}
					</h2>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleEditSubmit} className="space-y-6">
					{/* DATOS GENERALES */}
					<div className="space-y-4">
						<SwappInput
							label="Nombre Comercial"
							required
							value={editingProduct.name || ""}
							onChange={(e) =>
								setEditingProduct({
									...editingProduct,
									name: e.target.value,
								})
							}
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									Marca Registrada
								</label>
								<select
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
									value={editingProduct.brand_id || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											brand_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}>
									<option value="" className="dark:bg-swapp-negro-azulado">
										Sin marca asignada
									</option>
									{brands.map((b) => (
										<option
											key={b.brand_id}
											value={b.brand_id}
											className="dark:bg-swapp-negro-azulado">
											{b.name}
										</option>
									))}
								</select>
							</div>
							<SwappInput
								label="SKU"
								value={editingProduct.sku || ""}
								onChange={(e) =>
									setEditingProduct({ ...editingProduct, sku: e.target.value })
								}
							/>
						</div>

						<SwappInput
							label="URL Amigable (Slug)"
							required
							value={editingProduct.slug || ""}
							onChange={(e) =>
								setEditingProduct({ ...editingProduct, slug: e.target.value })
							}
						/>
					</div>

					{/* MULTIMEDIA */}
					<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 space-y-6 transition-colors">
						<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
							Gestión Multimedia
						</h3>

						{/* Fila 1: Imagen Principal */}
						<div className="flex gap-4 items-start">
							<div className="flex-1">
								<SwappDropzone
									label="Imagen Principal (Reemplazar)"
									helpText="JPG, PNG o WEBP. Max 5MB."
									onDropAction={handleImageDrop}
									className="w-full"
								/>
							</div>
							{previewUrl ? (
								<div className="relative shrink-0 mt-6">
									<img
										src={previewUrl}
										alt="Principal"
										className="h-28 w-28 object-cover rounded-xl border-2 border-swapp-turquesa-oscuro dark:border-swapp-menta shadow-sm"
									/>
									<button
										type="button"
										onClick={handleRemoveImage}
										className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
										title="Eliminar imagen principal">
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							) : (
								<div className="shrink-0 mt-6 h-28 w-28 rounded-xl border-2 border-dashed border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/30 flex items-center justify-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 text-xs text-center p-2">
									Sin principal
								</div>
							)}
						</div>

						{/* Fila 2: Galería */}
						<div className="space-y-4 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo border-dashed">
							<SwappDropzone
								label="Agregar a la Galería"
								helpText="Podés subir varias imágenes extra."
								onDropAction={handleGalleryDrop}
								maxFiles={5}
							/>

							{/* Render de imágenes existentes + nuevas */}
							{(existingGallery.length > 0 ||
								newGalleryPreviews.length > 0) && (
								<div className="flex flex-wrap gap-4 mt-2 bg-swapp-tiza/20 dark:bg-swapp-azul-petroleo/20 p-4 rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo">
									{/* Existentes (En la nube) */}
									{existingGallery.map((m: any) => (
										<div
											key={m.media_uuid}
											className="relative inline-block animate-in fade-in zoom-in-95 duration-200">
											<img
												src={m.file_url}
												alt="Galería existente"
												className="h-20 w-20 object-cover rounded-lg border border-swapp-turquesa-oscuro/50 dark:border-swapp-menta/50 shadow-sm opacity-80"
												title="Imagen alojada en la nube"
											/>
											<button
												type="button"
												onClick={() => removeExistingGalleryImage(m.media_uuid)}
												className="absolute -top-2 -right-2 bg-swapp-azul-petroleo text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors">
												<Trash2 className="w-3 h-3" />
											</button>
										</div>
									))}

									{/* Nuevas (Archivos locales por subir) */}
									{newGalleryPreviews.map((url, idx) => (
										<div
											key={`new-${idx}`}
											className="relative inline-block animate-in fade-in zoom-in-95 duration-200">
											<img
												src={url}
												alt="Nueva galería"
												className="h-20 w-20 object-cover rounded-lg border-2 border-swapp-turquesa-oscuro dark:border-swapp-menta shadow-sm"
												title="Pendiente de subida"
											/>
											<span className="absolute bottom-1 left-1 bg-swapp-turquesa-oscuro text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm">
												NUEVA
											</span>
											<button
												type="button"
												onClick={() => removeNewGalleryImage(idx)}
												className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
												<X className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* SWITCHES */}
					<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 space-y-3 transition-colors">
						<SwappCheckbox
							label="Envase Retornable"
							id="edit_is_returnable"
							checked={editingProduct.is_returnable || false}
							onChange={(e) =>
								setEditingProduct({
									...editingProduct,
									is_returnable: e.target.checked,
								})
							}
						/>
						<SwappCheckbox
							label="Publicado (Visible en tienda)"
							id="edit_is_published"
							checked={editingProduct.is_published || false}
							onChange={(e) =>
								setEditingProduct({
									...editingProduct,
									is_published: e.target.checked,
								})
							}
						/>
					</div>

					<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua disabled:opacity-50">
							{isSaving ? "Guardando..." : "Guardar Cambios"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

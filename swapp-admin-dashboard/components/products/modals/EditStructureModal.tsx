"use client";

import { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappSelect } from "@/components/ui/SwappSelect";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { Product, Brand, Category, TaxClass } from "@/types/product";

interface EditStructureModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	brands: Brand[];
	categories: Category[];
	taxClasses: TaxClass[];
	onSuccess: (isUpgrade?: boolean, ghostVariant?: any) => void;
}

export default function EditStructureModal({
	isOpen,
	onClose,
	product,
	brands,
	categories,
	taxClasses,
	onSuccess,
}: EditStructureModalProps) {
	const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [showOptionalFields, setShowOptionalFields] = useState(false);

	// Estados Downgrade a Variante Fantasma
	const [ghostSku, setGhostSku] = useState("");
	const [ghostStock, setGhostStock] = useState(0);

	// Estados Multimedia
	const [newImageFile, setNewImageFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [mainMediaUuid, setMainMediaUuid] = useState<string | null>(null);
	const [existingGallery, setExistingGallery] = useState<any[]>([]);
	const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
	const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
	const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

	// Estados Locales para estructuras complejas
	const [dimLength, setDimLength] = useState(0);
	const [dimWidth, setDimWidth] = useState(0);
	const [dimHeight, setDimHeight] = useState(0);

	// --- LÓGICA DE CATEGORÍAS JERÁRQUICAS ---
	const parentCategories = categories.filter((c) => !c.parent_id);
	const subCategories = categories.filter((c) => c.parent_id);

	// --- CERRAR CON ESCAPE ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen && product) {
			setEditingProduct(product);
			setNewImageFile(null);
			setNewGalleryFiles([]);
			setNewGalleryPreviews([]);
			setMediaToDelete([]);
			setShowOptionalFields(false);
			
			setGhostSku("");
			setGhostStock(0);

			setDimLength((product.dimensions as any)?.length || 0);
			setDimWidth((product.dimensions as any)?.width || 0);
			setDimHeight((product.dimensions as any)?.height || 0);

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

	const generateSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");

	const handleImageDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;
		if (previewUrl) {
			const userConfirmed = window.confirm(
				"Esta nueva imagen reemplazará a la actual como imagen principal. ¿Deseas continuar?",
			);
			if (!userConfirmed) return;
			if (mainMediaUuid && !mediaToDelete.includes(mainMediaUuid)) {
				setMediaToDelete((prev) => [...prev, mainMediaUuid]);
			}
		}
		setNewImageFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const handleRemoveImage = () => {
		const userConfirmed = window.confirm(
			"¿Estás seguro de que querés eliminar la imagen principal?",
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

	const handleGenerateGhostSKU = () => {
		const formatSkuSegment = (text: string | null | undefined, fallback = "XXX") => {
			if (!text || text.trim() === "") return fallback;
			const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
			if (cleanText.length === 0) return fallback;
			return cleanText.length >= 3 ? cleanText.substring(0, 3) : cleanText.padEnd(3, "X");
		};

		const prodCode = formatSkuSegment(editingProduct.name, "PRO");
		const brandName = brands.find((b) => b.brand_id.toString() === editingProduct.brand_id?.toString())?.name;
		const brandCode = formatSkuSegment(brandName, "SWA");
		const modelCode = formatSkuSegment((editingProduct as any).model, "GEN");
		const attrCode = "UNI"; // Al hacer downgrade, pasamos a no tener atributos
		const countCode = "001"; // Pasa a ser la única variante física

		setGhostSku(`${prodCode}-${brandCode}-${modelCode}-${attrCode}-${countCode}`);
		toast.success("SKU Inteligente auto-generado", { position: "top-center" });
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingProduct || !editingProduct.product_uuid) return;

		// --- VALIDACIONES DE REQUISITOS DE PUBLICACIÓN ---
		if (editingProduct.is_published) {
			if (!previewUrl && !newImageFile) {
				toast.error("Para publicar, la Imagen Principal es obligatoria.");
				return;
			}
			if (existingGallery.length === 0 && newGalleryFiles.length === 0) {
				toast.error("Para publicar, debés tener al menos 1 imagen en la galería.");
				return;
			}
			if (!editingProduct.short_description?.trim()) {
				toast.error("Para publicar, la Descripción Corta es obligatoria.");
				return;
			}
			if (!editingProduct.description?.trim()) {
				toast.error("Para publicar, la Descripción Extendida es obligatoria.");
				return;
			}
		}

		const isDowngrading = product?.has_variants && (editingProduct as any).has_variants === false;
		
		if (isDowngrading && !ghostSku.trim()) {
			toast.error("Debés asignar un SKU para el inventario unificado.");
			return;
		}

		setIsSaving(true);
		const toastId = toast.loading("Procesando actualización...");

		try {
			if (mediaToDelete.length > 0) {
				toast.loading("Limpiando imágenes eliminadas...", { id: toastId });
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

			const dimensionsObj =
				dimLength > 0 || dimWidth > 0 || dimHeight > 0
					? { length: dimLength, width: dimWidth, height: dimHeight }
					: null;

			const { media, variants, ...safeUpdateData } = editingProduct as any;

			await ProductService.update(editingProduct.product_uuid, {
				...safeUpdateData,
				sku: isDowngrading ? ghostSku : undefined,
				stock_quantity: isDowngrading ? ghostStock : undefined,
				brand_id: safeUpdateData.brand_id ? Number(safeUpdateData.brand_id) : null,
				category_id: safeUpdateData.category_id ? Number(safeUpdateData.category_id) : null,
				tax_class_id: safeUpdateData.tax_class_id ? Number(safeUpdateData.tax_class_id) : null,
				dimensions: dimensionsObj,
			});

			toast.success("Estructura actualizada exitosamente.", { id: toastId });
			
			// Si hicimos UPGRADE, le pasamos los datos del fantasma al padre
			const isUpgrading = !product?.has_variants && (editingProduct as any).has_variants === true;
			if (isUpgrading && product?.variants && product.variants.length > 0) {
				onSuccess(true, product.variants[0]);
			} else {
				onSuccess(false, null);
			}
			onClose();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar.", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Arrays formateados para los componentes SwappSelect
	const brandOptions = brands.map((b) => ({
		value: b.brand_id,
		label: b.name,
	}));
	const taxOptions = taxClasses.map((t) => ({
		value: t.tax_class_id,
		label: `${t.name} (${t.rate}%)`,
	}));
	const weightUnitOptions = [
		{ value: "kg", label: "kg" },
		{ value: "g", label: "g" },
		{ value: "lb", label: "lb" },
		{ value: "oz", label: "oz" },
	];

	const isDowngrading = product?.has_variants && (editingProduct as any).has_variants === false;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
						Editar Estructura: {editingProduct.name} - {editingProduct.model}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
					<form
						onSubmit={handleEditSubmit}
						className="space-y-8 [&_input]:!bg-transparent [&_select]:!bg-transparent [&_textarea]:!bg-transparent">
						<div className="space-y-6">
							
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pb-4 transition-colors">
								<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Estructura e Identidad
								</h3>
								<div className="flex items-center gap-3 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 px-3 py-1.5 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 transition-colors shadow-sm">
									<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
										Tiene múltiples variantes
									</span>
									<SwappToggle
										checked={(editingProduct as any).has_variants !== false}
										onChange={(val) =>
											setEditingProduct({
												...editingProduct,
												has_variants: val,
											} as any)
										}
										id="toggle-has-variants-edit"
									/>
								</div>
							</div>

							{isDowngrading && (
								<div className="border border-red-500/30 bg-red-500/10 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
									<div className="flex items-start gap-3">
										<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
										<p className="text-sm text-red-700 dark:text-red-300 leading-relaxed font-medium">
											Atención: Estás por desactivar el uso de variantes. Todas las opciones existentes se archivarán y el producto pasará a ser único.
										</p>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-swapp-blanco/40 dark:bg-swapp-negro/20 p-3 rounded-lg border border-red-500/20">
										<div className="space-y-1.5">
											<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
												Nuevo SKU Único <span className="text-red-500">*</span>
											</label>
											<div className="flex gap-2">
												<input
													type="text"
													required
													className="w-full rounded-md border border-red-500/30 px-3 py-2 text-sm font-mono text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-red-500 uppercase bg-transparent"
													placeholder="Ej: SWA-BOT-UNI-X9Y"
													value={ghostSku}
													onChange={(e) => setGhostSku(e.target.value.toUpperCase())}
												/>
												<SwappTooltip text="Auto-generar SKU">
													<button
														type="button"
														onClick={handleGenerateGhostSKU}
														className="flex shrink-0 items-center justify-center rounded-md border border-red-500/30 bg-red-500/20 px-3 text-red-600 hover:bg-red-500 hover:text-white transition-all">
														<Wand2 className="h-5 w-5" />
													</button>
												</SwappTooltip>
											</div>
										</div>
										<div className="space-y-1.5">
											<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
												Stock Inicial
											</label>
											<input
												type="number"
												min="0"
												className="w-full rounded-md border border-red-500/30 px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-red-500 bg-transparent"
												value={ghostStock === 0 ? "" : ghostStock}
												onChange={(e) => setGhostStock(parseInt(e.target.value) || 0)}
											/>
										</div>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
								<div className="sm:col-span-2">
									<SwappInput
										label="Nombre Comercial"
										required
										value={editingProduct.name || ""}
										onChange={(e) => {
											const name = e.target.value;
											setEditingProduct({
												...editingProduct,
												name: name,
												slug: generateSlug(`${name} ${(editingProduct as any).model || ""}`),
											});
										}}
									/>
								</div>
								<div className="sm:col-span-2">
									<SwappInput
										label="Modelo de Fábrica"
										value={(editingProduct as any).model || ""}
										onChange={(e) => {
											const model = e.target.value;
											setEditingProduct({
												...editingProduct,
												model: model,
												slug: generateSlug(`${editingProduct.name || ""} ${model}`),
											} as any);
										}}
									/>
								</div>
								<div className="sm:col-span-4">
									<SwappInput
										label="URL Amigable (Slug)"
										required
										value={editingProduct.slug || ""}
										onChange={(e) =>
											setEditingProduct({
												...editingProduct,
												slug: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 transition-colors">
								<div className="space-y-1">
									<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-1">
										Categoría (Subcategoría){" "}
										<span className="text-red-500">*</span>
									</label>
									<select
										className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta"
										required
										value={editingProduct.category_id || ""}
										onChange={(e) =>
											setEditingProduct({
												...editingProduct,
												category_id: e.target.value
													? parseInt(e.target.value)
													: null,
											})
										}>
										<option
											value=""
											className="bg-swapp-blanco dark:bg-swapp-azul-oscuro text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60"
											disabled>
											Seleccione subcategoría...
										</option>
										{parentCategories.map((parent) => (
											<optgroup
												key={parent.category_id}
												label={parent.name}
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
												{subCategories
													.filter((sub) => sub.parent_id === parent.category_id)
													.map((sub) => (
														<option
															key={sub.category_id}
															value={sub.category_id}
															className="bg-swapp-blanco dark:bg-swapp-azul-oscuro font-normal text-swapp-azul-oscuro dark:text-swapp-blanco">
															{sub.name}
														</option>
													))}
											</optgroup>
										))}
									</select>
								</div>

								<SwappSelect
									label="Marca Registrada"
									placeholder="Sin marca"
									options={brandOptions}
									value={editingProduct.brand_id || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											brand_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
								/>

								<SwappSelect
									label="Clase de Impuesto"
									placeholder="Sin impuesto"
									options={taxOptions}
									value={editingProduct.tax_class_id || ""}
									onChange={(e) =>
										setEditingProduct({
											...editingProduct,
											tax_class_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
								/>
							</div>
						</div>

						<div className="flex items-center justify-between border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 transition-colors">
							<div>
								<h3 className="text-lg font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco">
									Detalles y Configuración Adicional
								</h3>
								<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
									Logística extendida, SEO y multimedia avanzada
								</p>
							</div>
							<SwappToggle
								checked={showOptionalFields}
								onChange={setShowOptionalFields}
								id="toggle-optional-fields-edit"
							/>
						</div>

						<div
							className={`transition-all duration-500 ease-in-out -m-2 p-2 ${showOptionalFields ? "max-h-[5000px] opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden"}`}>
							<div className="space-y-10">
								<div className="space-y-6">
									{/* ALERTA DE PUBLICACIÓN (Idéntica a la pantalla New) */}
									{editingProduct.is_published && (
										<div className="flex items-center gap-2 rounded-xl bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 p-4 text-sm font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 transition-colors animate-in fade-in shadow-sm">
											<AlertCircle className="h-5 w-5 shrink-0" />
											<p>
												Al optar por{" "}
												<strong className="font-bold">Publicar en tienda</strong>,
												los campos de descripciones e imágenes pasan a ser obligatorios.
											</p>
										</div>
									)}

									<SwappInput
										label={`Descripción Corta (Catálogo) ${editingProduct.is_published ? "*" : ""}`}
										required={editingProduct.is_published}
										value={editingProduct.short_description || ""}
										onChange={(e) =>
											setEditingProduct({
												...editingProduct,
												short_description: e.target.value,
											})
										}
									/>
									<SwappTextarea
										label={`Descripción Extendida (Detalle) ${editingProduct.is_published ? "*" : ""}`}
										rows={4}
										required={editingProduct.is_published}
										value={editingProduct.description || ""}
										onChange={(e) =>
											setEditingProduct({
												...editingProduct,
												description: e.target.value,
											})
										}
									/>
								</div>

								<div className="border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 space-y-6 transition-colors">
									<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
										Gestión Multimedia
									</h4>
									<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
										<div className="space-y-3">
											<SwappDropzone
												label={`Imagen Principal (Reemplazar) ${editingProduct.is_published ? "*" : ""}`}
												helpText="JPG, PNG o WEBP. Max 5MB."
												onDropAction={handleImageDrop}
											/>
											{previewUrl ? (
												<div className="relative inline-block mt-2">
													<img
														src={previewUrl}
														alt="Principal"
														className="h-32 w-32 object-cover rounded-xl border-2 border-swapp-verde-oscuro dark:border-swapp-verde-menta shadow-sm bg-swapp-blanco"
													/>
													<button
														type="button"
														onClick={handleRemoveImage}
														className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors">
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											) : (
												<div className="shrink-0 mt-6 h-32 w-32 rounded-xl border-2 border-dashed border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-center text-xs text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
													Sin principal
												</div>
											)}
										</div>
										<div className="space-y-3">
											<SwappDropzone
												label={`Agregar a la Galería ${editingProduct.is_published ? "*" : ""}`}
												helpText="Podés subir varias imágenes extra."
												onDropAction={handleGalleryDrop}
												maxFiles={5}
											/>
											{(existingGallery.length > 0 ||
												newGalleryPreviews.length > 0) && (
												<div className="flex flex-wrap gap-4 mt-2 bg-swapp-tiza-verdoso/20 dark:bg-swapp-azul-petroleo/20 p-4 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50">
													{existingGallery.map((m: any) => (
														<div
															key={m.media_uuid}
															className="relative inline-block">
															<img
																src={m.file_url}
																className="h-20 w-20 object-cover rounded-lg border border-swapp-verde-oscuro/50 opacity-80 bg-swapp-blanco"
															/>
															<button
																type="button"
																onClick={() =>
																	removeExistingGalleryImage(m.media_uuid)
																}
																className="absolute -top-2 -right-2 bg-swapp-azul-petroleo text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors">
																<Trash2 className="w-3 h-3" />
															</button>
														</div>
													))}
													{newGalleryPreviews.map((url, idx) => (
														<div
															key={`new-${idx}`}
															className="relative inline-block">
															<img
																src={url}
																className="h-20 w-20 object-cover rounded-lg border-2 border-swapp-verde-oscuro bg-swapp-blanco"
															/>
															<span className="absolute bottom-1 left-1 bg-swapp-verde-oscuro text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm">
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
								</div>

								<div className="space-y-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 transition-colors">
									<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
										Posicionamiento y SEO
									</h4>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<SwappInput
											label="Meta Título"
											value={editingProduct.meta_title || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													meta_title: e.target.value,
												})
											}
										/>
										<SwappInput
											label="Meta Keywords"
											value={editingProduct.meta_keywords || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													meta_keywords: e.target.value,
												})
											}
										/>
									</div>
									<SwappTextarea
										label="Meta Descripción"
										rows={2}
										value={editingProduct.meta_description || ""}
										onChange={(e) =>
											setEditingProduct({
												...editingProduct,
												meta_description: e.target.value,
											})
										}
									/>
								</div>

								<div className="space-y-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 transition-colors">
									<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
										Logística Física y Envíos
									</h4>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
										<SwappInput
											label="Cantidad Máx por Orden"
											type="text"
											formatThousands
											min="0"
											value={editingProduct.max_order_quantity || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													max_order_quantity: parseInt(e.target.value) || 0,
												})
											}
										/>
										<SwappInput
											label="Peso"
											type="text"
											formatThousands
											step="0.01"
											min="0"
											value={editingProduct.weight || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													weight: parseFloat(e.target.value) || 0,
												})
											}
										/>
										<SwappSelect
											label="Unidad de Peso"
											options={weightUnitOptions}
											value={editingProduct.weight_unit || "kg"}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													weight_unit: e.target.value,
												})
											}
										/>
									</div>
									<div className="grid grid-cols-3 gap-4">
										<SwappInput
											label="Largo (cm)"
											type="text"
											formatThousands
											min="0"
											value={dimLength === 0 ? "" : dimLength}
											onChange={(e) =>
												setDimLength(parseFloat(e.target.value) || 0)
											}
										/>
										<SwappInput
											label="Ancho (cm)"
											type="text"
											formatThousands
											min="0"
											value={dimWidth === 0 ? "" : dimWidth}
											onChange={(e) =>
												setDimWidth(parseFloat(e.target.value) || 0)
											}
										/>
										<SwappInput
											label="Alto (cm)"
											type="text"
											formatThousands
											min="0"
											value={dimHeight === 0 ? "" : dimHeight}
											onChange={(e) =>
												setDimHeight(parseFloat(e.target.value) || 0)
											}
										/>
									</div>
								</div>

								<div className="space-y-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 transition-colors">
									<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
										Archivos Digitales
									</h4>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
										<SwappInput
											label="URL de Descarga"
											value={editingProduct.download_url || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													download_url: e.target.value,
												})
											}
										/>
										<SwappInput
											label="Tamaño (Bytes)"
											type="text"
											formatThousands
											min="0"
											value={editingProduct.file_size || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													file_size: parseInt(e.target.value) || 0,
												})
											}
										/>
										<SwappInput
											label="Extensión (Ej: pdf)"
											value={editingProduct.file_extension || ""}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													file_extension: e.target.value,
												})
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors">
									<div className="space-y-4">
										<SwappCheckbox
											label="Envase Retornable (IA)"
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
										<SwappCheckbox
											label="Destacar producto"
											id="edit_is_featured"
											checked={editingProduct.is_featured || false}
											onChange={(e) =>
												setEditingProduct({
													...editingProduct,
													is_featured: e.target.checked,
												})
											}
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-8 flex justify-end gap-3 pt-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
								<Save className="h-4 w-4" />
								{isSaving ? "Guardando..." : "Guardar Estructura"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
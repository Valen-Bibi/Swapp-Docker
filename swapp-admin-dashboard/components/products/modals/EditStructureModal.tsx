"use client";

import { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, Save, Fingerprint, ImageIcon, Truck } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappSelect } from "@/components/ui/SwappSelect";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { Product, Brand, Category, TaxClass } from "@/types/product";

interface EditStructureModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	brands: Brand[];
	categories: Category[];
	taxClasses: TaxClass[];
	onSuccess: () => void;
}

const TABS = [
	{ id: 1, title: "Identidad", icon: Fingerprint },
	{ id: 2, title: "Vitrina y SEO", icon: ImageIcon },
	{ id: 3, title: "Logística Física", icon: Truck },
];

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
	const [activeTab, setActiveTab] = useState(1);

	// Estados Multimedia
	const [newImageFile, setNewImageFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [mainMediaUuid, setMainMediaUuid] = useState<string | null>(null);
	const [existingGallery, setExistingGallery] = useState<any[]>([]);
	const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
	const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
	const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

	// Estados Locales para dimensiones
	const [dimLength, setDimLength] = useState(0);
	const [dimWidth, setDimWidth] = useState(0);
	const [dimHeight, setDimHeight] = useState(0);

	// --- LÓGICA DE CATEGORÍAS JERÁRQUICAS ---
	const parentCategories = categories.filter((c) => !c.parent_id);
	const subCategories = categories.filter((c) => c.parent_id);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen && product) {
			setEditingProduct(product);
			setActiveTab(1); // Volvemos a la primera pestaña al abrir
			setNewImageFile(null);
			setNewGalleryFiles([]);
			setNewGalleryPreviews([]);
			setMediaToDelete([]);

			setDimLength((product.dimensions as any)?.length || 0);
			setDimWidth((product.dimensions as any)?.width || 0);
			setDimHeight((product.dimensions as any)?.height || 0);

			const mainMedia = product.media?.find(
				(m: any) => m.media_type === "image" && m.media_subtype === "main" && m.is_active,
			);
			setPreviewUrl(mainMedia ? mainMedia.file_url : null);
			setMainMediaUuid(mainMedia ? mainMedia.media_uuid : null);

			const galleryMedia = product.media?.filter(
				(m: any) => m.media_type === "image" && m.media_subtype === "gallery" && m.is_active,
			);
			setExistingGallery(galleryMedia || []);
		}
	}, [isOpen, product]);

	if (!isOpen || !product) return null;

	const generateSlug = (text: string) =>
		text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

	const handleImageDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;
		if (previewUrl) {
			const userConfirmed = window.confirm("Esta nueva imagen reemplazará a la actual como imagen principal. ¿Deseas continuar?");
			if (!userConfirmed) return;
			if (mainMediaUuid && !mediaToDelete.includes(mainMediaUuid)) {
				setMediaToDelete((prev) => [...prev, mainMediaUuid]);
			}
		}
		setNewImageFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const handleRemoveImage = () => {
		const userConfirmed = window.confirm("¿Estás seguro de que querés eliminar la imagen principal?");
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
		const userConfirmed = window.confirm("¿Seguro que querés eliminar esta imagen de la galería?");
		if (!userConfirmed) return;
		if (!mediaToDelete.includes(media_uuid)) {
			setMediaToDelete((prev) => [...prev, media_uuid]);
		}
		setExistingGallery((prev) => prev.filter((m) => m.media_uuid !== media_uuid));
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingProduct || !editingProduct.product_uuid) return;

		if (editingProduct.is_published && !(editingProduct as any).is_internal) {
			if (!previewUrl && !newImageFile) {
				setActiveTab(2);
				return toast.error("Para publicar, la Imagen Principal es obligatoria.");
			}
			if (existingGallery.length === 0 && newGalleryFiles.length === 0) {
				setActiveTab(2);
				return toast.error("Para publicar, debés tener al menos 1 imagen en la galería.");
			}
			if (!editingProduct.short_description?.trim() || !editingProduct.description?.trim()) {
				setActiveTab(2);
				return toast.error("Para publicar, las descripciones son obligatorias.");
			}
		}

		setIsSaving(true);
		const toastId = toast.loading("Procesando actualización...");

		try {
			if (mediaToDelete.length > 0) {
				toast.loading("Limpiando imágenes eliminadas...", { id: toastId });
				await Promise.all(mediaToDelete.map((uuid) => ProductService.deleteMedia(editingProduct.product_uuid!, uuid)));
			}

			if (newImageFile) {
				toast.loading("Actualizando imagen principal...", { id: toastId });
				await ProductService.uploadMainImage(editingProduct.product_uuid, newImageFile);
			}

			if (newGalleryFiles.length > 0) {
				toast.loading(`Subiendo ${newGalleryFiles.length} imágenes a la galería...`, { id: toastId });
				await ProductService.uploadGalleryImages(editingProduct.product_uuid, newGalleryFiles);
			}

			toast.loading("Guardando información general...", { id: toastId });

			const dimensionsObj = dimLength > 0 || dimWidth > 0 || dimHeight > 0
				? { length: dimLength, width: dimWidth, height: dimHeight }
				: null;

			// Filtramos datos sensibles/controlados por otros flujos
			const { media, variants, has_variants, is_returnable, linked_internal_product_id, is_internal, category_id, ...safeUpdateData } = editingProduct as any;

			await ProductService.update(editingProduct.product_uuid, {
				...safeUpdateData,
				brand_id: safeUpdateData.brand_id ? Number(safeUpdateData.brand_id) : null,
				tax_class_id: safeUpdateData.tax_class_id ? Number(safeUpdateData.tax_class_id) : null,
				dimensions: dimensionsObj,
			});

			toast.success("Estructura actualizada exitosamente.", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al actualizar.", { id: toastId });
		} finally {
			setIsSaving(false);
		}
	};

	const brandOptions = brands.map((b) => ({ value: b.brand_id, label: b.name }));
	const taxOptions = taxClasses.map((t) => ({ value: t.tax_class_id, label: `${t.name} (${t.rate}%)` }));
	const weightUnitOptions = [
		{ value: "kg", label: "kg" }, { value: "g", label: "g" }, { value: "lb", label: "lb" }, { value: "oz", label: "oz" },
	];

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco truncate max-w-md">
							{editingProduct.name} {editingProduct.model ? `- ${editingProduct.model}` : ""}
						</h2>
						<p className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 font-mono mt-1">
							SKU Base / Estructura Global
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-md bg-swapp-azul-petroleo/5 text-swapp-azul-petroleo/50 dark:bg-swapp-tiza-verdoso/10 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors self-start sm:self-center">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* SELECTOR DE PESTAÑAS (TABS) */}
				<div className="flex px-6 pt-4 gap-2 bg-swapp-blanco/30 dark:bg-swapp-azul-oscuro/30 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 overflow-x-auto custom-scrollbar shrink-0">
					{TABS.map((tab) => {
						const isActive = activeTab === tab.id;
						// Ocultamos la pestaña de Vitrina si es un producto interno
						if (tab.id === 2 && (editingProduct as any).is_internal) return null;
						
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-bold transition-colors whitespace-nowrap ${
									isActive
										? "border-swapp-verde-oscuro text-swapp-verde-oscuro dark:border-swapp-verde-menta dark:text-swapp-verde-menta bg-swapp-verde-oscuro/5 dark:bg-swapp-verde-menta/5 rounded-t-lg"
										: "border-transparent text-swapp-azul-petroleo/50 hover:text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-tiza-verdoso"
								}`}>
								<tab.icon className="h-4 w-4" />
								{tab.title}
							</button>
						);
					})}
				</div>

				<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
					<form onSubmit={handleEditSubmit} className="space-y-8 [&_input]:!bg-transparent [&_select]:!bg-transparent [&_textarea]:!bg-transparent">
						
						{/* PESTAÑA 1: IDENTIDAD */}
						<div className={activeTab === 1 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
								<div className="sm:col-span-2">
									<SwappInput
										label="Nombre Comercial"
										required
										value={editingProduct.name || ""}
										onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
									/>
								</div>
								<div className="sm:col-span-2">
									<SwappInput
										label="Modelo de Fábrica"
										value={(editingProduct as any).model || ""}
										onChange={(e) => setEditingProduct({ ...editingProduct, model: e.target.value } as any)}
									/>
								</div>
								<div className="sm:col-span-4">
									<SwappInput
										label="URL Amigable (Slug)"
										required
										value={editingProduct.slug || ""}
										onChange={(e) => setEditingProduct({ ...editingProduct, slug: generateSlug(e.target.value) })}
										helpText="Impacta en el SEO y enlaces existentes. Editar con precaución."
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 mt-6 transition-colors">
								<div className="space-y-1">
									<label className="block text-sm font-medium text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 mb-1">
										Categoría / Subcategoría
									</label>
									<input 
										type="text" 
										disabled 
										value={categories.find(c => c.category_id === editingProduct.category_id)?.name || "Sin categoría"}
										className="w-full rounded-md border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 px-3 py-2.5 text-sm text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 outline-none cursor-not-allowed"
									/>
									<p className="text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 leading-tight">
										Dato bloqueado por sistema para preservar la integridad de los atributos técnicos (PIM).
									</p>
								</div>

								<SwappSelect
									label="Marca Registrada"
									placeholder="Sin marca"
									options={brandOptions}
									value={editingProduct.brand_id || ""}
									onChange={(e) => setEditingProduct({ ...editingProduct, brand_id: e.target.value ? parseInt(e.target.value) : null })}
								/>

								<SwappSelect
									label="Clase de Impuesto"
									placeholder="Sin impuesto"
									options={taxOptions}
									value={editingProduct.tax_class_id || ""}
									onChange={(e) => setEditingProduct({ ...editingProduct, tax_class_id: e.target.value ? parseInt(e.target.value) : null })}
								/>
							</div>
						</div>

						{/* PESTAÑA 2: VITRINA Y SEO */}
						<div className={activeTab === 2 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
							<div className="space-y-6">
								{editingProduct.is_published && (
									<div className="flex items-center gap-2 rounded-xl bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 p-4 text-sm font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 shadow-sm">
										<AlertCircle className="h-5 w-5 shrink-0" />
										<p>Producto publicado. Imágenes y descripciones obligatorias.</p>
									</div>
								)}

								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
									<div className="space-y-4">
										<SwappCheckbox
											label="Visible en tienda (Publicado)"
											id="edit_is_published"
											checked={editingProduct.is_published || false}
											onChange={(e) => setEditingProduct({ ...editingProduct, is_published: e.target.checked })}
										/>
										<SwappCheckbox
											label="Destacar en Home"
											id="edit_is_featured"
											checked={editingProduct.is_featured || false}
											onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
									<SwappInput
										label={`Descripción Corta (Tarjetas) ${editingProduct.is_published ? "*" : ""}`}
										required={editingProduct.is_published}
										value={editingProduct.short_description || ""}
										onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
									/>
									<div className="sm:col-span-2">
										<SwappTextarea
											label={`Descripción Extendida (Detalle) ${editingProduct.is_published ? "*" : ""}`}
											rows={4}
											required={editingProduct.is_published}
											value={editingProduct.description || ""}
											onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 border-t border-swapp-azul-petroleo/10 pt-6">
									<div className="space-y-3">
										<SwappDropzone label={`Imagen Principal (Reemplazar) ${editingProduct.is_published ? "*" : ""}`} helpText="JPG, PNG o WEBP. Max 5MB." onDropAction={handleImageDrop} />
										{previewUrl ? (
											<div className="relative inline-block mt-2">
												<img src={previewUrl} alt="Principal" className="h-32 w-32 object-cover rounded-xl border-2 border-swapp-verde-oscuro shadow-sm bg-swapp-blanco" />
												<button type="button" onClick={handleRemoveImage} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
											</div>
										) : (
											<div className="shrink-0 mt-6 h-32 w-32 rounded-xl border-2 border-dashed border-swapp-azul-petroleo/20 flex items-center justify-center text-xs text-swapp-azul-petroleo/50">Sin principal</div>
										)}
									</div>
									<div className="space-y-3">
										<SwappDropzone label={`Agregar a la Galería ${editingProduct.is_published ? "*" : ""}`} helpText="Subí múltiples imágenes extra." onDropAction={handleGalleryDrop} maxFiles={5} />
										{(existingGallery.length > 0 || newGalleryPreviews.length > 0) && (
											<div className="flex flex-wrap gap-4 mt-2 bg-swapp-tiza-verdoso/20 dark:bg-swapp-azul-petroleo/20 p-4 rounded-xl border border-swapp-azul-petroleo/10">
												{existingGallery.map((m: any) => (
													<div key={m.media_uuid} className="relative inline-block">
														<img src={m.file_url} className="h-20 w-20 object-cover rounded-lg border border-swapp-verde-oscuro/50 opacity-80 bg-swapp-blanco" />
														<button type="button" onClick={() => removeExistingGalleryImage(m.media_uuid)} className="absolute -top-2 -right-2 bg-swapp-azul-petroleo text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
													</div>
												))}
												{newGalleryPreviews.map((url, idx) => (
													<div key={`new-${idx}`} className="relative inline-block">
														<img src={url} className="h-20 w-20 object-cover rounded-lg border-2 border-swapp-verde-oscuro bg-swapp-blanco" />
														<span className="absolute bottom-1 left-1 bg-swapp-verde-oscuro text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm">NUEVA</span>
														<button type="button" onClick={() => removeNewGalleryImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"><X className="w-3 h-3" /></button>
													</div>
												))}
											</div>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-swapp-azul-petroleo/10 pt-6">
									<SwappInput label="Meta Título SEO" value={editingProduct.meta_title || ""} onChange={(e) => setEditingProduct({ ...editingProduct, meta_title: e.target.value })} />
									<SwappInput label="Meta Keywords" value={editingProduct.meta_keywords || ""} onChange={(e) => setEditingProduct({ ...editingProduct, meta_keywords: e.target.value })} />
									<div className="sm:col-span-2">
										<SwappTextarea label="Meta Descripción SEO" rows={2} value={editingProduct.meta_description || ""} onChange={(e) => setEditingProduct({ ...editingProduct, meta_description: e.target.value })} />
									</div>
								</div>
							</div>
						</div>

						{/* PESTAÑA 3: LOGÍSTICA FÍSICA Y ARCHIVOS */}
						<div className={activeTab === 3 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
							<div className="space-y-8">
								<div>
									<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mb-4">
										Logística Física y Envíos
									</h4>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
										<SwappInput label="Cantidad Máx por Orden" type="text" formatThousands min="0" value={editingProduct.max_order_quantity || ""} onChange={(e) => setEditingProduct({ ...editingProduct, max_order_quantity: parseInt(e.target.value) || 0 })} />
										<SwappInput label="Peso (Bulto cerrado)" type="text" formatThousands step="0.01" min="0" value={editingProduct.weight || ""} onChange={(e) => setEditingProduct({ ...editingProduct, weight: parseFloat(e.target.value) || 0 })} />
										<SwappSelect label="Unidad de Peso" options={weightUnitOptions} value={editingProduct.weight_unit || "kg"} onChange={(e) => setEditingProduct({ ...editingProduct, weight_unit: e.target.value })} />
									</div>
									<div className="grid grid-cols-3 gap-4 mt-6">
										<SwappInput label="Largo (cm)" type="text" formatThousands min="0" value={dimLength === 0 ? "" : dimLength} onChange={(e) => setDimLength(parseFloat(e.target.value) || 0)} />
										<SwappInput label="Ancho (cm)" type="text" formatThousands min="0" value={dimWidth === 0 ? "" : dimWidth} onChange={(e) => setDimWidth(parseFloat(e.target.value) || 0)} />
										<SwappInput label="Alto (cm)" type="text" formatThousands min="0" value={dimHeight === 0 ? "" : dimHeight} onChange={(e) => setDimHeight(parseFloat(e.target.value) || 0)} />
									</div>
								</div>

								<div className="border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6">
									<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mb-4">
										Archivos Digitales (Descargables)
									</h4>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
										<SwappInput label="URL de Descarga Segura" value={editingProduct.download_url || ""} onChange={(e) => setEditingProduct({ ...editingProduct, download_url: e.target.value })} />
										<SwappInput label="Tamaño (Bytes)" type="text" formatThousands min="0" value={editingProduct.file_size || ""} onChange={(e) => setEditingProduct({ ...editingProduct, file_size: parseInt(e.target.value) || 0 })} />
										<SwappInput label="Extensión (Ej: pdf, zip)" value={editingProduct.file_extension || ""} onChange={(e) => setEditingProduct({ ...editingProduct, file_extension: e.target.value })} />
									</div>
								</div>
							</div>
						</div>

						{/* FOOTER DEL MODAL */}
						<div className="mt-8 flex justify-end gap-3 pt-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/30 dark:bg-swapp-azul-oscuro/30 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl transition-colors">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-md">
								<Save className="h-4 w-4" />
								{isSaving ? "Guardando..." : "Guardar Cambios Globales"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { PackagePlus, ArrowLeft, Save, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import Link from "next/link";
import { Brand, Category, TaxClass } from "@/types/product";

export default function NewProductPage() {
	const router = useRouter();
	const [brands, setBrands] = useState<Brand[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const [showOptionalFields, setShowOptionalFields] = useState(false);

	// --- ESTADOS MULTIMEDIA INDEPENDIENTES ---
	const [mainImageFile, setMainImageFile] = useState<File | null>(null);
	const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
	const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		sku: "",
		cost_price: 0,
		base_price: 0,
		brand_id: "",
		category_id: "",
		tax_class_id: "",
		short_description: "",
		description: "",
		meta_title: "",
		meta_description: "",
		meta_keywords: "",
		stock_quantity: 0,
		max_order_quantity: 0,
		weight: 0,
		weight_unit: "kg",
		dim_length: 0,
		dim_width: 0,
		dim_height: 0,
		download_url: "",
		file_size: 0,
		file_extension: "",
		is_returnable: false,
		is_published: false,
		is_featured: false,
		variant_attributes_raw: "",
	});

	useEffect(() => {
		const fetchFormData = async () => {
			try {
				const [brandsData, categoriesData, taxesData] = await Promise.all([
					ProductService.getBrands(),
					ProductService.getCategories(),
					ProductService.getTaxes(),
				]);

				setBrands(brandsData);
				setCategories(categoriesData);
				setTaxClasses(taxesData);
			} catch (error) {
				console.error("Error obteniendo los datos del formulario:", error);
				toast.error("Error al cargar marcas, categorías o impuestos.");
			}
		};
		fetchFormData();
	}, []);

	const generateSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		setFormData({ ...formData, name, slug: generateSlug(name) });
	};

	const handleMainImageDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;
		setMainImageFile(file);
		setMainImagePreview(URL.createObjectURL(file));
	};

	const handleGalleryDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;
		setGalleryFiles((prev) => [...prev, ...acceptedFiles]);

		const tempUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
		setGalleryPreviews((prev) => [...prev, ...tempUrls]);
	};

	const removeGalleryImage = (indexToRemove: number) => {
		setGalleryFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
		setGalleryPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
	};

	const handleCreateProduct = async (e: React.FormEvent) => {
		e.preventDefault();

		if (formData.is_published) {
			if (!mainImageFile) {
				toast.error("Para publicar, la Imagen Principal es obligatoria.");
				return;
			}
			if (galleryFiles.length === 0) {
				toast.error(
					"Para publicar, debés subir al menos 1 imagen a la galería.",
				);
				return;
			}
		}

		let parsedVariants = null;
		if (formData.variant_attributes_raw.trim() !== "") {
			try {
				parsedVariants = JSON.parse(formData.variant_attributes_raw);
			} catch (error) {
				toast.error("Los Atributos de Variantes deben ser un JSON válido.");
				return;
			}
		}

		setIsSaving(true);
		const toastId = toast.loading("Creando base del producto...");

		try {
			const dimensionsObj =
				formData.dim_length > 0 ||
				formData.dim_width > 0 ||
				formData.dim_height > 0
					? {
							length: formData.dim_length,
							width: formData.dim_width,
							height: formData.dim_height,
						}
					: null;

			// 1. CREAR EL PRODUCTO (Sin imágenes, ya que no existen en el esquema)
			const newProductResponse = await ProductService.create({
				...formData,
				sku: formData.sku || null,
				meta_title: formData.meta_title || null,
				meta_description: formData.meta_description || null,
				meta_keywords: formData.meta_keywords || null,
				download_url: formData.download_url || null,
				file_size: formData.file_size || null,
				file_extension: formData.file_extension || null,
				max_order_quantity: formData.max_order_quantity || null,
				weight: formData.weight || null,
				weight_unit: formData.weight_unit || "kg",
				dimensions: dimensionsObj,
				variant_attributes: parsedVariants,
				brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
				category_id: formData.category_id
					? parseInt(formData.category_id)
					: null,
				tax_class_id: formData.tax_class_id
					? parseInt(formData.tax_class_id)
					: null,
			});

			const newProductUuid = newProductResponse.product_uuid;

			// 2. SUBIR IMAGEN PRINCIPAL (Si existe)
			if (mainImageFile) {
				toast.loading("Subiendo imagen principal...", { id: toastId });
				await ProductService.uploadMainImage(newProductUuid, mainImageFile);
			}

			// 3. SUBIR GALERÍA (Si existen archivos)
			if (galleryFiles.length > 0) {
				toast.loading(
					`Subiendo ${galleryFiles.length} imágenes a la galería...`,
					{ id: toastId },
				);
				await ProductService.uploadGalleryImages(newProductUuid, galleryFiles);
			}

			toast.success("¡Producto y multimedia creados exitosamente!", {
				id: toastId,
			});
			setTimeout(() => {
				router.push("/dashboard/products/catalog/master");
			}, 1000);
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error crítico al crear el producto.",
				{ id: toastId },
			);
			setIsSaving(false);
		}
	};

	return (
		<div className="p-6 relative max-w-4xl mx-auto">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard/products/catalog/master"
						className="p-2 rounded-lg bg-swapp-blanco dark:bg-swapp-negro-azulado border border-swapp-tiza dark:border-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
						<ArrowLeft className="h-5 w-5" />
					</Link>
					<PageHeader
						title="Incorporar Nuevo Producto"
						description="Dar de alta un nuevo artículo o insumo en el ecosistema"
						icon={PackagePlus}
					/>
				</div>
			</div>

			<div className="rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 sm:p-8 shadow-sm transition-colors">
				<form onSubmit={handleCreateProduct} className="space-y-8">
					<div className="space-y-6">
						<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza">
							Información Esencial
						</h3>

						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<SwappInput
								label="Nombre Comercial"
								placeholder="Ej: Botella Térmica..."
								required
								value={formData.name}
								onChange={handleNameChange}
							/>
							<SwappInput
								label="URL Amigable (Slug)"
								required
								value={formData.slug}
								onChange={(e) =>
									setFormData({
										...formData,
										slug: generateSlug(e.target.value),
									})
								}
							/>
							<SwappInput
								label="Costo de Adquisición ($)"
								type="text"
								formatThousands
								step="0.01"
								min="0"
								required
								value={formData.cost_price === 0 ? "" : formData.cost_price}
								onChange={(e) =>
									setFormData({
										...formData,
										cost_price: parseFloat(e.target.value) || 0,
									})
								}
							/>
							<SwappInput
								label="Precio Base de Venta ($)"
								type="text"
								formatThousands
								step="0.01"
								min="0"
								required
								value={formData.base_price === 0 ? "" : formData.base_price}
								onChange={(e) =>
									setFormData({
										...formData,
										base_price: parseFloat(e.target.value) || 0,
									})
								}
							/>
						</div>

						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
							<SwappInput
								label="SKU / Código"
								placeholder="Ej: ENV-VID-001"
								required
								value={formData.sku}
								onChange={(e) =>
									setFormData({ ...formData, sku: e.target.value })
								}
							/>
							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									Categoría <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
									required
									value={formData.category_id}
									onChange={(e) =>
										setFormData({ ...formData, category_id: e.target.value })
									}>
									<option value="" className="dark:bg-swapp-negro-azulado">
										Seleccione...
									</option>
									{categories.map((c) => (
										<option
											key={c.category_id}
											value={c.category_id}
											className="dark:bg-swapp-negro-azulado">
											{c.name}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									Marca Registrada <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
									required
									value={formData.brand_id}
									onChange={(e) =>
										setFormData({ ...formData, brand_id: e.target.value })
									}>
									<option value="" className="dark:bg-swapp-negro-azulado">
										Seleccione...
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

							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									Clase de Impuesto <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
									required
									value={formData.tax_class_id}
									onChange={(e) =>
										setFormData({ ...formData, tax_class_id: e.target.value })
									}>
									<option value="" className="dark:bg-swapp-negro-azulado">
										Seleccione...
									</option>
									{taxClasses.map((t) => (
										<option
											key={t.tax_class_id}
											value={t.tax_class_id}
											className="dark:bg-swapp-negro-azulado">
											{t.name} ({t.rate}%)
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
						<div>
							<h3 className="text-lg font-semibold text-swapp-negro-azulado dark:text-swapp-blanco">
								Detalles y Configuración Adicional
							</h3>
							<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
								Logística extendida, SEO, multimedia avanzada y atributos
							</p>
						</div>
						<SwappToggle
							checked={showOptionalFields}
							onChange={setShowOptionalFields}
							id="toggle-optional-fields"
						/>
					</div>

					<div
						className={`transition-all duration-500 ease-in-out -m-2 p-2 ${
							showOptionalFields
								? "max-h-[5000px] opacity-100 mt-2"
								: "max-h-0 opacity-0 overflow-hidden"
						}`}>
						<div className="space-y-10">
							<div className="space-y-6">
								{formData.is_published && (
									<div className="flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro/10 dark:bg-swapp-menta/10 p-3 text-sm text-swapp-turquesa-oscuro dark:text-swapp-menta border border-swapp-turquesa-oscuro/20 dark:border-swapp-menta/20 transition-colors animate-in fade-in">
										<AlertCircle className="h-4 w-4 shrink-0" />
										<p>
											Al optar por <strong>Publicar inmediatamente</strong>, los
											campos de descripciones e imágenes pasan a ser
											obligatorios.
										</p>
									</div>
								)}

								<SwappInput
									label="Descripción Corta (Catálogo)"
									placeholder="Breve resumen para las tarjetas de la tienda..."
									required={formData.is_published}
									value={formData.short_description}
									onChange={(e) =>
										setFormData({
											...formData,
											short_description: e.target.value,
										})
									}
								/>

								<SwappTextarea
									label="Descripción Extendida (Detalle)"
									rows={4}
									placeholder="Especificaciones completas..."
									required={formData.is_published}
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</div>

							<div className="space-y-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
								<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 flex items-center justify-between">
									Multimedia Avanzada
								</h4>

								<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
									{/* Dropzone Imagen Principal */}
									<div className="space-y-3">
										<SwappDropzone
											label={`Imagen Principal ${formData.is_published ? "*" : ""}`}
											helpText="Formatos: JPG, PNG, WEBP. Max 5MB."
											onDropAction={handleMainImageDrop}
										/>
										{mainImagePreview && (
											<div className="relative inline-block mt-2">
												<img
													src={mainImagePreview}
													alt="Principal"
													className="h-32 w-32 object-cover rounded-xl border-2 border-swapp-turquesa-oscuro dark:border-swapp-menta shadow-sm"
												/>
												<button
													type="button"
													onClick={() => {
														setMainImageFile(null);
														setMainImagePreview(null);
													}}
													className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors">
													<X className="w-4 h-4" />
												</button>
											</div>
										)}
									</div>

									{/* Dropzone Galería */}
									<div className="space-y-3">
										<SwappDropzone
											label={`Galería de Imágenes ${formData.is_published ? "*" : ""}`}
											helpText="Podés seleccionar varias. Max 5MB c/u."
											maxFiles={5}
											onDropAction={handleGalleryDrop}
										/>
										{galleryPreviews.length > 0 && (
											<div className="flex flex-wrap gap-4 mt-2">
												{galleryPreviews.map((url, idx) => (
													<div
														key={idx}
														className="relative inline-block animate-in fade-in zoom-in-95 duration-200">
														<img
															src={url}
															alt={`Gallery ${idx}`}
															className="h-20 w-20 object-cover rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo shadow-sm"
														/>
														<button
															type="button"
															onClick={() => removeGalleryImage(idx)}
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

							<div className="space-y-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
								<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
									Posicionamiento y SEO
								</h4>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<SwappInput
										label="Meta Título (Max 70 caracteres)"
										placeholder="Título optimizado para Google"
										value={formData.meta_title}
										onChange={(e) =>
											setFormData({ ...formData, meta_title: e.target.value })
										}
									/>
									<SwappInput
										label="Meta Keywords"
										placeholder="sustentable, botella, verde"
										value={formData.meta_keywords}
										onChange={(e) =>
											setFormData({
												...formData,
												meta_keywords: e.target.value,
											})
										}
									/>
								</div>
								<SwappTextarea
									label="Meta Descripción (Max 160 caracteres)"
									placeholder="Breve descripción que aparecerá en resultados de búsqueda..."
									rows={2}
									value={formData.meta_description}
									onChange={(e) =>
										setFormData({
											...formData,
											meta_description: e.target.value,
										})
									}
								/>
							</div>

							<div className="space-y-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
								<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
									Logística Física y Envíos
								</h4>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
									<SwappInput
										label="Cantidad Máx por Orden"
										type="text"
										formatThousands
										min="0"
										value={
											formData.max_order_quantity === 0
												? ""
												: formData.max_order_quantity
										}
										onChange={(e) =>
											setFormData({
												...formData,
												max_order_quantity: parseInt(e.target.value) || 0,
											})
										}
									/>
									<SwappInput
										label="Peso del Producto"
										type="text"
										formatThousands
										step="0.01"
										min="0"
										value={formData.weight === 0 ? "" : formData.weight}
										onChange={(e) =>
											setFormData({
												...formData,
												weight: parseFloat(e.target.value) || 0,
											})
										}
									/>
									<div className="space-y-1">
										<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
											Unidad de Peso
										</label>
										<select
											className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
											value={formData.weight_unit}
											onChange={(e) =>
												setFormData({
													...formData,
													weight_unit: e.target.value,
												})
											}>
											<option
												value="kg"
												className="dark:bg-swapp-negro-azulado">
												Kilogramos (kg)
											</option>
											<option value="g" className="dark:bg-swapp-negro-azulado">
												Gramos (g)
											</option>
											<option
												value="lb"
												className="dark:bg-swapp-negro-azulado">
												Libras (lb)
											</option>
											<option
												value="oz"
												className="dark:bg-swapp-negro-azulado">
												Onzas (oz)
											</option>
										</select>
									</div>
									<SwappInput
										label="Largo x Ancho x Alto (cm)"
										placeholder="Ej: 10 x 5 x 20"
										helpText="Dimensiones de empaquetado"
										onChange={() => {}}
									/>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<SwappInput
										label="Largo (cm)"
										type="text"
										formatThousands
										min="0"
										value={formData.dim_length === 0 ? "" : formData.dim_length}
										onChange={(e) =>
											setFormData({
												...formData,
												dim_length: parseFloat(e.target.value) || 0,
											})
										}
									/>
									<SwappInput
										label="Ancho (cm)"
										type="text"
										formatThousands
										min="0"
										value={formData.dim_width === 0 ? "" : formData.dim_width}
										onChange={(e) =>
											setFormData({
												...formData,
												dim_width: parseFloat(e.target.value) || 0,
											})
										}
									/>
									<SwappInput
										label="Alto (cm)"
										type="text"
										formatThousands
										min="0"
										value={formData.dim_height === 0 ? "" : formData.dim_height}
										onChange={(e) =>
											setFormData({
												...formData,
												dim_height: parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
							</div>

							<div className="space-y-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
								<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
									Archivos y Productos Digitales (Opcional)
								</h4>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
									<SwappInput
										label="URL de Descarga"
										placeholder="https://..."
										value={formData.download_url}
										onChange={(e) =>
											setFormData({ ...formData, download_url: e.target.value })
										}
									/>
									<SwappInput
										label="Tamaño del Archivo (Bytes)"
										type="text"
										formatThousands
										min="0"
										value={formData.file_size === 0 ? "" : formData.file_size}
										onChange={(e) =>
											setFormData({
												...formData,
												file_size: parseInt(e.target.value) || 0,
											})
										}
									/>
									<SwappInput
										label="Extensión (Ej: pdf, zip)"
										placeholder="pdf"
										value={formData.file_extension}
										onChange={(e) =>
											setFormData({
												...formData,
												file_extension: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className="space-y-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
								<h4 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
									Atributos y Variantes
								</h4>
								<SwappTextarea
									label="JSON de Atributos Personalizados"
									rows={3}
									value={formData.variant_attributes_raw}
									onChange={(e) =>
										setFormData({
											...formData,
											variant_attributes_raw: e.target.value,
										})
									}
								/>
							</div>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
								<SwappInput
									label="Stock Inicial de Depósito"
									type="text"
									formatThousands
									min="0"
									value={
										formData.stock_quantity === 0 ? "" : formData.stock_quantity
									}
									onChange={(e) =>
										setFormData({
											...formData,
											stock_quantity: parseInt(e.target.value) || 0,
										})
									}
								/>
								<div className="space-y-4">
									<SwappCheckbox
										label="Es un envase retornable (Habilitar escaneo de IA)"
										id="is_returnable"
										checked={formData.is_returnable}
										onChange={(e) =>
											setFormData({
												...formData,
												is_returnable: e.target.checked,
											})
										}
									/>
									<SwappCheckbox
										label="Publicar inmediatamente en la tienda"
										id="is_published"
										checked={formData.is_published}
										onChange={(e) =>
											setFormData({
												...formData,
												is_published: e.target.checked,
											})
										}
									/>
									<SwappCheckbox
										label="Destacar producto (Carrusel de inicio)"
										id="is_featured"
										checked={formData.is_featured}
										onChange={(e) =>
											setFormData({
												...formData,
												is_featured: e.target.checked,
											})
										}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 flex justify-end gap-3 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
						<Link
							href="/dashboard/products/catalog/master"
							className="rounded-lg px-6 py-2.5 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</Link>
						<button
							type="submit"
							disabled={isSaving}
							className="flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-6 py-2.5 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua disabled:opacity-50">
							<Save className="h-4 w-4" />
							{isSaving ? "Guardando..." : "Crear e Ingresar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

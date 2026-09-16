"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product.service";
import {
	PackagePlus,
	ArrowLeft,
	Save,
	AlertCircle,
	X,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";
import Link from "next/link";
import { Brand, Category, TaxClass } from "@/types/product";

export default function NewProductPage() {
	const router = useRouter();
	const [brands, setBrands] = useState<Brand[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [showOptionalFields, setShowOptionalFields] = useState(false);

	const [mainImageFile, setMainImageFile] = useState<File | null>(null);
	const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
	const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

	const [structuralAttributes, setStructuralAttributes] = useState<any[]>([]);
	const [customAttributes, setCustomAttributes] = useState<
		Record<string, string>
	>({});
	const [isLoadingPim, setIsLoadingPim] = useState(false);

	// Estado base 100% limpio (sin rastros de has_variants, sku o stock_quantity)
	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		model: "",
		reference_cost: 0,
		reference_price: 0,
		refill_price: 0,
		brand_id: "",
		category_id: "",
		tax_class_id: "",
		short_description: "",
		description: "",
		meta_title: "",
		meta_description: "",
		meta_keywords: "",
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
		is_internal: false,
	});

	const parentCategories = categories.filter((c) => !c.parent_id);
	const subCategories = categories.filter((c) => c.parent_id);

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

	useEffect(() => {
		const loadStructuralAttributes = async () => {
			if (!formData.category_id) {
				setStructuralAttributes([]);
				setCustomAttributes({});
				return;
			}
			setIsLoadingPim(true);
			try {
				const [globalAttrs, linkedAttrs] = await Promise.all([
					ProductService.getAttributes(),
					ProductService.getCategoryAttributes(parseInt(formData.category_id)),
				]);

				const structuralLinkedAttrs = linkedAttrs.filter(
					(l: any) => !l.is_variant,
				);
				const enrichedAttrs = structuralLinkedAttrs.map((linked: any) => {
					const globalAttr = globalAttrs.find(
						(g: any) => g.attribute_id === linked.attribute_id,
					);
					return { ...linked, values: globalAttr ? globalAttr.values : [] };
				});

				setStructuralAttributes(enrichedAttrs);
				setCustomAttributes({});
			} catch (error) {
				toast.error("Error al cargar la ficha técnica de esta categoría.");
			} finally {
				setIsLoadingPim(false);
			}
		};
		loadStructuralAttributes();
	}, [formData.category_id]);

	const generateSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		setFormData({
			...formData,
			name,
			slug: generateSlug(`${name} ${formData.model}`),
		});
	};

	const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const model = e.target.value;
		setFormData({
			...formData,
			model,
			slug: generateSlug(`${formData.name} ${model}`),
		});
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

		const missingStructural = structuralAttributes.some(
			(attr) => attr.is_required && !customAttributes[attr.name],
		);
		if (missingStructural) {
			toast.error(
				"Faltan completar atributos obligatorios en la Ficha Técnica.",
			);
			return;
		}

		setIsSaving(true);
		const toastId = toast.loading("Registrando carcasa del producto...");

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

			const cleanCustomAttributes = Object.entries(customAttributes).reduce(
				(acc: Record<string, string>, [key, val]) => {
					if (val && val.trim() !== "") acc[key] = val;
					return acc;
				},
				{},
			);

			const newProductResponse = await ProductService.create({
				...formData,
				model: formData.model.trim() !== "" ? formData.model : undefined,
				reference_refill_price:
					formData.is_returnable && formData.refill_price > 0
						? formData.refill_price
						: null,
				custom_attributes:
					Object.keys(cleanCustomAttributes).length > 0
						? cleanCustomAttributes
						: null,
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
				brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
				category_id: formData.category_id
					? parseInt(formData.category_id)
					: null,
				tax_class_id: formData.tax_class_id
					? parseInt(formData.tax_class_id)
					: null,
			});

			const newProductUuid = newProductResponse.product_uuid;

			if (mainImageFile) {
				toast.loading("Subiendo imagen principal...", { id: toastId });
				await ProductService.uploadMainImage(newProductUuid, mainImageFile);
			}

			if (galleryFiles.length > 0) {
				toast.loading(`Subiendo ${galleryFiles.length} imágenes...`, {
					id: toastId,
				});
				await ProductService.uploadGalleryImages(newProductUuid, galleryFiles);
			}

			toast.success(
				"¡Carcasa creada! Redirigiendo para añadir la/s variante/s obligatoria/s...",
				{ id: toastId },
			);

			setTimeout(() => router.push("/dashboard/products/catalog/master"), 1500);
		} catch (error: any) {
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: errDetail || "Error crítico al crear el producto.";
			toast.error(errorMessage, { id: toastId });
			setIsSaving(false);
		}
	};

	return (
		<div className="p-6 relative max-w-4xl mx-auto pb-32">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
				<PageHeader
					title="Incorporar Nuevo Producto"
					description="Dar de alta la carcasa de un artículo (luego añadirás sus variantes)"
					icon={PackagePlus}
				/>
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard/products/catalog/master"
						className="inline-flex items-center gap-2 rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo transition-colors whitespace-nowrap shadow-sm">
						<ArrowLeft className="h-4 w-4 text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70" />{" "}
						Volver al Catálogo
					</Link>
				</div>
			</div>

			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md p-6 sm:p-8 shadow-xl transition-all duration-300">
				<form onSubmit={handleCreateProduct} className="space-y-8">
					<div className="space-y-6">
						{/* HEADER ESTRUCTURA */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pb-4 transition-colors">
							<h3 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Estructura e Identidad
							</h3>
							<div className="flex flex-col sm:flex-row items-center gap-3">
								{formData.is_internal && (
									<div className="flex items-center gap-2 bg-swapp-azul-petroleo/10 dark:bg-swapp-tiza-verdoso/10 px-3 py-1.5 rounded-xl border border-swapp-azul-petroleo/20 shadow-sm animate-in fade-in">
										<AlertCircle className="h-4 w-4 text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso" />
										<span className="text-xs font-bold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
											Producto Interno
										</span>
									</div>
								)}
								<div className="flex items-center gap-3 bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 px-3 py-1.5 rounded-xl border border-swapp-verde-pastel/20 dark:border-swapp-verde-menta/20 transition-colors shadow-sm">
									<span className="text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
										Es envase retornable
									</span>
									<SwappToggle
										checked={formData.is_returnable}
										onChange={(val) =>
											setFormData({
												...formData,
												is_returnable: val,
												refill_price: val ? formData.refill_price : 0,
											})
										}
										id="toggle-returnable"
									/>
								</div>
							</div>
						</div>

						{/* GRILLA ORDENADA SEGÚN REQUERIMIENTO */}
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{/* 1. Nombre y Modelo */}
							<div className="sm:col-span-2">
								<SwappInput
									label="Nombre Comercial"
									placeholder="Ej: Máquina SodaStream..."
									required
									value={formData.name}
									onChange={handleNameChange}
								/>
							</div>
							<div className="sm:col-span-2">
								<SwappInput
									label="Modelo de Fábrica (Opcional)"
									placeholder="Ej: E-Duo"
									value={formData.model}
									onChange={handleModelChange}
								/>
							</div>

							{/* 2. Marca y Categoría */}
							<div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Marca <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none shadow-sm cursor-pointer"
									required
									value={formData.brand_id}
									onChange={(e) =>
										setFormData({ ...formData, brand_id: e.target.value })
									}>
									<option
										value=""
										disabled
										className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
										Seleccione...
									</option>
									{brands.map((b) => (
										<option
											key={b.brand_id}
											value={b.brand_id}
											className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
											{b.name}
										</option>
									))}
								</select>
							</div>
							<div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Categoría <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none shadow-sm cursor-pointer"
									required
									value={formData.category_id}
									onChange={(e) =>
										setFormData({ ...formData, category_id: e.target.value })
									}>
									<option
										value=""
										disabled
										className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
										Seleccione...
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
														className="bg-swapp-blanco dark:bg-swapp-azul-oscuro font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
														{sub.name}
													</option>
												))}
										</optgroup>
									))}
								</select>
							</div>

							{/* 3. Costos, Precios */}
							<div className="sm:col-span-2 lg:col-span-1">
								<SwappInput
									label="Costo Base de Ref. ($)"
									type="text"
									formatThousands
									step="0.01"
									min="0"
									value={
										formData.reference_cost === 0 ? "" : formData.reference_cost
									}
									onChange={(e) =>
										setFormData({
											...formData,
											reference_cost: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="sm:col-span-2 lg:col-span-1">
								<SwappInput
									label="Precio Final de Ref. ($)"
									type="text"
									formatThousands
									step="0.01"
									min="0"
									value={
										formData.reference_price === 0
											? ""
											: formData.reference_price
									}
									onChange={(e) =>
										setFormData({
											...formData,
											reference_price: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>

							{/* 4. IVA y Recarga (si aplica) */}
							<div className="sm:col-span-2 space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Condición de IVA <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none shadow-sm cursor-pointer"
									required
									value={formData.tax_class_id}
									onChange={(e) =>
										setFormData({ ...formData, tax_class_id: e.target.value })
									}>
									<option
										value=""
										disabled
										className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
										Seleccione impuesto...
									</option>
									{taxClasses.map((t) => (
										<option
											key={t.tax_class_id}
											value={t.tax_class_id}
											className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
											{t.name} ({t.rate}%)
										</option>
									))}
								</select>
							</div>

							{formData.is_returnable && (
								<div className="sm:col-span-2 animate-in fade-in slide-in-from-left-4 duration-300">
									<SwappInput
										label="Recarga Ref. ($)"
										type="text"
										formatThousands
										step="0.01"
										min="0"
										value={
											formData.refill_price === 0 ? "" : formData.refill_price
										}
										onChange={(e) =>
											setFormData({
												...formData,
												refill_price: parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
							)}
						</div>
					</div>

					{/* FICHA TÉCNICA DINÁMICA (Estructurales) */}
					{(isLoadingPim || structuralAttributes.length > 0) && (
						<div className="border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
							<div className="flex items-center gap-3">
								<h3 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Ficha Técnica (Estructural)
								</h3>
								{isLoadingPim && (
									<Loader2 className="h-4 w-4 animate-spin text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
								)}
							</div>
							{!isLoadingPim && structuralAttributes.length > 0 && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-50">
									{structuralAttributes.map((attr) => (
										<div key={attr.attribute_id} className="space-y-1.5">
											<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
												{attr.name}{" "}
												{attr.is_required && (
													<span className="text-red-500">*</span>
												)}
											</label>
											<SwappSearchableSelect
												options={attr.values.map((v: any) => ({
													label: v.value,
													value: v.value,
												}))}
												value={customAttributes[attr.name] || ""}
												onChange={(val) =>
													setCustomAttributes({
														...customAttributes,
														[attr.name]: val,
													})
												}
												placeholder={`Seleccionar ${attr.name}...`}
											/>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
						<div>
							<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
								Detalles y Configuración Adicional
							</h3>
							<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
								Logística extendida, SEO y multimedia avanzada
							</p>
						</div>
						<div className="flex items-center gap-3 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md px-4 py-2 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo shadow-sm">
							<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
								Mostrar Opciones
							</span>
							<SwappToggle
								checked={showOptionalFields}
								onChange={setShowOptionalFields}
								id="toggle-optional-fields"
							/>
						</div>
					</div>

					{/* ACORDEÓN DE CONFIGURACIÓN AVANZADA */}
					<div
						className={`transition-all duration-500 ease-in-out -m-2 p-2 ${showOptionalFields ? "max-h-[5000px] opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden"}`}>
						<div className="space-y-10">
							{/* GESTIÓN INTERNA Y PUBLICACIÓN */}
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-5 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50">
								<div className="space-y-4">
									<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pb-2">
										Visibilidad Comercial
									</h4>
									<div
										className={
											formData.is_internal
												? "opacity-50 pointer-events-none"
												: ""
										}>
										<SwappCheckbox
											label="Publicar en tienda online"
											id="is_published"
											checked={formData.is_published}
											onChange={(e) =>
												setFormData({
													...formData,
													is_published: e.target.checked,
												})
											}
										/>
									</div>
									<SwappCheckbox
										label="Destacar producto (Carrusel)"
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
								<div className="space-y-4">
									<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pb-2">
										Gestión Interna
									</h4>
									<SwappCheckbox
										label="Es de Consumo Interno (Oculto comercialmente)"
										id="is_internal"
										checked={formData.is_internal}
										onChange={(e) =>
											setFormData({
												...formData,
												is_internal: e.target.checked,
												is_published: e.target.checked
													? false
													: formData.is_published,
											})
										}
									/>
									<p className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 pl-8">
										Ideal para registrar envases vacíos, uniformes o material de
										logística sin afectar la tienda.
									</p>
								</div>
							</div>

							<div className="space-y-6">
								{formData.is_published && (
									<div className="flex items-center gap-2 rounded-xl bg-swapp-verde-oscuro/10 p-4 text-sm font-medium text-swapp-verde-oscuro border border-swapp-verde-oscuro/20 shadow-sm">
										<AlertCircle className="h-5 w-5 shrink-0" />
										<p>
											Para{" "}
											<strong className="font-bold">Publicar en tienda</strong>,
											los campos de descripciones e imágenes pasan a ser
											obligatorios.
										</p>
									</div>
								)}
								<SwappInput
									label="Descripción Corta (Catálogo)"
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
									required={formData.is_published}
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</div>

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 pt-6">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70">
									Multimedia Avanzada
								</h4>
								<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
									<div className="space-y-3">
										<SwappDropzone
											label={`Imagen Principal ${formData.is_published ? "*" : ""}`}
											helpText="JPG, PNG, WEBP. Max 5MB."
											onDropAction={handleMainImageDrop}
										/>
										{mainImagePreview && (
											<div className="relative inline-block mt-2">
												<img
													src={mainImagePreview}
													alt="Principal"
													className="h-32 w-32 object-cover rounded-xl shadow-md p-1"
												/>
												<button
													type="button"
													onClick={() => {
														setMainImageFile(null);
														setMainImagePreview(null);
													}}
													className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600">
													<X className="w-4 h-4" />
												</button>
											</div>
										)}
									</div>
									<div className="space-y-3">
										<SwappDropzone
											label={`Galería ${formData.is_published ? "*" : ""}`}
											helpText="Varias. Max 5MB c/u."
											maxFiles={5}
											onDropAction={handleGalleryDrop}
										/>
										{galleryPreviews.length > 0 && (
											<div className="flex flex-wrap gap-4 mt-2">
												{galleryPreviews.map((url, idx) => (
													<div key={idx} className="relative inline-block">
														<img
															src={url}
															alt={`Gallery ${idx}`}
															className="h-20 w-20 object-cover rounded-lg shadow-sm p-0.5"
														/>
														<button
															type="button"
															onClick={() => removeGalleryImage(idx)}
															className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
															<X className="w-3 h-3" />
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* SEO Y URL AMIGABLE (Escondida) */}
							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 pt-6">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70">
									Posicionamiento y SEO
								</h4>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
									<div className="sm:col-span-1">
										<SwappInput
											label="URL Amigable (Slug)"
											value={formData.slug}
											onChange={(e) =>
												setFormData({
													...formData,
													slug: generateSlug(e.target.value),
												})
											}
											helpText="Se autogenera por defecto."
										/>
									</div>
									<div className="sm:col-span-1">
										<SwappInput
											label="Meta Título"
											value={formData.meta_title}
											onChange={(e) =>
												setFormData({ ...formData, meta_title: e.target.value })
											}
										/>
									</div>
									<div className="sm:col-span-1">
										<SwappInput
											label="Meta Keywords"
											placeholder="sustentable, verde..."
											value={formData.meta_keywords}
											onChange={(e) =>
												setFormData({
													...formData,
													meta_keywords: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<SwappTextarea
									label="Meta Descripción (Max 160 caracteres)"
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

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 pt-6">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70">
									Logística Física y Envíos
								</h4>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
									<SwappInput
										label="Cant. Máx por Orden"
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
									<div className="space-y-1.5">
										<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70">
											Unidad de Peso
										</label>
										<select
											className="w-full rounded-xl border border-swapp-azul-petroleo/20 bg-swapp-blanco/50 px-4 py-2.5 text-sm"
											value={formData.weight_unit}
											onChange={(e) =>
												setFormData({
													...formData,
													weight_unit: e.target.value,
												})
											}>
											<option value="kg">Kilogramos (kg)</option>
											<option value="g">Gramos (g)</option>
											<option value="lb">Libras (lb)</option>
											<option value="oz">Onzas (oz)</option>
										</select>
									</div>
									<div className="grid grid-cols-3 gap-2 col-span-1 sm:col-span-4 lg:col-span-1">
										<SwappInput
											label="L (cm)"
											type="text"
											formatThousands
											min="0"
											value={
												formData.dim_length === 0 ? "" : formData.dim_length
											}
											onChange={(e) =>
												setFormData({
													...formData,
													dim_length: parseFloat(e.target.value) || 0,
												})
											}
										/>
										<SwappInput
											label="A (cm)"
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
											label="Al (cm)"
											type="text"
											formatThousands
											min="0"
											value={
												formData.dim_height === 0 ? "" : formData.dim_height
											}
											onChange={(e) =>
												setFormData({
													...formData,
													dim_height: parseFloat(e.target.value) || 0,
												})
											}
										/>
									</div>
								</div>
							</div>

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 pt-6 transition-colors">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
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
										label="Tamaño (Bytes)"
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
										label="Extensión (Ej: pdf)"
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
						</div>
					</div>

					{/* FOOTER Y BOTONES */}
					<div className="mt-8 flex justify-end gap-3 border-t border-swapp-azul-petroleo/10 pt-6">
						<Link
							href="/dashboard/products/catalog/master"
							className="rounded-xl px-6 py-2.5 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-blanco/80 transition-colors">
							Cancelar
						</Link>
						<button
							type="submit"
							disabled={isSaving}
							className="flex items-center gap-2 rounded-xl bg-swapp-verde-pastel px-6 py-2.5 text-sm font-medium text-swapp-blanco hover:bg-swapp-verde-oscuro disabled:opacity-50 shadow-sm">
							<Save className="h-4 w-4" />
							{isSaving ? "Guardando..." : "Crear Carcasa"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

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
	Wand2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
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

	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		model: "", // <-- NUEVO: Modelo de fábrica
		has_variants: true, // <-- NUEVO: Toggle de variabilidad (por defecto true para el flujo clásico)
		sku: "", // <-- NUEVO: Para la variante fantasma
		stock_quantity: 0, // <-- NUEVO: Para la variante fantasma
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
					return {
						...linked,
						values: globalAttr ? globalAttr.values : [],
					};
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
			slug: generateSlug(`${name} ${formData.model}`) 
		});
	};

	// --- AUTO-GENERAR SKU PARA PRODUCTO SIMPLE ---
	const handleGenerateGhostSKU = () => {
		const formatSkuSegment = (text: string | null | undefined, fallback = "XXX") => {
			if (!text || text.trim() === "") return fallback;
			const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
			if (cleanText.length === 0) return fallback;
			return cleanText.length >= 3 ? cleanText.substring(0, 3) : cleanText.padEnd(3, "X");
		};

		const prodCode = formatSkuSegment(formData.name, "PRO");
		const brandName = brands.find((b) => b.brand_id.toString() === formData.brand_id)?.name;
		const brandCode = formatSkuSegment(brandName, "SWA");
		const modelCode = formatSkuSegment(formData.model, "GEN");
		const attrCode = "UNI"; // Al ser fantasma, no tiene atributos
		const countCode = "001"; // Al ser el primero/único, siempre es 001

		setFormData((prev) => ({
			...prev,
			sku: `${prodCode}-${brandCode}-${modelCode}-${attrCode}-${countCode}`,
		}));
		toast.success("SKU Inteligente auto-generado", {
			position: "top-center",
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

		if (!formData.has_variants && !formData.sku.trim()) {
			toast.error(
				"Al ser un producto único, debés ingresar un SKU válido para su inventario.",
			);
			return;
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
		const toastId = toast.loading("Registrando producto en el catálogo...");

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

			// ARMAMOS EL PAYLOAD MAESTRO
			const newProductResponse = await ProductService.create({
				...formData,
				model: formData.model.trim() !== "" ? formData.model : undefined,
				sku: formData.has_variants ? undefined : formData.sku.toUpperCase(),
				stock_quantity: formData.has_variants ? 0 : formData.stock_quantity,
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
				formData.has_variants 
					? "¡Carcasa creada! Redirigiendo para añadir variantes..." 
					: "¡Producto único creado y listo para la venta!",
				{ id: toastId },
			);
			
			setTimeout(() => router.push("/dashboard/products/catalog/master"), 1500);
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error crítico al crear el producto.",
				{ id: toastId },
			);
			setIsSaving(false);
		}
	};

	return (
		<div className="p-6 relative max-w-4xl mx-auto pb-32">
			{/* CONTROLES Y HEADER ESTANDARIZADOS */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
				<PageHeader
					title="Incorporar Nuevo Producto"
					description="Dar de alta un nuevo artículo en el catálogo central"
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

			{/* CONTENEDOR DEL FORMULARIO ESTANDARIZADO (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md p-6 sm:p-8 shadow-xl transition-all duration-300">
				<form onSubmit={handleCreateProduct} className="space-y-8">
					{/* IDENTIDAD Y PRECIOS */}
					<div className="space-y-6">
						{/* HEADER DE LA SECCIÓN CON LOS DOS TOGGLES ESTRUCTURALES */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pb-4 transition-colors">
							<h3 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Estructura e Identidad
							</h3>
							<div className="flex flex-col sm:flex-row items-center gap-3">
								<div className="flex items-center gap-3 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 px-3 py-1.5 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 transition-colors shadow-sm">
									<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
										Tiene múltiples variantes
									</span>
									<SwappToggle
										checked={formData.has_variants}
										onChange={(val) =>
											setFormData({ ...formData, has_variants: val, sku: "" })
										}
										id="toggle-has-variants"
									/>
								</div>
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

						{/* GRILLA DE INPUTS PRINCIPALES */}
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
							<div className="sm:col-span-2">
								<SwappInput
									label="Nombre Comercial"
									placeholder="Ej: Botella Térmica..."
									required
									value={formData.name}
									onChange={handleNameChange}
								/>
							</div>
							<div className="sm:col-span-2">
								<SwappInput
									label="Modelo de Fábrica (Opcional)"
									placeholder="Ej: SodaStream 500ml"
									value={formData.model}
									onChange={(e) => {
										const model = e.target.value;
										setFormData({ 
											...formData, 
											model,
											slug: generateSlug(`${formData.name} ${model}`)
										});
									}}
								/>
							</div>
							<div className="sm:col-span-4">
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
							</div>

							{/* --- SECCIÓN DINÁMICA: VARIANTE FANTASMA --- */}
							{!formData.has_variants && (
								<>
									<div className="sm:col-span-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-4 mt-2">
										<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
											SKU / Código Único Físico{" "}
											<span className="text-red-500">*</span>
										</label>
										<div className="flex gap-2">
											<input
												type="text"
												required={!formData.has_variants}
												className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-3 py-2 text-sm font-mono text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta uppercase"
												placeholder="Ej: SWA-BOT-UNI-X9Y"
												value={formData.sku}
												onChange={(e) =>
													setFormData({
														...formData,
														sku: e.target.value.toUpperCase(),
													})
												}
											/>
											<SwappTooltip text="Auto-generar código inteligente">
												<button
													type="button"
													onClick={handleGenerateGhostSKU}
													className="flex shrink-0 items-center justify-center rounded-md border border-swapp-verde-pastel/20 bg-swapp-verde-pastel/10 px-3 text-swapp-verde-oscuro hover:bg-swapp-verde-oscuro hover:text-swapp-blanco transition-all">
													<Wand2 className="h-5 w-5" />
												</button>
											</SwappTooltip>
										</div>
									</div>
									<div className="sm:col-span-1 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-4 mt-2">
										<SwappInput
											label="Stock Inicial"
											type="number"
											min="0"
											value={
												formData.stock_quantity === 0
													? ""
													: formData.stock_quantity
											}
											onChange={(e) =>
												setFormData({
													...formData,
													stock_quantity: parseInt(e.target.value) || 0,
												})
											}
										/>
									</div>
								</>
							)}

							{/* --- SECCIÓN DINÁMICA: PRECIOS --- */}
							<div
								className={`transition-all duration-300 ${!formData.has_variants ? "border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-4 mt-2 sm:col-span-2" : "sm:col-span-2"}`}>
								<SwappInput
									label={formData.has_variants ? "Costo de Referencia ($)" : "Costo Interno ($)"}
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

							<div
								className={`transition-all duration-300 ${!formData.has_variants ? "border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-4 mt-2" : ""} ${formData.is_returnable ? "sm:col-span-1" : "sm:col-span-2"}`}>
								<SwappInput
									label={formData.has_variants ? "Precio Base Ref. ($)" : "Precio Final ($)"}
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

							{/* RECARGA */}
							{formData.is_returnable && (
								<div className={`animate-in fade-in slide-in-from-left-4 duration-300 sm:col-span-1 ${!formData.has_variants ? "border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-4 mt-2" : ""}`}>
									<SwappInput
										label={formData.has_variants ? "Recarga Ref. ($)" : "Recarga ($)"}
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

						{/* RESTO DEL FORMULARIO INTACTO */}
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
							<div className="space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 transition-colors">
									Categoría (Subcategoría){" "}
									<span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm cursor-pointer"
									required
									value={formData.category_id}
									onChange={(e) =>
										setFormData({ ...formData, category_id: e.target.value })
									}>
									<option
										value=""
										className="bg-swapp-blanco dark:bg-swapp-azul-oscuro"
										disabled>
										Seleccione una subcategoría...
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

							<div className="space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 transition-colors">
									Marca Registrada <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm cursor-pointer"
									required
									value={formData.brand_id}
									onChange={(e) =>
										setFormData({ ...formData, brand_id: e.target.value })
									}>
									<option
										value=""
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

							<div className="space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 transition-colors">
									Clase de Impuesto <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm cursor-pointer"
									required
									value={formData.tax_class_id}
									onChange={(e) =>
										setFormData({ ...formData, tax_class_id: e.target.value })
									}>
									<option
										value=""
										className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
										Seleccione...
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
						</div>
					</div>

					{/* FICHA TÉCNICA DINÁMICA */}
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
									{structuralAttributes.map((attr) => {
										const formatOptions = attr.values.map((v: any) => ({
											label: v.value,
											value: v.value,
										}));

										return (
											<div key={attr.attribute_id} className="space-y-1.5">
												<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
													{attr.name}{" "}
													{attr.is_required && (
														<span className="text-red-500">*</span>
													)}
												</label>
												<SwappSearchableSelect
													options={formatOptions}
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
										);
									})}
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
						<div className="flex items-center gap-3 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md px-4 py-2 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors shadow-sm">
							<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso whitespace-nowrap">
								Mostrar Opciones
							</span>
							<SwappToggle
								checked={showOptionalFields}
								onChange={setShowOptionalFields}
								id="toggle-optional-fields"
							/>
						</div>
					</div>

					{/* SECCIÓN AVANZADA ACORDEÓN */}
					<div
						className={`transition-all duration-500 ease-in-out -m-2 p-2 ${showOptionalFields ? "max-h-[5000px] opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden"}`}>
						<div className="space-y-10">
							<div className="space-y-6">
								{formData.is_published && (
									<div className="flex items-center gap-2 rounded-xl bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 p-4 text-sm font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 transition-colors animate-in fade-in shadow-sm">
										<AlertCircle className="h-5 w-5 shrink-0" />
										<p>
											Al optar por{" "}
											<strong className="font-bold">
												Publicar inmediatamente
											</strong>
											, los campos de descripciones e imágenes pasan a ser
											obligatorios.
										</p>
									</div>
								)}
								<SwappInput
									label="Descripción Corta (Catálogo)"
									placeholder="Breve resumen..."
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

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Multimedia Avanzada
								</h4>
								<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
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
													className="h-32 w-32 object-cover rounded-xl border border-swapp-verde-oscuro/40 dark:border-swapp-verde-menta/40 shadow-md bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm p-1"
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
															className="h-20 w-20 object-cover rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm p-0.5"
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

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
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

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
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
									<div className="space-y-1.5">
										<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 transition-colors">
											Unidad de Peso
										</label>
										<select
											className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm cursor-pointer"
											value={formData.weight_unit}
											onChange={(e) =>
												setFormData({
													...formData,
													weight_unit: e.target.value,
												})
											}>
											<option
												value="kg"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
												Kilogramos (kg)
											</option>
											<option
												value="g"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
												Gramos (g)
											</option>
											<option
												value="lb"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
												Libras (lb)
											</option>
											<option
												value="oz"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
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

							<div className="space-y-6 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
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

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-6 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 transition-colors">
								<div className="space-y-4">
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

					{/* FOOTER Y BOTONES */}
					<div className="mt-8 flex justify-end gap-3 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 pt-6 transition-colors">
						<Link
							href="/dashboard/products/catalog/master"
							className="rounded-xl px-6 py-2.5 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</Link>
						<button
							type="submit"
							disabled={isSaving}
							className="flex items-center gap-2 rounded-xl bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2.5 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-sm">
							<Save className="h-4 w-4" />
							{isSaving ? "Guardando..." : (formData.has_variants ? "Crear Carcasa" : "Crear Producto")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
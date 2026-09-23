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
	ChevronRight,
	ChevronLeft,
	Fingerprint,
	Box,
	Truck,
	Image as ImageIcon,
	CheckCircle2,
	Wand2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { SwappDropzone } from "@/components/ui/SwappDropzone";
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";
import Link from "next/link";
import { Brand, Category, TaxClass, Product } from "@/types/product";

const STEPS = [
	{ id: 1, title: "Identidad", icon: Fingerprint, desc: "Clasificación base" },
	{ id: 2, title: "Ficha Técnica", icon: Box, desc: "Atributos y 1er SKU" },
	{ id: 3, title: "Logística", icon: Truck, desc: "Precios y envases" },
	{ id: 4, title: "Vitrina", icon: ImageIcon, desc: "Multimedia y SEO" },
];

export default function NewProductWizard() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);

	const [brands, setBrands] = useState<Brand[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);

	const [isSaving, setIsSaving] = useState(false);

	const [mainImageFile, setMainImageFile] = useState<File | null>(null);
	const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
	const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

	// --- ATRIBUTOS PIM ---
	const [structuralAttributes, setStructuralAttributes] = useState<any[]>([]);
	const [variantAttributes, setVariantAttributes] = useState<any[]>([]);
	const [customAttributes, setCustomAttributes] = useState<
		Record<string, string>
	>({});
	const [customVariantAttributes, setCustomVariantAttributes] = useState<
		Record<string, string>
	>({});
	const [isLoadingPim, setIsLoadingPim] = useState(false);

	// --- PRIMERA VARIANTE ---
	const [initialSku, setInitialSku] = useState("");
	const [initialStock, setInitialStock] = useState(0);

	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		model: "",
		cost_price: 0,
		price: 0,
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
		is_published: false,
		is_featured: false,
		is_internal: false,
	});

	// --- LÓGICA DE PASOS DINÁMICOS ---
	const visibleSteps = formData.is_internal ? STEPS.slice(0, 3) : STEPS;

	const parentCategories = categories.filter((c) => !c.parent_id);
	const subCategories = categories.filter((c) => c.parent_id);

	useEffect(() => {
		const fetchInitialData = async () => {
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
				toast.error("Error al cargar datos base.");
			}
		};
		fetchInitialData();
	}, []);

	useEffect(() => {
		const loadAttributes = async () => {
			if (!formData.category_id) {
				setStructuralAttributes([]);
				setVariantAttributes([]);
				setCustomAttributes({});
				setCustomVariantAttributes({});
				return;
			}
			setIsLoadingPim(true);
			try {
				const [globalAttrs, linkedAttrs] = await Promise.all([
					ProductService.getAttributes(),
					ProductService.getCategoryAttributes(parseInt(formData.category_id)),
				]);

				const enrichedAttrs = linkedAttrs.map((linked: any) => {
					const globalAttr = globalAttrs.find(
						(g: any) => g.attribute_id === linked.attribute_id,
					);
					return { ...linked, values: globalAttr ? globalAttr.values : [] };
				});

				const globalVariants = globalAttrs.filter((g: any) => g.is_variant);
				globalVariants.forEach((gv: any) => {
					if (
						!enrichedAttrs.some((e: any) => e.attribute_id === gv.attribute_id)
					) {
						enrichedAttrs.unshift({
							...gv,
							is_required: true,
							values: gv.values || [],
						});
					}
				});

				setStructuralAttributes(
					enrichedAttrs.filter((a: any) => !a.is_variant),
				);
				setVariantAttributes(enrichedAttrs.filter((a: any) => a.is_variant));
			} catch (error) {
				toast.error("Error al cargar la ficha técnica de esta categoría.");
			} finally {
				setIsLoadingPim(false);
			}
		};
		loadAttributes();
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

	const formatSkuSegment = (
		text: string | null | undefined,
		fallback = "XXX",
	) => {
		if (!text || text.trim() === "") return fallback;
		const cleanText = text
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-zA-Z0-9]/g, "")
			.toUpperCase();
		if (cleanText.length === 0) return fallback;
		return cleanText.length >= 3
			? cleanText.substring(0, 3)
			: cleanText.padEnd(3, "X");
	};

	const handleGenerateInitialSKU = () => {
		const brandName = brands.find(
			(b) => b.brand_id.toString() === formData.brand_id?.toString(),
		)?.name;
		const brandCode = formatSkuSegment(brandName, "SWA");
		const prodCode = formatSkuSegment(formData.name, "PRO");
		const modelCode = formatSkuSegment(formData.model, "GEN");

		const firstAttrValue =
			Object.values(customVariantAttributes).find(
				(val) => val && val.trim() !== "",
			) || "UNI";

		const attrCode = formData.is_internal
			? "INT"
			: formatSkuSegment(firstAttrValue, "UNI");

		setInitialSku(`${brandCode}-${prodCode}-${modelCode}-${attrCode}-001`);
		toast.success(
			`SKU auto-generado ${formData.is_internal ? "(Modo Interno)" : ""}`,
		);
	};

	const validateStep = (step: number) => {
		if (step === 1) {
			if (!formData.name.trim()) return "El Nombre Comercial es obligatorio.";
			if (!formData.brand_id) return "Debe seleccionar una Marca.";
			if (!formData.category_id) return "Debe seleccionar una Categoría.";
		}
		if (step === 2) {
			const missingStructural = structuralAttributes.some(
				(attr) => attr.is_required && !customAttributes[attr.name],
			);
			if (missingStructural)
				return "Faltan completar atributos estructurales obligatorios.";

			const missingVariant = variantAttributes.some(
				(attr) => attr.is_required && !customVariantAttributes[attr.name],
			);
			if (missingVariant)
				return "Faltan completar atributos obligatorios para el SKU físico (Ej. Color).";

			if (!initialSku.trim())
				return "Debe definir un SKU para el producto físico.";
		}
		if (step === 3) {
			if (!formData.tax_class_id)
				return "Debe seleccionar una condición de IVA.";
		}
		return null;
	};

	const nextStep = () => {
		const error = validateStep(currentStep);
		if (error) return toast.error(error);
		setCurrentStep((prev) => Math.min(prev + 1, visibleSteps.length));
	};

	const prevStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
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

	const handleCreateProduct = async () => {
		const error = validateStep(visibleSteps.length);
		if (error) return toast.error(error);

		if (formData.is_published && !formData.is_internal) {
			if (!mainImageFile)
				return toast.error(
					"Para publicar, la Imagen Principal es obligatoria.",
				);
			if (galleryFiles.length === 0)
				return toast.error(
					"Para publicar, debés subir al menos 1 imagen a la galería.",
				);
		}

		setIsSaving(true);
		const toastId = toast.loading("Paso 1/2: Registrando carcasa base...");

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

			const cleanVariantAttributes = Object.entries(
				customVariantAttributes,
			).reduce((acc: Record<string, string>, [key, val]) => {
				if (val && val.trim() !== "") acc[key] = val;
				return acc;
			}, {});

			const newProductResponse = await ProductService.create({
				name: formData.name,
				slug: formData.slug,
				model: formData.model.trim() !== "" ? formData.model : undefined,
				brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
				category_id: formData.category_id
					? parseInt(formData.category_id)
					: null,
				tax_class_id: formData.tax_class_id
					? parseInt(formData.tax_class_id)
					: null,
				short_description: formData.short_description,
				description: formData.description,
				is_published: formData.is_published,
				is_featured: formData.is_featured,
				is_internal: formData.is_internal,
				is_returnable: false, // <-- NACE SIEMPRE EN FALSE. EL MODAL DE RELACIONES LO ACTIVA LUEGO.
				has_variants: false, // <-- NACE SIEMPRE EN FALSE. EL BACKEND LO ACTIVA SI HAY MÁS DE UN SKU.
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
			});

			const newProductUuid = newProductResponse.product_uuid;

			toast.loading("Paso 2/2: Inicializando SKU Inicial (Inventario)...", {
				id: toastId,
			});

			await ProductService.createVariant(newProductUuid, {
				sku: initialSku,
				stock_quantity: initialStock,
				price: formData.price,
				cost_price: formData.cost_price,
				refill_price: null, // <-- SE CONFIGURARÁ DESPUÉS DE CREAR LA RELACIÓN
				variant_attributes:
					Object.keys(cleanVariantAttributes).length > 0
						? cleanVariantAttributes
						: null,
			});

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

			toast.success("¡Producto y SKU inicial creados con éxito!", {
				id: toastId,
			});
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
					description="Asistente de creación de producto base y primer SKU"
					icon={PackagePlus}
				/>
				<Link
					href="/dashboard/products/catalog/master"
					className="inline-flex items-center gap-2 rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo transition-colors shadow-sm">
					<ArrowLeft className="h-4 w-4" /> Cancelar y Volver
				</Link>
			</div>

			<div className="mb-8 relative">
				<div className="absolute top-1/2 left-0 w-full h-0.5 bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/30 -translate-y-1/2 z-0 hidden sm:block"></div>
				<div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
					{visibleSteps.map((step) => {
						const isCompleted = currentStep > step.id;
						const isCurrent = currentStep === step.id;
						const Icon = isCompleted ? CheckCircle2 : step.icon;

						return (
							<div
								key={step.id}
								className="flex items-center gap-3 bg-swapp-blanco dark:bg-swapp-negro-azulado px-2 py-1 rounded-full">
								<div
									className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${isCompleted ? "bg-swapp-verde-oscuro border-swapp-verde-oscuro text-swapp-blanco dark:bg-swapp-verde-menta dark:border-swapp-verde-menta dark:text-swapp-azul-oscuro" : isCurrent ? "border-swapp-verde-oscuro text-swapp-verde-oscuro dark:border-swapp-verde-menta dark:text-swapp-verde-menta bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10" : "border-swapp-azul-petroleo/20 text-swapp-azul-petroleo/40 dark:border-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/40"}`}>
									<Icon className="h-5 w-5" />
								</div>
								<div className="hidden sm:block">
									<p
										className={`text-sm font-bold ${isCurrent || isCompleted ? "text-swapp-azul-oscuro dark:text-swapp-blanco" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50"}`}>
										{step.title}
									</p>
									<p className="text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 uppercase tracking-wider">
										{step.desc}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md p-6 sm:p-8 shadow-xl">
				{/* --- PASO 1: IDENTIDAD --- */}
				<div
					className={
						currentStep === 1
							? "block animate-in fade-in slide-in-from-right-4"
							: "hidden"
					}>
					<div className="mb-6">
						<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
							Identidad del Producto
						</h3>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
							Definí cómo se llama y a qué segmento pertenece.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 rounded-xl border border-swapp-azul-petroleo/10 mb-6 transition-colors">
						<div>
							<p className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
								Es Producto Interno (Logística)
							</p>
							<p className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-0.5">
								Oculta la vitrina comercial. Ideal para registrar envases vacíos
								o insumos en sistema.
							</p>
						</div>
						<SwappToggle
							checked={formData.is_internal}
							onChange={(val) =>
								setFormData({
									...formData,
									is_internal: val,
									is_published: val ? false : formData.is_published,
								})
							}
							id="toggle-internal-step1"
						/>
					</div>

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<SwappInput
								label="Nombre Comercial"
								placeholder="Ej: Máquina SodaStream"
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
						<div className="space-y-1.5">
							<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Marca <span className="text-red-500">*</span>
							</label>
							<select
								className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 px-4 py-2.5 text-sm outline-none shadow-sm cursor-pointer"
								required
								value={formData.brand_id}
								onChange={(e) =>
									setFormData({ ...formData, brand_id: e.target.value })
								}>
								<option value="" disabled>
									Seleccione...
								</option>
								{brands.map((b) => (
									<option key={b.brand_id} value={b.brand_id}>
										{b.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5">
							<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Categoría <span className="text-red-500">*</span>
							</label>
							<select
								className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 px-4 py-2.5 text-sm outline-none shadow-sm cursor-pointer"
								required
								value={formData.category_id}
								onChange={(e) =>
									setFormData({ ...formData, category_id: e.target.value })
								}>
								<option value="" disabled>
									Seleccione...
								</option>
								{parentCategories.map((parent) => (
									<optgroup
										key={parent.category_id}
										label={parent.name}
										className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
										{subCategories
											.filter((sub) => sub.parent_id === parent.category_id)
											.map((sub) => (
												<option
													key={sub.category_id}
													value={sub.category_id}
													className="font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
													{sub.name}
												</option>
											))}
									</optgroup>
								))}
							</select>
						</div>
					</div>
					{formData.is_internal && (
						<div className="mt-6 pt-6 border-t border-swapp-azul-petroleo/10 animate-in fade-in slide-in-from-top-4">
							<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 mb-4">
								Identidad Visual (Uso Administrativo)
							</h4>
							<div className="flex gap-6 items-start bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-4 rounded-xl border border-swapp-azul-petroleo/10">
								<div className="flex-1">
									<SwappDropzone
										label="Fotografía de Referencia"
										helpText="Ayudará al equipo a identificar este insumo o envase vacío en las tablas del sistema. (Opcional)"
										onDropAction={handleMainImageDrop}
									/>
								</div>
								{mainImagePreview && (
									<div className="relative shrink-0 animate-in zoom-in-95">
										<img
											src={mainImagePreview}
											alt="Referencia"
											className="h-24 w-24 object-cover rounded-xl shadow-md p-1 bg-swapp-blanco border border-swapp-azul-petroleo/20"
										/>
										<button
											type="button"
											onClick={() => {
												setMainImageFile(null);
												setMainImagePreview(null);
											}}
											className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
											<X className="w-3 h-3" />
										</button>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* --- PASO 2: FICHA TÉCNICA Y PRIMER SKU --- */}
				<div
					className={
						currentStep === 2
							? "block animate-in fade-in slide-in-from-right-4"
							: "hidden"
					}>
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
								Ficha Técnica y Variante Inicial
							</h3>
							<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Atributos del producto y configuración del primer ítem físico.
							</p>
						</div>
						{isLoadingPim && (
							<Loader2 className="h-5 w-5 animate-spin text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						)}
					</div>

					<div className="space-y-4 mb-10">
						<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 border-b border-swapp-azul-petroleo/10 pb-2">
							1. Atributos Comunes (Estructurales)
						</h4>
						{structuralAttributes.length === 0 && !isLoadingPim ? (
							<p className="text-sm text-swapp-azul-petroleo/60 italic">
								Esta categoría no tiene atributos estructurales obligatorios.
							</p>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
											placeholder={`Seleccionar...`}
										/>
									</div>
								))}
							</div>
						)}
					</div>

					{variantAttributes.length > 0 && (
						<div className="space-y-4 mb-10 animate-in fade-in slide-in-from-top-4">
							<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 border-b border-swapp-azul-petroleo/10 pb-2">
								2. Atributos Físicos (Variante Inicial)
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-5 rounded-xl border border-swapp-azul-petroleo/10">
								{variantAttributes.map((attr) => (
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
											value={customVariantAttributes[attr.name] || ""}
											onChange={(val) =>
												setCustomVariantAttributes({
													...customVariantAttributes,
													[attr.name]: val,
												})
											}
											placeholder={`Seleccionar...`}
										/>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="space-y-4">
						<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 border-b border-swapp-azul-petroleo/10 pb-2">
							{variantAttributes.length > 0 ? "3." : "2."} Identificación y
							Stock (SKU Inicial)
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-5 rounded-xl border border-swapp-azul-petroleo/10">
							<div className="space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									SKU Único <span className="text-red-500">*</span>
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										required
										className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 px-3 py-2 text-sm font-mono outline-none shadow-sm uppercase"
										placeholder="Ej: SWA-BOT-UNI-X9Y"
										value={initialSku}
										onChange={(e) =>
											setInitialSku(e.target.value.toUpperCase())
										}
									/>
									<button
										type="button"
										onClick={handleGenerateInitialSKU}
										className="flex shrink-0 items-center justify-center rounded-xl border border-swapp-verde-oscuro/20 bg-swapp-verde-pastel/10 px-3 text-swapp-verde-oscuro dark:text-swapp-verde-menta hover:bg-swapp-verde-pastel hover:text-white transition-all shadow-sm">
										<Wand2 className="h-5 w-5" />
									</button>
								</div>
							</div>
							<div className="space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Stock Inicial Físico
								</label>
								<input
									type="number"
									min="0"
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 px-3 py-2 text-sm outline-none shadow-sm"
									value={initialStock === 0 ? "" : initialStock}
									onChange={(e) =>
										setInitialStock(parseInt(e.target.value) || 0)
									}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* --- PASO 3: LOGÍSTICA Y ECONOMÍA CIRCULAR --- */}
				<div
					className={
						currentStep === 3
							? "block animate-in fade-in slide-in-from-right-4"
							: "hidden"
					}>
					<div className="mb-6">
						<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
							Logística y Operativa
						</h3>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
							Configuración de costos e inventario base.
						</p>
					</div>

					<div className="space-y-8">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
							<div className="space-y-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Condición de IVA <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 bg-swapp-blanco/50 px-4 py-2.5 text-sm outline-none"
									required
									value={formData.tax_class_id}
									onChange={(e) =>
										setFormData({ ...formData, tax_class_id: e.target.value })
									}>
									<option value="" disabled>
										Seleccione...
									</option>
									{taxClasses.map((t) => (
										<option key={t.tax_class_id} value={t.tax_class_id}>
											{t.name} ({t.rate}%)
										</option>
									))}
								</select>
							</div>
							<SwappInput
								label="Costo Base ($)"
								type="text"
								formatThousands
								step="0.01"
								min="0"
								value={formData.cost_price === 0 ? "" : formData.cost_price}
								onChange={(e) =>
									setFormData({
										...formData,
										cost_price: parseFloat(e.target.value) || 0,
									})
								}
							/>
							<SwappInput
								label="Precio Final de Venta ($)"
								type="text"
								formatThousands
								step="0.01"
								min="0"
								value={formData.price === 0 ? "" : formData.price}
								onChange={(e) =>
									setFormData({
										...formData,
										price: parseFloat(e.target.value) || 0,
									})
								}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4 border-t border-swapp-azul-petroleo/10">
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
								label="Peso Físico"
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
									Unidad Peso
								</label>
								<select
									className="w-full rounded-xl border border-swapp-azul-petroleo/20 bg-swapp-blanco/50 px-4 py-2.5 text-sm"
									value={formData.weight_unit}
									onChange={(e) =>
										setFormData({ ...formData, weight_unit: e.target.value })
									}>
									<option value="kg">kg</option>
									<option value="g">g</option>
									<option value="lb">lb</option>
									<option value="oz">oz</option>
								</select>
							</div>
							<div className="flex gap-2 col-span-1 sm:col-span-4 lg:col-span-1">
								<SwappInput
									label="L(cm)"
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
									label="A(cm)"
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
									label="Al(cm)"
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
					</div>
				</div>

				{/* --- PASO 4: VITRINA Y SEO (SOLO SI NO ES INTERNO) --- */}
				{!formData.is_internal && (
					<div
						className={
							currentStep === 4
								? "block animate-in fade-in slide-in-from-right-4"
								: "hidden"
						}>
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
									Vitrina Comercial
								</h3>
								<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Imágenes, textos persuasivos y publicación.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
									¡Publicar Inmediatamente!
								</span>
								<SwappToggle
									checked={formData.is_published}
									onChange={(val) =>
										setFormData({ ...formData, is_published: val })
									}
									id="toggle-publish"
								/>
							</div>
						</div>

						<div className="space-y-8">
							{formData.is_published && (
								<div className="flex items-center gap-2 rounded-xl bg-swapp-verde-oscuro/10 p-3 text-sm font-medium text-swapp-verde-oscuro border border-swapp-verde-oscuro/20 shadow-sm animate-in fade-in">
									<AlertCircle className="h-4 w-4 shrink-0" />
									<p>
										Al encender la publicación, la imagen principal, galería y
										descripciones pasan a ser{" "}
										<strong className="font-bold">obligatorias</strong>.
									</p>
								</div>
							)}

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<SwappInput
									label="Descripción Corta"
									required={formData.is_published}
									value={formData.short_description}
									onChange={(e) =>
										setFormData({
											...formData,
											short_description: e.target.value,
										})
									}
								/>
								<div className="sm:col-span-2">
									<SwappTextarea
										label="Descripción Extendida"
										rows={4}
										required={formData.is_published}
										value={formData.description}
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 pt-4 border-t border-swapp-azul-petroleo/10">
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
												className="h-24 w-24 object-cover rounded-xl shadow-md p-1 bg-swapp-blanco"
											/>
											<button
												type="button"
												onClick={() => {
													setMainImageFile(null);
													setMainImagePreview(null);
												}}
												className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
												<X className="w-3 h-3" />
											</button>
										</div>
									)}
								</div>
								<div className="space-y-3">
									<SwappDropzone
										label={`Galería ${formData.is_published ? "*" : ""}`}
										helpText="Subí múltiples imágenes extra."
										maxFiles={5}
										onDropAction={handleGalleryDrop}
									/>
									{galleryPreviews.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{galleryPreviews.map((url, idx) => (
												<div key={idx} className="relative inline-block">
													<img
														src={url}
														alt={`Gallery ${idx}`}
														className="h-16 w-16 object-cover rounded-lg shadow-sm p-0.5 bg-swapp-blanco"
													/>
													<button
														type="button"
														onClick={() => removeGalleryImage(idx)}
														className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600">
														<X className="w-3 h-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="pt-4 border-t border-swapp-azul-petroleo/10">
								<h4 className="text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 mb-4">
									Posicionamiento SEO
								</h4>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<SwappInput
										label="Meta Título"
										value={formData.meta_title}
										onChange={(e) =>
											setFormData({ ...formData, meta_title: e.target.value })
										}
									/>
									<SwappInput
										label="URL Amigable (Slug)"
										value={formData.slug}
										onChange={(e) =>
											setFormData({
												...formData,
												slug: generateSlug(e.target.value),
											})
										}
										helpText="Autogenerado por defecto."
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* CONTROLES DE NAVEGACIÓN INFERIORES */}
				<div className="mt-8 flex items-center justify-between border-t border-swapp-azul-petroleo/10 pt-6">
					<button
						type="button"
						onClick={prevStep}
						disabled={currentStep === 1 || isSaving}
						className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${currentStep === 1 ? "opacity-0 pointer-events-none" : "text-swapp-azul-petroleo hover:bg-swapp-blanco/80 dark:text-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo/50"}`}>
						<ChevronLeft className="h-4 w-4" /> Anterior
					</button>

					{currentStep < visibleSteps.length ? (
						<button
							type="button"
							onClick={nextStep}
							className="flex items-center gap-2 rounded-xl bg-swapp-azul-petroleo text-swapp-blanco px-6 py-2.5 text-sm font-medium hover:bg-swapp-azul-oscuro dark:bg-swapp-tiza-verdoso dark:text-swapp-azul-oscuro dark:hover:bg-swapp-blanco transition-colors shadow-sm">
							Siguiente <ChevronRight className="h-4 w-4" />
						</button>
					) : (
						<button
							type="button"
							onClick={handleCreateProduct}
							disabled={isSaving}
							className="flex items-center gap-2 rounded-xl bg-swapp-verde-pastel px-6 py-2.5 text-sm font-medium text-swapp-blanco hover:bg-swapp-verde-oscuro dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro dark:hover:bg-swapp-verde-pastel transition-colors disabled:opacity-50 shadow-md">
							<Save className="h-4 w-4" />
							{isSaving ? "Guardando..." : "Finalizar y Crear Producto"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

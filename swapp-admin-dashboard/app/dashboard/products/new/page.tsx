"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { PackagePlus, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import Link from "next/link";

interface Brand {
	brand_id: number;
	name: string;
}

interface Category {
	category_id: number;
	name: string;
}

interface TaxClass {
	tax_class_id: number;
	name: string;
	rate: number;
}

export default function NewProductPage() {
	const router = useRouter();
	const [brands, setBrands] = useState<Brand[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		sku: "",
		short_description: "",
		description: "",
		cost_price: 0,
		base_price: 0,
		stock_quantity: 0,
		is_returnable: false,
		is_published: false,
		is_featured: false,
		brand_id: "",
		category_id: "",
		tax_class_id: "",
	});

	useEffect(() => {
		const fetchFormData = async () => {
			try {
				// Ejecutamos las peticiones en paralelo para mayor velocidad
				const [brandsData, categoriesData, taxesData] = await Promise.all([
					ProductService.getBrands(),
					ProductService.getCategories(), // Asegurate de agregar este método en tu product.service.ts
					ProductService.getTaxes(), // Asegurate de agregar este método en tu product.service.ts
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

	const handleCreateProduct = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		const toastId = toast.loading("Creando producto...");
		try {
			await ProductService.create({
				...formData,
				sku: formData.sku || null,
				cost_price: formData.cost_price || null,
				brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
				category_id: formData.category_id
					? parseInt(formData.category_id)
					: null,
				tax_class_id: formData.tax_class_id
					? parseInt(formData.tax_class_id)
					: null,
			});

			toast.success("Producto creado exitosamente", { id: toastId });
			setTimeout(() => {
				router.push("/dashboard/products");
			}, 1000);
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al crear el producto.",
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
						href="/dashboard/products"
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
				<form onSubmit={handleCreateProduct} className="space-y-6">
					{/* Primera Fila: Identificación Básica */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<SwappInput
							label="Nombre Comercial"
							placeholder="Ej: Envase Vidrio Retornable 1L"
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
					</div>

					{/* Segunda Fila: Clasificación */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
						<SwappInput
							label="SKU / Código de Barra"
							placeholder="Ej: ENV-VID-001"
							value={formData.sku}
							onChange={(e) =>
								setFormData({ ...formData, sku: e.target.value })
							}
						/>

						<div className="space-y-1">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
								Categoría Principal
							</label>
							<select
								className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
								value={formData.category_id}
								onChange={(e) =>
									setFormData({ ...formData, category_id: e.target.value })
								}>
								<option value="" className="dark:bg-swapp-negro-azulado">
									Seleccione una categoría...
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
								Marca Registrada
							</label>
							<select
								className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
								value={formData.brand_id}
								onChange={(e) =>
									setFormData({ ...formData, brand_id: e.target.value })
								}>
								<option value="" className="dark:bg-swapp-negro-azulado">
									Seleccione una marca...
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
					</div>

					<SwappInput
						label="Descripción Corta (Catálogo)"
						placeholder="Breve resumen para las tarjetas de la tienda..."
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
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
					/>

					{/* Fila de Finanzas y Logística */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
						<SwappInput
							label="Costo de Adquisición ($)"
							type="number"
							step="0.01"
							min="0"
							value={formData.cost_price || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									cost_price: parseFloat(e.target.value) || 0,
								})
							}
						/>

						<SwappInput
							label="Precio Base Inicial ($)"
							type="number"
							step="0.01"
							min="0"
							required
							value={formData.base_price || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									base_price: parseFloat(e.target.value) || 0,
								})
							}
						/>

						<div className="space-y-1">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
								Clase de Impuesto
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

						<SwappInput
							label="Stock Inicial de Depósito"
							type="number"
							min="0"
							required
							value={formData.stock_quantity || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									stock_quantity: parseInt(e.target.value) || 0,
								})
							}
						/>
					</div>

					{/* Fila de Switches/Configuración */}
					<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 space-y-4 transition-colors">
						<SwappCheckbox
							label="Es un envase retornable (Habilitar para escaneo de IA)"
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

					<div className="mt-8 flex justify-end gap-3 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
						<Link
							href="/dashboard/products"
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

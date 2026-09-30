"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	X,
	DollarSign,
	Plus,
	Loader2,
	Trash2,
	Receipt,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentService } from "@/services/payment.service";
import { formatCurrency } from "@/lib/utils";
import { SwappTooltip } from "@/components/ui/SwappTooltip";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	order: any | null;
	onSuccess: () => void;
}

export default function PaymentModal({
	isOpen,
	onClose,
	order,
	onSuccess,
}: PaymentModalProps) {
	const [isVoiding, setIsVoiding] = useState<string | null>(null);

	// Estado visual para el input formateado (Ej: "15.000,50")
	const [displayAmount, setDisplayAmount] = useState<string>("");

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { isSubmitting },
	} = useForm({
		defaultValues: {
			payment_method: "efectivo",
			amount: 0,
			transaction_reference: "",
		},
	});

	const currentAmount = watch("amount");

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

	// --- CÁLCULOS DE TESORERÍA ---
	const totalAmount = Number(order?.total_amount || 0);
	const activePayments =
		order?.payments?.filter((p: any) => p.payment_status === "completed") || [];
	const totalPaid = activePayments.reduce(
		(acc: number, curr: any) => acc + Number(curr.amount),
		0,
	);
	// Redondeo de seguridad para evitar errores de coma flotante (ej: 0.000000000001)
	const remainingDebt = Number((totalAmount - totalPaid).toFixed(2));
	const isFullyPaid = remainingDebt <= 0;

	// Pre-cargamos el input con el monto faltante al abrir el modal
	useEffect(() => {
		if (isOpen && order) {
			const initialAmount = remainingDebt > 0 ? remainingDebt : 0;
			setValue("amount", initialAmount);

			// Formateamos el monto inicial a visual
			if (initialAmount > 0) {
				setDisplayAmount(new Intl.NumberFormat("es-AR").format(initialAmount));
			} else {
				setDisplayAmount("");
			}

			setValue("payment_method", "efectivo");
			setValue("transaction_reference", "");
		}
	}, [isOpen, order, remainingDebt, setValue]);

	if (!isOpen || !order) return null;

	// --- FORMATEADOR EN TIEMPO REAL ---
	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = e.target.value;

		// 1. Permitimos solo números y comas
		val = val.replace(/[^0-9,]/g, "");

		// 2. Prevenimos que escriban múltiples comas
		const commaParts = val.split(",");
		if (commaParts.length > 2) {
			val = commaParts[0] + "," + commaParts.slice(1).join("");
		}

		// 3. Separamos enteros de decimales (limitado a 2 decimales)
		const parts = val.split(",");
		let integerPart = parts[0];
		let decimalPart = parts.length > 1 ? "," + parts[1].substring(0, 2) : "";

		// 4. Formateamos la parte entera con el estándar argentino (puntos para miles)
		if (integerPart) {
			integerPart = parseInt(integerPart, 10).toLocaleString("es-AR");
		}

		// 5. Unimos y actualizamos la vista
		const formattedDisplay = integerPart + decimalPart;
		setDisplayAmount(formattedDisplay);

		// 6. Traducimos la coma a punto para que Pydantic/FastAPI reciba un float válido
		const numericString = val.replace(",", ".");
		setValue("amount", parseFloat(numericString) || 0, {
			shouldValidate: true,
		});
	};

	const fillRemainingDebt = () => {
		setValue("amount", remainingDebt, { shouldValidate: true });
		setDisplayAmount(new Intl.NumberFormat("es-AR").format(remainingDebt));
	};

	const onSubmit = async (data: any) => {
		if (data.amount <= 0) {
			toast.error("El monto debe ser mayor a 0");
			return;
		}
		if (data.amount > remainingDebt + 1) {
			// +1 de margen por redondeos
			toast.error("No puedes cobrar más de la deuda restante");
			return;
		}

		const toastId = toast.loading("Registrando pago...");
		try {
			await PaymentService.createPayment(order.order_uuid, {
				payment_method: data.payment_method,
				amount: Number(data.amount),
				transaction_reference: data.transaction_reference || undefined,
			});
			toast.success("Pago registrado exitosamente", { id: toastId });
			reset();
			onSuccess();
		} catch (error: any) {
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: errDetail || "Error al registrar el pago";

			toast.error(errorMessage, { id: toastId });
		}
	};

	const handleVoidPayment = async (paymentUuid: string) => {
		if (
			!confirm(
				"¿Estás seguro de anular este recibo? El saldo volverá a ser adeudado.",
			)
		)
			return;

		setIsVoiding(paymentUuid);
		const toastId = toast.loading("Anulando recibo...");
		try {
			await PaymentService.voidPayment(paymentUuid);
			toast.success("Recibo anulado correctamente", { id: toastId });
			onSuccess();
		} catch (error: any) {
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: errDetail || "Error al anular el recibo";

			toast.error(errorMessage, { id: toastId });
		} finally {
			setIsVoiding(null);
		}
	};

	// --- CLASES ESTANDARIZADAS ---
	const inputBaseClass =
		"w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-transparent px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40";
	const labelBaseClass =
		"block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 transition-colors";

	const isAmountExceeded = currentAmount > remainingDebt + 0.1;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-2xl rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden flex flex-col max-h-[90vh] transition-colors">
				{/* Header */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<div className="flex items-center gap-3">
						<div
							className={`p-2 rounded-lg border shadow-sm ${isFullyPaid ? "bg-emerald-500/10 border-emerald-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
							<DollarSign
								className={`h-6 w-6 ${isFullyPaid ? "text-emerald-600 dark:text-emerald-400" : "text-yellow-600 dark:text-yellow-500"}`}
							/>
						</div>
						<div>
							<h3 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
								Tesorería del Pedido
							</h3>
							<p className="text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-0.5">
								Cliente: {order.client?.first_name} {order.client?.last_name}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
					{/* Columna Izquierda: Carga de Pago */}
					<div className="flex flex-col gap-5">
						{/* Indicador de Deuda */}
						<div className="flex flex-col gap-2 p-4 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/20 backdrop-blur-sm shadow-sm transition-colors">
							<div className="flex justify-between items-center text-sm">
								<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 font-medium">
									Total Pedido:
								</span>
								<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
									{formatCurrency(totalAmount)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm">
								<span className="text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 font-medium">
									Pagado:
								</span>
								<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
									{formatCurrency(totalPaid)}
								</span>
							</div>
							<div className="border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 my-1 transition-colors" />
							<div className="flex justify-between items-center">
								<span className="text-xs font-bold uppercase tracking-wider text-swapp-azul-oscuro dark:text-swapp-blanco">
									Saldo Deudor:
								</span>
								<span
									className={`text-lg font-bold ${isFullyPaid ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-red-600 dark:text-red-400"}`}>
									{formatCurrency(remainingDebt > 0 ? remainingDebt : 0)}
								</span>
							</div>
						</div>

						{/* Formulario */}
						{!isFullyPaid ? (
							<form
								id="payment-form"
								onSubmit={handleSubmit(onSubmit)}
								className="flex flex-col gap-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col">
										<div className="flex justify-between items-end mb-1.5">
											<label className={labelBaseClass}>
												Monto <span className="text-red-500">*</span>
											</label>
											<SwappTooltip text="Autocompletar saldo total">
												<button
													type="button"
													onClick={fillRemainingDebt}
													className="text-[9px] font-bold uppercase tracking-wider bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-menta hover:text-white dark:hover:text-swapp-azul-oscuro px-1.5 py-0.5 rounded transition-colors">
													Saldo Total
												</button>
											</SwappTooltip>
										</div>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/40">
												$
											</span>
											<input
												type="text"
												value={displayAmount}
												onChange={handleAmountChange}
												className={`${inputBaseClass} pl-7 font-bold ${isAmountExceeded ? "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-600 dark:text-red-400" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}
												placeholder="0,00"
											/>
										</div>
										{isAmountExceeded && (
											<span className="text-[10px] font-bold text-red-500 mt-1">
												El monto supera la deuda actual.
											</span>
										)}
									</div>

									<div className="flex flex-col">
										<label className={`${labelBaseClass} mb-1.5`}>
											Método <span className="text-red-500">*</span>
										</label>
										<select
											{...register("payment_method")}
											className={`${inputBaseClass} h-[38px] font-medium`}>
											<option
												value="efectivo"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
												Efectivo
											</option>
											<option
												value="transferencia"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
												Transferencia
											</option>
											<option
												value="mercadopago"
												className="bg-swapp-blanco dark:bg-swapp-azul-oscuro">
												Mercado Pago
											</option>
										</select>
									</div>
								</div>

								<div>
									<label className={`${labelBaseClass} mb-1.5`}>
										Referencia / Nro. Comprobante
									</label>
									<input
										type="text"
										placeholder="Opcional..."
										{...register("transaction_reference")}
										className={inputBaseClass}
									/>
								</div>

								<button
									type="submit"
									disabled={
										isSubmitting || currentAmount <= 0 || isAmountExceeded
									}
									className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-4 py-2.5 text-sm font-bold text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel transition-colors disabled:opacity-50 shadow-sm">
									{isSubmitting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Plus className="h-4 w-4" />
									)}
									Registrar Cobro
								</button>
							</form>
						) : (
							<div className="flex flex-col items-center justify-center gap-2 h-full text-center p-6 border-2 border-dashed border-swapp-verde-oscuro/30 dark:border-swapp-verde-menta/30 bg-swapp-verde-oscuro/5 dark:bg-swapp-verde-menta/5 rounded-xl transition-colors">
								<CheckCircle2 className="h-10 w-10 text-swapp-verde-oscuro dark:text-swapp-verde-menta mb-2" />
								<p className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
									Pedido Saldado
								</p>
								<p className="text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									No hay deuda pendiente de cobro en este pedido.
								</p>
							</div>
						)}
					</div>

					{/* Columna Derecha: Historial de Recibos */}
					<div className="flex flex-col gap-3 border-l-0 md:border-l border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 md:pl-8 transition-colors">
						<h4 className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2 mb-2">
							<Receipt className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Historial de Recibos
						</h4>

						{activePayments.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
								<AlertCircle className="h-8 w-8 mb-2 opacity-50" />
								<p className="text-xs font-medium">
									No hay pagos registrados aún.
								</p>
							</div>
						) : (
							<div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[300px] custom-scrollbar">
								{activePayments.map((payment: any) => (
									<div
										key={payment.payment_uuid}
										className="flex flex-col p-3 rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/20 backdrop-blur-sm shadow-sm relative group transition-colors hover:border-swapp-verde-oscuro/40 dark:hover:border-swapp-verde-menta/40">
										<div className="flex justify-between items-start">
											<div className="flex flex-col gap-0.5">
												<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta text-sm">
													{formatCurrency(payment.amount)}
												</span>
												<span className="text-[10px] uppercase font-bold text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
													{payment.payment_method}
												</span>
											</div>
											<button
												onClick={() => handleVoidPayment(payment.payment_uuid)}
												disabled={isVoiding === payment.payment_uuid}
												className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 shadow-sm">
												{isVoiding === payment.payment_uuid ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<Trash2 className="h-3.5 w-3.5" />
												)}
											</button>
										</div>
										<div className="flex justify-between items-end mt-2">
											<span className="text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 font-medium font-mono truncate max-w-[150px]">
												{payment.transaction_reference || "Sin ref."}
											</span>
											<span className="text-[9px] font-medium text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
												{new Date(payment.created_at).toLocaleDateString(
													"es-AR",
													{
														day: "2-digit",
														month: "2-digit",
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

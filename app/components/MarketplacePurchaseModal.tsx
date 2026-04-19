'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PaymentMethod = 'cash_on_delivery' | 'card' | 'mobile_banking';

interface PurchaseDefaultsResponse {
	success?: boolean;
	error?: string;
	defaults?: {
		customerName?: string;
		customerEmail?: string;
		customerPhone?: string;
		shippingAddress?: string;
		shippingCity?: string;
		shippingPostcode?: string;
	};
}

interface MarketplacePurchaseModalProps {
	open: boolean;
	onClose: () => void;
	item: {
		id: string;
		type: 'car' | 'diorama';
		imageData: string | null;
		title: string;
		subtitle?: string;
		condition?: string;
		sellingPrice: number;
		sellerUsername: string;
	} | null;
}

const methodLabel: Record<PaymentMethod, string> = {
	cash_on_delivery: 'Cash on Delivery',
	card: 'Card',
	mobile_banking: 'Mobile Banking',
};

export default function MarketplacePurchaseModal({ open, onClose, item }: MarketplacePurchaseModalProps) {
	const router = useRouter();
	const [showForm, setShowForm] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
	const [customerName, setCustomerName] = useState('');
	const [customerEmail, setCustomerEmail] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [shippingAddress, setShippingAddress] = useState('');
	const [shippingCity, setShippingCity] = useState('Dhaka');
	const [shippingPostcode, setShippingPostcode] = useState('1200');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const isOnlinePayment = paymentMethod === 'card' || paymentMethod === 'mobile_banking';

	useEffect(() => {
		if (!open) return;

		let cancelled = false;

		const loadDefaults = async () => {
			try {
				const response = await fetch('/api/marketplace/purchase', {
					method: 'GET',
					cache: 'no-store',
				});

				if (!response.ok) return;

				const data = (await response.json()) as PurchaseDefaultsResponse;
				if (cancelled || !data.defaults) return;

				setCustomerName((prev) => prev || data.defaults?.customerName || '');
				setCustomerEmail((prev) => prev || data.defaults?.customerEmail || '');
				setCustomerPhone((prev) => prev || data.defaults?.customerPhone || '');
				setShippingAddress((prev) => prev || data.defaults?.shippingAddress || '');
				setShippingCity((prev) => prev || data.defaults?.shippingCity || 'Dhaka');
				setShippingPostcode((prev) => prev || data.defaults?.shippingPostcode || '1200');
			} catch {
				// Silently ignore prefill failures; users can still enter fields manually.
			}
		};

		void loadDefaults();

		return () => {
			cancelled = true;
		};
	}, [open]);

	const titleLine = useMemo(() => {
		if (!item) return '';
		return item.subtitle ? `${item.title} ${item.subtitle}` : item.title;
	}, [item]);

	if (!open || !item) return null;

	const closeAndReset = () => {
		setShowForm(false);
		setPaymentMethod('cash_on_delivery');
		setCustomerName('');
		setCustomerEmail('');
		setCustomerPhone('');
		setShippingAddress('');
		setShippingCity('Dhaka');
		setShippingPostcode('1200');
		setError('');
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
			setError('Please provide name, phone, and shipping address');
			return;
		}

		if (isOnlinePayment && !customerEmail.trim()) {
			setError('Email is required for card and mobile banking payments');
			return;
		}

		setSubmitting(true);

		try {
			const response = await fetch('/api/marketplace/purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itemId: item.id,
					itemType: item.type,
					paymentMethod,
					customerName: customerName.trim(),
					customerEmail: customerEmail.trim(),
					customerPhone: customerPhone.trim(),
					shippingAddress: shippingAddress.trim(),
					shippingCity: shippingCity.trim(),
					shippingPostcode: shippingPostcode.trim(),
				}),
			});

			const data = (await response.json()) as {
				success?: boolean;
				error?: string;
				mode?: string;
				redirectUrl?: string;
			};

			if (!response.ok || data.error) {
				setError(data.error ?? 'Failed to start purchase');
				setSubmitting(false);
				return;
			}

			if (data.mode === 'cash_on_delivery') {
				closeAndReset();
				router.refresh();
				return;
			}

			if (data.redirectUrl) {
				window.location.href = data.redirectUrl;
				return;
			}

			setError('Payment URL was not returned by SSLCommerz');
			setSubmitting(false);
		} catch {
			setError('Purchase request failed. Please try again.');
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
			<div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
					<div>
						<h2 className="text-white text-lg font-bold">Item Details</h2>
						<p className="text-zinc-500 text-xs mt-0.5">Review listing and complete purchase</p>
					</div>
					<button
						type="button"
						onClick={closeAndReset}
						className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				<div className="px-6 py-5 overflow-y-auto space-y-5">
					<div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 flex gap-4">
						<div className="w-28 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
							{item.imageData ? (
								<img src={item.imageData} alt={titleLine} className="w-full h-full object-cover" />
							) : (
								<div className="w-full h-full flex items-center justify-center text-zinc-600">No image</div>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-white text-sm font-semibold leading-tight">{titleLine}</p>
							{item.condition && <p className="text-zinc-500 text-xs mt-1">Condition: {item.condition}</p>}
							<p className="text-zinc-500 text-xs mt-1">Seller: @{item.sellerUsername}</p>
							<p className="text-red-400 font-bold mt-2">৳{item.sellingPrice.toLocaleString()}</p>
						</div>
					</div>

					{!showForm && (
						<button
							type="button"
							onClick={() => setShowForm(true)}
							className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
						>
							Buy Now
						</button>
					)}

					{showForm && (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-xs font-medium text-zinc-400 mb-2">Transaction Method</label>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
									{(['cash_on_delivery', 'card', 'mobile_banking'] as const).map((method) => (
										<button
											type="button"
											key={method}
											onClick={() => setPaymentMethod(method)}
											className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
												paymentMethod === method
													? 'bg-red-600/20 text-red-400 border-red-500/50'
													: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
											}`}
										>
											{methodLabel[method]}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
								<input
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
									className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
									placeholder="Your full name"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone</label>
									<input
										value={customerPhone}
										onChange={(e) => setCustomerPhone(e.target.value)}
										className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
										placeholder="01XXXXXXXXX"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-400 mb-1.5">Email {isOnlinePayment ? '*' : '(optional)'}</label>
									<input
										type="email"
										value={customerEmail}
										onChange={(e) => setCustomerEmail(e.target.value)}
										className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
										placeholder="you@example.com"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-medium text-zinc-400 mb-1.5">Shipping Address</label>
								<textarea
									value={shippingAddress}
									onChange={(e) => setShippingAddress(e.target.value)}
									rows={2}
									className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
									placeholder="House, road, area"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-medium text-zinc-400 mb-1.5">City</label>
									<input
										value={shippingCity}
										onChange={(e) => setShippingCity(e.target.value)}
										className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
										placeholder="Dhaka"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-400 mb-1.5">Postcode</label>
									<input
										value={shippingPostcode}
										onChange={(e) => setShippingPostcode(e.target.value)}
										className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
										placeholder="1200"
									/>
								</div>
							</div>

							{error && <p className="text-xs text-red-400">{error}</p>}

							<div className="flex gap-3 pt-1">
								<button
									type="button"
									onClick={() => setShowForm(false)}
									className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
								>
									Back
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
								>
									{submitting
										? 'Processing...'
										: paymentMethod === 'cash_on_delivery'
											? 'Confirm COD Order'
											: 'Pay with SSLCommerz'}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

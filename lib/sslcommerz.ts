type SSLCommerzInitInput = {
  totalAmount: number;
  currency: 'BDT';
  transactionId: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostcode: string;
  productName: string;
  productCategory: string;
  valueA?: string;
  valueB?: string;
  valueC?: string;
};

type SSLCommerzInitResponse = {
  status?: string;
  failedreason?: string;
  GatewayPageURL?: string;
  [key: string]: unknown;
};

function getSandboxCredentials() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!storeId || !storePassword) {
    throw new Error('Missing SSLCOMMERZ_STORE_ID or SSLCOMMERZ_STORE_PASSWORD');
  }

  return { storeId, storePassword };
}

export async function initiateSSLCommerzSandboxPayment(input: SSLCommerzInitInput) {
  const { storeId, storePassword } = getSandboxCredentials();

  const payload = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: input.totalAmount.toFixed(2),
    currency: input.currency,
    tran_id: input.transactionId,
    success_url: input.successUrl,
    fail_url: input.failUrl,
    cancel_url: input.cancelUrl,
    ipn_url: input.ipnUrl ?? input.successUrl,
    shipping_method: 'NO',
    product_name: input.productName,
    product_category: input.productCategory,
    product_profile: 'general',
    cus_name: input.customerName,
    cus_email: input.customerEmail,
    cus_add1: input.customerAddress,
    cus_city: input.customerCity,
    cus_state: input.customerCity,
    cus_postcode: input.customerPostcode,
    cus_country: 'Bangladesh',
    cus_phone: input.customerPhone,
    value_a: input.valueA ?? '',
    value_b: input.valueB ?? '',
    value_c: input.valueC ?? '',
  });

  const response = await fetch('https://sandbox.sslcommerz.com/gwprocess/v4/api.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('SSLCommerz sandbox init request failed');
  }

  const result = (await response.json()) as SSLCommerzInitResponse;
  return result;
}

export async function validateSSLCommerzSandboxPayment(valId: string) {
  const { storeId, storePassword } = getSandboxCredentials();

  const url = new URL('https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php');
  url.searchParams.set('val_id', valId);
  url.searchParams.set('store_id', storeId);
  url.searchParams.set('store_passwd', storePassword);
  url.searchParams.set('v', '1');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    throw new Error('SSLCommerz sandbox validation request failed');
  }

  return (await response.json()) as Record<string, unknown>;
}

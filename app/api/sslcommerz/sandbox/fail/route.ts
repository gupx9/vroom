import { NextResponse } from 'next/server';
import { markTransactionStatus } from '@/lib/marketplacePurchase';

async function readData(request: Request) {
  if (request.method === 'GET') {
    const params = new URL(request.url).searchParams;
    return {
      tranId: params.get('tran_id') ?? '',
      reason: params.get('failedreason') ?? '',
    };
  }

  const form = await request.formData();
  return {
    tranId: String(form.get('tran_id') ?? ''),
    reason: String(form.get('failedreason') ?? ''),
  };
}

function redirect(request: Request, state: string) {
  const redirectUrl = new URL('/marketplace', request.url);
  redirectUrl.searchParams.set('purchase', state);
  return NextResponse.redirect(redirectUrl);
}

async function handle(request: Request) {
  const { tranId, reason } = await readData(request);

  if (tranId) {
    await markTransactionStatus(tranId, 'failed', reason || 'SSLCommerz reported payment failure');
  }

  return redirect(request, 'failed');
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

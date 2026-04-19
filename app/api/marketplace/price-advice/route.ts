import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateGeminiJson, generateGroqJson, getGeminiApiKey } from '@/lib/gemini';

type ItemType = 'car' | 'diorama';
type AdviceMode = 'sell' | 'buy';

interface PriceAdviceRequestBody {
  mode?: AdviceMode;
  itemType?: ItemType;
  itemId?: string;
  title?: string;
  subtitle?: string;
  condition?: string;
  currentPrice?: number;
}

interface ComparableListing {
  label: string;
  price: number;
  condition?: string;
  seller?: string;
  size?: string;
}

interface AdviceResponse {
  provider: 'gemini' | 'fallback';
  sourceNote: string;
  mode: AdviceMode;
  recommendedPrice: number;
  lowPrice: number;
  highPrice: number;
  marketSignal: 'underpriced' | 'fair' | 'overpriced';
  confidence: 'low' | 'medium' | 'high';
  rationale: string;
  comparableCount: number;
  comparables: ComparableListing[];
}

function isItemType(value: string): value is ItemType {
  return value === 'car' || value === 'diorama';
}

function isAdviceMode(value: string): value is AdviceMode {
  return value === 'sell' || value === 'buy';
}

function roundPrice(price: number) {
  if (price < 100) return Math.max(10, Math.round(price / 10) * 10);
  if (price < 1000) return Math.max(50, Math.round(price / 50) * 50);
  if (price < 5000) return Math.max(100, Math.round(price / 100) * 100);
  return Math.max(100, Math.round(price / 250) * 250);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function summarizeComparables(comparables: ComparableListing[]) {
  const prices = comparables.map((listing) => listing.price).filter((price) => Number.isFinite(price) && price > 0);
  const average = prices.length ? prices.reduce((total, price) => total + price, 0) / prices.length : 0;
  const med = median(prices);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  return {
    average: roundPrice(average),
    median: roundPrice(med),
    min: roundPrice(min),
    max: roundPrice(max),
  };
}

function buildFallbackAdvice(
  mode: AdviceMode,
  currentPrice: number,
  comparableCount: number,
  compSummary: { average: number; median: number; min: number; max: number },
  rationale: string,
  comparables: ComparableListing[],
): AdviceResponse {
  const basis = compSummary.median || compSummary.average || currentPrice || 0;
  const recommendedPrice = roundPrice(Math.max(50, basis || currentPrice || 50));
  const lowPrice = roundPrice(Math.max(50, recommendedPrice * 0.85));
  const highPrice = roundPrice(Math.max(lowPrice, recommendedPrice * 1.15));

  const marketSignal = currentPrice > highPrice ? 'overpriced' : currentPrice < lowPrice ? 'underpriced' : 'fair';
  const confidence: AdviceResponse['confidence'] = comparableCount >= 5 ? 'high' : comparableCount >= 2 ? 'medium' : 'low';

  return {
    provider: 'fallback',
    sourceNote: rationale,
    mode,
    recommendedPrice,
    lowPrice,
    highPrice,
    marketSignal,
    confidence,
    rationale,
    comparableCount,
    comparables,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as PriceAdviceRequestBody;
  const mode = body.mode;
  const itemType = body.itemType;
  const title = body.title?.trim() || '';
  const subtitle = body.subtitle?.trim() || '';
  const condition = body.condition?.trim() || '';
  const currentPrice = Number(body.currentPrice || 0);
  const itemId = body.itemId?.trim() || '';

  if (!mode || !itemType || !isAdviceMode(mode) || !isItemType(itemType) || !title) {
    return NextResponse.json({ error: 'Invalid price advice request' }, { status: 400 });
  }

  const [cars, dioramas] = await Promise.all([
    itemType === 'car'
      ? prisma.car.findMany({
          where: {
            forSale: true,
            ...(itemId ? { NOT: { id: itemId } } : {}),
            OR: [
              { brand: { contains: title, mode: 'insensitive' } },
              subtitle ? { carModel: { contains: subtitle, mode: 'insensitive' } } : undefined,
              subtitle ? { brand: { contains: subtitle, mode: 'insensitive' } } : undefined,
            ].filter(Boolean) as Array<Record<string, unknown>>,
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            brand: true,
            carModel: true,
            size: true,
            condition: true,
            sellingPrice: true,
            user: { select: { username: true } },
          },
        })
      : [],
    itemType === 'diorama'
      ? prisma.diorama.findMany({
          where: {
            forSale: true,
            ...(itemId ? { NOT: { id: itemId } } : {}),
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            description: true,
            sellingPrice: true,
            user: { select: { username: true } },
          },
        })
      : [],
  ]);

  const comparables: ComparableListing[] =
    itemType === 'car'
      ? cars.map((car) => ({
          label: `${car.brand} ${car.carModel}`.trim(),
          price: car.sellingPrice,
          condition: car.condition,
          seller: car.user.username,
          size: car.size,
        }))
      : dioramas.map((diorama) => ({
          label: diorama.description,
          price: diorama.sellingPrice,
          seller: diorama.user.username,
        }));

  const compSummary = summarizeComparables(comparables);
  const comparatorText = comparables
    .slice(0, 8)
    .map((listing) => `- ${listing.label} | ৳${listing.price.toLocaleString()}${listing.condition ? ` | ${listing.condition}` : ''}${listing.size ? ` | size ${listing.size}` : ''}${listing.seller ? ` | seller ${listing.seller}` : ''}`)
    .join('\n');

  const prompt = `You are a pricing assistant for a die-cast marketplace in Bangladesh.
Return strict JSON only, no markdown, no code fences, with this schema:
{
  "recommendedPrice": number,
  "lowPrice": number,
  "highPrice": number,
  "marketSignal": "underpriced" | "fair" | "overpriced",
  "confidence": "low" | "medium" | "high",
  "rationale": string
}

Mode: ${mode}
Item type: ${itemType}
Title: ${title}
Subtitle: ${subtitle || 'N/A'}
Condition: ${condition || 'N/A'}
Current price: ${Number.isFinite(currentPrice) && currentPrice > 0 ? `৳${currentPrice.toLocaleString()}` : 'not set'}

Current marketplace context:
- comparable count: ${comparables.length}
- average price: ৳${compSummary.average.toLocaleString()}
- median price: ৳${compSummary.median.toLocaleString()}
- min price: ৳${compSummary.min.toLocaleString()}
- max price: ৳${compSummary.max.toLocaleString()}

Comparable listings:
${comparatorText || '- none found'}

Guidance:
- Use the condition and comparable listings to judge quality.
- Do not copy the current listing price unless the market really supports it.
- If the condition suggests wear, looseness, dents, scratches, missing pieces, or box/card absence, reduce the price meaningfully.
- If the condition suggests mint, intact, boxed, carded, or collector-grade quality, increase the price meaningfully.
- For sell mode, recommend a realistic asking price a collector would accept, not the seller's hope price.
- For buy mode, decide if the current listing is fair, overpriced, or underpriced and reflect that in the range.
- Keep the explanation concise and practical.
- All prices must be whole Bangladeshi Taka numbers.
`;

  let advice: AdviceResponse;

  try {
    if (getGeminiApiKey()) {
      try {
        const result = (await generateGeminiJson(prompt)) as Partial<AdviceResponse>;

        const recommendedPrice = roundPrice(Number(result.recommendedPrice || compSummary.median || compSummary.average || currentPrice || 50));
        const lowPrice = roundPrice(Number(result.lowPrice || Math.max(50, recommendedPrice * 0.85)));
        const highPrice = roundPrice(Number(result.highPrice || Math.max(lowPrice, recommendedPrice * 1.15)));

        advice = {
          provider: 'gemini',
          sourceNote: 'Gemini AI analyzed current marketplace comparables and item condition.',
          mode,
          recommendedPrice,
          lowPrice,
          highPrice,
          marketSignal: result.marketSignal === 'underpriced' || result.marketSignal === 'fair' || result.marketSignal === 'overpriced'
            ? result.marketSignal
            : currentPrice > highPrice
              ? 'overpriced'
              : currentPrice < lowPrice
                ? 'underpriced'
                : 'fair',
          confidence: result.confidence === 'low' || result.confidence === 'medium' || result.confidence === 'high'
            ? result.confidence
            : compSummary.median > 0
              ? 'medium'
              : 'low',
          rationale: typeof result.rationale === 'string' && result.rationale.trim()
            ? result.rationale.trim()
            : 'Used live marketplace comparisons to estimate a fair price.',
          comparableCount: comparables.length,
          comparables,
        };
      } catch (geminiError) {
        console.error('Gemini failed, trying GROQ:', geminiError instanceof Error ? geminiError.message : String(geminiError));
        
        // Try GROQ as fallback
        const result = (await generateGroqJson(prompt)) as Partial<AdviceResponse>;

        const recommendedPrice = roundPrice(Number(result.recommendedPrice || compSummary.median || compSummary.average || currentPrice || 50));
        const lowPrice = roundPrice(Number(result.lowPrice || Math.max(50, recommendedPrice * 0.85)));
        const highPrice = roundPrice(Number(result.highPrice || Math.max(lowPrice, recommendedPrice * 1.15)));

        advice = {
          provider: 'gemini',
          sourceNote: 'AI pricing (via GROQ) based on marketplace comparables and item condition.',
          mode,
          recommendedPrice,
          lowPrice,
          highPrice,
          marketSignal: result.marketSignal === 'underpriced' || result.marketSignal === 'fair' || result.marketSignal === 'overpriced'
            ? result.marketSignal
            : currentPrice > highPrice
              ? 'overpriced'
              : currentPrice < lowPrice
                ? 'underpriced'
                : 'fair',
          confidence: result.confidence === 'low' || result.confidence === 'medium' || result.confidence === 'high'
            ? result.confidence
            : compSummary.median > 0
              ? 'medium'
              : 'low',
          rationale: typeof result.rationale === 'string' && result.rationale.trim()
            ? result.rationale.trim()
            : 'Used live marketplace comparisons to estimate a fair price.',
          comparableCount: comparables.length,
          comparables,
        };
      }
    } else {
      throw new Error('Gemini API key is not configured');
    }
  } catch (error) {
    console.error('AI pricing error:', error);
    const fallbackRationale = error instanceof Error && error.message.includes('Gemini API key')
      ? 'Gemini is not configured yet, so this is a local market estimate. Add GEMINI_API_KEY to use AI pricing.'
      : 'AI pricing unavailable, so this is a local market estimate based on current listings.';

    advice = buildFallbackAdvice(mode, currentPrice, comparables.length, compSummary, fallbackRationale, comparables);
  }

  return NextResponse.json(advice, { status: 200 });
}

import type { CarBodyType, FuelType, TransmissionType, VehicleCategory, VehicleCondition } from '@motorx/shared-contracts';

export interface AnalyzedSearchQuery {
  intent: string;
  correctedTerms: Record<string, string>;
  filters: {
    make?: string; model?: string; location?: string; category?: VehicleCategory; bodyType?: CarBodyType;
    condition?: VehicleCondition; fuelType?: FuelType; transmission?: TransmissionType;
    yearMin?: number; yearMax?: number; priceMin?: number; priceMax?: number; mileageMin?: number; mileageMax?: number;
  };
}

const makes = ['toyota', 'honda', 'nissan', 'suzuki', 'mitsubishi', 'mazda', 'hyundai', 'kia', 'bmw', 'mercedes', 'audi', 'volkswagen', 'ford', 'tesla', 'tata', 'isuzu'];
const models = ['corolla', 'camry', 'prius', 'vitz', 'axio', 'civic', 'fit', 'vezel', 'sunny', 'leaf', 'wagonr', 'swift', 'alto', 'pajero', 'lancer', 'ioniq', 'sportage'];
const stopWords = new Set(['a', 'an', 'the', 'vehicle', 'vehicles', 'car', 'cars', 'want', 'show', 'me', 'find', 'looking', 'for', 'with', 'and', 'please', 'affordable', 'budget', 'cheap', 'reliable']);

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    let diagonal = previous[0]; previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(previous[rightIndex] + 1, previous[rightIndex - 1] + 1, diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length];
}

function fuzzyVocabularyMatch(token: string, vocabulary: string[]) {
  if (token.length < 4) return undefined;
  const candidate = vocabulary.map((value) => ({ value, distance: editDistance(token, value) })).sort((a, b) => a.distance - b.distance)[0];
  return candidate && candidate.distance <= (token.length >= 7 ? 2 : 1) ? candidate.value : undefined;
}

function numericAmount(value: string, unit?: string) {
  const number = Number(value.replace(/,/g, ''));
  if (unit && /^m(illion)?$/i.test(unit)) return number * 1_000_000;
  if (unit && /^lakh?s?$/i.test(unit)) return number * 100_000;
  if (unit && /^[kK]$/.test(unit)) return number * 1_000;
  return number;
}

// Converts a bounded natural-language query into structured constraints plus residual intent.
export function analyzeSearchQuery(rawQuery: string): AnalyzedSearchQuery {
  let working = rawQuery.toLocaleLowerCase('en').replace(/[^a-z0-9.,\s_-]/g, ' ').replace(/\s+/g, ' ').trim();
  const filters: AnalyzedSearchQuery['filters'] = {};
  const correctedTerms: Record<string, string> = {};
  const consume = (pattern: RegExp, action: (match: RegExpMatchArray) => void) => {
    const match = working.match(pattern);
    if (match) { action(match); working = working.replace(match[0], ' '); }
  };

  consume(/\b(?:under|below|max(?:imum)?)\s*([\d,.]+)\s*km\b/i, (match) => { filters.mileageMax = numericAmount(match[1]); });
  consume(/\b(?:over|above|min(?:imum)?)\s*([\d,.]+)\s*km\b/i, (match) => { filters.mileageMin = numericAmount(match[1]); });
  consume(/\b(?:under|below|less than|max(?:imum)?(?: price)?(?: of)?)\s*(?:lkr|rs\.?|rupees?)?\s*([\d,.]+)\s*(million|m|lakhs?|k)?\b/i, (match) => { filters.priceMax = numericAmount(match[1], match[2]); });
  consume(/\b(?:over|above|more than|min(?:imum)?(?: price)?(?: of)?)\s*(?:lkr|rs\.?|rupees?)?\s*([\d,.]+)\s*(million|m|lakhs?|k)?\b/i, (match) => { filters.priceMin = numericAmount(match[1], match[2]); });
  consume(/\b(?:from|after|newer than)\s*((?:19|20)\d{2})\b/i, (match) => { filters.yearMin = Number(match[1]); });
  consume(/\b(?:before|older than)\s*((?:19|20)\d{2})\b/i, (match) => { filters.yearMax = Number(match[1]); });
  consume(/\b((?:19|20)\d{2})\b/, (match) => { filters.yearMin = Number(match[1]); filters.yearMax = Number(match[1]); });
  consume(/\b(?:near|around|located in|in)\s+([a-z][a-z\s-]{1,40}?)(?=\s+(?:under|below|over|above|with|automatic|manual|petrol|diesel|hybrid|electric|new|used|reconditioned)\b|$)/i, (match) => { filters.location = match[1].trim().replace(/\b\w/g, (letter) => letter.toUpperCase()); });

  const mappings: Array<[RegExp, () => void]> = [
    [/\b(?:suv|sport utility)\b/i, () => { filters.category = 'car'; filters.bodyType = 'suv'; }],
    [/\bhatchback\b/i, () => { filters.category = 'car'; filters.bodyType = 'hatchback'; }],
    [/\bsedan\b/i, () => { filters.category = 'car'; filters.bodyType = 'sedan'; }],
    [/\b(?:motorcycle|motorbike|bike)\b/i, () => { filters.category = 'motorcycle'; }],
    [/\bthree[\s_-]?wheeler\b|\btuk[\s-]?tuk\b/i, () => { filters.category = 'three_wheeler'; }],
    [/\bvan\b/i, () => { filters.category = 'van'; }], [/\btruck\b/i, () => { filters.category = 'truck'; }], [/\bbus\b/i, () => { filters.category = 'bus'; }],
    [/\bautomatic\b/i, () => { filters.transmission = 'automatic'; }], [/\bmanual\b/i, () => { filters.transmission = 'manual'; }], [/\bcvt\b/i, () => { filters.transmission = 'cvt'; }], [/\bdct\b/i, () => { filters.transmission = 'dct'; }],
    [/\bplug[\s_-]?in hybrid\b/i, () => { filters.fuelType = 'plug_in_hybrid'; }], [/\bhybrid\b/i, () => { filters.fuelType = 'hybrid'; }], [/\belectric|\bev\b/i, () => { filters.fuelType = 'electric'; }], [/\bdiesel\b/i, () => { filters.fuelType = 'diesel'; }], [/\bpetrol|\bgasoline\b/i, () => { filters.fuelType = 'petrol'; }],
    [/\bbrand[\s_-]?new|\bnew\b/i, () => { filters.condition = 'brand_new'; }], [/\breconditioned\b/i, () => { filters.condition = 'reconditioned'; }], [/\bused|\bsecond[\s-]?hand\b/i, () => { filters.condition = 'used'; }],
  ];
  for (const [pattern, action] of mappings) consume(pattern, () => action());

  const tokens = working.split(/\s+/).filter(Boolean);
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const make = makes.includes(token) ? token : fuzzyVocabularyMatch(token, makes);
    const model = models.includes(token) ? token : fuzzyVocabularyMatch(token, models);
    if (!filters.make && make) { filters.make = make.replace(/\b\w/g, (letter) => letter.toUpperCase()); if (make !== token) correctedTerms[token] = make; tokens[index] = ''; }
    else if (!filters.model && model) { filters.model = model.replace(/\b\w/g, (letter) => letter.toUpperCase()); if (model !== token) correctedTerms[token] = model; tokens[index] = ''; }
  }
  const intent = tokens.filter((token) => token && !stopWords.has(token)).join(' ').trim();
  return { filters, intent, correctedTerms };
}

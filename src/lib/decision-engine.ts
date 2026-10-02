export type Urgency = 'flexible' | 'planned' | 'urgent';

export interface ScenarioInput {
  quantityKg: number;
  expectedPrice: number;
  transport: number;
  storage: number;
  riskAdjustment: number;
  waitPriceChangePct: number;
  waitExtraStorage: number;
  urgency: Urgency;
}

export interface ScenarioResult {
  id: 'sell' | 'wait' | 'nagpur' | 'amravati' | 'wardha';
  name: string;
  gross: number;
  transport: number;
  storage: number;
  riskAdjustment: number;
  totalCost: number;
  net: number;
  pricePerKg: number;
  addedTransport: number;
  delayRiskPerKg: number;
  distanceKm: number;
  priceLift: number;
}

export interface DecisionResults {
  sellNow: ScenarioResult;
  wait: ScenarioResult;
  markets: ScenarioResult[];
  bestAlternative: ScenarioResult;
  recommendation: ScenarioResult;
  urgencyCost: number;
  waitNetWithoutUrgency: number;
  strongestNonWaitNet: number;
  waitVsSellDifference: number;
  waitLosesDueToUrgency: boolean;
}

const urgencyRate: Record<Urgency, number> = {
  flexible: 0,
  planned: 0.5,
  urgent: 1.25,
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function makeScenario(
  input: ScenarioInput,
  values: {
    id: ScenarioResult['id'];
    name: string;
    pricePerKg: number;
    transport: number;
    storage: number;
    riskAdjustment: number;
    addedTransport?: number;
    delayRiskPerKg?: number;
    distanceKm?: number;
    priceLift?: number;
  },
): ScenarioResult {
  const gross = roundCurrency(input.quantityKg * values.pricePerKg);
  const totalCost = roundCurrency(values.transport + values.storage + values.riskAdjustment);
  return {
    ...values,
    gross,
    totalCost,
    net: roundCurrency(gross - totalCost),
    addedTransport: values.addedTransport ?? 0,
    delayRiskPerKg: values.delayRiskPerKg ?? 0,
    distanceKm: values.distanceKm ?? 0,
    priceLift: values.priceLift ?? 0,
  };
}

/** All figures are illustrative. This is the single source of scenario arithmetic. */
export function calculateDecision(input: ScenarioInput): DecisionResults {
  const urgencyPerKg = urgencyRate[input.urgency];
  const urgencyCost = roundCurrency(input.quantityKg * urgencyPerKg);
  const sellNow = makeScenario(input, {
    id: 'sell',
    name: 'SELL NOW',
    pricePerKg: input.expectedPrice,
    transport: input.transport,
    storage: input.storage,
    riskAdjustment: input.riskAdjustment,
  });
  const wait = makeScenario(input, {
    id: 'wait',
    name: 'WAIT 3 DAYS',
    pricePerKg: roundCurrency(input.expectedPrice * (1 + input.waitPriceChangePct / 100)),
    transport: input.transport,
    storage: input.storage + input.waitExtraStorage,
    riskAdjustment: input.riskAdjustment + urgencyCost,
    delayRiskPerKg: urgencyPerKg,
  });
  const markets = [
    { id: 'nagpur' as const, name: 'Nagpur', distanceKm: 8, priceLift: 0, addedTransport: 0 },
    { id: 'amravati' as const, name: 'Amravati', distanceKm: 78, priceLift: 2, addedTransport: 650 },
    { id: 'wardha' as const, name: 'Wardha', distanceKm: 155, priceLift: 3.5, addedTransport: 1200 },
  ].map((market) =>
    makeScenario(input, {
      id: market.id,
      name: market.name,
      pricePerKg: roundCurrency(input.expectedPrice + market.priceLift),
      transport: input.transport + market.addedTransport,
      storage: input.storage,
      riskAdjustment: input.riskAdjustment,
      addedTransport: market.addedTransport,
      distanceKm: market.distanceKm,
      priceLift: market.priceLift,
    }),
  );
  const bestAlternative = markets.reduce((best, item) => (item.net > best.net ? item : best));
  const nonWait = [sellNow, bestAlternative];
  const strongestNonWaitNet = Math.max(...nonWait.map((item) => item.net));
  const waitNetWithoutUrgency = roundCurrency(wait.net + urgencyCost);
  const recommendation = [sellNow, wait, bestAlternative].reduce((best, item) =>
    item.net > best.net ? item : best,
  );
  return {
    sellNow,
    wait,
    markets,
    bestAlternative,
    recommendation,
    urgencyCost,
    waitNetWithoutUrgency,
    strongestNonWaitNet,
    waitVsSellDifference: wait.net - sellNow.net,
    waitLosesDueToUrgency:
      recommendation.id !== 'wait' && waitNetWithoutUrgency > strongestNonWaitNet,
  };
}
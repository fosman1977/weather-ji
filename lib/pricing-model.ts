/**
 * Actuarial Pricing Model for Match Day Protection
 * Based on historical IPL data and DLS method analysis
 *
 * Historical Data (2008-2024):
 * - Complete abandonments: ~0.9% of matches
 * - DLS-affected matches: ~2-3% additional
 * - Total rain-affected: ~3-5% of IPL matches
 */

export interface PricingFactors {
  baseRainRisk: number; // From weather API (0-100)
  stadiumDrainage: 'excellent' | 'good' | 'average' | 'poor';
  stadiumCoverage: number; // Percentage of covered stands
  seasonalFactor: number; // Time of year (monsoon season, etc.)
  venueRiskMultiplier: number; // Historical venue-specific data
}

export interface PremiumBreakdown {
  basePremium: number;
  riskAdjustment: number;
  venueAdjustment: number;
  drainageAdjustment: number;
  totalPremium: number;
  expectedLoss: number;
  loadingFactor: number;
}

/**
 * Venue-specific risk multipliers based on historical data
 */
export const VENUE_RISK_MULTIPLIERS: Record<string, number> = {
  'mum': 1.5,  // Mumbai (Wankhede) - Monsoon exposure +50%
  'blr': 1.3,  // Bengaluru - High rainfall +30%
  'kol': 1.3,  // Kolkata (Eden Gardens) - Monsoon +30%
  'che': 1.0,  // Chennai - Baseline
  'del': 0.9,  // Delhi - Lower risk -10%
  'ahm': 0.8,  // Ahmedabad (Narendra Modi Stadium) - Low risk -20%
  'dha': 1.2,  // Dharamshala - Mountain weather +20%
  'pun': 1.1,  // Pune - Moderate +10%
  'jai': 0.8,  // Jaipur - Low rainfall -20%
  'lko': 1.0,  // Lucknow - Baseline
};

/**
 * Drainage quality impact on effective rain risk
 */
const DRAINAGE_FACTORS: Record<string, number> = {
  excellent: 0.7,  // 30% reduction in risk
  good: 0.85,      // 15% reduction
  average: 1.0,    // No change
  poor: 1.2        // 20% increase in risk
};

/**
 * Expected loss calculation per ticket
 * Based on DLS payout tiers and historical probabilities
 */
function calculateExpectedLoss(rainRisk: number, ticketValue: number): number {
  // Probability estimates (conservative)
  const effectiveRisk = rainRisk / 100;

  // Tier probabilities based on rain risk
  const pAbandoned = effectiveRisk * 0.01;      // ~1% at 100% rain risk
  const pSevere = effectiveRisk * 0.01;          // ~1% at 100% rain risk
  const pSignificant = effectiveRisk * 0.02;     // ~2% at 100% rain risk
  const pMinor = effectiveRisk * 0.02;           // ~2% at 100% rain risk

  // Expected loss calculation
  const expectedLoss =
    (pAbandoned * ticketValue * 1.0) +      // 100% payout
    (pSevere * ticketValue * 1.0) +         // 100% payout
    (pSignificant * ticketValue * 0.5) +    // 50% payout
    (pMinor * ticketValue * 0.25);          // 25% payout

  return expectedLoss;
}

/**
 * Calculate dynamic premium for Basic tier
 * Scales with risk and ticket value
 */
export function calculateBasicPremium(
  ticketValue: number,
  factors: PricingFactors
): PremiumBreakdown {
  // Base expected loss
  let expectedLoss = calculateExpectedLoss(factors.baseRainRisk, ticketValue);

  // Apply venue risk multiplier
  const venueMultiplier = factors.venueRiskMultiplier;
  expectedLoss *= venueMultiplier;

  // Apply drainage factor
  const drainageFactor = DRAINAGE_FACTORS[factors.stadiumDrainage];
  expectedLoss *= drainageFactor;

  // Apply coverage discount (covered stands reduce risk)
  const coverageDiscount = 1 - (factors.stadiumCoverage / 200); // Up to 50% coverage = 25% discount
  expectedLoss *= coverageDiscount;

  // Loading factor for uncertainty and operational costs
  const loadingFactor = 1.5;
  const loadedLoss = expectedLoss * loadingFactor;

  // Administrative costs and profit margin
  const adminCost = 15; // Fixed ₹15
  const profitMargin = 1.2; // 20% margin

  const totalPremium = Math.round((loadedLoss + adminCost) * profitMargin);

  // Cap premium at 20% of ticket value (safety measure)
  const cappedPremium = Math.min(totalPremium, ticketValue * 0.20);

  // Ensure minimum premium of ₹99 for Basic
  const finalPremium = Math.max(99, cappedPremium);

  return {
    basePremium: expectedLoss,
    riskAdjustment: expectedLoss * (venueMultiplier - 1),
    venueAdjustment: expectedLoss * (drainageFactor - 1),
    drainageAdjustment: expectedLoss * (coverageDiscount - 1),
    totalPremium: finalPremium,
    expectedLoss,
    loadingFactor
  };
}

/**
 * Calculate premium for Standard tier (₹199 base)
 * Includes additional coverage components
 */
export function calculateStandardPremium(
  ticketValue: number,
  factors: PricingFactors
): PremiumBreakdown {
  const basicBreakdown = calculateBasicPremium(ticketValue, factors);

  // Additional expected losses for Standard features
  const travelAllowanceRisk = (factors.baseRainRisk / 100) * 0.01 * 750; // ₹750 travel
  const inconvenienceRisk = (factors.baseRainRisk / 100) * 0.04 * 250;   // ₹250 inconvenience

  const additionalExpectedLoss = travelAllowanceRisk + inconvenienceRisk;
  const totalExpectedLoss = basicBreakdown.expectedLoss + additionalExpectedLoss;

  // Apply same loading and margin
  const loadedLoss = totalExpectedLoss * 1.5;
  const withMargin = (loadedLoss + 20) * 1.2; // Slightly higher admin cost

  const finalPremium = Math.max(199, Math.min(withMargin, ticketValue * 0.25));

  return {
    ...basicBreakdown,
    expectedLoss: totalExpectedLoss,
    totalPremium: Math.round(finalPremium)
  };
}

/**
 * Calculate premium for Premium tier (₹499 base)
 * Includes accommodation and enhanced benefits
 */
export function calculatePremiumPremium(
  ticketValue: number,
  factors: PricingFactors,
  isOutstation: boolean
): PremiumBreakdown {
  const standardBreakdown = calculateStandardPremium(ticketValue, factors);

  // Additional coverage components
  const accommodationRisk = isOutstation ? (factors.baseRainRisk / 100) * 0.01 * 3000 : 0;
  const stadiumStrandedRisk = (factors.baseRainRisk / 100) * 0.05 * 300;
  const rainCheckBonus = (factors.baseRainRisk / 100) * 0.01 * 500;

  const additionalExpectedLoss = accommodationRisk + stadiumStrandedRisk + rainCheckBonus;
  const totalExpectedLoss = standardBreakdown.expectedLoss + additionalExpectedLoss;

  const loadedLoss = totalExpectedLoss * 1.5;
  const withMargin = (loadedLoss + 30) * 1.2;

  const finalPremium = Math.max(499, Math.min(withMargin, ticketValue * 0.35));

  return {
    ...standardBreakdown,
    expectedLoss: totalExpectedLoss,
    totalPremium: Math.round(finalPremium)
  };
}

/**
 * Calculate value proposition for customer
 * Helps determine if insurance is "worth it"
 */
export function calculateValueProposition(
  premium: number,
  ticketValue: number,
  totalMatchDayInvestment: number,
  rainRisk: number
): {
  protectionRatio: number; // Premium as % of total investment
  expectedROI: number;     // Expected return on investment
  breakEvenRisk: number;   // Rain risk needed to break even
  recommendation: 'strongly-recommended' | 'recommended' | 'optional' | 'not-recommended';
  reasoning: string;
} {
  const protectionRatio = (premium / totalMatchDayInvestment) * 100;
  const expectedPayout = calculateExpectedLoss(rainRisk, ticketValue) / 0.04; // Reverse engineer from expected loss
  const expectedROI = ((expectedPayout - premium) / premium) * 100;
  const breakEvenRisk = (premium / (ticketValue * 0.04)) * 100; // Rough calculation

  let recommendation: 'strongly-recommended' | 'recommended' | 'optional' | 'not-recommended';
  let reasoning: string;

  if (rainRisk >= 60) {
    recommendation = 'strongly-recommended';
    reasoning = `High rain risk (${rainRisk}%) makes insurance essential. Protecting ${totalMatchDayInvestment.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} investment for just ${premium.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} (${protectionRatio.toFixed(1)}%)`;
  } else if (rainRisk >= 35 || totalMatchDayInvestment >= 8000) {
    recommendation = 'recommended';
    reasoning = `Moderate risk (${rainRisk}%) and significant investment make insurance worthwhile`;
  } else if (rainRisk >= 15) {
    recommendation = 'optional';
    reasoning = `Lower risk (${rainRisk}%), but insurance provides peace of mind for ${protectionRatio.toFixed(1)}% of your investment`;
  } else {
    recommendation = 'not-recommended';
    reasoning = `Very low rain risk (${rainRisk}%). You may choose to self-insure.`;
  }

  return {
    protectionRatio,
    expectedROI,
    breakEvenRisk,
    recommendation,
    reasoning
  };
}

/**
 * Get tier-specific dynamic pricing
 */
export function getTierPricing(
  tierId: string,
  ticketValue: number,
  factors: PricingFactors,
  isOutstation: boolean = false
): number {
  switch (tierId) {
    case 'basic':
      return calculateBasicPremium(ticketValue, factors).totalPremium;
    case 'standard':
      return calculateStandardPremium(ticketValue, factors).totalPremium;
    case 'premium':
      return calculatePremiumPremium(ticketValue, factors, isOutstation).totalPremium;
    case 'group':
      return Math.round(calculatePremiumPremium(ticketValue * 5, factors, isOutstation).totalPremium * 0.85); // 15% group discount
    default:
      return 99;
  }
}

/**
 * DLS (Duckworth-Lewis-Stern) Method Calculator
 * For Parametric Cricket Insurance Triggers
 *
 * This module implements the DLS method logic for determining
 * insurance payouts based on match interruptions.
 */

export interface DLSResult {
  oversLostPercentage: number;
  payoutTier: 'none' | 'minor' | 'significant' | 'severe';
  payoutMultiplier: number;
  description: string;
}

export interface MatchStatus {
  totalOvers: number;
  oversPlayed: number;
  dlsApplied: boolean;
  matchAbandoned: boolean;
}

/**
 * Calculate DLS-based payout tier
 *
 * Tier 1 - Minor Disruption: 10-25% overs lost → 25% payout
 * Tier 2 - Significant: 26-50% overs lost → 50% payout
 * Tier 3 - Severe: >50% overs lost or abandoned → 100% payout
 */
export function calculateDLSPayout(matchStatus: MatchStatus): DLSResult {
  const { totalOvers, oversPlayed, dlsApplied, matchAbandoned } = matchStatus;

  // Match abandoned - full payout
  if (matchAbandoned || oversPlayed < (totalOvers * 0.25)) {
    return {
      oversLostPercentage: 100,
      payoutTier: 'severe',
      payoutMultiplier: 1.0,
      description: 'Match abandoned - Full refund'
    };
  }

  // Calculate overs lost percentage
  const oversLost = totalOvers - oversPlayed;
  const oversLostPercentage = (oversLost / totalOvers) * 100;

  // No DLS applied and minimal interruption
  if (!dlsApplied || oversLostPercentage < 10) {
    return {
      oversLostPercentage,
      payoutTier: 'none',
      payoutMultiplier: 0,
      description: 'Match played as scheduled'
    };
  }

  // Tier 1: Minor disruption (10-25% overs lost)
  if (oversLostPercentage >= 10 && oversLostPercentage <= 25) {
    return {
      oversLostPercentage,
      payoutTier: 'minor',
      payoutMultiplier: 0.25,
      description: 'DLS applied - Minor disruption (10-25% overs lost)'
    };
  }

  // Tier 2: Significant disruption (26-50% overs lost)
  if (oversLostPercentage > 25 && oversLostPercentage <= 50) {
    return {
      oversLostPercentage,
      payoutTier: 'significant',
      payoutMultiplier: 0.50,
      description: 'DLS applied - Significant disruption (26-50% overs lost)'
    };
  }

  // Tier 3: Severe disruption (>50% overs lost)
  return {
    oversLostPercentage,
    payoutTier: 'severe',
    payoutMultiplier: 1.0,
    description: 'DLS applied - Severe disruption (>50% overs lost)'
  };
}

/**
 * Simulate match outcome based on rain risk
 * Returns realistic match status based on weather conditions
 */
export function simulateMatchOutcome(rainRisk: number, totalOvers: number = 20): MatchStatus {
  // Base probability calculations
  const abandonmentThreshold = Math.random() * 100;
  const dlsThreshold = Math.random() * 100;

  // Match completely abandoned
  if (abandonmentThreshold < rainRisk * 0.3) { // 30% of rain risk translates to abandonment chance
    return {
      totalOvers,
      oversPlayed: 0,
      dlsApplied: false,
      matchAbandoned: true
    };
  }

  // DLS applied with varying severity
  if (dlsThreshold < rainRisk) {
    // Higher rain risk = more overs lost
    const maxOversLost = Math.floor(totalOvers * (rainRisk / 100));
    const oversLost = Math.floor(Math.random() * maxOversLost);
    const oversPlayed = Math.max(5, totalOvers - oversLost); // IPL minimum is 5 overs

    return {
      totalOvers,
      oversPlayed,
      dlsApplied: true,
      matchAbandoned: false
    };
  }

  // Match played without interruption
  return {
    totalOvers,
    oversPlayed: totalOvers,
    dlsApplied: false,
    matchAbandoned: false
  };
}

/**
 * Calculate expected value for insurance purchase
 * Helps users understand if insurance is worth it
 */
export function calculateExpectedValue(
  premium: number,
  coverage: number,
  rainRisk: number
): {
  expectedPayout: number;
  expectedProfit: number;
  worthIt: boolean;
  confidence: string;
} {
  // Probability estimates based on rain risk
  const pAbandonment = (rainRisk / 100) * 0.01; // ~1% abandonment at 100% rain risk
  const pSignificantDLS = (rainRisk / 100) * 0.02; // ~2% significant DLS
  const pMinorDLS = (rainRisk / 100) * 0.03; // ~3% minor DLS

  const expectedPayout =
    (pAbandonment * coverage) +
    (pSignificantDLS * coverage * 0.50) +
    (pMinorDLS * coverage * 0.25);

  const expectedProfit = expectedPayout - premium;

  let confidence = 'Low confidence';
  if (rainRisk > 70) confidence = 'High confidence - Strong recommendation';
  else if (rainRisk > 40) confidence = 'Moderate confidence - Worth considering';
  else if (rainRisk > 20) confidence = 'Low-moderate confidence - Optional protection';

  return {
    expectedPayout,
    expectedProfit,
    worthIt: expectedProfit > (-premium * 0.5), // Worth it if expected loss is less than 50% of premium
    confidence
  };
}

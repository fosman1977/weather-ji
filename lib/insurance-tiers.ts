/**
 * Insurance Tier Definitions for Match Day Protection
 * Based on comprehensive parametric insurance model with DLS triggers
 */

export interface CoverageComponent {
  name: string;
  trigger: string;
  amount: (ticketValue: number) => number;
  description: string;
}

export interface InsuranceTier {
  id: string;
  name: string;
  price: number;
  tagline: string;
  recommended: boolean;
  color: string;
  coverageComponents: CoverageComponent[];
  features: string[];
}

/**
 * Basic Cover - ₹99
 * Simple ticket refund protection
 */
const basicCover: InsuranceTier = {
  id: 'basic',
  name: '🤝 Dost Plan (Basic)',
  price: 99,
  tagline: 'Broke but responsible vibes 💪',
  recommended: false,
  color: 'blue',
  coverageComponents: [
    {
      name: 'Ticket Value Refund',
      trigger: 'Match abandoned',
      amount: (ticketValue) => ticketValue,
      description: '100% ticket refund if match is abandoned'
    },
    {
      name: 'Partial Refund',
      trigger: 'DLS reduces match by >50%',
      amount: (ticketValue) => ticketValue * 0.5,
      description: '50% refund for severe interruptions'
    }
  ],
  features: [
    '100% ticket refund if match abandoned',
    '50% refund if DLS reduces match by >50%',
    'Same-day claims processing',
    'Automatic payout verification'
  ]
};

/**
 * Standard Cover - ₹199
 * Comprehensive match day protection (RECOMMENDED)
 */
const standardCover: InsuranceTier = {
  id: 'standard',
  name: '👑 VIP Tier (Standard)',
  price: 199,
  tagline: 'Boss vibes + Full protection 🌟',
  recommended: true,
  color: 'purple',
  coverageComponents: [
    {
      name: 'Ticket Value Refund',
      trigger: 'Match abandoned',
      amount: (ticketValue) => ticketValue,
      description: '100% ticket refund if match is abandoned'
    },
    {
      name: 'Travel Allowance',
      trigger: 'Match abandoned',
      amount: () => 750,
      description: 'Fixed ₹750 for wasted travel costs'
    },
    {
      name: 'Inconvenience Benefit',
      trigger: 'Any DLS application',
      amount: () => 250,
      description: 'Compensation even when match completes'
    },
    {
      name: 'Significant Disruption',
      trigger: 'DLS 26-50% overs lost',
      amount: (ticketValue) => ticketValue * 0.5,
      description: '50% refund + ₹250 inconvenience'
    },
    {
      name: 'Minor Disruption',
      trigger: 'DLS 10-25% overs lost',
      amount: (ticketValue) => ticketValue * 0.25,
      description: '25% refund + ₹250 inconvenience'
    }
  ],
  features: [
    'Everything in Basic Cover',
    'Travel allowance (₹750) if match abandoned',
    'Inconvenience benefit (₹250) for ANY DLS application',
    '25% refund if DLS reduces match by 10-25%',
    '50% refund if DLS reduces match by 26-50%',
    'Priority claims processing'
  ]
};

/**
 * Premium Cover - ₹499
 * Ultimate protection for travelling supporters
 */
const premiumCover: InsuranceTier = {
  id: 'premium',
  name: '💎 Diamond Haath (Premium)',
  price: 499,
  tagline: 'Ameer log only (Papa ka paisa?) 💰',
  recommended: false,
  color: 'amber',
  coverageComponents: [
    {
      name: 'Ticket Value Refund',
      trigger: 'Match abandoned',
      amount: (ticketValue) => ticketValue,
      description: '100% ticket refund if match is abandoned'
    },
    {
      name: 'Travel Allowance',
      trigger: 'Match abandoned',
      amount: () => 1000,
      description: 'Enhanced ₹1000 travel reimbursement'
    },
    {
      name: 'Accommodation Cover',
      trigger: 'Match abandoned (outstation)',
      amount: () => 3000,
      description: 'Up to ₹3000 for hotel bookings'
    },
    {
      name: 'Stadium Stranded Cover',
      trigger: 'Rain delay >90 minutes',
      amount: () => 300,
      description: 'F&B voucher for long delays'
    },
    {
      name: 'Inconvenience Benefit',
      trigger: 'Any DLS application',
      amount: () => 250,
      description: 'Compensation for shortened matches'
    },
    {
      name: 'Rain Check Bonus',
      trigger: 'Attend rescheduled match',
      amount: () => 500,
      description: 'Loyalty reward for attending makeup match'
    }
  ],
  features: [
    'Everything in Standard Cover',
    'Accommodation cover (up to ₹3,000) for outstation fans',
    'Stadium stranded F&B voucher (₹300) for delays >60 mins',
    'Rain check rebooking bonus (₹500) if attending rescheduled match',
    'Enhanced travel allowance (₹1,000)',
    'VIP claims processing',
    'Dedicated support hotline'
  ]
};

/**
 * Group Cover - ₹1,499 (up to 5 people)
 */
const groupCover: InsuranceTier = {
  id: 'group',
  name: '👨‍👩‍👧‍👦 Squad Goals (Group)',
  price: 1499,
  tagline: 'Poore parivar ka insurance! (5 people) 🎉',
  recommended: false,
  color: 'green',
  coverageComponents: [
    {
      name: 'Group Ticket Refund',
      trigger: 'Match abandoned',
      amount: (ticketValue) => ticketValue * 5, // Covers up to 5 people
      description: '100% refund for all group tickets'
    },
    {
      name: 'Group Travel Allowance',
      trigger: 'Match abandoned',
      amount: () => 2000,
      description: 'Shared travel reimbursement'
    },
    {
      name: 'Group Accommodation',
      trigger: 'Match abandoned (outstation)',
      amount: () => 5000,
      description: 'Enhanced accommodation cover for groups'
    },
    {
      name: 'Stadium Merchandise Voucher',
      trigger: 'Any DLS application',
      amount: () => 500,
      description: 'Group shopping voucher'
    }
  ],
  features: [
    'All Premium benefits for up to 5 people',
    'Shared travel allowance (₹2,000)',
    'Group accommodation cover (₹5,000)',
    'One complimentary stadium poncho per person',
    'Group F&B vouchers',
    'Single policy for easy management'
  ]
};

export const INSURANCE_TIERS: InsuranceTier[] = [
  basicCover,
  standardCover,
  premiumCover,
  groupCover
];

/**
 * Calculate total maximum payout for a given tier
 */
export function calculateMaxPayout(
  tier: InsuranceTier,
  ticketValue: number,
  scenario: 'abandoned' | 'severe' | 'significant' | 'minor'
): number {
  let total = 0;

  tier.coverageComponents.forEach(component => {
    const trigger = component.trigger.toLowerCase();

    if (scenario === 'abandoned' && trigger.includes('abandoned')) {
      total += component.amount(ticketValue);
    } else if (scenario === 'severe' && (trigger.includes('>50%') || trigger.includes('severe'))) {
      total += component.amount(ticketValue);
    } else if (scenario === 'significant' && trigger.includes('26-50%')) {
      total += component.amount(ticketValue);
    } else if (scenario === 'minor' && trigger.includes('10-25%')) {
      total += component.amount(ticketValue);
    }

    // Universal triggers
    if (scenario !== 'abandoned' && trigger.includes('any dls')) {
      total += component.amount(ticketValue);
    }
  });

  return total;
}

/**
 * Get recommended tier based on ticket value and rain risk
 */
export function getRecommendedTier(ticketValue: number, rainRisk: number, isOutstation: boolean): InsuranceTier {
  // High value tickets or high risk or outstation → Premium
  if (ticketValue >= 5000 || rainRisk >= 60 || isOutstation) {
    return premiumCover;
  }

  // Medium risk or medium value → Standard
  if (rainRisk >= 30 || ticketValue >= 2000) {
    return standardCover;
  }

  // Low risk, low value → Basic
  return basicCover;
}

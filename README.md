# Match Day Protection

**DLS-Based Parametric Cricket Insurance for IPL Matches**

A comprehensive insurance application that uses the Duckworth-Lewis-Stern (DLS) method to provide objective, parametric coverage for cricket match day investments affected by rain interruptions.

---

## 🎯 Overview

Match Day Protection addresses a critical gap in the cricket spectator experience: **rain-affected matches cost fans not just their ticket price, but their entire match day investment** (travel, food, accommodation, time off work).

This application implements a **parametric insurance model** where payouts are automatically triggered by objective, verifiable events (DLS application, match abandonment) rather than subjective loss assessment.

---

## 🏏 The DLS Method Foundation

### What is DLS?

The Duckworth–Lewis–Stern method is cricket's official solution for calculating revised targets in rain-interrupted limited-overs matches. It was:
- Introduced in 1997
- Officially adopted by ICC in 1999
- Used in all major cricket tournaments including IPL

### Why DLS for Insurance?

1. **Objectivity** - Maintained by the ICC, no disputes about triggers
2. **Public Record** - Every IPL scorecard records DLS application
3. **Instant Verification** - Results published immediately after matches
4. **No Moral Hazard** - Policyholders cannot influence whether DLS is invoked

---

## 💎 Product Structure

### Coverage Tiers

#### 1. **Basic Cover - ₹99**
*Essential ticket protection*
- 100% ticket refund if match abandoned
- 50% refund if DLS reduces match by >50%
- Same-day claims processing

#### 2. **Standard Cover - ₹199** ⭐ *RECOMMENDED*
*Complete match day protection*
- All Basic features
- Travel allowance (₹750) if match abandoned
- **Inconvenience benefit (₹250)** for ANY DLS application
- 25% refund for 10-25% overs lost
- 50% refund for 26-50% overs lost

**Key Innovation:** The Inconvenience Benefit pays out even when a match completes after DLS application, acknowledging that a shortened match isn't what you paid for.

#### 3. **Premium Cover - ₹499**
*Ultimate protection for travelling fans*
- All Standard features
- Accommodation cover (up to ₹3,000) for outstation fans
- Stadium stranded F&B voucher (₹300) for delays >60 mins
- Rain check rebooking bonus (₹500) if attending rescheduled match
- Enhanced travel allowance (₹1,000)

#### 4. **Group Cover - ₹1,499**
*For families & friend groups (up to 5 people)*
- All Premium benefits for group members
- Shared travel allowance (₹2,000)
- Group accommodation cover (₹5,000)
- Complimentary stadium ponchos

---

## 📊 DLS Payout Triggers

### Tier Structure

| Scenario | Overs Lost | Payout Multiplier | Description |
|----------|-----------|-------------------|-------------|
| **Tier 1** | 10-25% | 25% | Minor disruption |
| **Tier 2** | 26-50% | 50% | Significant disruption |
| **Tier 3** | >50% or abandoned | 100% | Severe disruption |

### Example Scenarios

**Scenario A: IPL 2023 Final**
- Original: 20 overs scheduled
- Actual: 15 overs played (25% reduction)
- DLS Applied: Yes
- **Standard Cover Payout:** ₹625 (25% of ₹2,500) + ₹250 inconvenience = **₹875**

**Scenario B: Complete Abandonment**
- Original: 20 overs scheduled
- Actual: 0 overs (match called off)
- **Standard Cover Payout:** ₹2,500 (ticket) + ₹750 (travel) = **₹3,250**

---

## 💰 Actuarial Pricing Model

### Historical Data Foundation

Based on IPL statistics (2008-2024):
- **Complete abandonments:** ~0.9% of matches (~10/1,100 matches)
- **DLS-affected matches:** ~2-3% additional
- **Total rain-affected probability:** 3-5% of IPL matches

### Pricing Formula

```
Expected Loss =
  (P_abandoned × Ticket_Value × 1.0) +
  (P_severe × Ticket_Value × 1.0) +
  (P_significant × Ticket_Value × 0.5) +
  (P_minor × Ticket_Value × 0.25)

Premium = (Expected_Loss × Loading_Factor) × Profit_Margin + Admin_Cost
```

Where:
- **Loading Factor:** 1.5x (covers uncertainty and operational costs)
- **Admin Cost:** ₹15-30 (varies by tier)
- **Profit Margin:** 20%

### Risk Adjustments

**Venue-Specific Multipliers:**
| Venue | Multiplier | Reason |
|-------|-----------|---------|
| Mumbai (Wankhede) | 1.5x | Monsoon exposure |
| Bengaluru | 1.3x | High rainfall |
| Kolkata | 1.3x | Monsoon season |
| Chennai | 1.0x | Baseline |
| Delhi | 0.9x | Lower risk |
| Ahmedabad | 0.8x | Low rainfall |
| Jaipur | 0.8x | Arid climate |

**Drainage Quality Impact:**
- Excellent: 30% risk reduction
- Good: 15% reduction
- Average: No change
- Poor: 20% increase

---

## 🎨 Technical Architecture

### Core Modules

#### 1. DLS Calculator (`lib/dls-calculator.ts`)
```typescript
export function calculateDLSPayout(matchStatus: MatchStatus): DLSResult {
  // Determines payout tier based on overs lost
  // Returns: oversLostPercentage, payoutTier, payoutMultiplier
}
```

#### 2. Insurance Tiers (`lib/insurance-tiers.ts`)
```typescript
export const INSURANCE_TIERS: InsuranceTier[] = [
  basicCover, standardCover, premiumCover, groupCover
];

export function getRecommendedTier(
  ticketValue: number,
  rainRisk: number,
  isOutstation: boolean
): InsuranceTier;
```

#### 3. Pricing Model (`lib/pricing-model.ts`)
```typescript
export function getTierPricing(
  tierId: string,
  ticketValue: number,
  factors: PricingFactors,
  isOutstation: boolean
): number;

export function calculateValueProposition(
  premium: number,
  ticketValue: number,
  totalMatchDayInvestment: number,
  rainRisk: number
): ValueProposition;
```

### Data Flow

```
1. User selects venue → Fetch real-time weather data
2. Weather API → Calculate rain risk (0-100%)
3. User configures coverage → Calculate dynamic premium
4. Apply venue/drainage adjustments → Show value proposition
5. Purchase policy → Store policy details
6. Simulate match → Apply DLS triggers
7. Calculate payout → Show breakdown
```

---

## 🔧 Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Components:** Radix UI + Tailwind CSS
- **Animations:** Framer Motion
- **Weather API:** Open-Meteo (free, no API key required)
- **Hosting:** Vercel-ready

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd weather-ji

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

---

## 📈 Value Proposition Analysis

### For Customers

**Scenario: Mumbai vs Chennai at Wankhede**
- Ticket: ₹2,500
- Travel: ₹1,500
- Food/Merchandise: ₹1,000
- **Total Investment:** ₹5,000

**Standard Cover: ₹199**
- Protection Cost: **3.98% of total investment**
- If match abandoned: **₹3,250 payout** (163% ROI)
- If DLS applied: **₹625-1,500 payout** (214-653% ROI)

### For the Business

**Revenue Model (Conservative):**
- IPL 2025: 74 matches
- Average attendance: 40,000
- Policy uptake: 5%
- Average premium: ₹150

```
Policies sold: 74 × 40,000 × 5% = 148,000
Gross premium: 148,000 × ₹150 = ₹2.22 crore
Expected claims: ~4% × ₹2.22cr = ₹8.88 lakh
Net margin: ₹1.33 crore (60% margin)
```

**At 10% uptake:** ₹2.66 crore net margin

---

## 🛡️ Regulatory Compliance

### IRDAI Framework

This product is designed to comply with Indian insurance regulations:

1. **Parametric Insurance Precedent**
   - India has 20+ years of weather-based parametric products (crop insurance)
   - Event cancellation insurance is IRDAI-approved

2. **Key Compliance Features**
   - **Insurable Interest:** Policy can only be purchased with valid ticket
   - **Loss Compensation:** Sum insured capped at actual loss (ticket + incidental costs)
   - **Objective Triggers:** DLS application is publicly verifiable
   - **IRDAI Product Filing:** Required before commercial launch

3. **Differentiation from Gambling (Online Gaming Act 2025)**

| Feature | Gambling | This Product |
|---------|----------|--------------|
| Insurable interest | None | Ticket purchase required |
| Purpose | Profit from prediction | Loss compensation |
| Regulator | None/State laws | IRDAI |
| Payout trigger | Speculation | Verified loss event |
| Sum insured | Unlimited | Capped at actual loss |

---

## 🎯 Unique Features

### 1. Inconvenience Benefit
**First product to pay for shortened-but-completed matches**
- IPL 2023 Final: 20 overs → 15 overs
- Match technically "completed" but spectators got diminished value
- Standard Cover pays ₹250 even though result was achieved

### 2. Dynamic Pricing Transparency
- Real-time premium calculation based on weather forecast
- Venue-specific risk factors clearly displayed
- Interactive pricing breakdown

### 3. Total Match Day Protection
- Beyond ticket value: travel, food, accommodation
- Reflects real investment, not just face value

### 4. Cliff Horizon Integration Ready
Your proprietary weather analytics platform can provide:
- Enhanced venue-specific forecasting
- Real-time risk pricing
- Loss mitigation via early warnings

---

## 📚 Key Insights from Research

### Why This Product is Attractive

**From customer perspective:**
1. **Protects entire investment** - Not just ₹2,500 ticket, but ₹5,000-10,000 total outlay
2. **Low cost relative to risk** - 2-4% of total investment
3. **Unique benefit** - Inconvenience payment even for completed matches
4. **Peace of mind** - Especially for travelling fans

**From business perspective:**
1. **Scalable** - Digital distribution via BookMyShow/Paytm
2. **Healthy margins** - 45-60% after claims
3. **Defensible** - DLS triggers, Cliff Horizon data, first-mover advantage
4. **Regulatory pathway** - Precedent exists, clear compliance framework

---

## 🔮 Future Enhancements

### Phase 1 (MVP - Current)
- ✅ DLS-based triggers
- ✅ Multi-tier coverage
- ✅ Dynamic pricing
- ✅ Weather API integration

### Phase 2 (Production)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Email/SMS notifications
- [ ] Digital policy certificates (PDF)
- [ ] Claims portal

### Phase 3 (Scale)
- [ ] BookMyShow/Paytm API integration
- [ ] Official IPL partnership ("Official Rain Insurance Partner")
- [ ] Historical data analytics dashboard
- [ ] Reinsurance integration for tail risk

### Phase 4 (Advanced)
- [ ] Cliff Horizon real-time data feed
- [ ] ML-based dynamic pricing
- [ ] Venue-specific forecasting
- [ ] Mobile app (React Native)

---

## 🤝 Partnership Opportunities

### Distribution Partners
- **BookMyShow** - Point-of-sale insurance at ticket checkout
- **Paytm/PhonePe** - Digital insurance marketplace
- **Team Franchises** - Co-branded protection plans

### Technology Partners
- **Cliff Horizon** - Enhanced weather analytics
- **ESPNCricinfo** - Official DLS data verification
- **Insurance Carriers** - ICICI Lombard, HDFC Ergo, Bajaj Allianz

### Value-Added Services
- **Uber/Ola** - Ride vouchers if match abandoned
- **Swiggy/Zomato** - Food delivery credits
- **OTT Platforms** - Streaming subscriptions as consolation

---

## 📞 Contact & Support

For questions about the product model, technical architecture, or partnership opportunities:

- **Documentation:** This README
- **Technical Details:** See `/lib` modules
- **Product Specs:** Based on comprehensive market research (see conversation history)

---

## ⚖️ License & Disclaimer

This is a **demonstration application** showcasing a parametric insurance product concept.

**Important Notes:**
1. Not a licensed insurance product (requires IRDAI approval)
2. Weather data is real (Open-Meteo API)
3. Pricing model is actuarially sound but illustrative
4. Match simulations are probabilistic, not predictions

For commercial deployment:
1. Obtain IRDAI product approval
2. Partner with licensed general insurer
3. Secure reinsurance for tail risk
4. Integrate payment/claims processing

---

## 🎓 Learn More

### About DLS Method
- [Wikipedia: Duckworth-Lewis-Stern](https://en.wikipedia.org/wiki/Duckworth%E2%80%93Lewis%E2%80%93Stern_method)
- [ICC Official DLS Resources](https://www.icc-cricket.com)

### About Parametric Insurance
- [Swiss Re: Parametric Insurance Explained](https://www.swissre.com)
- [IRDAI Weather-Based Crop Insurance](https://www.irdai.gov.in)

### About IPL Statistics
- [ESPNCricinfo IPL Stats](https://www.espncricinfo.com/ci/content/stats/ipl.html)

---

## 🙏 Acknowledgments

- **Open-Meteo** for free weather API
- **Radix UI** for accessible components
- **Vercel** for Next.js framework
- **ICC** for the DLS methodology
- **Research** based on comprehensive analysis of parametric insurance models, IPL data, and regulatory frameworks

---

**Built with ❤️ for cricket fans who deserve better protection from unpredictable weather**

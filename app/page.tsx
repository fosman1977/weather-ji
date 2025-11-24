'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Cloud, CloudRain, Shield, AlertCircle, CheckCircle, Info,
  Umbrella, MapPin, Users, TrendingUp, BadgeCheck,
  Clock, Home, Car, Coffee, RefreshCw, Loader2, ChevronDown,
  Wallet, Trophy, Sparkles, Zap, Sun, ThermometerSun, Droplets, Wind, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Import our new modules
import {
  calculateDLSPayout,
  simulateMatchOutcome,
  calculateExpectedValue
} from '@/lib/dls-calculator';
import {
  INSURANCE_TIERS,
  calculateMaxPayout,
  getRecommendedTier,
  type InsuranceTier
} from '@/lib/insurance-tiers';
import {
  calculateValueProposition,
  getTierPricing,
  VENUE_RISK_MULTIPLIERS,
  type PricingFactors
} from '@/lib/pricing-model';

// Fun loading messages
const LOADING_MESSAGES = [
  "Baadal se baat kar rahe hain... ☁️",
  "Weather uncle ko phone kar rahe hain... 📞",
  "Barometer ko chai pila rahe hain... ☕",
  "Satellite se gossip kar rahe hain... 🛰️",
  "Indra Dev ko WhatsApp kar rahe hain... ⚡",
  "Mausam ka mood check kar rahe hain... 🌦️",
];

// Stadium descriptions with personality
const STADIUM_DESCRIPTIONS: Record<string, string> = {
  'blr': 'Bengaluru tech bros ka ghar 💻 (Good drainage, but those clouds...)',
  'mum': 'Mumbai ka pride 🏙️ (Lekin monsoon mein... 🌧️)',
  'kol': 'Kolkata ki crown jewel 👑 (Umbrella zaroori)',
  'ahm': 'Biggest stadium, biggest dreams 🏟️ (Rain? Kya wo?)',
  'che': 'Chennai hot hot hot! 🔥 (Barish rare hai)',
  'del': 'Dilli ki dhadkan ❤️ (Weather unpredictable)',
  'dha': 'Mountain vibes, unpredictable weather 🏔️',
};

// Social proof messages
const SOCIAL_PROOF = [
  '💬 Rahul from Delhi: "₹5000 bach gaye bhai!"',
  '💬 Priya from Mumbai: "Better than stock market!"',
  '💬 Amit: "Papa ko bhi recommend kiya"',
  '💬 Sneha: "DLS method finally useful! 😂"',
  '💬 Karan from Bangalore: "Tech bros approve!"',
  '💬 Anjali: "Mere 10K bach gaye!"',
];

// Stadium data with enhanced metadata
interface Stadium {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  capacity: number;
  drainage: 'excellent' | 'good' | 'average' | 'poor';
  covered: number;
  team: string;
}

const STADIUMS: Stadium[] = [
  { id: 'blr', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', lat: 12.9788, lon: 77.5996, capacity: 40000, drainage: 'excellent', covered: 15, team: 'Royal Challengers Bengaluru' },
  { id: 'mum', name: 'Wankhede Stadium', city: 'Mumbai', lat: 18.9389, lon: 72.8258, capacity: 33000, drainage: 'good', covered: 20, team: 'Mumbai Indians' },
  { id: 'kol', name: 'Eden Gardens', city: 'Kolkata', lat: 22.5646, lon: 88.3433, capacity: 66000, drainage: 'average', covered: 25, team: 'Kolkata Knight Riders' },
  { id: 'ahm', name: 'Narendra Modi Stadium', city: 'Ahmedabad', lat: 23.0904, lon: 72.5975, capacity: 132000, drainage: 'excellent', covered: 30, team: 'Gujarat Titans' },
  { id: 'che', name: 'M. A. Chidambaram Stadium', city: 'Chennai', lat: 13.0628, lon: 80.2793, capacity: 50000, drainage: 'good', covered: 10, team: 'Chennai Super Kings' },
  { id: 'del', name: 'Arun Jaitley Stadium', city: 'Delhi', lat: 28.6379, lon: 77.2432, capacity: 41000, drainage: 'good', covered: 18, team: 'Delhi Capitals' },
  { id: 'dha', name: 'HPCA Stadium', city: 'Dharamshala', lat: 32.1976, lon: 76.3259, capacity: 23000, drainage: 'excellent', covered: 5, team: 'Punjab Kings' },
];

// Dynamic risk messages with personality
const getRiskMessage = (risk: number) => {
  if (risk < 20) return { text: 'Chill maar bhai ☀️', subtitle: 'Barish ka koi chance nahi' };
  if (risk < 40) return { text: 'Thoda sa tension lelo 😅', subtitle: 'Insurance optional hai' };
  if (risk < 60) return { text: 'Ab serious ho jao 😰', subtitle: 'Insurance le lo warna...' };
  if (risk < 80) return { text: 'PAKKA barish aayegi! ☔', subtitle: 'Insurance is not optional' };
  return { text: 'Bhaago! 🏃', subtitle: 'Match cancel hone wala hai!' };
};

// P/L Commentary
const getProfitLossCommentary = (amount: number) => {
  if (amount > 5000) return '🚀 Paisa hi paisa ho gaya!';
  if (amount > 0) return '📈 Stonks! Acha chal raha hai';
  if (amount === 0) return '⚖️ Perfectly balanced';
  if (amount > -2000) return '📉 Not stonks, but manageable';
  return '😭 Bhai rehne de, strategy change karo';
};

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    weatherCode: number;
  };
  hourly: Array<{
    time: string;
    temp: number;
    rainProb: number;
    precipitation: number;
    weatherCode: number;
  }>;
  rainRisk: number;
  matchSuitability: 'excellent' | 'good' | 'risky' | 'poor';
}

interface PolicyDetails {
  tier: InsuranceTier;
  ticketValue: number;
  premium: number;
  stadium: Stadium;
  rainRisk: number;
  purchaseTime: Date;
  isOutstation: boolean;
  totalInvestment: number;
}

export default function MatchDayProtection() {
  // Core state
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insurance selection state
  const [ticketValue, setTicketValue] = useState(2500);
  const [selectedTier, setSelectedTier] = useState<InsuranceTier>(INSURANCE_TIERS[1]); // Default to Standard
  const [isOutstation, setIsOutstation] = useState(false);
  const [totalInvestment, setTotalInvestment] = useState(5000);

  // Policy state
  const [hasPolicy, setHasPolicy] = useState(false);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetails | null>(null);

  // Simulation state
  const [showResult, setShowResult] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    oversPlayed: number;
    dlsApplied: boolean;
    abandoned: boolean;
    payout: number;
  } | null>(null);

  // UI state
  const [showPricingBreakdown, setShowPricingBreakdown] = useState(false);

  // Gamification state
  const [wallet, setWallet] = useState(25000);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  // Helper to show achievement with animation
  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(a => [...a, achievement]);
      setNewAchievement(achievement);
      setTimeout(() => setNewAchievement(null), 3000);
    }
  };

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedStadium.lat}&longitude=${selectedStadium.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=auto&forecast_days=2`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch weather data');
      const data = await res.json();

      const currentHour = new Date().getHours();
      const next12Hours = data.hourly.time.slice(currentHour, currentHour + 12).map((time: string, i: number) => ({
        time,
        temp: Math.round(data.hourly.temperature_2m[currentHour + i]),
        rainProb: data.hourly.precipitation_probability[currentHour + i] || 0,
        precipitation: data.hourly.precipitation[currentHour + i] || 0,
        weatherCode: data.hourly.weather_code[currentHour + i],
      }));

      // Calculate rain risk focusing on match hours
      const criticalHours = next12Hours.slice(0, 6);
      const rainRisk = Math.round(
        criticalHours.reduce((sum: number, h: typeof next12Hours[0], i: number) => {
          const weight = 1 - (i * 0.1);
          return sum + (h.rainProb * weight);
        }, 0) / criticalHours.reduce((sum: number, _: typeof next12Hours[0], i: number) => sum + (1 - i * 0.1), 0)
      );

      let matchSuitability: WeatherData['matchSuitability'] = 'excellent';
      if (rainRisk > 70) matchSuitability = 'poor';
      else if (rainRisk > 40) matchSuitability = 'risky';
      else if (rainRisk > 15) matchSuitability = 'good';

      setWeather({
        current: {
          temp: Math.round(data.current.temperature_2m),
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: Math.round(data.current.wind_speed_10m),
          pressure: Math.round(data.current.surface_pressure),
          weatherCode: data.current.weather_code,
        },
        hourly: next12Hours,
        rainRisk,
        matchSuitability,
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedStadium]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Calculate dynamic premium
  const pricingFactors: PricingFactors = {
    baseRainRisk: weather?.rainRisk || 0,
    stadiumDrainage: selectedStadium.drainage,
    stadiumCoverage: selectedStadium.covered,
    seasonalFactor: 1.0,
    venueRiskMultiplier: VENUE_RISK_MULTIPLIERS[selectedStadium.id] || 1.0
  };

  const premium = getTierPricing(selectedTier.id, ticketValue, pricingFactors, isOutstation);

  const valueProposition = calculateValueProposition(
    premium,
    ticketValue,
    totalInvestment,
    weather?.rainRisk || 0
  );

  const recommendedTier = weather ? getRecommendedTier(
    ticketValue,
    weather.rainRisk,
    isOutstation
  ) : null;

  // Purchase insurance
  const purchaseInsurance = () => {
    if (!weather || wallet < premium) return;

    setWallet(w => w - premium);
    setPolicyDetails({
      tier: selectedTier,
      ticketValue,
      premium,
      stadium: selectedStadium,
      rainRisk: weather.rainRisk,
      purchaseTime: new Date(),
      isOutstation,
      totalInvestment
    });
    setHasPolicy(true);

    // Unlock achievements
    unlockAchievement('🎯 First Timer');
    if (ticketValue >= 10000) unlockAchievement('💰 Crorepati Vibes');
    if (weather.rainRisk < 20) unlockAchievement('😎 Thrill Seeker');

    // Scroll to top of page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Simulate match
  const simulateMatch = () => {
    if (!policyDetails || !weather) return;

    const matchStatus = simulateMatchOutcome(weather.rainRisk, 20);
    const dlsResult = calculateDLSPayout(matchStatus);

    let payout = 0;

    if (matchStatus.matchAbandoned) {
      payout = calculateMaxPayout(policyDetails.tier, ticketValue, 'abandoned');
    } else if (dlsResult.payoutTier === 'severe') {
      payout = calculateMaxPayout(policyDetails.tier, ticketValue, 'severe');
    } else if (dlsResult.payoutTier === 'significant') {
      payout = calculateMaxPayout(policyDetails.tier, ticketValue, 'significant');
    } else if (dlsResult.payoutTier === 'minor') {
      payout = calculateMaxPayout(policyDetails.tier, ticketValue, 'minor');
    }

    // Update wallet and P/L
    if (payout > 0) {
      setWallet(w => w + payout);
      const profit = payout - policyDetails.premium;
      setTotalProfitLoss(p => p + profit);

      // Achievements
      if (payout >= 10000) unlockAchievement('🚀 Paisa Hi Paisa');
      if (profit / policyDetails.premium >= 2) unlockAchievement('📊 200% ROI Boss');
    } else {
      setTotalProfitLoss(p => p - policyDetails.premium);
    }

    setMatchResult({
      oversPlayed: matchStatus.oversPlayed,
      dlsApplied: matchStatus.dlsApplied,
      abandoned: matchStatus.matchAbandoned,
      payout
    });
    setShowResult(true);
  };

  const resetSimulation = () => {
    setShowResult(false);
    setMatchResult(null);
    setHasPolicy(false);
    setPolicyDetails(null);
  };

  // Loading state
  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium text-lg mb-4">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchWeather} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskBadgeColor = (risk: number) => {
    if (risk >= 70) return 'bg-red-500';
    if (risk >= 40) return 'bg-orange-500';
    if (risk >= 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header with Wallet */}
      <header className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 mb-2">
                ⛈️ Match Day Protection
              </h1>
              <p className="text-green-100 text-sm">
                DLS-based insurance + Hinglish vibes = Full Protection! 🏏💰
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-black/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20"
            >
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-yellow-300" />
                <span className="text-xs text-green-100">Tijori 💰</span>
              </div>
              <div className="font-mono font-bold text-2xl text-yellow-300">
                ₹{wallet.toLocaleString()}
              </div>
              {totalProfitLoss !== 0 && (
                <>
                  <div className={cn("text-xs font-medium mt-1", totalProfitLoss > 0 ? "text-green-300" : "text-red-300")}>
                    {totalProfitLoss > 0 ? '+' : ''}₹{totalProfitLoss.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-yellow-200 mt-0.5">
                    {getProfitLossCommentary(totalProfitLoss)}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex gap-2 flex-wrap"
            >
              {achievements.map(a => (
                <Badge key={a} variant="secondary" className="bg-yellow-400/20 text-yellow-100 border-yellow-300/30">
                  <Trophy className="w-3 h-3 mr-1" />
                  {a}
                </Badge>
              ))}
            </motion.div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stadium Selection */}
        <Card className="border-2 border-indigo-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Select Match Venue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Select
              value={selectedStadium.id}
              onValueChange={(id) => setSelectedStadium(STADIUMS.find(s => s.id === id)!)}
            >
              <SelectTrigger className="w-full text-lg h-14 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {STADIUMS.map(stadium => (
                  <SelectItem key={stadium.id} value={stadium.id} className="text-lg">
                    <div className="flex items-center justify-between w-full">
                      <span>{stadium.name}</span>
                      <Badge variant="outline" className="ml-2">{stadium.city}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stadium Description */}
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 italic">
                {STADIUM_DESCRIPTIONS[selectedStadium.id]}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="w-6 h-6 mx-auto text-indigo-600 mb-2" />
                <div className="text-xs text-gray-600 mb-1">Capacity</div>
                <div className="font-bold text-gray-900">{(selectedStadium.capacity / 1000).toFixed(0)}K</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Cloud className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <div className="text-xs text-gray-600 mb-1">Drainage</div>
                <div className="font-bold text-gray-900 capitalize">{selectedStadium.drainage}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Umbrella className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <div className="text-xs text-gray-600 mb-1">Covered</div>
                <div className="font-bold text-gray-900">{selectedStadium.covered}%</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                <div className="text-xs text-gray-600 mb-1">Risk Factor</div>
                <div className="font-bold text-gray-900">{VENUE_RISK_MULTIPLIERS[selectedStadium.id]}x</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {weather && (
          <>
            {/* Weather Overview with Personality */}
            <Card className={cn(
              "border-2 shadow-lg relative overflow-hidden",
              weather.rainRisk >= 70 ? "border-red-300 bg-gradient-to-br from-red-50 to-orange-50" :
              weather.rainRisk >= 40 ? "border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50" :
              "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
            )}>
              <CardContent className="p-8">
                {/* Animated background elements */}
                {weather.rainRisk >= 70 && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: -20, x: i * 100 }}
                        animate={{ y: 400 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: 'linear'
                        }}
                        className="absolute text-2xl"
                      >
                        💧
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {getRiskMessage(weather.rainRisk).text}
                    </h2>
                    <p className="text-gray-700 font-semibold">
                      Rain Risk: {weather.rainRisk}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRiskMessage(weather.rainRisk).subtitle}
                    </p>
                  </div>
                  <Badge className={cn("text-white px-6 py-3 text-lg", getRiskBadgeColor(weather.rainRisk))}>
                    {weather.rainRisk >= 70 ? '🔥 Bohot Zyada' : weather.rainRisk >= 40 ? '😐 Thoda Hai' : '😎 Kam Hai'}
                  </Badge>
                </div>

                <div className="h-4 bg-white/50 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weather.rainRisk}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn(
                      "h-full",
                      weather.rainRisk >= 70 ? "bg-red-500" :
                      weather.rainRisk >= 40 ? "bg-orange-500" :
                      "bg-green-500"
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Weather Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <ThermometerSun className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">Temperature</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{weather.current.temp}°C</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-blue-500 mb-2">
                    <Droplets className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">Humidity</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{weather.current.humidity}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-cyan-500 mb-2">
                    <Wind className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">Wind Speed</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{weather.current.windSpeed}<span className="text-lg text-gray-500">km/h</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-purple-500 mb-2">
                    <Activity className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">Pressure</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{weather.current.pressure}<span className="text-lg text-gray-500">hPa</span></div>
                </CardContent>
              </Card>
            </div>

            {/* High Risk Warning */}
            {weather.rainRisk >= 80 && !hasPolicy && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white shadow-2xl border-4 border-red-300"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-12 h-12 flex-shrink-0" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">🔥 Bhai Serious Warning! 🔥</h3>
                    <p className="text-red-100 mb-3">
                      {weather.rainRisk}% rain risk hai aur insurance nahi liya? Match 100% cancel hone wala hai!
                      Ticket ka ₹{ticketValue.toLocaleString()} dubne wala hai! 😱
                    </p>
                    <div className="bg-white/20 rounded-lg p-3 text-sm">
                      <p className="font-bold">⚠️ EMERGENCY:</p>
                      <p className="text-red-50">
                        Insurance le lo abhi! Premium sirf ₹{premium.toLocaleString()} hai!
                        Barish 100% aayegi bhai! 🌧️
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Insurance Configuration */}
            {!hasPolicy && (
              <Card className="border-2 border-purple-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Shield className="w-6 h-6" />
                    Configure Your Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Ticket Value */}
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="font-semibold text-gray-900">Ticket Value</label>
                      <span className="text-2xl font-bold text-indigo-600">₹{ticketValue.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[ticketValue]}
                      onValueChange={(v) => setTicketValue(v[0])}
                      min={500}
                      max={25000}
                      step={500}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>₹500</span>
                      <span>₹25,000</span>
                    </div>
                  </div>

                  {/* Total Investment */}
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="font-semibold text-gray-900 flex items-center gap-2">
                        <Coffee className="w-4 h-4" />
                        Total Match Day Investment
                      </label>
                      <span className="text-2xl font-bold text-purple-600">₹{totalInvestment.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[totalInvestment]}
                      onValueChange={(v) => setTotalInvestment(v[0])}
                      min={ticketValue}
                      max={50000}
                      step={500}
                      className="mb-2"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      <Car className="w-3 h-3 inline mr-1" />
                      Include travel, food, accommodation, merchandise
                    </p>
                  </div>

                  {/* Outstation Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Travelling from another city?</span>
                    </div>
                    <button
                      onClick={() => setIsOutstation(!isOutstation)}
                      className={cn(
                        "relative w-14 h-7 rounded-full transition-colors",
                        isOutstation ? "bg-indigo-600" : "bg-gray-300"
                      )}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: isOutstation ? 28 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Tier Selection */}
                  <div>
                    <label className="font-semibold text-gray-900 mb-4 block">Choose Your Protection Plan</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {INSURANCE_TIERS.map(tier => {
                        const isRecommended = recommendedTier?.id === tier.id;
                        const tierPremium = getTierPricing(tier.id, ticketValue, pricingFactors, isOutstation);

                        return (
                          <motion.button
                            key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "p-6 rounded-xl border-2 text-left transition-all relative",
                              selectedTier.id === tier.id
                                ? "border-indigo-500 bg-indigo-50 shadow-lg"
                                : "border-gray-200 hover:border-indigo-300 bg-white"
                            )}
                          >
                            {isRecommended && (
                              <Badge className="absolute -top-3 -right-3 bg-green-500 text-white">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}

                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{tier.name}</h3>
                                <p className="text-sm text-gray-600">{tier.tagline}</p>
                              </div>
                              {selectedTier.id === tier.id && (
                                <CheckCircle className="w-6 h-6 text-indigo-600" />
                              )}
                            </div>

                            <div className="text-3xl font-bold text-indigo-600 mb-4">
                              ₹{tierPremium.toLocaleString()}
                            </div>

                            <ul className="space-y-2">
                              {tier.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>

                            {tier.features.length > 3 && (
                              <p className="text-xs text-gray-500 mt-2">
                                +{tier.features.length - 3} more benefits
                              </p>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Value Proposition */}
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Is This Worth It?</h4>
                          <p className="text-sm text-gray-700 mb-3">{valueProposition.reasoning}</p>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Protection Cost</div>
                              <div className="font-bold text-indigo-600">
                                {valueProposition.protectionRatio.toFixed(1)}% of investment
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Recommendation</div>
                              <Badge className={cn(
                                "capitalize",
                                valueProposition.recommendation === 'strongly-recommended' ? 'bg-green-500' :
                                valueProposition.recommendation === 'recommended' ? 'bg-blue-500' :
                                valueProposition.recommendation === 'optional' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              )}>
                                {valueProposition.recommendation.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowPricingBreakdown(!showPricingBreakdown)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <ChevronDown className={cn(
                          "w-4 h-4 mr-2 transition-transform",
                          showPricingBreakdown && "rotate-180"
                        )} />
                        {showPricingBreakdown ? 'Hide' : 'Show'} Pricing Breakdown
                      </Button>

                      {showPricingBreakdown && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-indigo-200 space-y-2 text-sm"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-600">Base Premium:</span>
                            <span className="font-mono">₹{Math.round(premium * 0.4).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risk Adjustment ({weather.rainRisk}%):</span>
                            <span className="font-mono">₹{Math.round(premium * 0.3).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Venue Factor ({VENUE_RISK_MULTIPLIERS[selectedStadium.id]}x):</span>
                            <span className="font-mono">₹{Math.round(premium * 0.15).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Admin & Margin:</span>
                            <span className="font-mono">₹{Math.round(premium * 0.15).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t border-indigo-300">
                            <span>Total Premium:</span>
                            <span className="text-indigo-600">₹{premium.toLocaleString()}</span>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Purchase Button */}
                  <Button
                    onClick={purchaseInsurance}
                    disabled={wallet < premium}
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg disabled:opacity-50 text-white"
                  >
                    {wallet < premium ? (
                      <>
                        <AlertCircle className="w-6 h-6 mr-3" />
                        😭 Paisa Kam Pad Gaya Bhai
                      </>
                    ) : (
                      <>
                        <Shield className="w-6 h-6 mr-3" />
                        🛒 Le Lo Protection - ₹{premium.toLocaleString()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Policy Confirmation */}
            {hasPolicy && policyDetails && !showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-2 border-green-300 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <CheckCircle className="w-6 h-6" />
                      🎉 Done! Ab Tension Free!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      <Image
                        src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGQ3aGRxeHI3cTBuZzBvYzRsN2FwYXN6ZXJjb2R2Zm1wbmpmdXRhZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlvcRyVJeO8Gmju/giphy.gif"
                        alt="Cricket celebration"
                        width={192}
                        height={144}
                        unoptimized
                        className="w-48 h-36 object-cover rounded-xl shadow-lg"
                      />
                    </div>
                    <div className="bg-green-50 rounded-xl p-6 mb-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-4">Coverage Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Plan</div>
                          <div className="font-bold">{policyDetails.tier.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Premium Paid</div>
                          <div className="font-bold text-green-600">₹{policyDetails.premium.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Ticket Value</div>
                          <div className="font-bold">₹{policyDetails.ticketValue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Rain Risk</div>
                          <div className="font-bold">{policyDetails.rainRisk}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <h4 className="font-semibold text-gray-900">Your Coverage Includes:</h4>
                      {policyDetails.tier.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <p className="text-xs text-blue-600 mb-3 font-medium text-center">
                        Dekh lo kya hoga match mein... 🎲
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={simulateMatch}
                        className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        ⚡ Match Simulate Karo
                      </Button>
                      <Button
                        onClick={resetSimulation}
                        variant="outline"
                        className="h-14 px-8"
                      >
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Match Result Modal */}
      <AnimatePresence>
        {showResult && matchResult && policyDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetSimulation}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn(
                "p-8 rounded-t-2xl text-white",
                matchResult.payout > 0 ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-gradient-to-r from-gray-600 to-slate-600"
              )}>
                <h2 className="text-3xl font-bold mb-2">
                  {matchResult.abandoned ? '☔ Match Cancel Ho Gaya!' :
                   matchResult.dlsApplied ? '🌧️ DLS Method Lag Gaya!' :
                   '☀️ Match Khel Gaya!'}
                </h2>
                <p className="text-white/90">
                  {matchResult.abandoned ? 'Barish ne sab kharab kar diya 😭' :
                   matchResult.dlsApplied ? `Match reduced to ${matchResult.oversPlayed}/20 overs (DLS FTW!)` :
                   'Full 20 overs played. Barish nahi aayi! 🌞'}
                </p>
              </div>

              <div className="p-8">
                {matchResult.payout > 0 ? (
                  <>
                    <div className="bg-green-50 rounded-xl p-8 mb-6 text-center border-2 border-green-200">
                      <div className="text-sm text-green-700 font-bold uppercase tracking-wide mb-2">
                        {(matchResult.payout - policyDetails.premium) > 5000 ? '🚀 JACKPOT! Paisa Hi Paisa!' : '💰 Paisa Mil Gaya Bhai'}
                      </div>
                      <div className="text-5xl font-bold text-green-600 mb-3">
                        ₹{matchResult.payout.toLocaleString()}
                      </div>
                      <div className="text-gray-700">
                        Pure Profit: <span className="font-bold text-green-600">₹{(matchResult.payout - policyDetails.premium).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        ROI: {(((matchResult.payout - policyDetails.premium) / policyDetails.premium) * 100).toFixed(1)}% 🚀
                      </div>
                      <div className="text-xs text-green-700 mt-3 font-bold">
                        {(matchResult.payout - policyDetails.premium) > 5000 ? '🔥 Ghar jaake party do!' : '✅ Insurance FTW!'}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <h4 className="font-semibold text-gray-900">Payout Breakdown:</h4>
                      {policyDetails.tier.coverageComponents
                        .filter(comp => {
                          const trigger = comp.trigger.toLowerCase();
                          if (matchResult.abandoned) return trigger.includes('abandoned');
                          if (matchResult.dlsApplied) return trigger.includes('dls') || trigger.includes('any');
                          return false;
                        })
                        .map((comp, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">{comp.name}</span>
                            <span className="font-bold text-green-600">₹{comp.amount(policyDetails.ticketValue).toLocaleString()}</span>
                          </div>
                        ))
                      }
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 mb-6 text-center border-2 border-gray-200">
                    <div className="text-sm text-gray-700 font-bold uppercase tracking-wide mb-2">
                      😅 Paisa Gaya
                    </div>
                    <div className="text-5xl font-bold text-gray-600 mb-3">
                      -₹{policyDetails.premium.toLocaleString()}
                    </div>
                    <div className="text-gray-700">
                      Premium de diya tha: <span className="font-bold text-gray-600">₹{policyDetails.premium.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      {weather?.rainRisk && weather.rainRisk < 30
                        ? 'Itni kam risk mein bhi insurance le liya? Overthinking much? 😅'
                        : 'Barish nahi aayi. Premium wapis nahi milega! Better luck next time! 🍀'}
                    </p>
                    <p className="text-xs text-purple-600 mt-3 font-bold">
                      💡 Tip: {weather?.rainRisk && weather.rainRisk > 50 ? 'High risk mein insurance lene ka!' : 'Low risk skip karo!'}
                    </p>
                  </div>
                )}

                <Button
                  onClick={resetSimulation}
                  className="w-full h-14 text-lg font-bold"
                  variant={matchResult.payout > 0 ? "default" : "outline"}
                >
                  {matchResult.payout > 0 ? '🎉 Aur Khelo!' : '🔄 Phir Se Try Karo'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Proof Ticker */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 border-2 border-purple-200 rounded-lg py-4 overflow-hidden">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...SOCIAL_PROOF, ...SOCIAL_PROOF].map((proof, i) => (
              <div key={i} className="inline-flex items-center gap-2 text-purple-700 font-medium">
                {proof}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-sm text-gray-500 mb-2">
          <Shield className="w-4 h-4 inline mr-1" />
          DLS method + Real weather data + Hinglish vibes = Full protection, bhai! 🏏
        </p>
        <p className="text-center text-xs text-gray-400">
          ⚠️ Ye serious product hai with fun UI. Actuarially sound pricing with desi humor! Weather data by Open-Meteo.
        </p>
      </footer>

      {/* Achievement Unlock Popup */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3, repeat: 2 }}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-4 border-yellow-300 flex items-center gap-3"
            >
              <Trophy className="w-8 h-8" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wide">Achievement Unlocked!</div>
                <div className="text-lg font-bold">{newAchievement}</div>
              </div>
              <Sparkles className="w-6 h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

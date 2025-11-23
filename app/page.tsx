'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Cloud, CloudRain, CloudDrizzle, Sun,
  Shield, Wallet, AlertCircle, CheckCircle, Zap, Trophy,
  ThermometerSun, Droplets, Wind, Eye,
  Sparkles, Target, Activity, WifiOff, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Funny loading messages
const LOADING_MESSAGES = [
  "Baadal se baat kar rahe hain... ☁️",
  "Weather uncle ko phone kar rahe hain... 📞",
  "Barometer ko chai pila rahe hain... ☕",
  "Satellite se gossip kar rahe hain... 🛰️",
  "Indra Dev ko WhatsApp kar rahe hain... ⚡",
  "Mausam ka mood check kar rahe hain... 🌦️",
];

// Stadium descriptions
const STADIUM_DESCRIPTIONS: Record<string, string> = {
  'blr': 'Bengaluru tech bros ka ghar 💻',
  'mum': 'Mumbai ka pride (lekin drainage... 🤔)',
  'kol': 'Kolkata ki crown jewel (umbrella zaroori) ☔',
  'ahm': 'Biggest stadium, biggest dreams 🏟️',
  'che': 'Chennai hot hot hot! 🔥',
  'del': 'Dilli ki dhadkan ❤️',
  'dha': 'Mountain vibes, unpredictable weather 🏔️',
};

// Time-based greetings
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { emoji: '🌅', text: 'Subah ka weather check!' };
  if (hour >= 12 && hour < 17) return { emoji: '🔥', text: 'Dopahar ki garmi mein!' };
  if (hour >= 17 && hour < 21) return { emoji: '🌆', text: 'Shaam ho gayi, match time!' };
  return { emoji: '🌙', text: 'Raat ko bhi trading? Crypto bro ho kya?' };
};

// Dynamic risk messages
const getRiskMessage = (risk: number) => {
  if (risk < 20) return { text: 'Chill maar bhai ☀️', subtitle: 'Barish ka koi chance nahi' };
  if (risk < 40) return { text: 'Thoda sa tension lelo 😅', subtitle: 'Just in case...' };
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
  return '😭 Bhai rehne de, aur nuksan mat kar';
};

// Social proof messages
const SOCIAL_PROOF = [
  '💬 Rahul from Delhi saved ₹5000!',
  '💬 Priya from Mumbai: "Better than stock market!"',
  '💬 Amit: "Papa ko bhi recommend kiya"',
  '💬 Sneha: "Barish insurance > Life insurance 😂"',
  '💬 Karan from Bangalore: "Tech bros approve!"',
  '💬 Anjali: "Mere 10K bach gaye bhai!"',
];

// Types
interface Stadium {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  capacity: number;
  drainage: 'excellent' | 'good' | 'average' | 'poor';
  covered: number;
}

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

interface InsuranceTier {
  id: string;
  name: string;
  multiplier: number;
  features: string[];
  color: string;
}

interface PolicyDetails {
  tier: InsuranceTier;
  coverage: number;
  premium: number;
  stadium: Stadium;
  rainRisk: number;
  purchaseTime: Date;
}

const STADIUMS: Stadium[] = [
  { id: 'blr', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', lat: 12.9788, lon: 77.5996, capacity: 40000, drainage: 'excellent', covered: 15 },
  { id: 'mum', name: 'Wankhede Stadium', city: 'Mumbai', lat: 18.9389, lon: 72.8258, capacity: 33000, drainage: 'good', covered: 20 },
  { id: 'kol', name: 'Eden Gardens', city: 'Kolkata', lat: 22.5646, lon: 88.3433, capacity: 66000, drainage: 'average', covered: 25 },
  { id: 'ahm', name: 'Narendra Modi Stadium', city: 'Ahmedabad', lat: 23.0904, lon: 72.5975, capacity: 132000, drainage: 'excellent', covered: 30 },
  { id: 'che', name: 'M. A. Chidambaram Stadium', city: 'Chennai', lat: 13.0628, lon: 80.2793, capacity: 50000, drainage: 'good', covered: 10 },
  { id: 'del', name: 'Arun Jaitley Stadium', city: 'Delhi', lat: 28.6379, lon: 77.2432, capacity: 41000, drainage: 'good', covered: 18 },
  { id: 'dha', name: 'HPCA Stadium', city: 'Dharamshala', lat: 32.1976, lon: 76.3259, capacity: 23000, drainage: 'excellent', covered: 5 },
];

const INSURANCE_TIERS: InsuranceTier[] = [
  { id: 'basic', name: '🤝 Dost Plan', multiplier: 1.0, features: ['100% paisa wapas if match cancelled', 'Same-day processing (lightning fast!)', '💪 Broke but responsible'], color: 'bg-blue-500' },
  { id: 'premium', name: '👑 VIP Tier (Boss Vibes)', multiplier: 1.3, features: ['Full refund if barish ho gaya', 'Instant processing like Zomato delivery', '50% back if 2hr+ delay ho', '🌟 Middle class with dreams'], color: 'bg-purple-500' },
  { id: 'platinum', name: '💎 Diamond Haath Wala', multiplier: 1.6, features: ['120% profit if washed out (stonks!)', 'Priority instant claims (VVIP treatment)', '75% refund if 1hr delay', 'Free upgrade to next match (because you matter)', '💎 Ameer log only (Papa ka paisa?)'], color: 'bg-amber-500' },
];

export default function PitchCoverPage() {
  const [wallet, setWallet] = useState(25000);
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketValue, setTicketValue] = useState(2500);
  const [selectedTier, setSelectedTier] = useState<InsuranceTier>(INSURANCE_TIERS[0]);
  const [hasPolicy, setHasPolicy] = useState(false);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetails | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [matchResult, setMatchResult] = useState<'rained' | 'played' | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);

  const policyConfirmationRef = useRef<HTMLDivElement>(null);

  // Load smart defaults from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStadium = localStorage.getItem('weatherji_stadium');
      const savedTier = localStorage.getItem('weatherji_tier');
      const savedAchievements = localStorage.getItem('weatherji_achievements');

      if (savedStadium) {
        const stadium = STADIUMS.find(s => s.id === savedStadium);
        if (stadium) setSelectedStadium(stadium);
      }
      if (savedTier) {
        const tier = INSURANCE_TIERS.find(t => t.id === savedTier);
        if (tier) setSelectedTier(tier);
      }
      if (savedAchievements) {
        try {
          setAchievements(JSON.parse(savedAchievements));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('weatherji_stadium', selectedStadium.id);
      localStorage.setItem('weatherji_tier', selectedTier.id);
      localStorage.setItem('weatherji_achievements', JSON.stringify(achievements));
    }
  }, [selectedStadium, selectedTier, achievements]);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedStadium.lat}&longitude=${selectedStadium.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=auto&forecast_days=2`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Server so gaya lagta hai... 😴');
      const data = await res.json();

      const currentHour = new Date().getHours();
      const next12Hours = data.hourly.time.slice(currentHour, currentHour + 12).map((time: string, i: number) => ({
        time,
        temp: Math.round(data.hourly.temperature_2m[currentHour + i]),
        rainProb: data.hourly.precipitation_probability[currentHour + i] || 0,
        precipitation: data.hourly.precipitation[currentHour + i] || 0,
        weatherCode: data.hourly.weather_code[currentHour + i],
      }));

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
    } catch (error) {
      console.error('Weather fetch error:', error);
      const errorMessage = error instanceof Error && error.message.includes('Failed to fetch')
        ? 'Internet ka chakkar hai! Babu bhaiya! 😅'
        : error instanceof Error ? error.message : 'Kuch gadbad ho gayi bhai! 🤔';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedStadium]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const calculatePremium = () => {
    if (!weather) return 0;

    const baseRate = 0.08;
    const riskMultiplier = weather.rainRisk / 100;
    const drainageFactor = {
      excellent: 0.7,
      good: 0.85,
      average: 1.0,
      poor: 1.2,
    }[selectedStadium.drainage];

    const coveredDiscount = 1 - (selectedStadium.covered / 200);
    const tierMultiplier = selectedTier.multiplier;

    const premium = Math.round(
      ticketValue * baseRate * (1 + riskMultiplier * 1.5) * drainageFactor * coveredDiscount * tierMultiplier
    );

    return Math.min(premium, ticketValue * 0.95);
  };

  const premium = calculatePremium();

  // Helper to show achievement with animation
  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(a => [...a, achievement]);
      setNewAchievement(achievement);
      setTimeout(() => setNewAchievement(null), 3000);
    }
  };

  const buyInsurance = () => {
    if (wallet < premium) return;

    setWallet(w => w - premium);
    setHasPolicy(true);
    setPolicyDetails({
      tier: selectedTier,
      coverage: ticketValue,
      premium,
      stadium: selectedStadium,
      rainRisk: weather?.rainRisk || 0,
      purchaseTime: new Date(),
    });

    unlockAchievement('🎯 First Timer');
    if (ticketValue >= 10000) unlockAchievement('💰 Crorepati Vibes');

    // Scroll to confirmation on mobile
    setTimeout(() => {
      policyConfirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const simulateMatch = () => {
    if (!policyDetails || !weather) return;

    const rainRoll = Math.random() * 100;
    const drainageBonus = { excellent: 15, good: 10, average: 5, poor: 0 }[selectedStadium.drainage];
    const effectiveRainRisk = Math.max(0, weather.rainRisk - drainageBonus);

    const washedOut = rainRoll < effectiveRainRisk;

    if (washedOut) {
      let payout = policyDetails.coverage;
      if (policyDetails.tier.id === 'platinum') payout = Math.round(payout * 1.2);

      const profit = payout - policyDetails.premium;
      setWallet(w => w + payout);
      setMatchResult('rained');
      setTotalProfitLoss(p => p + profit);
      setTotalWins(w => w + 1);
      setConsecutiveLosses(0);

      // New achievements with animations
      if (payout >= 10000) unlockAchievement('🚀 Paisa Hi Paisa');
      if (profit / policyDetails.premium >= 2) unlockAchievement('📊 200% ROI Boss');
      if (totalWins + 1 >= 5) unlockAchievement('🎯 Weather Baba');
    } else {
      setMatchResult('played');
      setTotalProfitLoss(p => p - policyDetails.premium);
      setConsecutiveLosses(c => c + 1);

      // Paper hands achievement
      if (weather.rainRisk < 30) unlockAchievement('📉 Paper Hands');
      // Overconfident achievement
      if (consecutiveLosses + 1 >= 3) unlockAchievement('🤡 Overconfident');
    }

    setShowResult(true);

    if (weather.rainRisk < 20) unlockAchievement('😎 Thrill Seeker Bhai');
  };

  const getSuitabilityConfig = (suitability: WeatherData['matchSuitability']) => {
    const configs = {
      excellent: { color: 'bg-green-500', text: '🌞 Bilkul Mast Weather!', icon: Sun, textColor: 'text-green-700' },
      good: { color: 'bg-blue-500', text: '👍 Chill Hai Sab', icon: Cloud, textColor: 'text-blue-700' },
      risky: { color: 'bg-amber-500', text: '😬 Thoda Risky Hai Boss', icon: CloudDrizzle, textColor: 'text-amber-700' },
      poor: { color: 'bg-red-500', text: '☔ Pakka Barish Aayega!', icon: CloudRain, textColor: 'text-red-700' },
    };
    return configs[suitability];
  };

  const resetGame = () => {
    setShowResult(false);
    setMatchResult(null);
    setHasPolicy(false);
    setPolicyDetails(null);
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium mb-4">{loadingMessage}</p>
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-red-200">
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <WifiOff className="w-10 h-10 text-red-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! 😅</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  fetchWeather();
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Dubara Try Karo!
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const suitabilityConfig = weather ? getSuitabilityConfig(weather.matchSuitability) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20">
      <div className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                ⛈️ Weather-Ji
              </h1>
              <p className="text-green-100 text-sm mt-1">
                {getTimeBasedGreeting().emoji} {getTimeBasedGreeting().text}
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
                  {a.replace('_', ' ')}
                </Badge>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-2 border-green-100">
          <CardContent className="p-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🏟️ Kaun Sa Maidan?</label>
            <Select value={selectedStadium.id} onValueChange={(id) => setSelectedStadium(STADIUMS.find(s => s.id === id)!)}>
              <SelectTrigger className="w-full text-lg font-semibold h-14 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {STADIUMS.map(stadium => (
                  <SelectItem key={stadium.id} value={stadium.id} className="text-lg text-gray-900">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-gray-900">{stadium.name}</span>
                      <Badge variant="outline" className="ml-2 text-gray-700">{stadium.city}</Badge>
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

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Target className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <div className="text-xs text-gray-500">Crowd Capacity</div>
                <div className="text-sm font-bold">{(selectedStadium.capacity / 1000).toFixed(0)}K logon</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Droplets className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
                <div className="text-xs text-gray-500">Paani Nikal Jaata Hai?</div>
                <div className="text-sm font-bold capitalize">{selectedStadium.drainage === 'excellent' ? '💯 Ekdum' : selectedStadium.drainage === 'good' ? '👍 Theek' : selectedStadium.drainage === 'average' ? '😐 Normal' : '😬 Slow'}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Shield className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                <div className="text-xs text-gray-500">Roof Hai Kya?</div>
                <div className="text-sm font-bold">{selectedStadium.covered}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {weather && suitabilityConfig && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-2xl p-6 text-white shadow-xl relative overflow-hidden", suitabilityConfig.color)}
            >
              {/* Animated background clouds */}
              {weather.rainRisk > 30 && (
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <motion.div
                    animate={{ x: [-100, 800] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-4 text-6xl"
                  >
                    ☁️
                  </motion.div>
                  <motion.div
                    animate={{ x: [-50, 800] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 5 }}
                    className="absolute top-12 text-4xl"
                  >
                    ☁️
                  </motion.div>
                </div>
              )}

              {/* Animated raindrops for high risk */}
              {weather.rainRisk >= 70 && (
                <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
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

              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-1">{suitabilityConfig.text}</h2>
                  <p className="text-white/80 mb-3">Rain Risk: {weather.rainRisk}%</p>

                  {/* Animated Rain Risk Bar */}
                  <div className="mb-2">
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${weather.rainRisk}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn(
                          "h-full rounded-full transition-colors",
                          weather.rainRisk < 30 ? "bg-green-400" :
                          weather.rainRisk < 60 ? "bg-yellow-400" :
                          "bg-red-400"
                        )}
                      />
                    </div>
                  </div>

                  <p className="text-white/90 text-sm font-semibold">
                    {getRiskMessage(weather.rainRisk).subtitle}
                  </p>
                </div>
                <suitabilityConfig.icon className="w-16 h-16 opacity-80 ml-4" />
              </div>
            </motion.div>

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
                    <span className="text-xs font-bold uppercase">Wind</span>
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
                    <h3 className="text-2xl font-bold mb-2">🔥 This Is Fine 🔥</h3>
                    <p className="text-red-100 mb-3">
                      Bhai {weather.rainRisk}% rain risk hai aur insurance nahi liya? Match 100% cancel hone wala hai!
                      Ticket ka paisa dubne wala hai! 😱
                    </p>
                    <div className="bg-white/20 rounded-lg p-3 text-sm">
                      <p className="font-bold">⚠️ WARNING:</p>
                      <p className="text-red-50">
                        You&apos;re about to lose ₹{ticketValue.toLocaleString()} with {weather.rainRisk}% certainty.
                        Insurance le lo abhi! Premium sirf ₹{premium.toLocaleString()} hai!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <Card className="border-2 border-purple-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <Shield className="w-7 h-7" />
                  🛡️ Barish Ka Insurance
                </h2>
                <p className="text-purple-100 text-sm">Ticket ka paisa dubne se bachao! 💸</p>
              </div>

              <CardContent className="p-6">
                {!hasPolicy ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">💎 Apna Plan Chuno Bhai</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {INSURANCE_TIERS.map(tier => (
                          <motion.button
                            key={tier.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedTier(tier)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              selectedTier.id === tier.id
                                ? "border-purple-500 bg-purple-50 shadow-lg"
                                : "border-gray-200 hover:border-purple-300"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900">{tier.name}</h3>
                              {selectedTier.id === tier.id && <CheckCircle className="w-5 h-5 text-purple-500" />}
                            </div>
                            <ul className="space-y-1">
                              {tier.features.map((feature, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-3">
                        <label className="text-sm font-bold text-gray-700">🎫 Ticket Ka Value (Kitna Udana Hai?)</label>
                        <span className="text-2xl font-bold text-purple-600">₹{ticketValue.toLocaleString()}</span>
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

                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border-2 border-purple-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-gray-700">⚠️ Risk Ka Meter</span>
                        <Badge variant={weather.rainRisk > 50 ? "destructive" : "secondary"}>
                          {weather.rainRisk > 70 ? '🔥 Bohot Zyada' : weather.rainRisk > 35 ? '😐 Thoda Hai' : '😎 Kam Hai'} Risk
                        </Badge>
                      </div>

                      {/* Visual Premium Gauge */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>Low Premium</span>
                          <span>High Premium</span>
                        </div>
                        <div className="relative h-6 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ left: `${(premium / (ticketValue * 0.95)) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute top-0 bottom-0 w-1 -ml-0.5"
                          >
                            <div className="h-full w-1 bg-purple-600 shadow-lg" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg">
                              ₹{premium.toLocaleString()}
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-purple-200 pt-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">💵 Premium Dena Padega</div>
                          <div className="text-3xl font-bold text-purple-600">₹{premium.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Coverage</div>
                          <div className="text-lg font-bold text-gray-700">₹{ticketValue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-3 text-center">
                        🚀 Stonks Potential: {((ticketValue / premium - 1) * 100).toFixed(0)}% agar claim mila toh!
                      </div>
                    </div>

                    <Button
                      onClick={buyInsurance}
                      disabled={wallet < premium}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                    >
                      {wallet < premium ? (
                        <>
                          <AlertCircle className="w-5 h-5 mr-2" />
                          😭 Paisa Kam Pad Gaya Bhai
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          🛒 Le Lo Insurance - ₹{premium.toLocaleString()}
                        </>
                      )}
                    </Button>
                  </div>
                ) : policyDetails ? (
                  <motion.div
                    ref={policyConfirmationRef}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Done! Ab Tension Free!</h3>
                    <p className="text-gray-600 mb-1">Coverage: <span className="font-bold text-purple-600">₹{policyDetails.coverage.toLocaleString()}</span></p>
                    <p className="text-sm text-gray-500 mb-6">Plan: {policyDetails.tier.name}</p>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <p className="text-xs text-blue-600 mb-3 font-medium">Dekh lo kya hoga match mein... 🎲</p>
                      <Button
                        onClick={simulateMatch}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        ⚡ Match Simulate Karo
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Eye className="w-5 h-5 text-gray-700" />
                  🔮 Agle 12 Ghante Ka Haal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex overflow-x-auto gap-3 pb-4">
                  {weather.hourly.map((hour, i) => {
                    const time = new Date(hour.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const isRisky = hour.rainProb > 40;

                    return (
                      <motion.div
                        key={hour.time}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex-shrink-0 w-28 p-3 rounded-xl border-2 text-center relative overflow-hidden",
                          isRisky ? "border-blue-400 bg-gradient-to-b from-blue-50 to-blue-100" : "border-gray-200 bg-gradient-to-b from-white to-gray-50"
                        )}
                      >
                        {/* Gradient overlay based on rain probability */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"
                          style={{ opacity: hour.rainProb / 100 }}
                        />

                        <div className="relative z-10">
                          <div className="text-xs text-gray-600 font-semibold mb-2">{time}</div>
                          <div className="my-2">
                            {isRisky ? (
                              <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <CloudRain className="w-7 h-7 text-blue-600 mx-auto" />
                              </motion.div>
                            ) : (
                              <Cloud className="w-7 h-7 text-gray-400 mx-auto" />
                            )}
                          </div>
                          <div className="text-xl font-bold text-gray-900 mb-2">{hour.temp}°</div>

                          {/* Mini rain probability bar */}
                          <div className="mt-2">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${hour.rainProb}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className={cn(
                                  "h-full rounded-full",
                                  hour.rainProb < 30 ? "bg-green-400" :
                                  hour.rainProb < 60 ? "bg-yellow-400" :
                                  "bg-blue-500"
                                )}
                              />
                            </div>
                            <div className={cn("text-xs font-bold mt-1", isRisky ? "text-blue-700" : "text-gray-600")}>
                              {hour.rainProb}%
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetGame}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {policyDetails && matchResult === 'rained' ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CloudRain className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {policyDetails.tier.id === 'platinum' ? '💎 Ameer Ho Gaye Bhai!' : '☔ Match Cancel Ho Gaya!'}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {policyDetails.tier.id === 'platinum'
                      ? 'Platinum plan ka kamaal! 120% profit mil gaya! 🚀'
                      : policyDetails.tier.id === 'premium'
                      ? 'VIP treatment mil gayi! Paisa wapas aa gaya! 👑'
                      : 'Insurance FTW! Full refund mil gaya bhai! 🎉'
                    }
                  </p>
                  <p className="text-xs text-purple-600 italic mb-6">
                    &ldquo;{weather?.rainRisk && weather.rainRisk > 70 ? 'Weather baba ne sahi predict kiya tha! 🎯' : 'Lucky day tha tumhara! 🍀'}&rdquo;
                  </p>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg">
                    <div className="text-sm text-green-700 font-bold uppercase tracking-wide mb-2">
                      💰 {((policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage) - policyDetails.premium) > 3000 ? 'JACKPOT!' : 'Paisa Mil Gaya Bhai'}
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      ₹{(policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 mt-3 space-y-1">
                      <div>🚀 Pure Profit: ₹{((policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage) - policyDetails.premium).toLocaleString()}</div>
                      <div className="font-bold">
                        {((policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage) - policyDetails.premium) > 5000
                          ? '🔥 Ghar jaake party do!'
                          : ((policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage) - policyDetails.premium) > 2000
                          ? '📈 Acha khasa profit!'
                          : '✅ Small win but win is win!'}
                      </div>
                    </div>
                  </div>
                </>
              ) : policyDetails && matchResult === 'played' ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Sun className="w-10 h-10 text-amber-500" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {consecutiveLosses >= 2 ? '🤡 Phir Se Fail!' : '🌞 Match Khel Gaya!'}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {weather?.rainRisk && weather.rainRisk < 20
                      ? 'Itni kam risk mein bhi insurance le liya? Overthinking much? 😅'
                      : consecutiveLosses >= 2
                      ? 'Bhai strategy change karo, ye nahi chal raha! 🤦'
                      : 'Barish nahi aayi. Premium de diya tha woh gaya! 😅'
                    }
                  </p>
                  <p className="text-xs text-purple-600 italic mb-6">
                    &ldquo;{consecutiveLosses >= 2 ? 'Learn from mistakes bhai! 📚' : 'Better luck next time! 🍀'}&rdquo;
                  </p>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-6 shadow-lg">
                    <div className="text-sm text-amber-700 font-bold uppercase tracking-wide mb-2">
                      💸 {policyDetails.premium > 3000 ? 'Bada Nuksan Ho Gaya' : 'Premium De Diya Tha'}
                    </div>
                    <div className="text-4xl font-bold text-amber-600">
                      -₹{policyDetails.premium.toLocaleString()}
                    </div>
                    <div className="text-xs text-amber-600 mt-3 space-y-1">
                      <div>
                        {policyDetails.premium > 3000
                          ? '😭 Mere paise wapas do!'
                          : consecutiveLosses >= 2
                          ? '🤦 Strategy fail ho rahi hai'
                          : '😬 Agli baar soch samajh ke!'}
                      </div>
                      <div className="font-bold text-purple-600">
                        💡 Tip: {weather?.rainRisk && weather.rainRisk > 50 ? 'High risk mein insurance lene ka!' : 'Low risk skip karo!'}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <Button onClick={resetGame} className="w-full h-12 text-lg font-bold" variant="default">
                👍 Theek Hai, Band Karo
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Proof Ticker */}
      <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 border-y-2 border-purple-200 py-4 overflow-hidden">
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

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <p className="text-center text-xs text-gray-400">
          ⚠️ Disclaimer: Ye bas mazaak hai bhai. Asli paisa nahi hai, asli insurance bhi nahi. Weather data Open-Meteo se aa raha hai. Bas timepass ke liye! 🎮
        </p>
      </div>

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

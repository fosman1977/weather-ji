'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, CloudRain, CloudDrizzle, Sun, Umbrella, TrendingUp,
  Shield, Wallet, AlertCircle, CheckCircle, Zap, Trophy,
  ChevronDown, ThermometerSun, Droplets, Wind, Eye, ArrowRight,
  Sparkles, Target, Award, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  { id: 'basic', name: 'Basic Cover', multiplier: 1.0, features: ['100% refund if washed out', 'Same-day claim'], color: 'bg-blue-500' },
  { id: 'premium', name: 'Premium Shield', multiplier: 1.3, features: ['100% refund if washed out', 'Instant claim processing', '50% refund if delayed >2hrs'], color: 'bg-purple-500' },
  { id: 'platinum', name: 'Platinum Protection', multiplier: 1.6, features: ['120% refund if washed out', 'Priority instant claims', '75% refund if delayed >1hr', 'Free upgrade to next match'], color: 'bg-amber-500' },
];

export default function PitchCoverPage() {
  const [wallet, setWallet] = useState(25000);
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketValue, setTicketValue] = useState(2500);
  const [selectedTier, setSelectedTier] = useState<InsuranceTier>(INSURANCE_TIERS[0]);
  const [hasPolicy, setHasPolicy] = useState(false);
  const [policyDetails, setPolicyDetails] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [matchResult, setMatchResult] = useState<'rained' | 'played' | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);

  useEffect(() => {
    fetchWeather();
  }, [selectedStadium]);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedStadium.lat}&longitude=${selectedStadium.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=auto&forecast_days=2`;

      const res = await fetch(url);
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
        criticalHours.reduce((sum, h, i) => {
          const weight = 1 - (i * 0.1);
          return sum + (h.rainProb * weight);
        }, 0) / criticalHours.reduce((sum, _, i) => sum + (1 - i * 0.1), 0)
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
    } finally {
      setLoading(false);
    }
  };

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

  const buyInsurance = () => {
    if (wallet < premium) return;

    setWallet(w => w - premium);
    setHasPolicy(true);
    setPolicyDetails({
      tier: selectedTier,
      coverage: ticketValue,
      premium,
      stadium: selectedStadium,
      rainRisk: weather?.rainRisk,
      purchaseTime: new Date(),
    });

    if (!achievements.includes('first_policy')) {
      setAchievements(a => [...a, 'first_policy']);
    }

    if (ticketValue >= 10000 && !achievements.includes('high_roller')) {
      setAchievements(a => [...a, 'high_roller']);
    }
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

      setWallet(w => w + payout);
      setMatchResult('rained');
      setTotalProfitLoss(p => p + (payout - policyDetails.premium));

      if (payout >= 10000 && !achievements.includes('big_claim')) {
        setAchievements(a => [...a, 'big_claim']);
      }
    } else {
      setMatchResult('played');
      setTotalProfitLoss(p => p - policyDetails.premium);
    }

    setShowResult(true);

    if (weather.rainRisk < 20 && !achievements.includes('risk_taker')) {
      setAchievements(a => [...a, 'risk_taker']);
    }

    setTimeout(() => {
      setHasPolicy(false);
      setPolicyDetails(null);
    }, 500);
  };

  const getSuitabilityConfig = (suitability: WeatherData['matchSuitability']) => {
    const configs = {
      excellent: { color: 'bg-green-500', text: 'Perfect Conditions', icon: Sun, textColor: 'text-green-700' },
      good: { color: 'bg-blue-500', text: 'Good Conditions', icon: Cloud, textColor: 'text-blue-700' },
      risky: { color: 'bg-amber-500', text: 'Risky Conditions', icon: CloudDrizzle, textColor: 'text-amber-700' },
      poor: { color: 'bg-red-500', text: 'Washout Risk', icon: CloudRain, textColor: 'text-red-700' },
    };
    return configs[suitability];
  };

  const resetGame = () => {
    setShowResult(false);
    setMatchResult(null);
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Analyzing weather patterns...</p>
        </div>
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
                <Umbrella className="w-8 h-8" />
                Pitch Cover Pro
              </h1>
              <p className="text-green-100 text-sm mt-1">Smart Cricket Weather Insurance</p>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-black/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20"
            >
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-yellow-300" />
                <span className="text-xs text-green-100">Balance</span>
              </div>
              <div className="font-mono font-bold text-2xl text-yellow-300">
                ₹{wallet.toLocaleString()}
              </div>
              {totalProfitLoss !== 0 && (
                <div className={cn("text-xs font-medium mt-1", totalProfitLoss > 0 ? "text-green-300" : "text-red-300")}>
                  {totalProfitLoss > 0 ? '+' : ''}₹{totalProfitLoss.toLocaleString()}
                </div>
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
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Stadium</label>
            <Select value={selectedStadium.id} onValueChange={(id) => setSelectedStadium(STADIUMS.find(s => s.id === id)!)}>
              <SelectTrigger className="w-full text-lg font-semibold h-14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Target className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <div className="text-xs text-gray-500">Capacity</div>
                <div className="text-sm font-bold">{(selectedStadium.capacity / 1000).toFixed(0)}K</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Droplets className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
                <div className="text-xs text-gray-500">Drainage</div>
                <div className="text-sm font-bold capitalize">{selectedStadium.drainage}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Shield className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                <div className="text-xs text-gray-500">Covered</div>
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
              className={cn("rounded-2xl p-6 text-white shadow-xl", suitabilityConfig.color)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{suitabilityConfig.text}</h2>
                  <p className="text-white/80">Rain Risk: {weather.rainRisk}%</p>
                </div>
                <suitabilityConfig.icon className="w-16 h-16 opacity-80" />
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

            <Card className="border-2 border-purple-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <Shield className="w-7 h-7" />
                  Weather Insurance
                </h2>
                <p className="text-purple-100 text-sm">Protect your match-day investment</p>
              </div>

              <CardContent className="p-6">
                {!hasPolicy ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Coverage Tier</label>
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
                        <label className="text-sm font-bold text-gray-700">Ticket Value to Cover</label>
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
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Risk Assessment</span>
                        <Badge variant={weather.rainRisk > 50 ? "destructive" : "secondary"}>
                          {weather.rainRisk > 70 ? 'High' : weather.rainRisk > 35 ? 'Medium' : 'Low'} Risk
                        </Badge>
                      </div>
                      <div className="flex justify-between items-end border-t border-purple-200 pt-3">
                        <span className="text-gray-700 font-medium">Premium Cost</span>
                        <span className="text-3xl font-bold text-purple-600">₹{premium.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        ROI Potential: {((ticketValue / premium - 1) * 100).toFixed(0)}% if claimed
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
                          Insufficient Funds
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Purchase Coverage - ₹{premium.toLocaleString()}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
                    >
                      <Shield className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">You're Covered!</h3>
                    <p className="text-gray-600 mb-1">Coverage: <span className="font-bold text-purple-600">₹{policyDetails.coverage.toLocaleString()}</span></p>
                    <p className="text-sm text-gray-500 mb-6">Tier: {policyDetails.tier.name}</p>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <p className="text-xs text-blue-600 mb-3 font-medium">Test your luck or wait for match day...</p>
                      <Button
                        onClick={simulateMatch}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Simulate Match Result
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  12-Hour Forecast
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
                          "flex-shrink-0 w-24 p-3 rounded-xl border-2 text-center",
                          isRisky ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="text-xs text-gray-500 mb-2">{time}</div>
                        <div className="my-2">
                          {isRisky ? (
                            <CloudRain className="w-6 h-6 text-blue-500 mx-auto" />
                          ) : (
                            <Cloud className="w-6 h-6 text-gray-400 mx-auto" />
                          )}
                        </div>
                        <div className="text-lg font-bold text-gray-900">{hour.temp}°</div>
                        <div className={cn("text-xs font-bold mt-1", isRisky ? "text-blue-600" : "text-gray-500")}>
                          {hour.rainProb}%
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
              {matchResult === 'rained' ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CloudRain className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Match Washed Out!</h2>
                  <p className="text-gray-600 mb-6">Your insurance claim has been processed.</p>

                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                    <div className="text-sm text-green-700 font-bold uppercase tracking-wide mb-2">Payout Received</div>
                    <div className="text-4xl font-bold text-green-600">
                      ₹{(policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      Net Profit: ₹{((policyDetails.tier.id === 'platinum' ? Math.round(policyDetails.coverage * 1.2) : policyDetails.coverage) - policyDetails.premium).toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Sun className="w-10 h-10 text-amber-500" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Match Completed!</h2>
                  <p className="text-gray-600 mb-6">The weather stayed clear. No claim filed.</p>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                    <div className="text-sm text-amber-700 font-bold uppercase tracking-wide mb-2">Premium Paid</div>
                    <div className="text-4xl font-bold text-amber-600">
                      -₹{policyDetails.premium.toLocaleString()}
                    </div>
                    <div className="text-xs text-amber-600 mt-2">
                      Better luck next time!
                    </div>
                  </div>
                </>
              )}

              <Button onClick={resetGame} className="w-full h-12 text-lg font-bold" variant="default">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <p className="text-center text-xs text-gray-400">
          * Demo application with virtual currency. No real insurance or financial transactions. Weather data from Open-Meteo API.
        </p>
      </div>
    </div>
  );
}

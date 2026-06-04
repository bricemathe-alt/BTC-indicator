import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Coins,
  TrendingUp,
  Percent,
  Search,
  ExternalLink,
  ShieldCheck,
  Twitter,
  Clock,
  Gauge,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Award,
  BookOpen,
  UserCheck
} from "lucide-react";

// Technical weights out of 20
const WEIGHTS = {
  priceAction: 2.5,
  gapCme: 1.5,
  rsi: 2.5,
  funding: 2.0,
  orderbook: 2.0,
  fng: 1.5,
  bollingerBands: 2.5,
  openInterest: 2.5,
  movingAverages: 3.0
};

const TOTAL_WEIGHT = 20;

// Helper functions for scoring normalization (1 is most favorable for buying BTC)
function scoreRSI(rsi: number) {
  if (rsi <= 30) return 1 - (rsi / 30) * 0.15;            // 30 -> 0.85, 0 -> 1 (Oversold = strong buy opportunity)
  if (rsi <= 50) return 0.85 - ((rsi - 30) / 20) * 0.30;  // 30->0.85, 50->0.55
  if (rsi <= 70) return 0.55 - ((rsi - 50) / 20) * 0.40;  // 50->0.55, 70->0.15
  return Math.max(0, 0.15 - ((rsi - 70) / 30) * 0.15);    // 70->0.15, 100->0 (Overbought = risky)
}

function scoreFunding(f: number) {
  // Negative funding is contrarian bullish, highly positive represents dangerous long leverage excess
  const s = 0.6 - (f / 0.10) * 0.6;
  return Math.max(0, Math.min(1, s));
}

function scoreFng(v: number) {
  // Fear (low values) = classic buy opportunity, Greed (high values) = watch out
  return Math.max(0, Math.min(1, 0.95 - (v / 100) * 0.85));
}

export default function App() {
  // Toggle Mode State
  const [activeTab, setActiveTab] = useState<"auto" | "manual">("auto");

  // Indicator inputs state
  const [priceAction, setPriceAction] = useState<number>(0.5); // 0 to 1
  const [gapCme, setGapCme] = useState<number>(0.5); // 0 to 1
  const [rsi, setRsi] = useState<number>(50); // 0 to 100
  const [funding, setFunding] = useState<number>(0.01); // -0.15% to 0.15%
  const [orderbook, setOrderbook] = useState<number>(0.5); // 0 to 1
  const [fng, setFng] = useState<number>(50); // 0 to 100
  const [bollingerBands, setBollingerBands] = useState<number>(0.5); // 0 to 1
  const [openInterest, setOpenInterest] = useState<number>(0.5); // 0 to 1
  const [movingAverages, setMovingAverages] = useState<number>(0.5); // 0 to 1

  // AI Explanations and Citations from search
  const [aiExplanations, setAiExplanations] = useState<{
    priceAction?: string;
    gapCme?: string;
    rsi?: string;
    funding?: string;
    orderbook?: string;
    fng?: string;
    bollingerBands?: string;
    openInterest?: string;
    movingAverages?: string;
    technicalSynthesis?: string;
  } | null>(null);

  const [aiSources, setAiSources] = useState<{ title: string; url: string }[]>([]);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string | null>(null);

  // Flow status state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Simulated progress steps during deep live research
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "Interrogation de Coinglass - Récupération du Funding Rate de moins de 12h...",
      "Recherche en direct sur Twitter/X d'analyses de moins de 12h (cryptogoose & alan tradingYT)...",
      "Scan récent d'autres analystes d'autorité de confiance...",
      "Analyse de la structure de prix (Price Action) de Bitcoin...",
      "Vérification de l'ouverture du carnet d'ordres & Fear & Greed...",
      "Calcul des scores normalisés et fusion de synthèse..."
    ];
    let index = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      index++;
      if (index < steps.length) {
        setLoadingStep(steps[index]);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [loading]);

  // Execute Auto-Analysis Search Grounded Endpoint
  const triggerAutonomousAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Une erreur inconnue est survenue.");
      }

      const raw = resData.data;
      
      // Update values
      if (raw.priceAction) setPriceAction(Number(raw.priceAction.score ?? 0.5));
      if (raw.gapCme) setGapCme(Number(raw.gapCme.score ?? 0.5));
      if (raw.rsi) setRsi(Number(raw.rsi.value ?? 50));
      if (raw.funding) setFunding(Number(raw.funding.value ?? 0.01));
      if (raw.orderbook) setOrderbook(Number(raw.orderbook.score ?? 0.5));
      if (raw.fng) setFng(Number(raw.fng.value ?? 50));
      if (raw.bollingerBands) setBollingerBands(Number(raw.bollingerBands.score ?? 0.5));
      if (raw.openInterest) setOpenInterest(Number(raw.openInterest.score ?? 0.5));
      if (raw.movingAverages) setMovingAverages(Number(raw.movingAverages.score ?? 0.5));

      // Store explanations & sources
      setAiExplanations({
        priceAction: raw.priceAction?.explanation,
        gapCme: raw.gapCme?.explanation,
        rsi: raw.rsi?.explanation,
        funding: raw.funding?.explanation,
        orderbook: raw.orderbook?.explanation,
        fng: raw.fng?.explanation,
        bollingerBands: raw.bollingerBands?.explanation,
        openInterest: raw.openInterest?.explanation,
        movingAverages: raw.movingAverages?.explanation,
        technicalSynthesis: raw.technicalSynthesis
      });

      // Dedup sources
      const fetchedSources = resData.sources || [];
      const uniqSources = Array.from(new Set(fetchedSources.map((s: any) => s.url)))
        .map(url => fetchedSources.find((s: any) => s.url === url))
        .filter(Boolean) as { title: string; url: string }[];
      
      setAiSources(uniqSources);
      setLastAnalyzedTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de joindre le service d'analyse autonome.");
    } finally {
      setLoading(false);
    }
  };

  // Reset metrics manually
  const resetMetrics = () => {
    setPriceAction(0.5);
    setGapCme(0.5);
    setRsi(50);
    setFunding(0.01);
    setOrderbook(0.5);
    setFng(50);
    setBollingerBands(0.5);
    setOpenInterest(0.5);
    setMovingAverages(0.5);
    setAiExplanations(null);
    setAiSources([]);
    setLastAnalyzedTime(null);
    setError(null);
  };

  // Compute live local values
  const normalizedScores = {
    priceAction: priceAction,
    gapCme: gapCme,
    rsi: scoreRSI(rsi),
    funding: scoreFunding(funding),
    orderbook: orderbook,
    fng: scoreFng(fng),
    bollingerBands: bollingerBands,
    openInterest: openInterest,
    movingAverages: movingAverages
  };

  const contributions = {
    priceAction: normalizedScores.priceAction * WEIGHTS.priceAction,
    gapCme: normalizedScores.gapCme * WEIGHTS.gapCme,
    rsi: normalizedScores.rsi * WEIGHTS.rsi,
    funding: normalizedScores.funding * WEIGHTS.funding,
    orderbook: normalizedScores.orderbook * WEIGHTS.orderbook,
    fng: normalizedScores.fng * WEIGHTS.fng,
    bollingerBands: normalizedScores.bollingerBands * WEIGHTS.bollingerBands,
    openInterest: normalizedScores.openInterest * WEIGHTS.openInterest,
    movingAverages: normalizedScores.movingAverages * WEIGHTS.movingAverages
  };

  const finalGrade = Object.values(contributions).reduce((a, b) => a + b, 0); // sur 20
  const finalRatio = finalGrade / TOTAL_WEIGHT;

  // Confidence rating logic based on dispersion + signal power
  const getConfidenceLevel = () => {
    const vals = Object.values(normalizedScores);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const mad = vals.reduce((a, b) => a + Math.abs(b - mean), 0) / vals.length;
    const consensus = 1 - Math.min(1, mad / 0.4);
    const strength = Math.min(1, Math.abs(finalRatio - 0.5) / 0.5);
    const score = 0.55 * consensus + 0.45 * strength;
    return Math.round(Math.max(35, Math.min(98, score * 100)));
  };

  const confidencePct = getConfidenceLevel();

  // Verdict config
  const getVerdictDetails = (note: number) => {
    if (note >= 16) {
      return { txt: "ACHAT FORT (STRONG BUY)", desc: "Les indicateurs de levier et de sentiment s'alignent avec une structure de prix haussière saine de moins de 12 heures.", emoji: "🚀", colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    }
    if (note >= 12) {
      return { txt: "ACHAT MODÉRÉ (BUY)", desc: "Les forces acheteuses prédominent, l'environnement global reste favorable.", emoji: "✅", colorClass: "text-teal-400 bg-teal-500/10 border-teal-500/30" };
    }
    if (note >= 8) {
      return { txt: "NEUTRE / ATTENTE (HOLD)", desc: "Structure mitigée. Rebond indécis ou range latéral persistant.", emoji: "⏸️", colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    }
    if (note >= 4) {
      return { txt: "PLUTÔT NE PAS ACHETER (SELL)", desc: "Excès d'optimisme déraisonnable (funding lourd, suracheté ou structure fracturée).", emoji: "⚠️", colorClass: "text-orangelight bg-orange-500/10 border-orange-500/30" };
    }
    return { txt: "ÉVITER / NE PAS ACHETER (STRONG SELL)", desc: "Sur-endettement du marché détecté, distribution en cours ou gap CME béant sous le cours.", emoji: "🛑", colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  const verdict = getVerdictDetails(finalGrade);

  // SVG Gauge Calculations
  const arcRadius = 70;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const strokeDashoffset = arcCircumference * (1 - finalRatio);

  return (
    <div id="app-root" className="min-h-screen bg-[#080b11] text-[#e2e8f0] py-8 px-4 font-sans selection:bg-amber-500 selection:text-black">
      {/* Background visual glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/10 w-80 h-80 bg-teal-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header section */}
        <header id="app-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/10 flex items-center justify-center">
              <span className="text-2xl font-black text-black">₿</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-display">
                Analyseur Bitcoin Autonome
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Recherche automatique sur Coinglass, Twitter/X (moins de 12h) &amp; Analyse Technique.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("auto")}
              className={`px-4 py-2 text-xs md:text-sm rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "auto"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyse Auto (IA live)</span>
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 text-xs md:text-sm rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "manual"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Ajuster à la main</span>
            </button>
          </div>
        </header>

        {/* Global info summary card */}
        <div id="notice-pane" className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm text-slate-300">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <span>
                Cet outil compile <b>9 indicateurs clés</b> pondérés sur un total de <b>20 points</b>.
              </span>
              {activeTab === "auto" && (
                <p className="text-amber-500/90 mt-1">
                  💡 Mode IA activé : Lancez la recherche pour extraire l&apos;état exact du marché en temps réel et pré-remplir les scores !
                </p>
              )}
            </div>
          </div>
          {lastAnalyzedTime && (
            <div className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/50 flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-mono text-[11px] text-teal-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Mis à jour : {lastAnalyzedTime}</span>
            </div>
          )}
        </div>

        {/* Setup Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: Inputs / Parameter settings */}
          <div className="lg:col-span-7 space-y-6">
            
            {activeTab === "auto" && (
              <div className="bg-gradient-to-b from-[#111726] to-[#0d121e] border border-[#232f4b] p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Rapport de Recherche Autonome</span>
                  </h2>
                  <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 font-mono uppercase font-bold tracking-wider">
                    Live Web
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Notre robot de recherche va chercher en temps réel les données de <b className="text-white">Coinglass</b>, les récentes structures de prix, et scanne les publications Twitter/X de moins de <b>12 heures</b> de traders de référence (<b className="text-white">cryptogoose</b>, <b className="text-white">alan tradingYT</b>, etc.). En cas d&apos;abscence d&apos;information, des sources tierces (CryptoQuant, TradingView) sont synthétisées.
                </p>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Échec de l&apos;analyse automatique</span>
                    </div>
                    <p className="opacity-90">{error}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Vous pouvez basculer sur l&apos;onglet &quot;Ajuster à la main&quot; pour remplir les données manuellement.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    disabled={loading}
                    onClick={triggerAutonomousAnalysis}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl shadow-amber-500/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Search className="w-4 h-4 text-black" />
                    )}
                    <span>{loading ? "Recherche en cours..." : "Rechercher et Analyser Autonome"}</span>
                  </button>
                </div>

                {loading && (
                  <div className="border border-slate-800/80 bg-slate-950/80 p-4 rounded-xl space-y-2.5 animate-pulse">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Évaluation IA active
                      </span>
                      <span className="text-slate-500">Fil d&apos;activité</span>
                    </div>
                    <p className="text-slate-300 text-xs font-mono">
                      &gt; {loadingStep}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Slider cards for actual indicators values */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-300">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Détail et configuration des Indicateurs</span>
                </h3>
                {activeTab === "manual" && (
                  <button
                    onClick={resetMetrics}
                    className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 font-medium transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
                  </button>
                )}
              </div>

              {/* Indicator Item: Price Action */}
              <div className="space-y-2" id="input-priceAction">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <label className="text-sm font-semibold text-white">Price Action (Tendance)</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×4</span>
                </div>
                <p className="text-[11px] text-slate-400">Structure de prix sur graphes 4H/Daily (HH/HL vs. LH/LL).</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {activeTab === "manual" ? (
                    <div className="md:col-span-12">
                      <select
                        value={priceAction}
                        onChange={(e) => setPriceAction(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                      >
                        <option value="1">Haussier très fort (Sommets/Creux de plus en plus hauts) [1.0]</option>
                        <option value="0.75">Modérément haussier [0.75]</option>
                        <option value="0.5">Neutre / Range ennuyeux [0.5]</option>
                        <option value="0.25">Modérément baissier [0.25]</option>
                        <option value="0">Baissier très fort (Sommets/Creux de plus en plus bas) [0.0]</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Score détecté par l&apos;IA :</span>
                        <span className="font-bold text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded font-mono">{priceAction} / 1</span>
                      </div>
                      {aiExplanations?.priceAction && (
                        <p className="text-slate-300 mt-2 text-[11px] leading-relaxed italic border-l-2 border-amber-500/60 pl-2">
                          {aiExplanations.priceAction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator Item: CME Gap */}
              <div className="space-y-2" id="input-gapCme">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <label className="text-sm font-semibold text-white">Gap CME</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×3</span>
                </div>
                <p className="text-[11px] text-slate-400">Écarts de cotation sur les futures CME (aspiration potentielle).</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {activeTab === "manual" ? (
                    <div className="md:col-span-12">
                      <select
                        value={gapCme}
                        onChange={(e) => setGapCme(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                      >
                        <option value="1">Gap ouvert au-dessus (Cible magnétique haussière) [1.0]</option>
                        <option value="0.65">Pas de gap majeur remarquable [0.65]</option>
                        <option value="0.5">Gap déjà comblé récemment [0.5]</option>
                        <option value="0.15">Petit gap ouvert tout juste en dessous (Risque repli léger) [0.15]</option>
                        <option value="0">Gros gap CME béant sous le cours actuel (Aspiration baissière) [0.0]</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Score détecté par l&apos;IA :</span>
                        <span className="font-bold text-slate-300 px-2 py-0.5 bg-slate-800 rounded font-mono">{gapCme} / 1</span>
                      </div>
                      {aiExplanations?.gapCme && (
                        <p className="text-slate-300 mt-2 text-[11px] leading-relaxed italic border-l-2 border-slate-500 pl-2">
                          {aiExplanations.gapCme}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator Item: RSI */}
              <div className="space-y-2" id="input-rsi">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400" />
                    <label className="text-sm font-semibold text-white">RSI (Relative Strength Index)</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×4</span>
                </div>
                <p className="text-[11px] text-slate-400">Indicateur de momentum. Seuil bas (survendu, opportunité) vs. Seuil haut (suracheté, risque).</p>
                
                {activeTab === "manual" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-mono text-slate-500">0</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rsi}
                        onChange={(e) => setRsi(parseInt(e.target.value))}
                        className="flex-grow accent-amber-500 h-1 bg-slate-800 rounded"
                      />
                      <span className="font-mono text-slate-500">100</span>
                      <span className="w-12 text-center font-bold font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        {rsi}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Valeur identifiée :</span>
                      <span className="font-bold text-teal-400 px-2 py-0.5 bg-teal-500/10 rounded font-mono">RSI : {rsi}</span>
                    </div>
                    {aiExplanations?.rsi && (
                      <p className="text-slate-300 text-[11px] leading-relaxed italic border-l-2 border-teal-500 pl-2">
                        {aiExplanations.rsi}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Indicator Item: Funding Rate */}
              <div className="space-y-2" id="input-funding">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-400" />
                    <label className="text-sm font-semibold text-white">Funding Rate (%)</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×3</span>
                </div>
                <p className="text-[11px] text-slate-400">Frais payés par les positions de levier perpétuel Coinglass. Idéalement bas/négatif pour l&apos;achat.</p>
                
                {activeTab === "manual" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-mono text-slate-550">-0.15%</span>
                      <input
                        type="range"
                        min="-0.15"
                        max="0.15"
                        step="0.005"
                        value={funding}
                        onChange={(e) => setFunding(parseFloat(e.target.value))}
                        className="flex-grow accent-amber-500 h-1 bg-slate-800 rounded"
                      />
                      <span className="font-mono text-slate-550">+0.15%</span>
                      <span className="w-20 text-center font-bold font-mono text-amber-550 bg-amber-500/10 px-2 py-1 rounded">
                        {funding.toFixed(3)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Taux identifié :</span>
                      <span className="font-bold text-violet-400 px-2 py-0.5 bg-violet-500/10 rounded font-mono">{funding.toFixed(3)}%</span>
                    </div>
                    {aiExplanations?.funding && (
                      <p className="text-slate-300 text-[11px] leading-relaxed italic border-l-2 border-violet-500 pl-2">
                        {aiExplanations.funding}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Indicator Item: Orderbook */}
              <div className="space-y-2" id="input-orderbook">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <label className="text-sm font-semibold text-white">Orderbook Dominance</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×3</span>
                </div>
                <p className="text-[11px] text-slate-400">Rapport de force d&apos;achat (bids) vs de vente (asks) limités sur Coinglass.</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {activeTab === "manual" ? (
                    <div className="md:col-span-12">
                      <select
                        value={orderbook}
                        onChange={(e) => setOrderbook(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                      >
                        <option value="1">Murs imposants d&apos;ordres d&apos;achat / Bids massifs [1.0]</option>
                        <option value="0.75">Léger avantage acheteur [0.75]</option>
                        <option value="0.5">Parfaitement équilibré [0.5]</option>
                        <option value="0.25">Léger avantage aux vendeurs (murs asks) [0.25]</option>
                        <option value="0">Murs imposants d&apos;ordres de vente / Asks massifs [0.0]</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Structure identifiée :</span>
                        <span className="font-bold text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded font-mono">{orderbook} / 1</span>
                      </div>
                      {aiExplanations?.orderbook && (
                        <p className="text-slate-300 mt-2 text-[11px] leading-relaxed italic border-l-2 border-cyan-500 pl-2">
                          {aiExplanations.orderbook}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator Item: Fear & Greed */}
              <div className="space-y-2" id="input-fng">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-450" />
                    <label className="text-sm font-semibold text-white">Fear &amp; Greed Index</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×1.5</span>
                </div>
                <p className="text-[11px] text-slate-400">Sentiment extrême des émotions sociales : &lt;20 Peur extrême (Achat), &gt;80 Cupidité (Vente).</p>
                
                {activeTab === "manual" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-mono text-slate-500">0</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={fng}
                        onChange={(e) => setFng(parseInt(e.target.value))}
                        className="flex-grow accent-amber-500 h-1 bg-slate-800 rounded"
                      />
                      <span className="font-mono text-slate-500">100</span>
                      <span className="w-12 text-center font-bold font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        {fng}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Index identifié :</span>
                      <span className="font-bold text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded font-mono">Index : {fng}</span>
                    </div>
                    {aiExplanations?.fng && (
                      <p className="text-slate-300 text-[11px] leading-relaxed italic border-l-2 border-rose-500 pl-2">
                        {aiExplanations.fng}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Indicator Item: Bollinger Bands */}
              <div className="space-y-2" id="input-bollingerBands">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <label className="text-sm font-semibold text-white">Bandes de Bollinger</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×2.5</span>
                </div>
                <p className="text-[11px] text-slate-400">Position du cours sur les bandes de volatilité (Squeeze, rebond ou breakout).</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {activeTab === "manual" ? (
                    <div className="md:col-span-12">
                      <select
                        value={bollingerBands}
                        onChange={(e) => setBollingerBands(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                      >
                        <option value="1">Rebond haussier bande milieu / Breakout haussier de squeeze fort [1.0]</option>
                        <option value="0.75">Rebond haussier validé sur bande inférieure [0.75]</option>
                        <option value="0.5">Position intermédiaire neutre / Indécision [0.5]</option>
                        <option value="0.25">Heurte la bande supérieure sans breakout (risque de correction) [0.25]</option>
                        <option value="0">Cassure baissière de la bande basse ou rejet violent bande haute [0.0]</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Structure identifiée (Bandes) :</span>
                        <span className="font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded font-mono">{bollingerBands} / 1</span>
                      </div>
                      {aiExplanations?.bollingerBands && (
                        <p className="text-slate-300 mt-2 text-[11px] leading-relaxed italic border-l-2 border-emerald-500 pl-2">
                          {aiExplanations.bollingerBands}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator Item: Open Interest */}
              <div className="space-y-2" id="input-openInterest">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <label className="text-sm font-semibold text-white">Open Interest &amp; Liquidation (Coinglass)</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×2.5</span>
                </div>
                <p className="text-[11px] text-slate-400">Volume total d&apos;intérêt ouvert et mur de liquidations. Idéal si OI en baisse ou short squeeze imminent.</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {activeTab === "manual" ? (
                    <div className="md:col-span-12">
                      <select
                        value={openInterest}
                        onChange={(e) => setOpenInterest(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                      >
                        <option value="1">Combustion de levier / Squeeze de Shorts imminent répertorié [1.0]</option>
                        <option value="0.75">OI stable ou en baisse, rachat spot sain [0.75]</option>
                        <option value="0.5">Énergie de levier neutre, pas de gros risque de cascade [0.5]</option>
                        <option value="0.25">Légère accumulation de longs fêtards (levier croissant) [0.25]</option>
                        <option value="0">OI surchauffé, mur massif de liquidations longs juste sous le cours [0.0]</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Position Coinglass OI :</span>
                        <span className="font-bold text-orange-400 px-2 py-0.5 bg-orange-500/10 rounded font-mono">{openInterest} / 1</span>
                      </div>
                      {aiExplanations?.openInterest && (
                        <p className="text-slate-300 mt-2 text-[11px] leading-relaxed italic border-l-2 border-orange-500 pl-2">
                          {aiExplanations.openInterest}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator Item: Moving Averages */}
              <div className="space-y-2" id="input-movingAverages">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-450" />
                    <label className="text-sm font-semibold text-white">Moyennes Mobiles (EMA/SMA)</label>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">Poids : ×3.0</span>
                </div>
                <p className="text-[11px] text-slate-400">Moyennes mobiles exponents (EMA 20/55) et simples (SMA 200) sur l&apos;échelle journalière.</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {activeTab === "manual" ? (
                    <div className="md:col-span-12">
                      <select
                        value={movingAverages}
                        onChange={(e) => setMovingAverages(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                      >
                        <option value="1">Structure haussière parfaite (Prix &gt; EMA20 &gt; EMA50 &gt; SMA200) [1.0]</option>
                        <option value="0.75">Rebond réussi sur SMA 200 Daily (Gros rebond de confirmation) [0.75]</option>
                        <option value="0.5">Prix oscillant au milieu des EMA sans direction forte [0.5]</option>
                        <option value="0.25">Fragilisation : sous l&apos;EMA 20, EMA 50 s&apos;aplatit [0.25]</option>
                        <option value="0">Tendance baissière active confirmée (Prix &lt; EMA &lt; SMA200, Death Cross) [0.0]</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Position MAs quotidienne :</span>
                        <span className="font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded font-mono">{movingAverages} / 1</span>
                      </div>
                      {aiExplanations?.movingAverages && (
                        <p className="text-slate-300 mt-2 text-[11px] leading-relaxed italic border-l-2 border-indigo-500 pl-2">
                          {aiExplanations.movingAverages}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT SIDE: Final Score calculations and summaries */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main recommendation verdict widget */}
            <div id="result-widget" className="bg-[#101422] border border-slate-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-500 animate-pulse" />
                Synthèse et recommandation BTC
              </h2>

              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                
                {/* SVG Semi-Circle/Full-Circle Gauge */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                    {/* Background track circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#1e293b"
                      strokeWidth="11"
                      fill="transparent"
                    />
                    {/* Active foreground indicator circle */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={arcCircumference}
                      initial={{ strokeDashoffset: arcCircumference }}
                      animate={{ strokeDashoffset: strokeDashoffset }}
                      transition={{ duration: 0.85, ease: "easeOut" }}
                    />
                  </svg>
                  
                  {/* Absolute numerical readout overlay */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-white tracking-tight font-display font-mono">
                      {finalGrade.toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-xs font-semibold uppercase">Sur 20</span>
                  </div>
                </div>

                {/* Verdict text representation */}
                <div className={`p-4 rounded-xl border w-full space-y-1 transition duration-300 ${verdict.colorClass}`}>
                  <span className="text-2xl block">{verdict.emoji}</span>
                  <div className="font-extrabold text-sm md:text-base tracking-wide font-display">
                    {verdict.txt}
                  </div>
                  <p className="text-[11px] text-slate-300 opacity-95">
                    {verdict.desc}
                  </p>
                </div>

              </div>

              {/* Confidence margin bar */}
              <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Confiance de la recommandation</span>
                  <span className="font-mono font-bold text-white text-sm">{confidencePct}%</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidencePct}%` }}
                    transition={{ duration: 0.7 }}
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                  />
                </div>
              </div>

              {/* Synthesis paragraph */}
              {aiExplanations?.technicalSynthesis && (
                <div className="mt-5 bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                  <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Synthèse Technique Globale (IA)
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed text-[11px] italic">
                    &quot;{aiExplanations.technicalSynthesis}&quot;
                  </p>
                </div>
              )}

            </div>

            {/* Score contribution details panel */}
            <div id="breakdown-widget" className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Contribution au score final (/20)
              </h3>
              
              <div className="space-y-4">
                
                {/* Price Action score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Price Action</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.priceAction.toFixed(2)} / {WEIGHTS.priceAction}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.priceAction) * 100}%` }}
                      className="bg-amber-500 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* CME Gap score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">CME Gap</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.gapCme.toFixed(2)} / {WEIGHTS.gapCme}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.gapCme) * 100}%` }}
                      className="bg-slate-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* RSI score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">RSI (Relative Strength Index)</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.rsi.toFixed(2)} / {WEIGHTS.rsi}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.rsi) * 100}%` }}
                      className="bg-teal-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Funding rate score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Funding Rate perpct</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.funding.toFixed(2)} / {WEIGHTS.funding}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.funding) * 100}%` }}
                      className="bg-violet-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Orderbook score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Dominance Carnet d&apos;ordres</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.orderbook.toFixed(2)} / {WEIGHTS.orderbook}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.orderbook) * 100}%` }}
                      className="bg-cyan-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Fear and Greed score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Fear &amp; Greed index</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.fng.toFixed(2)} / {WEIGHTS.fng}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.fng) * 100}%` }}
                      className="bg-[#ea3943] h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Bollinger Bands score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Bandes de Bollinger</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.bollingerBands.toFixed(2)} / {WEIGHTS.bollingerBands}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.bollingerBands) * 100}%` }}
                      className="bg-emerald-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Open Interest score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Open Interest / Liquidations</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.openInterest.toFixed(2)} / {WEIGHTS.openInterest}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.openInterest) * 100}%` }}
                      className="bg-orange-400 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Moving Averages score row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Moyennes Mobiles (EMA/SMA)</span>
                    <span className="font-mono font-semibold text-slate-400">{contributions.movingAverages.toFixed(2)} / {WEIGHTS.movingAverages}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(normalizedScores.movingAverages) * 100}%` }}
                      className="bg-indigo-400 h-full rounded-full"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Citations and Grounded links panel */}
            <AnimatePresence>
              {aiSources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0b101d] border border-teal-500/20 p-5 rounded-2xl space-y-4"
                >
                  <div className="flex items-center gap-2 text-teal-400">
                    <UserCheck className="w-5 h-5" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">
                      Sources &amp; Preuves de moins de 12h
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Les informations d&apos;analyse de marché, de coinglass et de tweets de cryptogoose / alan tradingYT ont été sourcées de manière transparente à partir des documents suivants :
                  </p>
                  
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {aiSources.map((source, index) => (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-1.5 p-2 bg-slate-950 border border-slate-900 rounded-lg group hover:border-teal-500/30 transition text-[11px]"
                      >
                        <div className="space-y-1">
                          <span className="text-slate-300 group-hover:text-amber-400 font-medium line-clamp-1">
                            {source.title}
                          </span>
                          <span className="text-slate-500 break-all block font-mono text-[10px] line-clamp-1">
                            {source.url}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

        {/* Footer info warnings */}
        <footer className="border-t border-slate-800/80 pt-6 text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Twitter className="w-3.5 h-3.5 text-amber-500" />
            <span>Flux de validation Twitter (cryptogoose, alan tradingYT) activé par Grounded Search Gemini</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed">
            Déni de responsabilité : Ces estimations synthétiques sont générées de manière autonome par une intelligence artificielle à des fins d&apos;assistance d&apos;analyse technique. Ceci ne représente aucunement un conseil financier. Les investissements dans la crypto-actifs comportent un niveau élevé de volatilité.
          </p>
        </footer>

      </div>
    </div>
  );
}

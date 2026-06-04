import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in your Secrets / Env settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Autonomous BTC market analysis proxy route
app.post("/api/analyze", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const currentTime = new Date().toISOString();

    const prompt = `Perform an autonomous analysis of the Bitcoin (BTC) market.
The current date and time is: ${currentTime}.
Conduct fresh searches on:
1. Coinglass indicators for BTC (Funding rates, Orderbook buy/sell depth, open interest trend, liquidation heatmaps, and Bollinger Bands position).
2. Recent posts/tweets on X (Twitter) from reputable traders (specifically looking for "cryptogoose", "alan tradingYT", or other well-known technical analysts like "Altcoin Sherpa" or "Pentoshi") posted in the LAST 12 HOURS.
3. Other specialized technical analysis hubs (e.g. TradingView technical signals, CoinMarketCap, CryptoQuant) if any indicator is missing.

Your objective is to recover specific metrics and formulate a consolidated synthesis for the following 8 indicator pillars:
- Price Action (HH/HL market structure, trend, major support/resistance levels) -> map to a score 0.0 (bearish) to 1.0 (bullish).
- CME Gap (any open gaps in CME futures) -> map to a score (1.0 if gap above current price as a bullish draw, 0.65 if no major open gap, 0.5 if filled recently, 0.15 if open gap just below, 0.0 if large open gap below).
- RSI (current Relative Strength Index value on daily or 4-hour charts, between 0 and 100).
- Funding Rate (exact real-time BTC weighted funding rate on major exchanges like Binance/Bybit, e.g. 0.012 or -0.005 percent).
- Orderbook (bid/ask volume walls depth, buyers vs sellers dominance) -> map to a score 0.0 (high ask wall/selling pressure) to 1.0 (high bid wall/buying pressure).
- Fear & Greed Index (current crowd sentiment value, 0 to 100).
- Bollinger Bands (position of price relative to the upper, middle, and lower bands on 4h/Daily chart, band squeeze width indicating if high volatility breakout is imminent) -> map to a score 0.0 (price rejecting off upper band, or breaking down lower band) to 1.0 (bouncing off middle band uptrend, or breaking out of narrow squeeze upwards).
- Open Interest & Liquidations (open interest trend on Coinglass, cluster liquidation levels, identifying squeeze opportunities or over-leverage flush risks) -> map to a score 0.0 (extreme leverage downside flush risk) to 1.0 (excellent short squeeze potential or clean accumulation).
- Moving Averages (status of short/medium/long term moving averages on daily, e.g., EMA 20, EMA 50, SMA 200, and golden/death cross setups) -> map to a score 0.0 (price trading below cross of major MAs) to 1.0 (bullish alignment above all key MAs).

Make sure all parameters are authentic and based on actual live data from your search results. If you cannot find a piece of info, look at alternative technical analysis sources from the last 12 hours. Do not invent any values.
For every indicator, describe your analytical findings, the exact sources where you extracted the numbers, and the reasoning behind your score.

Return your analysis strictly in French as a JSON object adhering to this exact schema:
{
  "priceAction": {
    "score": number (0 to 1),
    "explanation": "string describing trends, levels found, and trader tweets/opinions"
  },
  "gapCme": {
    "score": number (0 to 1),
    "explanation": "string describing open/closed CME gaps found and targets"
  },
  "rsi": {
    "value": number (0 to 100),
    "explanation": "string explaining current RSI values and levels"
  },
  "funding": {
    "value": number (exact percentage value, e.g. 0.015),
    "explanation": "string explaining funding rates and exchange leverage"
  },
  "orderbook": {
    "score": number (0 to 1),
    "explanation": "string explaining orderbook bid/ask ratios/walls"
  },
  "fng": {
    "value": number (0 to 100),
    "explanation": "string explaining crowd sentiment and F&G index"
  },
  "bollingerBands": {
    "score": number (0 to 1),
    "explanation": "string explaining Bollinger Bands squeeze, width, current band touch/rejections"
  },
  "openInterest": {
    "score": number (0 to 1),
    "explanation": "string explaining Open Interest trends on Coinglass and liquidation walls"
  },
  "movingAverages": {
    "score": number (0 to 1),
    "explanation": "string explaining EMA 20/50, SMA 200 levels and trend alignment"
  },
  "technicalSynthesis": "string representing a global summary of the Bitcoin technical market, indicating if we are in a buy zone or not",
  "recommendedAction": "BUY" | "STRONG_BUY" | "HOLD" | "SELL" | "STRONG_SELL"
}`;

    // Request content generation with Search Grounding
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priceAction: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["score", "explanation"]
            },
            gapCme: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["score", "explanation"]
            },
            rsi: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["value", "explanation"]
            },
            funding: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["value", "explanation"]
            },
            orderbook: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["score", "explanation"]
            },
            fng: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["value", "explanation"]
            },
            bollingerBands: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["score", "explanation"]
            },
            openInterest: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["score", "explanation"]
            },
            movingAverages: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["score", "explanation"]
            },
            technicalSynthesis: { type: Type.STRING },
            recommendedAction: { type: Type.STRING }
          },
          required: [
            "priceAction",
            "gapCme",
            "rsi",
            "funding",
            "orderbook",
            "fng",
            "bollingerBands",
            "openInterest",
            "movingAverages",
            "technicalSynthesis",
            "recommendedAction"
          ]
        },
        systemInstruction: "Tu es un terminal d'intelligence de marché de cryptomonnaies extrêmement rigoureux. Tu analyses en temps réel les données de Coinglass, de Twitter/X (recherche les analystes connus cryptogoose, alan tradingYT, altcoin sherpa de moins de 12h) et d'autres analyses de graphes de prix pour fournir des synthèses 100% réelles et sourcées. Rédige en français."
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");

    // Extract Grounding Chunks to provide user with real links/sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: { title: string; url: string }[] = [];
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Lien de Recherche",
            url: chunk.web.uri
          });
        }
      }
    }

    res.json({
      success: true,
      data: parsedData,
      sources: sources
    });

  } catch (error: any) {
    console.error("Analysis API failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de la recherche autonome de données."
    });
  }
});

// Setup development and production handlers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all SPA routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT} in env: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();

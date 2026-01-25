import logging
import random

logger = logging.getLogger(__name__)

def get_market_sentiment():
    """
    Fetches the current 'Market Mood' to influence financial simulations.
    In production, this queries financial news APIs and ticker feeds.
    """
    options = [
        {"mood": "BULLISH", "volatility_multiplier": 0.8, "trend_premium": 0.02, "msg": "Strong market sentiment, lowering anticipated volatility."},
        {"mood": "NEUTRAL", "volatility_multiplier": 1.0, "trend_premium": 0.0, "msg": "Stable market conditions observed."},
        {"mood": "BEARISH", "volatility_multiplier": 1.5, "trend_premium": -0.05, "msg": "Market downturn detected, increasing risk shock sensitivity."}
    ]
    
    # Mock selection based on random external factor
    sentiment = random.choice(options)
    logger.info(f"Market Sentiment Fetched: {sentiment['mood']}")
    return sentiment

def fetch_sector_benchmark(sector="Technology"):
    """
    Provides industry-specific growth benchmarks.
    """
    benchmarks = {
        "Technology": {"avg_margin": 0.25, "avg_growth": 0.12},
        "Finance": {"avg_margin": 0.35, "avg_growth": 0.05},
        "Energy": {"avg_margin": 0.15, "avg_growth": 0.08}
    }
    return benchmarks.get(sector, benchmarks["Technology"])

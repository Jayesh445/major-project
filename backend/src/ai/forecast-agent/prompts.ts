export const ANALYSIS_PROMPT = (historicalData: any[]) => `
You are a demand forecasting expert analyzing inventory data for supply chain optimization.

**Historical Daily Demand Data (last ${historicalData.length} days):**
${historicalData.map(d => `${d.date} (${d.dayOfWeek === 0 ? 'Sun' : d.dayOfWeek === 6 ? 'Sat' : 'Weekday'}): ${d.demand} units`).join('\n')}

**Task:** Analyze the data and identify patterns.

**IMPORTANT:** You must return ONLY valid JSON with no additional text or explanation. Do not wrap the JSON in markdown code blocks.

Return this exact JSON structure:
{
  "trend": "increasing" | "decreasing" | "stable",
  "seasonality": "Description of any weekly/monthly patterns",
  "averageDemand": number,
  "stdDeviation": number,
  "keyInsights": ["insight 1", "insight 2", ...]
}

Consider:
- Weekly patterns (weekday vs weekend)
- Recent trends (last 14 days vs earlier)
- Anomalies or spikes
- Consistency of demand
`;

export const FORECAST_PROMPT = (historicalData: any[], patterns: any) => `
You are a demand forecasting expert. Generate a 7-day demand forecast.

**Historical Summary:**
- Average daily demand: ${patterns.averageDemand} units
- Trend: ${patterns.trend}
- Seasonality: ${patterns.seasonality}
- Recent data points: ${historicalData.slice(-14).map(d => `${d.date}: ${d.demand}`).join(', ')}

**Task:** Generate 7-day forecast starting from tomorrow.

**IMPORTANT:** You must return ONLY valid JSON with no additional text or explanation. Do not wrap the JSON in markdown code blocks.

Return this exact JSON structure:
{
  "predictions": [
    {
      "date": "YYYY-MM-DD",
      "predictedDemand": number (round to nearest integer),
      "confidenceLow": number (95% lower bound),
      "confidenceHigh": number (95% upper bound)
    }
  ],
  "reasoning": "Brief explanation of forecast logic",
  "recommendedReorderQty": number,
  "recommendedOrderDate": "YYYY-MM-DD"
}

**Guidelines:**
- Confidence interval ≈ ±1.96 × stdDev (${patterns.stdDeviation})
- Consider day-of-week effects
- Account for observed trends
- Recommend reorder when forecast suggests stock < safety level
- Generate exactly 7 predictions, one for each day
`;

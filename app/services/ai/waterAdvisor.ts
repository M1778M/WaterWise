import { getTotalUsageByDate, getAverageDailyUsage, getAllUsage } from '../db/usage';
import { getAllBills, getTotalConsumption } from '../db/bills';
import { getCurrentWeather } from '../api/openMeteo';
import { getLocation } from '../location/geolocation';

export interface AdvisorRecommendation {
  type: 'usage' | 'savings' | 'regional' | 'bill';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: string;
  potentialSavings?: number;
}

const RECOMMENDED_DAILY_USAGE = 100; // liters per person per day

export async function getUserUsageAnalysis(): Promise<{
  todayUsage: number;
  avgDailyUsage: number;
  comparisonToRecommended: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}> {
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = await getTotalUsageByDate(today);
  const avgDailyUsage = await getAverageDailyUsage(30);
  const comparisonToRecommended = ((avgDailyUsage - RECOMMENDED_DAILY_USAGE) / RECOMMENDED_DAILY_USAGE) * 100;

  // Calculate trend
  const recentAvg = await getAverageDailyUsage(7);
  const olderAvg = await getAverageDailyUsage(30);
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (recentAvg > olderAvg * 1.1) {
    trend = 'increasing';
  } else if (recentAvg < olderAvg * 0.9) {
    trend = 'decreasing';
  }

  return {
    todayUsage,
    avgDailyUsage,
    comparisonToRecommended,
    trend
  };
}

export async function getBillsAnalysis(): Promise<{
  totalConsumption: number;
  averageCostPerLiter: number;
  billCount: number;
}> {
  const bills = await getAllBills();
  const totalConsumption = await getTotalConsumption();
  
  const totalCost = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const averageCostPerLiter = totalConsumption > 0 ? totalCost / totalConsumption : 0;

  return {
    totalConsumption,
    averageCostPerLiter,
    billCount: bills.length
  };
}

export async function getRegionalWaterContext(): Promise<{
  temperature: number;
  humidity: number;
  precipitation: number;
  recommendation: string;
}> {
  try {
    const location = await getLocation();
    const weather = await getCurrentWeather(location.lat, location.lon);

    let recommendation = '';
    
    if (weather.precipitation < 1 && weather.humidity < 40) {
      recommendation = 'Low rainfall and humidity detected. Consider reducing outdoor water usage.';
    } else if (weather.precipitation > 10) {
      recommendation = 'Good rainfall! Perfect time to collect rainwater for later use.';
    } else if (weather.temperature > 30) {
      recommendation = 'High temperatures increase water evaporation. Water plants early morning or late evening.';
    } else {
      recommendation = 'Weather conditions are normal. Maintain regular water conservation practices.';
    }

    return {
      temperature: weather.temperature,
      humidity: weather.humidity,
      precipitation: weather.precipitation,
      recommendation
    };
  } catch (error) {
    return {
      temperature: 0,
      humidity: 0,
      precipitation: 0,
      recommendation: 'Unable to fetch regional weather data.'
    };
  }
}

export async function generateRecommendations(): Promise<AdvisorRecommendation[]> {
  const recommendations: AdvisorRecommendation[] = [];

  try {
    const usageAnalysis = await getUserUsageAnalysis();
    const billsAnalysis = await getBillsAnalysis();
    const regionalContext = await getRegionalWaterContext();

    // Usage recommendations
    if (usageAnalysis.avgDailyUsage > RECOMMENDED_DAILY_USAGE) {
      const excessUsage = usageAnalysis.avgDailyUsage - RECOMMENDED_DAILY_USAGE;
      const potentialSavings = excessUsage * 30; // Monthly savings

      recommendations.push({
        type: 'usage',
        priority: 'high',
        title: 'Reduce Daily Water Usage',
        message: `Your average daily usage is ${usageAnalysis.avgDailyUsage.toFixed(1)}L, which is ${usageAnalysis.comparisonToRecommended.toFixed(0)}% above the recommended ${RECOMMENDED_DAILY_USAGE}L per day.`,
        actionable: 'Try reducing shower time by 2-3 minutes and fix any leaking faucets.',
        potentialSavings: potentialSavings
      });
    } else {
      recommendations.push({
        type: 'usage',
        priority: 'low',
        title: 'Excellent Water Conservation!',
        message: `Your daily average of ${usageAnalysis.avgDailyUsage.toFixed(1)}L is within recommended limits.`,
        actionable: 'Keep up the great work! Share your water-saving tips with others.'
      });
    }

    // Trend recommendations
    if (usageAnalysis.trend === 'increasing') {
      recommendations.push({
        type: 'usage',
        priority: 'medium',
        title: 'Usage Trend Alert',
        message: 'Your water usage has been increasing over the past week.',
        actionable: 'Review your recent activities and identify opportunities to reduce consumption.'
      });
    }

    // Regional recommendations
    if (regionalContext.precipitation < 1) {
      recommendations.push({
        type: 'regional',
        priority: 'high',
        title: 'Low Rainfall in Your Area',
        message: `Current precipitation: ${regionalContext.precipitation.toFixed(1)}mm. Your region is experiencing dry conditions.`,
        actionable: 'Limit outdoor watering to early morning only and consider rainwater harvesting for future use.'
      });
    }

    // Cost recommendations
    if (billsAnalysis.averageCostPerLiter > 0.01) {
      const monthlyPotentialSaving = billsAnalysis.averageCostPerLiter * 1000; // Save 1000L per month
      recommendations.push({
        type: 'bill',
        priority: 'medium',
        title: 'Reduce Water Costs',
        message: `Your average cost is $${billsAnalysis.averageCostPerLiter.toFixed(4)} per liter.`,
        actionable: `Reducing usage by 1000L monthly could save you $${monthlyPotentialSaving.toFixed(2)}.`,
        potentialSavings: monthlyPotentialSaving
      });
    }

  } catch (error) {
    console.error('Error generating recommendations:', error);
    recommendations.push({
      type: 'usage',
      priority: 'low',
      title: 'Start Tracking',
      message: 'Add your water usage and bills to get personalized recommendations.',
      actionable: 'Tap on "Add Usage" or "Water Bills" to start tracking your water consumption.'
    });
  }

  return recommendations;
}

export async function getQuickTip(): Promise<string> {
  const tips = [
    'A 5-minute shower uses about 50 liters of water. Try to keep it under 4 minutes!',
    'Fix leaky faucets! A dripping tap can waste up to 20 liters per day.',
    'Running your washing machine only when full can save 15,000 liters per year.',
    'Turn off the tap while brushing your teeth to save 6 liters per minute.',
    'Collect rainwater for watering plants instead of using tap water.',
    'Use a bucket instead of a hose to wash your car and save up to 300 liters.',
    'Install low-flow showerheads to reduce water usage by 40%.',
    'Water your garden early in the morning to reduce evaporation.',
  ];

  return tips[Math.floor(Math.random() * tips.length)];
}

import { getAllBills } from '../db/bills';
import { getAllUsage } from '../db/usage';

export interface UsagePattern {
  dayOfWeek: string;
  averageUsage: number;
  peakHours?: number[];
}

export interface MonthlyTrend {
  month: string;
  totalUsage: number;
  totalCost: number;
  averageDaily: number;
}

export interface WaterSavingsOpportunity {
  category: string;
  currentUsage: number;
  recommendedUsage: number;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export async function analyzeUsagePatterns(): Promise<UsagePattern[]> {
  try {
    const usage = await getAllUsage();
    const dayMap: { [key: number]: number[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    usage.forEach(u => {
      const date = new Date(u.date);
      const dayOfWeek = date.getDay();
      dayMap[dayOfWeek].push(u.liters);
    });

    const patterns: UsagePattern[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      if (dayMap[i].length > 0) {
        const avg = dayMap[i].reduce((sum, val) => sum + val, 0) / dayMap[i].length;
        patterns.push({
          dayOfWeek: dayNames[i],
          averageUsage: avg
        });
      }
    }

    return patterns;
  } catch (error) {
    console.error('Failed to analyze usage patterns:', error);
    return [];
  }
}

export async function calculateMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
  try {
    const [usage, bills] = await Promise.all([
      getAllUsage(),
      getAllBills()
    ]);

    const monthMap: { [key: string]: { usage: number; cost: number; days: Set<string> } } = {};

    usage.forEach(u => {
      const date = new Date(u.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { usage: 0, cost: 0, days: new Set() };
      }
      monthMap[monthKey].usage += u.liters;
      monthMap[monthKey].days.add(u.date);
    });

    bills.forEach(b => {
      const date = new Date(b.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { usage: 0, cost: 0, days: new Set() };
      }
      monthMap[monthKey].cost += b.amount;
    });

    const trends: MonthlyTrend[] = [];
    const sortedMonths = Object.keys(monthMap).sort().slice(-months);

    sortedMonths.forEach(monthKey => {
      const data = monthMap[monthKey];
      const daysInMonth = data.days.size || 1;
      
      trends.push({
        month: monthKey,
        totalUsage: data.usage,
        totalCost: data.cost,
        averageDaily: data.usage / daysInMonth
      });
    });

    return trends;
  } catch (error) {
    console.error('Failed to calculate monthly trends:', error);
    return [];
  }
}

export async function identifySavingsOpportunities(): Promise<WaterSavingsOpportunity[]> {
  try {
    const usage = await getAllUsage();
    const opportunities: WaterSavingsOpportunity[] = [];

    if (usage.length === 0) {
      return opportunities;
    }

    const totalUsage = usage.reduce((sum, u) => sum + u.liters, 0);
    const days = new Set(usage.map(u => u.date)).size;
    const dailyAvg = totalUsage / days;

    // Shower/bath usage (estimate)
    const showerUsage = dailyAvg * 0.35; // ~35% of daily usage
    if (showerUsage > 50) {
      opportunities.push({
        category: 'Shower & Bath',
        currentUsage: showerUsage,
        recommendedUsage: 40,
        potentialSavings: (showerUsage - 40) * 30,
        priority: 'high',
        description: 'Reduce shower time to 5 minutes or install low-flow showerheads'
      });
    }

    // Toilet usage (estimate)
    const toiletUsage = dailyAvg * 0.27; // ~27% of daily usage
    if (toiletUsage > 30) {
      opportunities.push({
        category: 'Toilet',
        currentUsage: toiletUsage,
        recommendedUsage: 24,
        potentialSavings: (toiletUsage - 24) * 30,
        priority: 'medium',
        description: 'Install dual-flush toilet system or check for leaks'
      });
    }

    // Kitchen & dishwashing
    const kitchenUsage = dailyAvg * 0.20; // ~20% of daily usage
    if (kitchenUsage > 20) {
      opportunities.push({
        category: 'Kitchen',
        currentUsage: kitchenUsage,
        recommendedUsage: 15,
        potentialSavings: (kitchenUsage - 15) * 30,
        priority: 'medium',
        description: 'Use dishwasher efficiently, don\'t pre-rinse dishes'
      });
    }

    // Overall high usage
    if (dailyAvg > 150) {
      opportunities.push({
        category: 'General',
        currentUsage: dailyAvg,
        recommendedUsage: 100,
        potentialSavings: (dailyAvg - 100) * 30,
        priority: 'high',
        description: 'Check for leaks and review all water-using activities'
      });
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    console.error('Failed to identify savings opportunities:', error);
    return [];
  }
}

export async function generateUsageReport(): Promise<{
  summary: {
    totalDays: number;
    totalUsage: number;
    averageDaily: number;
    totalCost: number;
  };
  patterns: UsagePattern[];
  trends: MonthlyTrend[];
  opportunities: WaterSavingsOpportunity[];
}> {
  try {
    const [usage, bills, patterns, trends, opportunities] = await Promise.all([
      getAllUsage(),
      getAllBills(),
      analyzeUsagePatterns(),
      calculateMonthlyTrends(),
      identifySavingsOpportunities()
    ]);

    const totalUsage = usage.reduce((sum, u) => sum + u.liters, 0);
    const totalCost = bills.reduce((sum, b) => sum + b.amount, 0);
    const totalDays = new Set(usage.map(u => u.date)).size;
    const averageDaily = totalDays > 0 ? totalUsage / totalDays : 0;

    return {
      summary: {
        totalDays,
        totalUsage,
        averageDaily,
        totalCost
      },
      patterns,
      trends,
      opportunities
    };
  } catch (error) {
    console.error('Failed to generate usage report:', error);
    throw error;
  }
}

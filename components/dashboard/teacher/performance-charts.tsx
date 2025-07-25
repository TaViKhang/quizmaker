import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useState, useEffect } from "react";

interface ClassPerformance {
  id: string;
  className: string;
  averageScore: number;
  studentCount: number;
  completionRate: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
}

interface PerformanceChartsProps {
  classPerformance: ClassPerformance[];
  categoryDistribution: CategoryDistribution[];
  fullWidth?: boolean;
}

export function PerformanceCharts({ 
  classPerformance, 
  categoryDistribution,
  fullWidth = false 
}: PerformanceChartsProps) {
  // Animation states
  const [animate, setAnimate] = useState(false);
  
  // Enhanced color palette with educational theme
  const COLORS = [
    '#4285F4', // Google Blue
    '#34A853', // Google Green
    '#FBBC05', // Google Yellow
    '#EA4335', // Google Red
    '#8667C9', // Purple
    '#35C7FB', // Light Blue
    '#FF8942', // Orange
    '#52CDAE', // Teal
  ];
  
  // Prepare category data for pie chart with "Other" grouping
  const preparedCategoryData = usePreparedCategoryData(categoryDistribution);
  
  // Start animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-xs">
          <p className="font-medium">{label}</p>
          <p>
            <span className="text-blue-500">Average Score: </span>
            {payload[0].value}%
          </p>
          <p>
            <span className="text-emerald-500">Students: </span>
            {payload[0].payload.studentCount}
          </p>
        </div>
      );
    }
    return null;
  };
  
  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-xs">
          <p className="font-medium">{payload[0].name}</p>
          <p>
            <span className="text-blue-500">Count: </span>
            {payload[0].value}
          </p>
          <p>
            <span className="text-emerald-500">Percentage: </span>
            {Math.round((payload[0].value / preparedCategoryData.reduce((sum, item) => sum + item.value, 0)) * 100)}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`grid gap-4 ${fullWidth ? "md:grid-cols-2" : ""}`}>
      {/* Class Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>Average scores across your classes</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classPerformance.sort((a, b) => b.averageScore - a.averageScore)}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="className" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="averageScore" 
                fill="url(#colorScore)" 
                radius={[4, 4, 0, 0]}
                animationDuration={2000}
                animationBegin={0}
                animationEasing="ease-out"
                isAnimationActive={animate}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quiz Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Categories</CardTitle>
          <CardDescription>Distribution of quiz types</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={preparedCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationDuration={2000}
                animationBegin={0}
                animationEasing="ease-out"
                isAnimationActive={animate}
                label={({ name, percent }) => 
                  percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {preparedCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieCustomTooltip />} />
              <Legend 
                formatter={(value) => <span className="text-sm font-medium">{value}</span>} 
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: 10 }}
              />
            </RePieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Helper function to prepare and optimize category data for visualization
 * Groups small categories into "Other" to improve chart readability
 */
function usePreparedCategoryData(categoryDistribution: CategoryDistribution[]) {
  // Define a threshold for grouping small categories (e.g., less than 5% of total)
  const THRESHOLD_PERCENT = 5;
  
  // Enhanced color palette with educational theme
  const COLORS = [
    '#4285F4', // Google Blue
    '#34A853', // Google Green
    '#FBBC05', // Google Yellow
    '#EA4335', // Google Red
    '#8667C9', // Purple
    '#35C7FB', // Light Blue 
    '#FF8942', // Orange
    '#52CDAE', // Teal
    '#9E9E9E'  // Grey (for "Other")
  ];

  if (!categoryDistribution || categoryDistribution.length === 0) {
    return [];
  }
  
  // Sort categories by count in descending order
  const sortedCategories = [...categoryDistribution].sort((a, b) => b.count - a.count);
  
  // Calculate total count for percentage calculations
  const totalCount = sortedCategories.reduce((sum, item) => sum + item.count, 0);
  
  // Initialize prepared data
  const mainCategories: any[] = [];
  let otherCategoryCount = 0;
  
  // Process each category
  sortedCategories.forEach((item, index) => {
    const percent = (item.count / totalCount) * 100;
    
    // If category is significant or one of the top 5, keep it separate
    if (percent >= THRESHOLD_PERCENT || index < 5) {
      mainCategories.push({
        name: item.category || "Uncategorized",
        value: item.count,
        color: COLORS[index % (COLORS.length - 1)] // Reserve last color for "Other"
      });
    } else {
      // Otherwise add to "Other" group
      otherCategoryCount += item.count;
    }
  });
  
  // Add "Other" category if there are small categories
  if (otherCategoryCount > 0) {
    mainCategories.push({
      name: "Other",
      value: otherCategoryCount,
      color: COLORS[COLORS.length - 1] // Use the last color for "Other"
    });
  }
  
  return mainCategories;
} 
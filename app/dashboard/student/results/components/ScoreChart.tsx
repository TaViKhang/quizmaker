"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps } from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { LineChart } from "lucide-react";

interface TimePointScoreData {
  date: string; // ISO YYYY-MM-DD
  averageScore: number;
  assessmentCount: number;
}

interface ScoreChartProps {
  timeSeriesData: TimePointScoreData[];
  timeFrame: string;
}

export default function ScoreChart({ timeSeriesData, timeFrame }: ScoreChartProps) {
  // Check if we have valid data to display
  const hasValidData = Array.isArray(timeSeriesData) && 
    timeSeriesData.length > 1 && 
    timeSeriesData.some(point => point.averageScore > 0);
  
  const formatDateLabel = (dateStr: string) => {
    try {
    const date = parseISO(dateStr);
      if (!isValid(date)) return dateStr;
    
    // Format based on timeframe
    if (timeFrame === 'last7days') {
      return format(date, 'EEE'); // Day name (Mon, Tue, etc.)
    } else if (timeFrame === 'last30days') {
        return format(date, 'dd MMM'); // 01 Jan
      } else if (timeFrame === 'last90days') {
      return format(date, 'dd MMM'); // 01 Jan
    } else {
      return format(date, 'MMM yy'); // Jan 23
      }
    } catch (e) {
      // If parsing fails, return the original string
      return dateStr;
    }
  };
  
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border rounded-md shadow-sm">
          <p className="font-medium">{formatDateLabel(label)}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            Score: {payload[0].value?.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Based on {payload[0].payload.assessmentCount} {payload[0].payload.assessmentCount === 1 ? 'assessment' : 'assessments'}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Progress</CardTitle>
        <CardDescription>
          Your average scores over time
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          {hasValidData ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={timeSeriesData}
                margin={{
                  top: 20,
                  right: 10,
                  left: 0,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tickCount={6}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Average Score"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <LineChart className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
              <p className="text-muted-foreground font-medium">Not enough data to display chart</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Complete more assessments to see your score progress over time
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
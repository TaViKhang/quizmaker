import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart2, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  PieChart 
} from "lucide-react";

interface StatsProps {
  overview: {
    activeClasses: number;
    totalStudents: number;
    activeQuizzes: number;
    completedQuizzes: number;
    engagementRate: number;
  };
}

export function StatsSection({ overview }: StatsProps) {
  // Define color schemes for different statistic types
  const statConfigs = [
    {
      title: "Active Classes",
      value: overview.activeClasses,
      description: "classes currently active",
      icon: <GraduationCap className="h-5 w-5" />,
      iconColor: "text-blue-500",
      badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      trend: "+2 this month",
    },
    {
      title: "Total Students",
      value: overview.totalStudents,
      description: "students enrolled",
      icon: <Users className="h-5 w-5" />,
      iconColor: "text-emerald-500",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      trend: "+5 this week",
    },
    {
      title: "Active Quizzes",
      value: overview.activeQuizzes,
      description: "quizzes open for students",
      icon: <BarChart2 className="h-5 w-5" />,
      iconColor: "text-violet-500",
      badgeColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
      trend: "+3 this month",
    },
    {
      title: "Engagement Rate",
      value: `${overview.engagementRate}%`,
      description: "student quiz participation",
      icon: <PieChart className="h-5 w-5" />,
      iconColor: "text-orange-500",
      badgeColor: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      trend: "+12% this month",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((stat, i) => (
        <Card key={i} className="overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${stat.badgeColor.split(' ')[0]}`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`rounded-full p-1 ${stat.iconColor.replace('text-', 'bg-')}/10`}>
              <div className={stat.iconColor}>
                {stat.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
            <Badge variant="outline" className={`mt-3 ${stat.badgeColor}`}>
              {stat.trend}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
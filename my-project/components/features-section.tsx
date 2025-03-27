import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Lock, Users, FileText, Settings, Globe2, Clock, Shield } from 'lucide-react'

export function FeaturesSection() {
  return (
    <section id="solutions" className="container mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 min-h-screen flex flex-col justify-center">
      <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
          Everything you need for online testing
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive features to create, deliver, and analyze tests securely
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl">{feature.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm md:text-base">{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

const features = [
  {
    title: "Test Creation",
    description: "Create professional tests with multiple question types, multimedia support, and customizable scoring",
    icon: FileText,
  },
  {
    title: "Secure Proctoring",
    description: "AI-powered proctoring with face detection, screen monitoring, and suspicious behavior alerts",
    icon: Shield,
  },
  {
    title: "Analytics Dashboard",
    description: "Comprehensive analytics and reporting tools to track performance and identify trends",
    icon: BarChart,
  },
  {
    title: "User Management",
    description: "Easily manage test-takers, proctors, and administrators with role-based access control",
    icon: Users,
  },
  {
    title: "Global Accessibility",
    description: "Available in multiple languages with 24/7 access from anywhere in the world",
    icon: Globe2,
  },
  {
    title: "Custom Workflows",
    description: "Flexible configuration options to match your specific testing requirements",
    icon: Settings,
  },
]


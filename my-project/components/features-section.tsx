import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Lock, Users, FileText, Settings, Globe2, Clock, Shield } from 'lucide-react'

export function FeaturesSection() {
  return (
    <section className="container py-24 space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need for online testing
        </h2>
        <p className="text-xl text-muted-foreground">
          Comprehensive features to create, deliver, and analyze tests securely
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{feature.description}</CardDescription>
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


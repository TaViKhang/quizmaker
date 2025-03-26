import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Globe, Clock } from 'lucide-react'

export function DashboardPreview() {
  return (
    <section 
      id="features" 
      className="py-12 md:py-16 min-h-screen flex flex-col justify-center bg-gray-50 dark:bg-gray-900"
    >
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Powerful Dashboard for All Your Testing Needs
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground">
            Manage tests, view analytics, and track student progress all in one place
          </p>
        </div>
        
        {/* Feature cards */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-blue-600 shrink-0" />
                <div>
                  <h3 className="font-semibold">Secure Testing</h3>
                  <p className="text-sm text-muted-foreground">Advanced proctoring & fraud prevention</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Globe className="h-6 w-6 md:h-8 md:w-8 text-blue-600 shrink-0" />
                <div>
                  <h3 className="font-semibold">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">Available in 100+ countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600 shrink-0" />
                <div>
                  <h3 className="font-semibold">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">Round-the-clock assistance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Dashboard image - no border or background */}
        <div className="relative rounded-lg overflow-hidden mx-auto max-w-6xl">
          <Image
            src="/./images/Homepage.png"
            width={1200}
            height={600}
            alt="TestPro Dashboard"
            priority
            className="relative rounded-lg shadow-2xl w-full h-auto"
          />
        </div>
      </div>
    </section>
  )
} 
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Globe, Clock } from 'lucide-react'
import Image from "next/image"

export function HeroSection() {

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-blue-50 opacity-70" />
      <div className="relative container px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Trusted by 2000+ Organizations Worldwide
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Secure Online Testing
            <span className="block text-blue-600">for Global Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[42rem]">
            TestPro helps thousands of organizations deliver secure, scalable online assessments. Get our all-in-one platform that simplifies test creation, delivery, and analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button size="lg" className="w-full sm:w-auto">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View pricing
            </Button>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-blue-600" />
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
                <Globe className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">Available in 100+ countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">Round-the-clock assistance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20">
          <div className="relative rounded-lg overflow-hidden border bg-background">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
            <Image
              src="/./images/Homepage.png"
              width={1200}
              height={600}
              alt="TestPro Dashboard"
              className="relative rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}


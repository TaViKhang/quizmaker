"use client"

import { useState, useEffect } from "react";
import { ThemeSwitcher, useTheme } from "@/components/ui/theme-provider"
import { getSafeTheme } from "@/lib/utils"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Book, 
  PaintBucket, 
  Palette, 
  Layout, 
  MoonStar, 
  SunMedium, 
  Laptop,
  Info
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ThemeSwitcherExamples() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    // Check if custom fonts are loaded properly
    document.fonts.ready.then(() => {
      setFontLoaded(true)
    })
  }, [])
  
  const safeTheme = getSafeTheme(theme, mounted)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-xl text-accent">EduAsses</Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/examples" className="text-sm font-medium text-foreground transition-colors">
                Examples
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher variant="navbar" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <div className="container py-8">
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient">
                Theme Switcher Examples
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Hệ thống giao diện EduAsses cung cấp nhiều biến thể của bộ chuyển đổi chủ đề, được thiết kế để tích hợp liền mạch vào các thành phần khác nhau của ứng dụng.
              </p>
              
              {/* Theme & Font Status */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Info className="h-4 w-4 text-info" />
                <span>
                  Current theme: <span className="font-medium">{safeTheme || 'Loading...'}</span> |
                  Fonts: <span className={fontLoaded ? "text-success font-medium" : "text-warning font-medium"}>
                    {fontLoaded ? 'Loaded' : 'Loading...'}
                  </span>
                </span>
              </div>
            </div>

            <Tabs defaultValue="variants" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="variants" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>Các biến thể</span>
                </TabsTrigger>
                <TabsTrigger value="demo" className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="usage" className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  <span>Cách sử dụng</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="variants" className="p-0">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Default variant */}
                  <Card className="overflow-hidden border-2 hover:border-accent/50 transition-all">
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <PaintBucket className="h-5 w-5 text-accent" />
                        Default (Dropdown)
                      </CardTitle>
                      <CardDescription>
                        A dropdown menu for selecting the theme
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                      <ThemeSwitcher variant="default" />
                    </CardContent>
                    <CardFooter className="bg-muted/30 text-sm text-muted-foreground">
                      Recommended for settings pages
                    </CardFooter>
                  </Card>

                  {/* Navbar variant */}
                  <Card className="overflow-hidden border-2 hover:border-accent/50 transition-all">
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <PaintBucket className="h-5 w-5 text-accent" />
                        Navbar
                      </CardTitle>
                      <CardDescription>
                        A simple toggle between light and dark mode
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                      <ThemeSwitcher variant="navbar" />
                    </CardContent>
                    <CardFooter className="bg-muted/30 text-sm text-muted-foreground">
                      Recommended for navigation bars
                    </CardFooter>
                  </Card>

                  {/* Minimal variant */}
                  <Card className="overflow-hidden border-2 hover:border-accent/50 transition-all">
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <PaintBucket className="h-5 w-5 text-accent" />
                        Minimal
                      </CardTitle>
                      <CardDescription>
                        A small icon that cycles through themes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                      <ThemeSwitcher variant="minimal" />
                    </CardContent>
                    <CardFooter className="bg-muted/30 text-sm text-muted-foreground">
                      Perfect for space-constrained interfaces
                    </CardFooter>
                  </Card>

                  {/* Buttons variant */}
                  <Card className="sm:col-span-2 lg:col-span-3 overflow-hidden border-2 hover:border-accent/50 transition-all">
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <PaintBucket className="h-5 w-5 text-accent" />
                        Buttons
                      </CardTitle>
                      <CardDescription>
                        A set of buttons for selecting the theme
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                      <ThemeSwitcher variant="buttons" />
                    </CardContent>
                    <CardFooter className="bg-muted/30 text-sm text-muted-foreground">
                      Ideal for theme preference settings
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="demo" className="p-0">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Theme Preview</CardTitle>
                    <CardDescription>
                      See how different elements look in the current theme
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {safeTheme && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold">Current Theme: {safeTheme.charAt(0).toUpperCase() + safeTheme.slice(1)}</h3>
                          <ThemeSwitcher variant="buttons" />
                        </div>
                        
                        <Separator />
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <h4 className="font-medium">Button Variants</h4>
                            <div className="flex flex-wrap gap-2">
                              <Button>Default</Button>
                              <Button variant="secondary">Secondary</Button>
                              <Button variant="outline">Outline</Button>
                              <Button variant="ghost">Ghost</Button>
                              <Button variant="destructive">Destructive</Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Theme Icons</h4>
                            <div className="flex gap-4 items-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="p-3 bg-muted rounded-md">
                                  <SunMedium className="h-6 w-6 text-yellow-500" />
                                </div>
                                <span className="text-sm">Light</span>
                              </div>
                              
                              <div className="flex flex-col items-center gap-1">
                                <div className="p-3 bg-muted rounded-md">
                                  <MoonStar className="h-6 w-6 text-blue-500" />
                                </div>
                                <span className="text-sm">Dark</span>
                              </div>
                              
                              <div className="flex flex-col items-center gap-1">
                                <div className="p-3 bg-muted rounded-md">
                                  <Laptop className="h-6 w-6 text-slate-500" />
                                </div>
                                <span className="text-sm">System</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Color Showcase</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-4 bg-primary text-primary-foreground rounded-md text-center">Primary</div>
                            <div className="p-4 bg-secondary text-secondary-foreground rounded-md text-center">Secondary</div>
                            <div className="p-4 bg-accent text-accent-foreground rounded-md text-center">Accent</div>
                            <div className="p-4 bg-muted text-muted-foreground rounded-md text-center">Muted</div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="usage" className="p-0">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Implementation Guide</CardTitle>
                    <CardDescription>
                      How to use the theme switcher in your components
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted rounded-md p-4 overflow-x-auto">
                      <pre className="text-sm">
                        <code className="language-tsx">{`// Import the ThemeSwitcher component
import { ThemeSwitcher } from "@/components/ui/theme-provider"

// Use different variants as needed
function MyHeader() {
  return (
    <header className="flex items-center justify-between">
      <Logo />
      <ThemeSwitcher variant="navbar" />
    </header>
  )
}

// For settings pages
function AppSettings() {
  return (
    <div className="space-y-4">
      <h2>Appearance</h2>
      <div className="flex items-center gap-4">
        <span>Theme:</span>
        <ThemeSwitcher variant="buttons" />
      </div>
    </div>
  )
}

// For using theme values in your component
function MyThemedComponent() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const safeTheme = getSafeTheme(theme, mounted)
  
  return (
    <div>
      {safeTheme && (
        <p>Current theme: {safeTheme}</p>
      )}
    </div>
  )
}`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end pt-6">
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard 
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 
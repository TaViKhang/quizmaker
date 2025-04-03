"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme/mode-toggle"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { UserIcon, MenuIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { UserNav } from "@/components/dashboard/user-nav"

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Safe access to theme
  const isDarkTheme = mounted ? theme === "dark" : false;
  
  // Track scroll position to determine header style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  // Function to handle section navigation without changing URL hash
  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
  };
  
  const headerBgClass = isScrolled 
    ? isDarkTheme 
      ? "bg-background/90 border-border shadow-sm" 
      : "bg-background/95 border-border shadow-sm"
    : isDarkTheme
      ? "bg-gray-900/90 border-gray-700/30" 
      : "bg-blue-950/80 border-blue-900/20 shadow-md";

  const textColorClass = isScrolled 
    ? "text-foreground" 
    : "text-white";
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-sm transition-all duration-300",
        headerBgClass
      )}
    >
      <div className="container flex h-16 items-center px-8 sm:px-10 md:px-16 lg:px-24">
        <div className="w-full grid grid-cols-3 items-center gap-4">
          {/* Part 1: Logo and brand */}
          <div className="flex justify-start">
            <Link 
              href="/"
              className="flex items-center space-x-2"
              onClick={scrollToSection('home')}
            >
              <span className={cn(
                "text-2xl font-bold tracking-tight transition-colors duration-200",
                textColorClass
              )}>
                TestPro
              </span>
            </Link>
          </div>

          {/* Part 2: Main menu */}
          <div className="flex justify-center">
            {/* Mobile menu */}
            <div className="flex md:hidden justify-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-9 w-9",
                      isScrolled ? "" : "text-white hover:bg-white/10"
                    )}
                  >
                    <MenuIcon className="h-5 w-5" />
                    <span className="sr-only">Open main menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 sm:w-80">
                  <div className="flex flex-col space-y-6 mt-8">
                    <div className="flex items-center mb-6">
                      <span className="text-xl font-bold">Menu</span>
                    </div>
                    <nav className="flex flex-col space-y-4">
                      <Link 
                        href="/"
                        className="flex items-center py-2 text-sm font-medium transition-colors"
                        onClick={(e) => {
                          scrollToSection('home')(e);
                        }}
                      >
                        Home
                      </Link>
                      <Link 
                        href="/"
                        className="flex items-center py-2 text-sm font-medium transition-colors"
                        onClick={(e) => {
                          scrollToSection('features')(e);
                        }}
                      >
                        Features
                      </Link>
                      <Link 
                        href="/"
                        className="flex items-center py-2 text-sm font-medium transition-colors"
                        onClick={(e) => {
                          scrollToSection('solutions')(e);
                        }}
                      >
                        Solutions
                      </Link>
                      <div className="border-t border-border my-2 pt-2">
                        <span className="text-sm font-medium mb-2 block">Platform</span>
                        <div className="ml-3 flex flex-col space-y-2 mt-1">
                          <Link href="/" className="text-sm">Online Testing Platform</Link>
                          <Link href="/test-creation" className="text-sm">Test Creation</Link>
                          <Link href="/proctoring" className="text-sm">Proctoring</Link>
                        </div>
                      </div>
                      <div className="border-t border-border my-2 pt-2">
                        <span className="text-sm font-medium mb-2 block">Industries</span>
                        <div className="ml-3 flex flex-col space-y-2 mt-1">
                          {solutions.map((solution) => (
                            <Link 
                              key={solution.title} 
                              href={solution.href} 
                              className="text-sm"
                            >
                              {solution.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <Link href="/pricing" className="flex items-center py-2 text-sm font-medium transition-colors">
                        Pricing
                      </Link>
                      
                      {isAuthenticated ? (
                        <Link href="/dashboard" className="flex items-center py-2 text-sm font-medium transition-colors">
                          Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link href="/auth/signin" className="flex items-center py-2 text-sm font-medium transition-colors">
                            Log in
                          </Link>
                          <Link href="/auth/signup" className="flex items-center py-2 text-sm font-medium transition-colors">
                            Sign up
                          </Link>
                        </>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop menu */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className={
                isScrolled ? "" : "text-white"
              }>
                {/* Section navigation links */}
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink 
                      onClick={scrollToSection('home')}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                        isScrolled 
                          ? "bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" 
                          : isDarkTheme 
                            ? "bg-transparent text-white hover:bg-gray-800/40 hover:text-white focus:bg-gray-800/40 focus:text-white data-[active]:bg-gray-800/40 data-[state=open]:bg-gray-800/40"
                            : "bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/10 data-[state=open]:bg-white/10"
                      )}
                    >
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink 
                      onClick={scrollToSection('features')}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                        isScrolled 
                          ? "bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" 
                          : isDarkTheme 
                            ? "bg-transparent text-white hover:bg-gray-800/40 hover:text-white focus:bg-gray-800/40 focus:text-white data-[active]:bg-gray-800/40 data-[state=open]:bg-gray-800/40"
                            : "bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/10 data-[state=open]:bg-white/10"
                      )}
                    >
                      Features
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink 
                      onClick={scrollToSection('solutions')}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                        isScrolled 
                          ? "bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" 
                          : isDarkTheme 
                            ? "bg-transparent text-white hover:bg-gray-800/40 hover:text-white focus:bg-gray-800/40 focus:text-white data-[active]:bg-gray-800/40 data-[state=open]:bg-gray-800/40"
                            : "bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/10 data-[state=open]:bg-white/10"
                      )}
                    >
                      Solutions
                    </NavigationMenuLink>
        </Link>
                </NavigationMenuItem>

                {/* Dropdown menus */}
            <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "transition-colors",
                    isScrolled 
                      ? "" 
                      : "bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/10 data-[state=open]:bg-white/10"
                  )}>
                    Platform
                  </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Online Testing Platform
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Secure, scalable testing solution for education and business
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a href="/test-creation" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Test Creation</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Create custom tests with multiple question types
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a href="/proctoring" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Proctoring</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Advanced proctoring features for secure testing
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "transition-colors",
                    isScrolled 
                      ? "" 
                      : "bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/10 data-[state=open]:bg-white/10"
                  )}>
                    Industries
                  </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {solutions.map((solution) => (
                    <li key={solution.title}>
                      <NavigationMenuLink asChild>
                        <a href={solution.href} className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">{solution.title}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {solution.description}
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/pricing" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      isScrolled 
                        ? "bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" 
                        : "bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active]:bg-white/10 data-[state=open]:bg-white/10"
                    )}>
                  Pricing
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
          </div>

          {/* Part 3: Theme, login, account */}
          <div className="flex justify-end items-center space-x-3 sm:space-x-4">
            {mounted && <ModeToggle variant="navbar" />}

            {isAuthenticated && mounted ? (
              <div className="flex items-center">
                {/* Dashboard link */}
                <Button 
                  variant="ghost" 
                  className={cn(
                    "hidden sm:inline-flex mr-2 px-3",
                    isScrolled ? "" : "text-white hover:bg-white/10 hover:text-white"
                  )} 
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                
                {/* User navigation */}
                <UserNav user={{
                  name: user?.name,
                  email: user?.email,
                  image: user?.image,
                  role: user?.role
                }} />
              </div>
            ) : mounted ? (
              <>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "hidden sm:inline-flex px-3",
                    isScrolled ? "" : "text-white hover:bg-white/10 hover:text-white"
                  )} 
                  asChild
                >
                  <Link href="/auth/signin">Log in</Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-9 w-9",
                    isScrolled ? "" : "border-white/20 text-white hover:bg-white/10 hover:text-white"
                  )}
                  asChild
                >
                  <Link href="/auth/signin">
                    <UserIcon className="h-5 w-5" />
                    <span className="sr-only">User account</span>
                  </Link>
                </Button>
                <Button 
                  className={cn(
                    "px-3 sm:px-4 font-medium",
                    isScrolled ? "" : "bg-white text-blue-900 hover:bg-white/90"
                  )} 
                  asChild
                >
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

const solutions = [
  {
    title: "Education",
    description: "Perfect for schools, universities, and educational institutions",
    href: "/solutions/education",
  },
  {
    title: "Corporate",
    description: "Ideal for employee assessments and certification programs",
    href: "/solutions/corporate",
  },
  {
    title: "Government",
    description: "Secure testing solutions for government agencies",
    href: "/solutions/government",
  },
  {
    title: "Healthcare",
    description: "Specialized testing for healthcare professionals",
    href: "/solutions/healthcare",
  },
]


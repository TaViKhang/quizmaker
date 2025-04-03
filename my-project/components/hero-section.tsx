"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from "react"
import Link from "next/link"

// Component for the background image overlay with color effect
function ImageOverlay() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    "/images/carousel/education-1.jpg",
    "/images/carousel/education-2.jpg",
    "/images/carousel/education-3.jpg",
    "/images/carousel/education-4.jpg"
  ];

  // Change image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((src, index) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: index === currentImageIndex ? 1 : 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      {/* Color overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-indigo-900/70 mix-blend-multiply" />
      
      {/* Image indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
            }`}
            onClick={() => setCurrentImageIndex(index)}
            aria-label={`Show image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center">
      <ImageOverlay />
      
      <div className="relative container px-4 w-full">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Trusted by 2000+ Organizations Worldwide
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Secure Online Testing
            <span className="block text-blue-200">for Global Teams</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-[42rem]">
            TestPro helps thousands of organizations deliver secure, scalable online assessments. Get our all-in-one platform that simplifies test creation, delivery, and analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button size="lg" asChild>
              <Link href="/auth/signup" className="px-8">
                Bắt đầu miễn phí
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signin" className="px-8">
                Đăng nhập
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}


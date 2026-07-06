import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"
import { Hero } from "../components/sections/Hero"
import { Problem } from "../components/sections/Problem"
import { Solution } from "../components/sections/Solution"
import { HowItWorks } from "../components/sections/HowItWorks"
import { Features } from "../components/sections/Features"
import { TechStack } from "../components/sections/TechStack"
import { DemoPreview } from "../components/sections/DemoPreview"
import { CTA } from "../components/sections/CTA"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 flex flex-col">
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <TechStack />
        <DemoPreview />
        <CTA />
      </main>
      
      <Footer />
    </div>
  )
}

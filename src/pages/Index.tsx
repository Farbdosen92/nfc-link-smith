import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { IdeaSection } from "@/components/marketing/idea-section";
import { FoundersSection } from "@/components/marketing/founders-section";
import { AnalyticsSection } from "@/components/marketing/analytics-section";
import { RoiSection } from "@/components/marketing/roi-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { TechHighlights } from "@/components/marketing/tech-highlights";
import { HistorySection } from "@/components/marketing/history-section";
import { ContactSection } from "@/components/marketing/contact-section";

export default function Index() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <Navbar />
      <Hero />
      <IdeaSection />

      {/* Visual Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-0" />

      <AnalyticsSection />
      <FoundersSection />

      <RoiSection />

      <FeaturesSection />
      <HistorySection />
      <TechHighlights />
      <ContactSection />

      <footer className="py-10 text-center text-muted-foreground text-sm border-t border-border bg-background">
        <p>© 2026 NFCwear by Severmore. All rights reserved.</p>
      </footer>
    </main>
  );
}

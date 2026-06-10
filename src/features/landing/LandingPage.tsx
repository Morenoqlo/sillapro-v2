import { LandingNav } from './sections/LandingNav';
import { LandingHero } from './sections/LandingHero';
import { LandingBenefits } from './sections/LandingBenefits';
import { LandingHowItWorks } from './sections/LandingHowItWorks';
import { LandingPricing } from './sections/LandingPricing';
import { LandingFAQ } from './sections/LandingFAQ';
import { LandingFooterCTA, LandingFooter } from './sections/LandingFooter';

/**
 * Marketing landing at `/`.
 *
 * Each section is its own file under `sections/`. Component-level helpers
 * (BenefitCard, StepCard, Bullet, FAQ) live next to the section that uses
 * them — they're not exported because they have no other consumer.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <LandingHero />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooterCTA />
      <LandingFooter />
    </div>
  );
}

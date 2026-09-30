import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import HowItWorks from '@/components/HowItWorks';
import Portfolio from '@/components/Portfolio';
import OrderForm from '@/components/OrderForm';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { I18nProvider } from '@/lib/i18n';

function StudioPage() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-[#0a0a0b] text-gray-200 overflow-x-hidden">
        <Navbar />

        <main>
          <Hero />
          <Services />
          <HowItWorks />
          <Portfolio />
          <OrderForm />
          <Pricing />
          <FAQ />
          <About />
          <Contact />
        </main>

        <Footer />
      </div>
    </I18nProvider>
  );
}

export default StudioPage;
import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Credentials from "@/components/Credentials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { trackHomepageView } from "@/hooks/useBookingAnalytics";

const Index = () => {
  useEffect(() => {
    trackHomepageView();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <About />
      <Credentials />
      <Services />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Credentials from "@/components/Credentials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { trackHomepageView } from "@/hooks/useBookingAnalytics";
import PageMeta from "@/components/PageMeta";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    trackHomepageView();
  }, []);

  // Handle hash-based scroll after navigation from sub-pages
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  return (
    <main className="min-h-screen bg-background">
      <PageMeta />
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

"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Moon, Leaf, ArrowRight, Sparkles, Send, Flower2, MapPin, Phone, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { getActiveOffersAction } from "@/modules/marketing/actions/marketing-offer-action";
import { toast } from "sonner";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MarketingOfferInput } from "@/modules/marketing/schemas/marketing-offer";
import { getFeaturedProductsAction } from "@/modules/product/actions/product-action";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MarketingPage() {
  const container = useRef<HTMLDivElement>(null);
  const { setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [offers, setOffers] = useState<(MarketingOfferInput & { id: string })[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [bgImage, setBgImage] = useState("bg-3.webp");

  useEffect(() => {
    // setTheme("light");
    const fetchData = async () => {
      const [offersResult, servicesResult] = await Promise.all([
        getActiveOffersAction(),
        getFeaturedProductsAction()
      ]);

      if (offersResult.success && offersResult.data) {
        setOffers(offersResult.data);
      }

      if (servicesResult.success && servicesResult.data) {
        const mapped = servicesResult.data.map((p: any) => ({
          title: p.name,
          desc: p.description || "Layanan premium Okgo.",
          time: p.duration ? `${p.duration} Menit` : "Fleksibel",
          price: `Rp ${Number(p.price).toLocaleString('id-ID')}`,
          img: p.image || "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=600&q=80"
        }));
        setFeaturedServices(mapped);
      }
    };
    fetchData();

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [setTheme]);

  const [formData, setFormData] = useState({
    nama: "",
    tanggal: "",
    jam: "",
    layanan: "",
    terapis: "Mana Saja",
  });

  const WA_NUMBER = "6281234567890";

  useGSAP(() => {
    // Elegant, slow parallax for the hero image
    gsap.to(".hero-img", {
      yPercent: 15,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Gentle fade up reveals
    const sections = gsap.utils.toArray(".reveal-section");
    sections.forEach((section: any) => {
      gsap.fromTo(section,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
          }
        }
      );
    });
  }, { scope: container });

  const orderVoucher = () => {
    toast.success("Segera Hadir", {
      description: "Integrasi sistem pembayaran sedang dalam tahap pengembangan."
    });
  };

  const scrollTo = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const targetPosition = element.getBoundingClientRect().top + window.scrollY;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      const duration = 1200; // 1.2 seconds for a luxurious, slow scroll
      let start: number | null = null;

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);

        // easeInOutQuart for a very premium feel
        const ease = progress < 0.5
          ? 8 * progress * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 4) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    }
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div ref={container} className="bg-background text-foreground font-sans min-h-screen selection:bg-primary/20">
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
          ? "bg-background/10 backdrop-blur-xl border-b border-border/50 py-4"
          : "bg-transparent border-b-transparent py-6"
          }`}
      >
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center h-12 relative">
          <div className="flex items-center transition-all duration-700 ease-in-out z-10 md:w-[250px]">
            <a href="#" className="flex items-center">
              <img
                src="/logo-long.webp"
                alt="Nyenyak Spa"
                className={`object-contain transition-all duration-500 ${isScrolled ? 'h-9 md:h-11' : 'h-10 md:h-12'}`}
              />
            </a>
          </div>
          <div className="w-auto md:w-62.5 flex items-center justify-end ml-auto z-20">
            <motion.button
              initial={false}
              animate={{ opacity: isScrolled ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => scrollTo(e, 'reservasi')}
              className={`group inline-flex items-center justify-center border border-foreground/30 hover:bg-foreground hover:text-background px-4 py-2 md:px-6 md:py-2.5 rounded-none gap-2 text-foreground text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium cursor-pointer transition-all duration-500 ${isScrolled ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              Booking Jadwal
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <header className="hero-section relative min-h-screen flex items-center w-full">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-background">
          <div
            className="hero-img absolute inset-[-5%] bg-cover bg-center md:bg-position-[90%_center]"
            style={{ backgroundImage: `url('/${bgImage}')` }}
          >
            <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/60 to-background/90 md:bg-linear-to-r md:from-background md:from-20% md:via-background/80 md:via-50% md:to-transparent" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 w-full relative z-10">
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="show"
            className="max-w-2xl text-left pt-0 sm:pt-20"
          >
            {/* <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-[0.3em] mb-10">
            Deep Relaxation & Sleep Therapy
          </motion.div> */}
            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-display font-light text-center sm:text-start leading-[1.1] tracking-tight mb-2 text-foreground">
              Lepas Lelah<br />
              Tidur Lebih <span className="text-primary italic font-light">Nyenyak</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-foreground/80 md:text-muted-foreground text-xs sm:text-base text-center sm:text-start font-light mb-10 leading-relaxed max-w-xl">
              Relaksasi mendalam oleh terapis profesional
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
              <motion.button
                onClick={(e) => scrollTo(e, 'reservasi')}
                className="group relative inline-flex items-center justify-center gap-3 text-foreground text-sm md:text-base uppercase tracking-[0.2em] font-light pb-3 cursor-pointer after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 sm:after:left-0 sm:after:translate-x-0 after:h-[1px] after:w-12 after:bg-foreground/50 hover:after:w-full hover:after:bg-foreground after:transition-all after:duration-500 after:ease-out"
              >
                Booking Jadwal <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500 ease-out stroke-1" />
              </motion.button>
              {/* <motion.button
              onClick={(e) => scrollTo(e, 'voucher')}
              className="flex items-center justify-center text-muted-foreground uppercase text-xs tracking-[0.2em] font-light hover:text-primary transition-colors cursor-pointer pt-3 sm:pt-0"
            >
              Lihat Penawaran Khusus
            </motion.button> */}
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* TENTANG KAMI */}
      <section id="tentang" className="py-40 px-6 bg-background">
        <div className="max-w-5xl mx-auto reveal-section text-center">
          <h2 className="text-4xl md:text-6xl font-display font-light text-foreground mb-10 leading-[1.2]">
            Kembalikan <span className="italic text-primary">Keseimbangan</span> Anda.
          </h2>
          <div className="w-12 h-[1px] bg-border mx-auto mb-10"></div>
          <p className="text-muted-foreground font-light text-sm md:text-xl leading-relaxed max-w-3xl mx-auto">
            Di Nyenyak, kami percaya bahwa istirahat yang berkualitas adalah pondasi untuk hidup yang lebih baik. Melalui sentuhan terapis profesional, teknik pijat tradisional yang disempurnakan, dan suasana yang menenangkan, kami menghadirkan pengalaman relaksasi yang memulihkan energi Anda sepenuhnya.
          </p>
        </div>
      </section>

      {/* LAYANAN REGULER */}
      <section id="layanan" className="py-40">
        <div className="max-w-6xl mx-auto reveal-section px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-display font-light text-foreground mb-3">Menu Layanan</h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-light text-base">Pilihan perawatan terbaik untuk relaksasi tubuh dan pikiran Anda.</p>
          </div>
        </div>

        <div className="flex flex-col w-full">
          {featuredServices.length === 0 ? (
            <div className="w-full max-w-7xl mx-auto text-center py-20 bg-muted/20 border border-dashed border-border/50 px-6">
              <p className="text-muted-foreground font-light text-lg">Belum ada layanan yang ditambahkan.</p>
            </div>
          ) : (
            featuredServices.map((service, i) => {
              const isEven = i % 2 === 0;

              // A consistent 55/45 split keeps it asymmetrical but visually balanced
              const imageWidth = 'md:w-[55%]';
              const textWidth = 'md:w-[45%]';

              return (
                <div key={i} className={`flex flex-col md:flex-row ${!isEven ? 'md:flex-row-reverse' : ''} w-full min-h-[500px] overflow-hidden group`}>
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -100 : 100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`w-full ${imageWidth} relative min-h-[400px] md:min-h-full`}
                  >
                    <img
                      src={service.img}
                      alt={service.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className={`w-full ${textWidth} flex flex-col justify-center p-12 bg-white/[0.02]`}
                  >
                    <h3 className="text-4xl md:text-6xl font-display font-light text-foreground mb-6">{service.title}</h3>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed font-light">{service.desc}</p>
                    <div className="flex items-center gap-6 mt-auto md:mt-0">
                      <span className="text-2xl font-light text-foreground tracking-widest">{service.price}</span>
                      <div className="h-[1px] flex-1 bg-border/50"></div>
                      <span className="text-sm text-muted-foreground uppercase tracking-widest">{service.time}</span>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* FORM RESERVASI */}
      <section id="reservasi" className="py-40 flex items-center justify-center bg-background border-t border-white/[0.02]">
        <div className="max-w-4xl mx-auto reveal-section text-center px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-display font-light text-foreground mb-3">Mulai Perjalanan Anda</h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-light text-base">Amankan waktu relaksasi Anda hari ini. Nikmati pengalaman premium dan konfirmasi instan langsung.</p>
          </div>

          <div className="flex justify-center">
            <motion.a
              href="/booking"
              className="group inline-flex items-center justify-center border border-foreground/30 hover:bg-foreground hover:text-background px-12 py-5 rounded-none text-foreground text-sm md:text-base uppercase tracking-[0.2em] font-medium cursor-pointer transition-all duration-500"
            >
              Buat Reservasi
            </motion.a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background py-24 px-6 border-t border-border/30 text-center relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <p className="text-2xl font-extralight text-foreground mb-8 tracking-[0.2em] text-primary">NYENYAK</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xs uppercase tracking-widest text-muted-foreground mb-16">
            <span>Medan, Indonesia</span>
            <span className="hidden md:inline-block text-muted-foreground/40">•</span>
            <span className="block md:hidden w-4 h-[1px] bg-muted-foreground/20"></span>
            <span>09.00 - 22.00</span>
            <span className="hidden md:inline-block text-muted-foreground/40">•</span>
            <span className="block md:hidden w-4 h-[1px] bg-muted-foreground/20"></span>
            <span>+62 812 3456 7890</span>
          </div>
          <p className="text-muted-foreground/60 text-xs font-light">&copy; {new Date().getFullYear()} Nyenyak. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

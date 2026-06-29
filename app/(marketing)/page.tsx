"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Moon, Leaf, ArrowRight, Sparkles, Send, Flower2, MapPin, Phone, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTheme } from "next-themes";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MarketingPage() {
  const container = useRef<HTMLDivElement>(null);
  const { setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // setTheme("light");

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
    const text = encodeURIComponent(
      "Halo Admin Nyenyak, saya tertarik untuk membeli *Paket Voucher Hemat (10 Lembar)* seharga Rp 1.125.000.\n\nBagaimana prosedur pembayarannya?"
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const templatePesan =
      `*RESERVASI BARU - NYENYAK SPA*
------------------------------------
👤 *Nama:* ${formData.nama}
📅 *Tanggal:* ${formData.tanggal}
⏰ *Jam Sesi:* ${formData.jam} WIB
💆 *Layanan:* ${formData.layanan}
🙌 *Terapis:* ${formData.terapis}
------------------------------------
Mohon konfirmasi ketersediaan slotnya ya Min. Terima kasih!`;

    const urlWA = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(templatePesan)}`;
    window.open(urlWA, "_blank");
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

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
          ? "bg-background/10 backdrop-blur-xl border-b border-border/50 py-4"
          : "bg-transparent border-b-transparent py-6"
          }`}
      >
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <a href="#" className="text-2xl font-display font-light tracking-widest text-foreground">
            NYENYAK<span className="text-primary font-sans font-light text-sm tracking-normal">.spa</span>
          </a>
          <div className="hidden md:flex space-x-12 font-medium text-sm text-muted-foreground tracking-wide">
            <button onClick={(e) => scrollTo(e, 'layanan')} className="hover:text-foreground transition-colors cursor-pointer">Layanan</button>
            <button onClick={(e) => scrollTo(e, 'voucher')} className="hover:text-foreground transition-colors cursor-pointer">Voucher</button>
            <button onClick={(e) => scrollTo(e, 'reservasi')} className="hover:text-foreground transition-colors cursor-pointer">Reservasi</button>
          </div>
          <div className="w-[150px] flex justify-end">
            <motion.button
              initial={false}
              animate={{ opacity: isScrolled ? 1 : 0, y: isScrolled ? 0 : -10 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => scrollTo(e, 'reservasi')}
              className={`bg-foreground text-background px-5 py-1.5 rounded-full text-xs font-medium tracking-wide cursor-pointer hover:bg-foreground/90 transition-colors ${isScrolled ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              Pesan Sekarang
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <header className="hero-section relative pt-44 pb-32 px-6 flex flex-col items-center justify-center min-h-[90vh]">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-[0.3em] mb-10">
            Deep Relaxation & Sleep Therapy
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-display font-light leading-[1.1] tracking-tight mb-8 text-foreground">
            Lepas Lelah,<br />
            Tidur Lebih <span className="text-primary italic font-light">Nyenyak</span>.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground text-lg md:text-xl font-light max-w-2xl mx-auto mb-14 leading-relaxed">
            Terapis profesional kami menghadirkan relaksasi mendalam untuk memulihkan tubuh dan kualitas tidur Anda ke tingkat yang paling optimal.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-8 w-full sm:w-auto items-center">
            <motion.button
              onClick={(e) => scrollTo(e, 'reservasi')}
              className="group flex items-center justify-center gap-3 border border-foreground/20 text-foreground px-10 py-4 rounded-full font-light tracking-wide hover:border-primary hover:text-primary transition-colors cursor-pointer w-full sm:w-auto"
            >
              Booking Jadwal <ChevronRight className="w-4 h-4 text-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </motion.button>
            <motion.button
              onClick={(e) => scrollTo(e, 'voucher')}
              className="flex items-center justify-center text-muted-foreground uppercase text-xs tracking-[0.2em] font-light hover:text-primary transition-colors cursor-pointer"
            >
              Lihat Penawaran Khusus
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Minimalist Image Reveal */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="hero-img absolute inset-[-10%] bg-[url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center grayscale" />
        </div>
      </header>

      {/* PROMO BUNDLE VOUCHER */}
      <section id="voucher" className="py-40 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto reveal-section">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-display font-light text-foreground mb-6">Penawaran Eksklusif</h2>
            <p className="text-muted-foreground max-w-md mx-auto font-light text-lg">Hadiahkan relaksasi premium untuk diri sendiri atau orang terkasih.</p>
          </div>

          <div className="bg-background rounded-[2rem] p-1 shadow-sm border border-border/50 max-w-4xl mx-auto flex flex-col md:flex-row">
            <div className="p-12 md:w-3/5 flex flex-col justify-center">
              <div className="text-primary text-xs font-bold tracking-[0.2em] mb-4 uppercase">Bundle Package</div>
              <h3 className="text-3xl font-display font-light text-foreground mb-6">10 Sesi Massage</h3>
              <p className="text-muted-foreground leading-relaxed font-light mb-10">
                Nikmati 10x sesi Full Body Massage (60 Menit). Berlaku selama 6 bulan, fleksibel, dan dapat dipindahtangankan.
              </p>
              <ul className="space-y-4 text-sm text-foreground/80 font-light">
                {['Bebas pilih jadwal (Weekday & Weekend)', 'Bebas pilih spesialis Terapis', 'Termasuk Essential Sleep-Oil & Wedang Jahe'].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-primary/60 mr-4 shrink-0 stroke-1" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-12 md:w-2/5 flex flex-col justify-center items-center text-center bg-muted/20 rounded-[1.8rem] m-2">
              <p className="text-muted-foreground text-xs tracking-[0.2em] mb-2 uppercase">Harga Normal</p>
              <p className="text-muted-foreground line-through mb-8">Rp 1.500.000</p>
              <p className="text-5xl font-light text-foreground font-display mb-4">Rp 1.125.000</p>
              <p className="text-xs text-muted-foreground mb-12">Hanya Rp 112.500 per kedatangan</p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={orderVoucher}
                className="w-full bg-foreground text-background font-medium tracking-wide py-4 px-6 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Beli via WhatsApp
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* LAYANAN REGULER */}
      <section id="layanan" className="py-40 px-6">
        <div className="max-w-6xl mx-auto reveal-section">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-display font-light text-foreground mb-6">Menu Layanan</h2>
            <p className="text-muted-foreground max-w-md mx-auto font-light text-lg">Pilihan perawatan terbaik untuk relaksasi tubuh dan pikiran Anda.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Deep Sleep Massage", desc: "Pijat seluruh tubuh berfokus meredakan ketegangan saraf untuk memicu tidur lebih lelap.", time: "60 Menit", price: "Rp 150.000", icon: Moon, img: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=600&q=80" },
              { title: "Refleksologi Nyenyak", desc: "Titik tekan akupresur pada area kaki untuk merelaksasi organ dalam dan otot kaku.", time: "45 Menit", price: "Rp 100.000", icon: Leaf, img: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80" },
              { title: "Aromaterapi Lavender", desc: "Pijatan lembut dipadukan dengan minyak esensial lavender murni untuk ketenangan maksimal.", time: "90 Menit", price: "Rp 220.000", icon: Flower2, img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80" }
            ].map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="group flex flex-col"
              >
                <div className="aspect-[4/5] relative overflow-hidden rounded-2xl mb-8 bg-muted">
                  <div className="absolute inset-0 bg-foreground/10 group-hover:bg-transparent transition-colors duration-700 z-10" />
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl font-display font-light text-foreground">{service.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-light">{service.desc}</p>
                  <div className="flex justify-between items-center pt-6 border-t border-border/50">
                    <span className="text-muted-foreground text-xs uppercase tracking-widest">{service.time}</span>
                    <span className="font-medium text-foreground">{service.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM RESERVASI */}
      <section id="reservasi" className="py-40 px-6 bg-primary/5">
        <div className="max-w-3xl mx-auto reveal-section">
          <div className="bg-background p-10 md:p-16 rounded-[2rem] shadow-sm border border-border/50">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-light text-foreground mb-4">Reservasi Jadwal</h2>
              <p className="text-muted-foreground font-light">Amankan jadwal relaksasi Anda sekarang. Konfirmasi instan via WhatsApp.</p>
            </div>

            <div className="flex justify-center mt-12">
              <motion.a
                href="/booking"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center justify-center gap-3 border border-foreground/20 text-foreground px-10 py-4 rounded-full font-light tracking-wide hover:border-primary hover:text-primary transition-colors cursor-pointer w-full sm:w-auto"
              >
                Buat Reservasi <ChevronRight className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background py-24 px-6 border-t border-border/30 text-center relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <p className="font-display text-2xl font-light text-foreground mb-8 tracking-[0.2em]">NYENYAK</p>
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-xs uppercase tracking-widest text-muted-foreground mb-16">
            <span className="flex items-center justify-center gap-3"><MapPin className="w-4 h-4 stroke-1" /> Jakarta, Indonesia</span>
            <span className="flex items-center justify-center gap-3"><Clock className="w-4 h-4 stroke-1" /> 10.00 - 22.00</span>
            <span className="flex items-center justify-center gap-3"><Phone className="w-4 h-4 stroke-1" /> +62 812 3456 7890</span>
          </div>
          <p className="text-muted-foreground/60 text-xs font-light">&copy; {new Date().getFullYear()} Nyenyak Wellness. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

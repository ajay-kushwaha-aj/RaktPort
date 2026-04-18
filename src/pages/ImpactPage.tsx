import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, DownloadCloud, Activity, Zap, ShieldCheck, MapPin, Users, Building2, Droplets } from 'lucide-react';

import one from '../assets/one.png';
import two from '../assets/two.png';
import three from '../assets/three.png';
import four from '../assets/four.png';

const IMPACT_STORIES = [
  { img: one, title: "Saving Lives in Rural Clinics", desc: "A rural clinic gets emergency blood supply connected by RaktPort, saving 5 lives in a single night." },
  { img: two, title: "Community Blood Drive", desc: "Over 500 donors united for a mega blood drive, filling local blood bank reserves completely." },
  { img: three, title: "Seamless Delivery", desc: "Real-time tracking enabled a critical blood unit to arrive exactly on time for a pediatric surgery." },
  { img: four, title: "Connecting Donors & Patients", desc: "A rare blood type request was fulfilled within 30 minutes thanks to our proximity-based alerts." }
];

export function ImpactPage() {
  const plugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: true })
  );

  React.useEffect(() => {
    // Reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pt-28 pb-16 px-4 md:px-8 relative overflow-hidden">

      {/* Background Decorators */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[var(--rp-primary)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-150px] w-[400px] h-[400px] rounded-full bg-[var(--rp-primary)]/5 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-20">

        {/* ══ HEADER & A-Z DETAILS ══ */}
        <section className="text-center space-y-6 reveal opacity-0 translate-y-6 transition-all duration-700 ease-out">
          <div className="flex items-center justify-center gap-3 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--rp-primary)]">
            <span className="w-6 h-px bg-[var(--rp-primary)]/50"></span>
            Making a Difference
            <span className="w-6 h-px bg-[var(--rp-primary)]/50"></span>
          </div>
          <h1 className="font-[Sora,Georgia,serif] font-extrabold text-[clamp(2.2rem,5vw,3.5rem)] tracking-[-0.04em] leading-[1.1] text-[var(--txt-main)]">
            Our <span className="text-[var(--rp-primary)]">Impact</span>
          </h1>

          <div className="max-w-3xl mx-auto bg-[var(--bg-panel)]/60 backdrop-blur-md border border-[var(--rp-border)] p-8 rounded-2xl shadow-xl mt-8">
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6 font-medium">
              RaktPort is a nationwide digital blood network that uses RTID tracking to connect donors and patients in real time—eliminating geographical barriers in life-saving transfusions.
            </p>
            <p className="text-[var(--text-secondary)]/80 text-base leading-relaxed mb-8">
              It replaces fragmented blood bank systems with a unified, trackable network—ensuring faster allocation, verified handling, and end-to-end visibility from donation to transfusion.
            </p>
            <p className="text-[var(--text-secondary)]/80 text-base font-bold leading-relaxed mb-8">
              Built to reduce delays and make every donation count.
            </p>
            <a href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[var(--rp-primary)] to-[#99152b] text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(196,30,58,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(196,30,58,0.45)] transition-all">
              Explore RaktPort System <ArrowRight size={18} />
            </a>
          </div>
        </section>

        {/* ══ ACCOMPLISHMENTS STATS (Border Style) ══ */}
        <section className="reveal opacity-0 translate-y-6 transition-all duration-700 delay-150 ease-out py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "2,54", l: "LIVES SAVED" },
              { n: "1,000", l: "ACTIVE DONORS" },
              { n: "100", l: "BLOOD BANKS" },
              { n: "2", l: "CITIES COVERED" }
            ].map((stat, i) => (
              <div key={i} className="bg-transparent border-[1.5px] border-blue-600/30 dark:border-blue-400/20 lg:border-[var(--rp-primary)]/40 rounded-[20px] py-10 px-4 text-center transform transition-transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group bg-gradient-to-b from-transparent to-black/5 dark:to-white/5">
                <div className="absolute inset-0 bg-[var(--rp-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-4xl md:text-5xl font-extrabold text-[var(--txt-main)] dark:text-gray-100 mb-2 font-[Sora,serif] flex items-center justify-center gap-1">
                  {stat.n}<span className="text-2xl text-[var(--rp-primary)]">+</span>
                </h3>
                <p className="text-[var(--rp-primary)] dark:text-[#E8294A] font-bold tracking-[0.16em] text-sm uppercase">
                  {stat.l}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS (Flowchart) ══ */}
        <section className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out bg-[var(--bg-panel)]/40 border border-[var(--rp-border)] rounded-3xl p-8 lg:p-12 shadow-sm">
          <div className="text-center mb-10">
            <h2 className="font-[Sora,Georgia,serif] font-extrabold text-[clamp(1.8rem,4vw,2.5rem)] tracking-[-0.04em] text-[var(--txt-main)]">
              How RaktPort <span className="text-[var(--rp-primary)]">Works</span>
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4 relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-[40px] left-10 right-10 h-0.5 bg-gradient-to-r from-[var(--rp-primary)]/20 via-[var(--rp-primary)] to-[var(--rp-primary)]/20 z-0 border-dashed border-t-[2px] border-[var(--rp-primary)]/40"></div>

            {[
              { i: Users, t: "Verified Donor Network", d: "Donors register, verify eligibility, and stay available within the network." },
              { i: Zap, t: "RTID Assignment", d: "Every donation is assigned a unique RTID — enabling secure, end-to-end digital tracking." },
              { i: Building2, t: "Certified Processing & Sync", d: "Blood is tested at authorized centers and instantly synced to the RaktPort network inventory." },
              { i: Activity, t: "Smart Allocation Engine", d: "System identifies the best match based on proximity, urgency, and compatibility." },
              { i: Droplets, t: "Seamless Transfusion & Tracking", d: "The patient receives the blood, and the donor receives real-time updates on the impact of their donation." }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center max-w-[200px]">
                <div className="w-[84px] h-[84px] rounded-full bg-[var(--bg-page)] border-2 border-[var(--rp-primary)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--rp-primary)]/20 transform transition-transform hover:scale-110">
                  <step.i size={36} className="text-[var(--rp-primary)]" />
                </div>
                <h4 className="font-bold text-[var(--txt-main)] text-[15px] mb-2">{step.t}</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{step.d}</p>
                {/* Mobile arrows */}
                {idx < 4 && <div className="lg:hidden my-4 text-[var(--rp-primary)] flex items-center justify-center h-8"><ArrowRight className="rotate-90" /></div>}
              </div>
            ))}
          </div>
        </section>

        {/* ══ STORIES THROUGH PICTURES (CAROUSEL) ══ */}
        <section className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out pt-6">
          <div className="text-center mb-10">
            <h2 className="font-[Sora,Georgia,serif] font-extrabold text-[clamp(1.8rem,4vw,2.5rem)] tracking-[-0.04em] text-[var(--txt-main)]">
              Accomplishments & <span className="text-[var(--rp-primary)]">Stories</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4">Real moments captured globally through the RaktPort ecosystem.</p>
          </div>

          <div className="mx-auto w-full relative px-6 md:px-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                dragFree: true,
              }}
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {IMPACT_STORIES.map((story, idx) => (
                  <CarouselItem key={idx} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="border-0 shadow-lg overflow-hidden bg-transparent rounded-2xl relative h-[420px] group cursor-pointer transition-all duration-300">
                      <CardContent className="p-0 h-full w-full relative">
                        <img
                          src={story.img}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-24 text-white">
                          <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-[var(--rp-primary)] transition-colors">{story.title}</h3>
                          <p className="text-white/80 text-sm leading-relaxed">{story.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 border-[var(--rp-border)] bg-[var(--bg-panel)] text-[var(--txt-main)] hover:bg-[var(--rp-primary)] hover:text-white transition-colors z-10" />
              <CarouselNext className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 border-[var(--rp-border)] bg-[var(--bg-panel)] text-[var(--txt-main)] hover:bg-[var(--rp-primary)] hover:text-white transition-colors z-10" />
            </Carousel>
          </div>
        </section>

        {/* ══ WHY WE'RE DIFFERENT ══ */}
        <section className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out py-10">
          <div className="bg-gradient-to-br from-[var(--rp-primary)] to-[#800F22] rounded-3xl p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="font-[Sora,Georgia,serif] font-extrabold text-3xl md:text-4xl mb-6 tracking-[-0.02em]">
                Why RaktPort is a New Blood Infrastructure
              </h2>
              <p className="text-white/85 text-lg max-w-2xl mx-auto mb-12">
                RaktPort is not a donor list—it’s a real-time blood routing network that connects supply to demand across locations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {[
                  { i: ShieldCheck, t: "End-to-End Traceability", d: "Every unit of blood is tracked via RTID—from donation to transfusion—ensuring visibility, accountability, and reduced misuse." },
                  { i: MapPin, t: "Zero Geographical Limits", d: "No longer confined to your city. If an emergency strikes, relevant compatible donors in the radius are immediately alerted." },
                  { i: DownloadCloud, t: "Intelligent Supply Prediction", d: "The system monitors blood inventory trends and triggers targeted donor alerts before shortages become critical." }
                ].map((feat, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                    <feat.i className="text-[#FFC1C1] mb-4" size={32} />
                    <h4 className="text-xl font-bold mb-2">{feat.t}</h4>
                    <p className="text-sm text-white/80 leading-relaxed">{feat.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}} />
    </div>
  );
}


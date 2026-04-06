import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
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
  )

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pt-32 pb-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--txt-main)]">
            Our <span className="text-[var(--clr-brand)]">Impact</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            See how RaktPort is transforming the blood supply landscape and connecting donors with patients in real time.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[var(--bg-panel)] p-6 rounded-xl border border-[var(--rp-border)] text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[var(--clr-brand)] mb-2">2,542+</h3>
            <p className="text-[var(--text-secondary)] font-medium">Lives Saved</p>
          </div>
          <div className="bg-[var(--bg-panel)] p-6 rounded-xl border border-[var(--rp-border)] text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[var(--clr-brand)] mb-2">18,000+</h3>
            <p className="text-[var(--text-secondary)] font-medium">Active Donors</p>
          </div>
          <div className="bg-[var(--bg-panel)] p-6 rounded-xl border border-[var(--rp-border)] text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[var(--clr-brand)] mb-2">851</h3>
            <p className="text-[var(--text-secondary)] font-medium">Blood Banks</p>
          </div>
          <div className="bg-[var(--bg-panel)] p-6 rounded-xl border border-[var(--rp-border)] text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[var(--clr-brand)] mb-2">24</h3>
            <p className="text-[var(--text-secondary)] font-medium">Cities Reached</p>
          </div>
        </section>

        {/* Stories Carousel */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-[var(--txt-main)] text-center">Stories Through Pictures</h2>
          <div className="mx-auto max-w-4xl relative px-10">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              className="w-full"
            >
              <CarouselContent>
                {IMPACT_STORIES.map((story, idx) => (
                  <CarouselItem key={idx}>
                    <div className="p-1">
                      <Card className="border-0 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden bg-[var(--bg-panel)] rounded-2xl">
                        <CardContent className="p-0 relative group">
                          <img 
                            src={story.img} 
                            alt={story.title}
                            className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-8 pt-32 text-white">
                            <h3 className="text-2xl font-bold mb-3 tracking-tight">{story.title}</h3>
                            <p className="text-white/85 text-lg leading-relaxed">{story.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 w-12 h-12 border-[var(--rp-border)] bg-[var(--bg-panel)] text-[var(--txt-main)] hover:bg-[var(--clr-brand)] hover:text-white transition-colors" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 w-12 h-12 border-[var(--rp-border)] bg-[var(--bg-panel)] text-[var(--txt-main)] hover:bg-[var(--clr-brand)] hover:text-white transition-colors" />
            </Carousel>
          </div>
        </section>

      </div>
    </div>
  );
}

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "About Us | Shashti Karz - Car Detailing Experts",
  description: "Learn about Shashti Karz, Tirupur's leading premium car detailing center. Our mission, story, and why car owners trust us for Ceramic Coating and PPF.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent italic tracking-tighter">
              About <span className="text-white">Shashti Karz</span>
            </h1>
            <p className="text-xl text-gray-500">
              Your trusted partner in premium car detailing services
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Our Story */}
            <section className="bg-white/[0.02] backdrop-blur-lg rounded-3xl p-8 border border-white/5">
              <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
              <p className="text-gray-400 leading-relaxed">
                Shashti Karz was founded with a simple mission: to provide exceptional car detailing
                services that exceed customer expectations. We combine cutting-edge technology with
                traditional craftsmanship to deliver results that make your vehicle look and feel brand new.
              </p>
            </section>

            {/* Our Mission */}
            <section className="bg-white/[0.02] backdrop-blur-lg rounded-3xl p-8 border border-white/5">
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-gray-400 leading-relaxed">
                We strive to be the leading car detailing service by consistently delivering superior
                quality, innovative solutions, and exceptional customer service. Our goal is to build
                lasting relationships with our clients through trust, reliability, and outstanding results.
              </p>
            </section>

            {/* Why Choose Us */}
            <section className="bg-white/[0.02] backdrop-blur-lg rounded-3xl p-8 border border-white/5">
              <h2 className="text-3xl font-bold text-white mb-6">Why Choose Us</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "Expert Technicians", desc: "Highly trained professionals with years of experience" },
                  { title: "Premium Products", desc: "Only the finest detailing products and equipment" },
                  { title: "Eco-Friendly", desc: "Environmentally conscious cleaning solutions" },
                  { title: "Customer Satisfaction", desc: "100% satisfaction guarantee on all services" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact CTA */}
            <section className="bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-lg rounded-3xl p-12 border border-red-500/20 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience the Difference?</h2>
              <p className="text-gray-400 mb-8">
                Book your car detailing service today and see why customers trust Shashti Karz.
              </p>
              <a
                href="/booking"
                className="inline-block px-10 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-full hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300"
              >
                Book a Slot Now
              </a>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

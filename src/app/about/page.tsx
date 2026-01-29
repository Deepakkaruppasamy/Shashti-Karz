"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <Navbar />

            <main className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent">
                            About Shashti Karz
                        </h1>
                        <p className="text-xl text-gray-300">
                            Your trusted partner in premium car detailing services
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-12">
                        {/* Our Story */}
                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
                            <p className="text-gray-300 leading-relaxed">
                                Shashti Karz was founded with a simple mission: to provide exceptional car detailing
                                services that exceed customer expectations. We combine cutting-edge technology with
                                traditional craftsmanship to deliver results that make your vehicle look and feel brand new.
                            </p>
                        </section>

                        {/* Our Mission */}
                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We strive to be the leading car detailing service by consistently delivering superior
                                quality, innovative solutions, and exceptional customer service. Our goal is to build
                                lasting relationships with our clients through trust, reliability, and outstanding results.
                            </p>
                        </section>

                        {/* Why Choose Us */}
                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-3xl font-bold text-white mb-6">Why Choose Us</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Expert Technicians</h3>
                                        <p className="text-gray-400 text-sm">Highly trained professionals with years of experience</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Premium Products</h3>
                                        <p className="text-gray-400 text-sm">Only the finest detailing products and equipment</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Eco-Friendly</h3>
                                        <p className="text-gray-400 text-sm">Environmentally conscious cleaning solutions</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Customer Satisfaction</h3>
                                        <p className="text-gray-400 text-sm">100% satisfaction guarantee on all services</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contact CTA */}
                        <section className="bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20 text-center">
                            <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience the Difference?</h2>
                            <p className="text-gray-300 mb-6">
                                Book your car detailing service today and see why customers trust Shashti Karz.
                            </p>
                            <a
                                href="/booking"
                                className="inline-block px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                            >
                                Book Now
                            </a>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

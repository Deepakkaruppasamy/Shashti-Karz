"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <Navbar />

            <main className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-gray-300">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 text-gray-300">
                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed">
                                By accessing and using Shashti Karz services, you accept and agree to be bound by the
                                terms and provision of this agreement. If you do not agree to these terms, please do not
                                use our services.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
                            <p className="leading-relaxed mb-4">
                                Shashti Karz provides professional car detailing services including but not limited to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Exterior washing and polishing</li>
                                <li>Interior cleaning and detailing</li>
                                <li>Paint protection and coating</li>
                                <li>Specialized treatments and packages</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">3. Booking and Payment</h2>
                            <p className="leading-relaxed mb-4">
                                All bookings must be made through our online platform or authorized channels. Payment
                                terms include:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Payment is required at the time of booking or upon service completion</li>
                                <li>Accepted payment methods include credit/debit cards, UPI, and digital wallets</li>
                                <li>Prices are subject to change without prior notice</li>
                                <li>Promotional offers are subject to terms and conditions</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">4. Cancellation and Refund Policy</h2>
                            <p className="leading-relaxed mb-4">
                                Our cancellation and refund policy is as follows:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Cancellations made 24 hours before the scheduled service are eligible for a full refund</li>
                                <li>Cancellations made within 24 hours may incur a cancellation fee</li>
                                <li>No-shows will be charged the full service amount</li>
                                <li>Refunds will be processed within 7-10 business days</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">5. Customer Responsibilities</h2>
                            <p className="leading-relaxed mb-4">
                                As a customer, you agree to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Provide accurate information during booking</li>
                                <li>Ensure your vehicle is accessible at the scheduled time</li>
                                <li>Remove all personal belongings and valuables from the vehicle</li>
                                <li>Inform us of any pre-existing damage or special requirements</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">6. Liability</h2>
                            <p className="leading-relaxed">
                                While we take utmost care in providing our services, Shashti Karz is not liable for any
                                pre-existing damage, wear and tear, or damage resulting from the condition of the vehicle.
                                We maintain insurance coverage for our operations and will address any legitimate claims
                                in accordance with applicable laws.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">7. Privacy</h2>
                            <p className="leading-relaxed">
                                Your privacy is important to us. Please refer to our Privacy Policy for information on
                                how we collect, use, and protect your personal data.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">8. Changes to Terms</h2>
                            <p className="leading-relaxed">
                                We reserve the right to modify these terms at any time. Changes will be effective
                                immediately upon posting to our website. Your continued use of our services constitutes
                                acceptance of the modified terms.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
                            <p className="leading-relaxed">
                                For questions about these Terms of Service, please contact us through our website or
                                customer service channels.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

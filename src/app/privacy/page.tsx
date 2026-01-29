"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <Navbar />

            <main className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-gray-300">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 text-gray-300">
                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                            <p className="leading-relaxed">
                                At Shashti Karz, we are committed to protecting your privacy and ensuring the security
                                of your personal information. This Privacy Policy explains how we collect, use, disclose,
                                and safeguard your information when you use our services.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                            <p className="leading-relaxed mb-4">
                                We collect information that you provide directly to us, including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Personal Information:</strong> Name, email address, phone number, and billing address</li>
                                <li><strong>Vehicle Information:</strong> Make, model, year, and registration details</li>
                                <li><strong>Payment Information:</strong> Credit card details and transaction history</li>
                                <li><strong>Service History:</strong> Records of services booked and completed</li>
                                <li><strong>Communication Data:</strong> Messages, reviews, and feedback</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                            <p className="leading-relaxed mb-4">
                                We use the collected information for the following purposes:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>To provide and maintain our car detailing services</li>
                                <li>To process your bookings and payments</li>
                                <li>To send you service confirmations, updates, and reminders</li>
                                <li>To respond to your inquiries and provide customer support</li>
                                <li>To improve our services and develop new features</li>
                                <li>To send promotional offers and marketing communications (with your consent)</li>
                                <li>To comply with legal obligations and protect our rights</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
                            <p className="leading-relaxed mb-4">
                                We may share your information in the following circumstances:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
                                <li><strong>Payment Processors:</strong> To process your payments securely</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
                            </ul>
                            <p className="leading-relaxed mt-4">
                                We do not sell your personal information to third parties.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                            <p className="leading-relaxed">
                                We implement appropriate technical and organizational measures to protect your personal
                                information against unauthorized access, alteration, disclosure, or destruction. This includes:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                                <li>Encryption of sensitive data in transit and at rest</li>
                                <li>Regular security assessments and updates</li>
                                <li>Access controls and authentication mechanisms</li>
                                <li>Employee training on data protection practices</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
                            <p className="leading-relaxed mb-4">
                                You have the following rights regarding your personal information:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Access:</strong> Request access to your personal information</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
                            <p className="leading-relaxed">
                                We use cookies and similar tracking technologies to enhance your experience on our website.
                                These technologies help us understand how you use our services, remember your preferences,
                                and provide personalized content. You can control cookies through your browser settings.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
                            <p className="leading-relaxed">
                                Our services are not directed to individuals under the age of 18. We do not knowingly
                                collect personal information from children. If you believe we have collected information
                                from a child, please contact us immediately.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Privacy Policy</h2>
                            <p className="leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by
                                posting the new Privacy Policy on this page and updating the "Last updated" date. Your
                                continued use of our services after any modifications indicates your acceptance of the
                                updated Privacy Policy.
                            </p>
                        </section>

                        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                            <p className="leading-relaxed">
                                If you have any questions about this Privacy Policy or our data practices, please contact
                                us through our website or customer service channels. We are committed to addressing your
                                concerns and protecting your privacy.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

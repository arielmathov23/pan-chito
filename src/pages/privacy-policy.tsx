import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/react";

const PrivacyPolicy = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Head>
        <title>Privacy Policy | 021 - From Zero to One</title>
        <meta name="description" content="Privacy Policy for 021 - From Zero to One platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation - Floating Nav Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6 backdrop-blur-md bg-white/70 border-b border-gray-100/50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 group relative">
              <div className="relative w-8 h-8 overflow-visible">
                <svg className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 16.5L12 3L19.5 16.5H4.5Z" stroke="#0F533A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V12" stroke="#0F533A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L16.5 16.5" stroke="#0F533A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L7.5 16.5" stroke="#0F533A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 16.5C4.5 18.5 6 21 12 21C18 21 19.5 18.5 19.5 16.5" stroke="#0F533A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="absolute -inset-2 bg-[#0F533A]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-xl font-medium relative">
                <span className="bg-gradient-to-r from-[#0F533A] to-[#16a34a] bg-clip-text text-transparent">021</span>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#0F533A]/20 to-[#16a34a]/20 blur-lg opacity-0 group-hover:opacity-75 transition-opacity"></div>
              </span>
            </Link>
          </div>
        </nav>

        {/* Content */}
        <div className="pt-28 pb-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="text-gray-700 space-y-6">
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
                <p>
                  This Privacy Policy describes how <a href="https://panchito.xyz" target="_blank" rel="noopener noreferrer" className="text-[#0F533A] hover:underline">Panchito Lab</a> ("we," "us," or "our") collects, uses, and discloses your personal information when you visit, use our services, or interact with our platform from021.io (the "Service").
                </p>
                <p>
                  We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data and tell you about your privacy rights.
                </p>
                <p>
                  By using the Service, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
                <h3 className="text-xl font-medium text-gray-900">2.1 Personal Data</h3>
                <p>
                  While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you, including but not limited to:
                </p>
                <ul className="list-disc pl-6">
                  <li>Email address</li>
                  <li>First name and last name</li>
                  <li>Company or organization name</li>
                  <li>Usage data and preferences</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">2.2 Usage Data</h3>
                <p>
                  We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.
                </p>

                <h3 className="text-xl font-medium text-gray-900">2.3 Tracking & Cookies Data</h3>
                <p>
                  We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                </p>
                <p>
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                </p>
                <p>
                  Examples of Cookies we use:
                </p>
                <ul className="list-disc pl-6">
                  <li><strong>Session Cookies:</strong> We use Session Cookies to operate our Service.</li>
                  <li><strong>Preference Cookies:</strong> We use Preference Cookies to remember your preferences and various settings.</li>
                  <li><strong>Security Cookies:</strong> We use Security Cookies for security purposes.</li>
                  <li><strong>Analytics Cookies:</strong> We use analytics tools like Mixpanel to understand how users interact with our platform.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Information</h2>
                <p>
                  We use the collected data for various purposes:
                </p>
                <ul className="list-disc pl-6">
                  <li>To provide and maintain our Service</li>
                  <li>To notify you about changes to our Service</li>
                  <li>To provide customer support</li>
                  <li>To gather analysis or valuable information so that we can improve our Service</li>
                  <li>To monitor the usage of our Service</li>
                  <li>To detect, prevent and address technical issues</li>
                  <li>To personalize and improve your experience with the platform</li>
                  <li>To provide you with news, special offers, and general information about other goods, services, and events which we offer</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. AI Usage & Data Processing</h2>
                <p>
                  Our platform utilizes artificial intelligence (AI) to help create product requirements, technical documentation, and other resources. Here's how we handle data in relation to AI:
                </p>
                <ul className="list-disc pl-6">
                  <li>Data you input for creating product specifications and documentation may be processed by our AI systems to generate recommendations and content.</li>
                  <li>We may use anonymized and aggregated data to improve our AI systems and enhance the Service.</li>
                  <li>When you use our AI features to create documentation, the inputs and generated outputs may be temporarily stored to provide the Service.</li>
                  <li>We do not train our AI models on your confidential information without explicit consent.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">5. Data Sharing and Disclosure</h2>
                <p>
                  We may disclose your personal information in the following situations:
                </p>
                <ul className="list-disc pl-6">
                  <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, and other partners who work on our behalf to help us deliver the Service.</li>
                  <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
                  <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                  <li><strong>With Your Consent:</strong> We may disclose your information for any other purpose with your consent.</li>
                </ul>
                <p>
                  We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">6. Data Retention</h2>
                <p>
                  We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
                </p>
                <p>
                  We will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of our Service, or we are legally obligated to retain this data for longer time periods.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">7. Data Security</h2>
                <p>
                  The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                </p>
                <p>
                  We implement appropriate technical and organizational measures to protect the security of your personal data, including:
                </p>
                <ul className="list-disc pl-6">
                  <li>Encryption of data in transit using HTTPS/TLS</li>
                  <li>Regular security assessments and testing</li>
                  <li>Access controls and authentication measures</li>
                  <li>Monitoring for suspicious activities</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">8. Your Data Rights</h2>
                <p>
                  Depending on your location, you may have certain rights regarding your personal data:
                </p>
                <ul className="list-disc pl-6">
                  <li>The right to access information we hold about you</li>
                  <li>The right to request correction of your personal data</li>
                  <li>The right to request deletion of your personal data</li>
                  <li>The right to restrict or object to processing of your personal data</li>
                  <li>The right to data portability</li>
                  <li>The right to withdraw consent where processing is based on consent</li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us at hello@from021.io. We will respond to your request within 30 days.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">9. Children's Privacy</h2>
                <p>
                  Our Service is not intended for use by children under the age of 16 ("Children"). We do not knowingly collect personally identifiable information from Children. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from Children without verification of parental consent, we take steps to remove that information from our servers.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">10. Changes to This Privacy Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
                </p>
                <p>
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">11. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at hello@from021.io.
                </p>
              </section>

              <div className="pt-10 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
                  Last updated: {currentYear}-03-21
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#0F533A] text-white/90 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 16.5L12 3L19.5 16.5H4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L7.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.5 16.5C4.5 18.5 6 21 12 21C18 21 19.5 18.5 19.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-2xl font-medium">021</span>
                </div>
                <p className="text-white/80 mb-6 max-w-sm">
                  from021 is built by <a href="https://panchito.xyz" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/90 underline">Panchito Lab</a>, where innovation meets rapid execution. We launch MVPs for clients using AI in less than 1 month, and craft our own AI-powered products.
                </p>
                
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Product</h4>
                <ul className="space-y-3">
                  <li><a href="#benefits" className="text-white/70 hover:text-white transition-colors">Benefits</a></li>
                  <li><a href="#workflow" className="text-white/70 hover:text-white transition-colors">Workflow</a></li>
                  <li><a href="#integrations" className="text-white/70 hover:text-white transition-colors">Integrations</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><a href="mailto:hello@from021.io" className="text-white/70 hover:text-white transition-colors">Contact us at hello@from021.io</a></li>
                  <li><Link href="/privacy-policy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms-conditions" className="text-white/70 hover:text-white transition-colors">Terms & Conditions</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
              <p className="text-white/70 mb-4 md:mb-0">© {currentYear} From Zero to One</p>
            </div>
          </div>
        </footer>
      </div>
      <Analytics />
    </>
  );
};

export default PrivacyPolicy; 
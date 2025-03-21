import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/react";

const TermsConditions = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Head>
        <title>Terms and Conditions | 021 - From Zero to One</title>
        <meta name="description" content="Terms and Conditions for 021 - From Zero to One platform" />
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
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
            
            <div className="text-gray-700 space-y-6">
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
                <p>
                  Welcome to 021 - From Zero to One ("we," "our," or "us"). These Terms and Conditions govern your use of our website located at from021.io and our product development platform (collectively, the "Service").
                </p>
                <p>
                  By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">2. Definitions</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"Account"</strong> means a unique account created for you to access our Service.</li>
                  <li><strong>"Company"</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to <a href="https://panchito.xyz" target="_blank" rel="noopener noreferrer" className="text-[#0F533A] hover:underline">Panchito Lab</a>.</li>
                  <li><strong>"Content"</strong> refers to content such as text, images, or other information that can be posted, uploaded, or otherwise made available through the Service.</li>
                  <li><strong>"Service"</strong> refers to the website and the 021 product development platform.</li>
                  <li><strong>"Terms and Conditions"</strong> (also referred to as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li>
                  <li><strong>"Third-party Content"</strong> means content that is owned by third parties that we do not control, but that may be accessed through our Services.</li>
                  <li><strong>"User"</strong> (referred to as either "the User", "You", or "Your" in this Agreement) refers to the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">3. Accounts</h2>
                <p>
                  When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
                <p>
                  You are responsible for safeguarding the password you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                </p>
                <p>
                  You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Intellectual Property</h2>
                <p>
                  The Service and its original content, features, and functionality are and will remain the exclusive property of <a href="https://panchito.xyz" target="_blank" rel="noopener noreferrer" className="text-[#0F533A] hover:underline">Panchito Lab</a> and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of <a href="https://panchito.xyz" target="_blank" rel="noopener noreferrer" className="text-[#0F533A] hover:underline">Panchito Lab</a>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">5. User Content</h2>
                <h3 className="text-xl font-medium text-gray-900">5.1 Your Content</h3>
                <p>
                  Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("User Content").
                </p>
                <p>
                  You are responsible for the User Content that you post to the Service, including its legality, reliability, and appropriateness.
                </p>
                <p>
                  By posting or submitting User Content to the Service, you grant us a worldwide, non-exclusive, royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such Content in any and all media or distribution methods now known or later developed. This license is for the purpose of operating and improving our Service.
                </p>
                
                <h3 className="text-xl font-medium text-gray-900">5.2 AI-Generated Content</h3>
                <p>
                  When you use our Service to generate content using our AI features:
                </p>
                <ul className="list-disc pl-6">
                  <li>You own the output generated by our AI systems based on your inputs.</li>
                  <li>We retain ownership of the underlying AI models and systems.</li>
                  <li>You are responsible for reviewing and ensuring the accuracy and appropriateness of any AI-generated content before use.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">6. Prohibited Uses</h2>
                <p>
                  You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
                </p>
                <ul className="list-disc pl-6">
                  <li>In any way that violates any applicable national or international law or regulation.</li>
                  <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                  <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                  <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                  <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful.</li>
                  <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm the Company or users of the Service or expose them to liability.</li>
                </ul>
                <p>
                  Additionally, you agree not to:
                </p>
                <ul className="list-disc pl-6">
                  <li>Use the Service in any manner that could disable, overburden, damage, or impair the site or interfere with any other party's use of the Service.</li>
                  <li>Use any robot, spider, or other automatic device, process, or means to access the Service for any purpose, including monitoring or copying any of the material on the Service.</li>
                  <li>Use any manual process to monitor or copy any of the material on the Service or for any other unauthorized purpose without our prior written consent.</li>
                  <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service, the server on which the Service is stored, or any server, computer, or database connected to the Service.</li>
                  <li>Attack the Service via a denial-of-service attack or a distributed denial-of-service attack.</li>
                  <li>Otherwise attempt to interfere with the proper working of the Service.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">7. Subscription and Payment</h2>
                <h3 className="text-xl font-medium text-gray-900">7.1 Subscription Terms</h3>
                <p>
                  Some parts of the Service are provided on a subscription basis. You agree to the pricing and payment terms for the subscription plan you select.
                </p>
                <p>
                  We reserve the right to change subscription fees upon reasonable notice. Such notice may be provided at any time by posting the changes to the 021 website or via email.
                </p>
                
                <h3 className="text-xl font-medium text-gray-900">7.2 Free Trial</h3>
                <p>
                  We may offer a free trial of our subscription services. At the end of the free trial period, we will automatically charge the payment method you provided when you signed up for the free trial unless you cancel your subscription prior to the end of the free trial period.
                </p>
                
                <h3 className="text-xl font-medium text-gray-900">7.3 Billing and Cancellation</h3>
                <p>
                  You can cancel your subscription at any time by contacting our customer support team or through your account settings. After cancellation, your subscription will remain active until the end of your current billing period.
                </p>
                <p>
                  We do not provide refunds for partial subscription periods.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">8. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY, ITS AFFILIATES, DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                </p>
                <ul className="list-disc pl-6">
                  <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
                  <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE;</li>
                  <li>ANY CONTENT OBTAINED FROM THE SERVICE; AND</li>
                  <li>UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT,</li>
                </ul>
                <p>
                  WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE) OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">9. Disclaimer</h2>
                <p>
                  YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. THE COMPANY EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p>
                  THE COMPANY MAKES NO WARRANTY THAT (I) THE SERVICE WILL MEET YOUR REQUIREMENTS, (II) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, (III) THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE, OR (IV) THE QUALITY OF ANY PRODUCTS, SERVICES, INFORMATION, OR OTHER MATERIAL PURCHASED OR OBTAINED BY YOU THROUGH THE SERVICE WILL MEET YOUR EXPECTATIONS.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">10. Governing Law</h2>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
                </p>
                <p>
                  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">11. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
                <p>
                  By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">12. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at hello@from021.io.
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

export default TermsConditions; 
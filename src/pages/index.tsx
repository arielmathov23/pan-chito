import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';
import Image from 'next/image';
import { Analytics } from "@vercel/analytics/react";
import { trackEvent } from '../lib/mixpanelClient';

// Define types for geometric elements
interface Rectangle {
  key: string;
  width: number;
  height: number;
  top: number;
  right: number;
  rotation: number;
  opacity: number;
}

interface Circle {
  key: string;
  width: number;
  height: number;
  top: number;
  right: number;
  opacity: number;
}

type GeometricElement = Rectangle | Circle;

const Home = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isHovering, setIsHovering] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Reference to the dropdown menu
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && 
          mobileMenuRef.current && 
          mobileMenuButtonRef.current &&
          !mobileMenuRef.current.contains(event.target as Node) &&
          !mobileMenuButtonRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Refs for parallax elements
  const heroRef = useRef<HTMLDivElement>(null);
  const circleOneRef = useRef<HTMLDivElement>(null);
  const circleTwoRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // Add state for year
  const [currentYear, setCurrentYear] = useState<string>('');
  
  // Add state for random geometric patterns
  const [geometricElements, setGeometricElements] = useState<GeometricElement[]>([]);
  
  // Use useEffect to set the year and generate random elements on client-side only
  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
    
    // Generate geometric elements for the 80/20 section
    const rectangles: Rectangle[] = Array.from({ length: 5 }).map((_, i) => ({
      key: `rect-${i}`,
      width: Math.random() * 100 + 50,
      height: Math.random() * 100 + 50,
      top: Math.random() * 100,
      right: Math.random() * 30,
      rotation: Math.random() * 45,
      opacity: 0.1 + (Math.random() * 0.2)
    }));
    
    const circles: Circle[] = Array.from({ length: 8 }).map((_, i) => ({
      key: `circle-${i + 5}`,
      width: Math.random() * 80 + 20,
      height: Math.random() * 80 + 20,
      top: Math.random() * 100,
      right: Math.random() * 40,
      opacity: 0.1 + (Math.random() * 0.15)
    }));
    
    setGeometricElements([...rectangles, ...circles]);
  }, []);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply parallax effects
  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.style.transform = `translateY(${scrollY * 0.1}px)`;
    }
    if (circleOneRef.current) {
      circleOneRef.current.style.transform = `translate(${scrollY * 0.05}px, ${scrollY * -0.05}px)`;
    }
    if (circleTwoRef.current) {
      circleTwoRef.current.style.transform = `translate(${scrollY * -0.08}px, ${scrollY * 0.08}px)`;
    }
    if (workflowRef.current) {
      workflowRef.current.style.transform = `translateY(${(scrollY - 500) * 0.03}px)`;
    }
    if (aiSectionRef.current) {
      aiSectionRef.current.style.transform = `translateY(${(scrollY - 800) * 0.05}px)`;
    }
    if (benefitsRef.current) {
      benefitsRef.current.style.transform = `translateY(${(scrollY - 300) * 0.03}px)`;
    }
    if (integrationsRef.current) {
      integrationsRef.current.style.transform = `translateY(${(scrollY - 700) * 0.02}px)`;
    }
  }, [scrollY]);

  const handleGetStarted = () => {
    // Track the click event
    trackEvent('Get Started Clicked', {
      'location': 'hero_section',
    });
    
    if (isAuthenticated) {
      router.push('/projects');
    } else {
      router.push('/signup');
       // Store redirect path for after login
       sessionStorage.setItem('redirectAfterLogin', '/projects');
    }
  };

  // Handle scroll to footer for Contact Us
  const handleContactUsClick = () => {
    // Track the click event
    trackEvent('Contact Us Clicked', {
      'location': 'navbar',
    });
    
    // Smooth scroll to footer
    footerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Workflow steps with detailed info
  const workflowSteps = [
    {
      name: "Brief",
      icon: "📝",
      desc: "Define vision & goals",
      details: "Outline product vision, audience, and business objectives."
    },
    {
      name: "Ideation",
      icon: "💡",
      desc: "Prioritize features",
      details: "Use MoSCoW method to prioritize features and create a roadmap."
    },
    {
      name: "PRD",
      icon: "📊",
      desc: "Document requirements",
      details: "Generate Product Requirement Documents with our AI assistant."
    },
    {
      name: "Screens",
      icon: "🖼️",
      desc: "Design the interface",
      details: "Create wireframes and mockups to align all stakeholders."
    },
    {
      name: "Tech Docs",
      icon: "⚙️",
      desc: "Specify implementation",
      details: "Create technical specifications for seamless development handoff."
    },
    {
      name: "Implementation",
      icon: "🚀",
      desc: "Export & execute",
      details: "Export to Trello or AI tools like Lovable/Cursor for development."
    }
  ];

  // Background animation component for subtle matrix effect
  const MatrixBackground = () => {
    const [matrixElements, setMatrixElements] = useState<Array<{
      key: number;
      left: string;
      top: string;
      animation: string;
      delay: string;
      opacity: number;
      value: string;
    }>>([]);
    
    useEffect(() => {
      const elements = Array.from({ length: 40 }).map((_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `fall ${Math.random() * 15 + 10}s linear infinite`,
        delay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.5 + 0.1,
        value: Math.random() > 0.5 ? '0' : '1'
      }));
      
      setMatrixElements(elements);
    }, []);
    
    if (matrixElements.length === 0) {
      return null; // Return nothing during server-side rendering
    }
    
    return (
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 overflow-hidden">
          {matrixElements.map((element) => (
            <div 
              key={element.key}
              className="absolute text-[#0F533A]"
              style={{
                left: element.left,
                top: element.top,
                animation: element.animation,
                animationDelay: element.delay,
                opacity: element.opacity
              }}
            >
              {element.value}
            </div>
          ))}
        </div>
        <style jsx>{`
          @keyframes fall {
            0% {
              transform: translateY(-100vh);
            }
            100% {
              transform: translateY(100vh);
            }
          }
        `}</style>
      </div>
    );
  };

  // Mobile menu portal component - ensures no transparency issues
  const MobileMenu = () => {
    if (!isMobileMenuOpen) return null;
    
    return (
      <div className="fixed top-16 right-4 z-50 md:hidden">
        <div ref={mobileMenuRef} className="w-56 bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100/30 backdrop-blur-sm">
          <div className="flex flex-col divide-y divide-gray-100/50">
            <button 
              onClick={() => {
                document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' });
                setIsMobileMenuOpen(false);
              }}
              className="px-6 py-4 text-gray-800 hover:bg-gray-50 text-left flex items-center transition-colors"
            >
              
              Features
            </button>
            <button 
              onClick={() => {
                handleContactUsClick();
                setIsMobileMenuOpen(false);
              }}
              className="px-6 py-4 text-gray-800 hover:bg-gray-50 text-left flex items-center transition-colors"
            >
            
              Contact Us
            </button>
            {!isAuthenticated ? (
              <>
                <Link 
                  href="/login" 
                  className="px-6 py-4 text-gray-800 hover:bg-gray-50 text-left flex items-center transition-colors"
                  onClick={() => {
                    sessionStorage.setItem('redirectAfterLogin', '/projects');
                    setIsMobileMenuOpen(false);
                  }}
                >
               
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="px-6 py-4 bg-gradient-to-r from-[#0F533A] to-[#16a34a] text-white text-left flex items-center transition-colors"
                  onClick={() => {
                    sessionStorage.setItem('redirectAfterLogin', '/projects');
                    setIsMobileMenuOpen(false);
                  }}
                >
                
                  Get Started
                </Link>
              </>
            ) : (
              <Link 
                href="/projects" 
                className="px-6 py-4 bg-gradient-to-r from-[#0F533A] to-[#16a34a] text-white text-left flex items-center transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Go to app
              </Link>
            )}
            <div className="divide-y divide-gray-100/50">
              <Link 
                href="/privacy-policy" 
                className="px-6 py-3 text-gray-600 hover:bg-gray-50 text-left flex items-center transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms-conditions" 
                className="px-6 py-3 text-gray-600 hover:bg-gray-50 text-left flex items-center transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>021 - From Zero to One | AI-Powered Product Development Platform</title>
        <meta name="description" content="Transform your product development process with AI-powered workflows. From concept to implementation, all in one platform." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white overflow-hidden">
        {/* Subtle Matrix Background */}
        <MatrixBackground />
        
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
            
            {/* Mobile Menu Button */}
            <button 
              ref={mobileMenuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 z-50 focus:outline-none"
              aria-label="Toggle menu"
              style={{ position: 'relative', zIndex: 50 }}
            >
              <span className="sr-only">Open menu</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-800" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {!isLoading && (
                <>
                  {!isAuthenticated ? (
                    <>
                      <button 
                        onClick={() => document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-gray-800 hover:text-[#0F533A] transition-colors font-medium relative group"
                      >
                        Features
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F533A] transition-all group-hover:w-full"></div>
                      </button>
                      <button 
                        onClick={handleContactUsClick}
                        className="text-gray-800 hover:text-[#0F533A] transition-colors font-medium relative group"
                      >
                        Contact Us
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F533A] transition-all group-hover:w-full"></div>
                      </button>
                      <Link 
                        href="/login" 
                        className="text-gray-800 hover:text-[#0F533A] transition-colors font-medium relative group"
                        onClick={() => sessionStorage.setItem('redirectAfterLogin', '/projects')}
                      >
                        Login
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F533A] transition-all group-hover:w-full"></div>
                      </Link>
                      <Link 
                        href="/signup" 
                        className="relative group overflow-hidden bg-[#0F533A] px-6 py-2 rounded-full"
                        onClick={() => sessionStorage.setItem('redirectAfterLogin', '/projects')}
                      >
                        <span className="relative z-10 text-white font-medium">Get Started</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#16a34a] to-[#0F533A] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-gray-800 hover:text-[#0F533A] transition-colors font-medium relative group"
                      >
                        Features
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F533A] transition-all group-hover:w-full"></div>
                      </button>
                      <button 
                        onClick={handleContactUsClick}
                        className="text-gray-800 hover:text-[#0F533A] transition-colors font-medium relative group"
                      >
                        Contact Us
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F533A] transition-all group-hover:w-full"></div>
                      </button>
                      <Link 
                        href="/projects" 
                        className="relative group overflow-hidden bg-[#0F533A] px-6 py-2 rounded-full"
                      >
                        <span className="relative z-10 text-white font-medium">Go to app</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#16a34a] to-[#0F533A] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-[#0F533A]/5">
          {/* Decorative elements with parallax */}
          <div ref={circleOneRef} className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-[#0F533A]/10 to-[#16a34a]/10 blur-3xl transition-transform duration-200 ease-out"></div>
          <div ref={circleTwoRef} className="absolute bottom-20 left-[10%] w-96 h-96 rounded-full bg-gradient-to-tr from-[#0F533A]/10 to-[#16a34a]/10 blur-3xl transition-transform duration-200 ease-out"></div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div ref={heroRef} className="relative z-10 transition-transform duration-200 ease-out">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#0F533A]/30 text-[#0F533A] text-sm font-medium mb-4">
                  <span>From vague ideas to solid products</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
                  From <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-br from-[#0F533A] to-[#16a34a] bg-clip-text text-transparent transition-opacity duration-1000">ZERO</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0F533A]/20 to-[#16a34a]/20 blur-lg opacity-75"></div>
                  </span><br /> 
                  to <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-br from-[#0F533A] to-[#16a34a] bg-clip-text text-transparent transition-opacity duration-1000">ONE</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0F533A]/20 to-[#16a34a]/20 blur-lg opacity-75"></div>
                  </span>
                </h1>
                <p className="mt-8 text-xl text-gray-600 leading-relaxed max-w-lg">
                  <span className="font-semibold bg-gradient-to-r from-[#0F533A] to-[#16a34a] bg-clip-text text-transparent">Define your products right the first time, in minutes.</span> No coding yet, no endless tweaks later. Just clear, actionable specs from day one.
                </p>
                
                {/* Platform Logos */}
                <div className="mt-8 flex items-center">
                  <span className="text-gray-600 font-medium mr-4">Integrated with:</span>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Image 
                      src="/cursor.jpg" 
                      alt="Cursor" 
                      width={32} 
                      height={32} 
                      className="rounded-md hover:scale-105 transition-transform"
                    />
                    <Image 
                      src="/replit.png" 
                      alt="Replit" 
                      width={32} 
                      height={32} 
                      className="rounded-md hover:scale-105 transition-transform"
                    />
                    <Image 
                      src="/lovable.jpeg" 
                      alt="Lovable" 
                      width={32} 
                      height={32} 
                      className="rounded-md hover:scale-105 transition-transform"
                    />
                    <Image 
                      src="/trello.png" 
                      alt="Trello" 
                      width={32} 
                      height={32} 
                      className="rounded-md hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  <button
                    onClick={() => {
                      trackEvent('Get Started Clicked', {
                        'location': 'cta_section',
                      });
                      handleGetStarted();
                    }}
                    className="group relative overflow-hidden bg-[#0F533A] text-white px-8 py-4 rounded-full text-lg font-medium transition-all w-full sm:w-auto"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#16a34a] to-[#0F533A] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                  <a 
                    href="#ai-assistant" 
                    className="group relative overflow-hidden px-8 py-4 rounded-full text-lg font-medium transition-all border border-gray-200 hover:border-[#0F533A]/20 w-full sm:w-auto text-center"
                  >
                    <span className="relative z-10 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent group-hover:from-[#0F533A] group-hover:to-[#16a34a]">See Benefits</span>
                  </a>
                </div>
                <p className="mt-3 text-center sm:text-left sm:pl-4 text-gray-500 text-sm">
                  Free trial — No credit card needed
                </p>
              </div>
              
              {/* Hero Image/Video */}
              <div className="relative w-full max-w-2xl mx-auto mt-12 rounded-xl overflow-hidden shadow-2xl">
                <div style={{ position: 'relative', paddingBottom: '62.5%', height: 0 }}>
                  <video
                    src="/021videointro.mp4"
                    autoPlay
                    muted
                    playsInline
                    controls
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '0.75rem', objectFit: 'cover' }}
                  ></video>
                </div>
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Work Process Section */}
<section id="workflow" className="pt-12 pb-32 px-6 relative bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mx-auto max-w-3xl mb-8">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                Get your product documentation ready <span className="hidden md:inline">in minutes</span>
                <span className="md:hidden">in minutes</span>
              </h2>
              <p className="mt-2 text-lg text-gray-500">
                Our streamlined process takes you from idea to implementation
              </p>
            </div>
            
            <div ref={workflowRef} className="transition-transform duration-200 ease-out">
              {/* Workflow Steps with connecting paths */}
              <div className="relative">
                {/* Workflow path line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 hidden md:block"></div>
                
                <div className="grid md:grid-cols-6 gap-6 gap-y-16 relative">
                  {workflowSteps.map((step, i) => (
                    <div 
                      key={i} 
                      className="group relative"
                      onMouseEnter={() => i !== 5 && setActiveWorkflowStep(i)}
                      onMouseLeave={() => i !== 5 && setActiveWorkflowStep(0)}
                    >
                      {/* Step number with active indicator */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all
                          ${i === 5 ? 'bg-purple-700 text-white border-purple-700' : 
                            (activeWorkflowStep === i ? 'bg-[#0F533A] text-white border-[#0F533A]' : 'bg-white text-gray-500 border-gray-300')}`}>
                          {i + 1}
                        </div>
                      </div>
                      
                      {/* Content card */}
                      <div className={`relative z-10 bg-white border rounded-xl p-6 transition-all ${
                        i === 5 ? 'border-purple-700 shadow-md' : 
                          (activeWorkflowStep === i ? 'border-[#0F533A] shadow-md' : 'border-gray-200 shadow-sm')
                      }`}>
                        <div className="mb-4 flex justify-center">
                          <div className={`w-16 h-16 flex items-center justify-center text-2xl rounded-full transition-transform ${
                            i === 5 ? 'bg-purple-100 scale-110' : 
                              (activeWorkflowStep === i ? 'bg-[#0F533A]/10 scale-110' : 'bg-gray-100')
                          }`}>
                            {step.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">{step.name}</h3>
                        <p className="text-sm text-gray-500 text-center mb-4">{step.desc}</p>
                        <p className={`text-sm transition-all text-center ${
                          i === 5 ? 'text-gray-700' : 
                            (activeWorkflowStep === i ? 'text-gray-700' : 'text-gray-400')
                        }`}>
                          {step.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Why Choose 021 */}
        <section id="benefits" className="py-4 pt-4 md:py-4 md:pt-2 md:-mt-8 bg-gradient-to-b from-white to-gray-50 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">Stop the guesswork and iterations</h2>
              <p className="mt-3 text-xl text-gray-500">
                Why 021 is a game-changer in product creation 
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  title: "Better Decisions, Faster",
                  description: "Make critical product decisions with confidence and speed. Better decisions = better products.",
                  icon: "🚀"
                },
                {
                  title: "Save Development Time",
                  description: "Crystal-clear specs mean faster builds, no rework. Launches that hit deadlines.",
                  icon: "⏱️"
                },
                {
                  title: "Eliminate Ambiguity",
                  description: "Create precise requirements that leave no room for misinterpretation.",
                  icon: "🎯"
                },
                {
                  title: "Improve Team Alignment",
                  description: "Keep everyone on the same page with shared documentation.",
                  icon: "🤝"
                }
              ].map((benefit, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-[#0F533A]/20 transition-all">
                  <div className="text-2xl mb-3">{benefit.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
            


            {/* AI Capabilities Section */}
        <section id="ai-assistant" className="py-20 px-6 bg-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Your AI assistant for product definition</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Transform how you define and build products with our AI-driven approach
              </p>
            </div>
            
            <div className="relative">
              {/* Central AI Core */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#0F533A] to-[#16a34a]/30 transform -translate-x-1/2 hidden md:block"></div>
              
              <div className="space-y-12">
                {/* Ideation Phase */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-5/12 p-6 order-2 md:order-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ideation & Research</h3>
                    <p className="text-gray-600 mb-4">Transform rough concepts into comprehensive briefs with market analysis and risk assessment in minutes, not weeks.</p>
                  </div>
                  <div className="w-full md:w-2/12 flex justify-center items-center py-6 order-1 md:order-2">
                    <div className="w-16 h-16 rounded-full bg-[#0F533A]/10 flex items-center justify-center border-4 border-white shadow-lg relative z-10">
                      <div className="w-8 h-8 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold">1</div>
                    </div>
                  </div>
                  <div className="w-full md:w-5/12 p-6 order-3">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 rounded-full bg-[#0F533A] mr-2"></div>
                        <h4 className="font-semibold text-gray-900">Comprehensive Brief Creation</h4>
                      </div>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#0F533A] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span>Define product scope & vision</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#0F533A] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span>Market opportunity analysis</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#0F533A] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span>Risk assessment & mitigation</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Definition Phase */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-5/12 p-6 order-3 md:order-1">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center mb-5">
                        <div className="w-3 h-3 rounded-full bg-[#16a34a] mr-2.5"></div>
                        <h4 className="font-semibold text-gray-900">Feature Prioritization</h4>
                      </div>
                      <div className="space-y-5">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-sm">MUST</span>
                              <span className="ml-2.5 text-sm font-medium text-gray-800">User Authentication</span>
                            </div>
                            <span className="text-xs font-medium text-[#0F533A]">90%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-[#0F533A] to-[#16a34a] h-2 rounded-full" style={{ width: '90%' }}></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-sm">SHOULD</span>
                              <span className="ml-2.5 text-sm font-medium text-gray-800">Dashboard Interface</span>
                            </div>
                            <span className="text-xs font-medium text-[#0F533A]">75%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-[#0F533A] to-[#16a34a] h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-sm">COULD</span>
                              <span className="ml-2.5 text-sm font-medium text-gray-800">Analytics Module</span>
                            </div>
                            <span className="text-xs font-medium text-[#0F533A]">60%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-[#0F533A] to-[#16a34a] h-2 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm">WON'T</span>
                              <span className="ml-2.5 text-sm font-medium text-gray-800">Social Sharing</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500">Deferred</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-gray-300 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-2/12 flex justify-center items-center py-6 order-1 md:order-2">
                    <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 flex items-center justify-center border-4 border-white shadow-lg relative z-10">
                      <div className="w-8 h-8 rounded-full bg-[#16a34a] flex items-center justify-center text-white font-bold">2</div>
                    </div>
                  </div>
                  <div className="w-full md:w-5/12 p-6 order-2 md:order-3">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Product Definition</h3>
                    <p className="text-gray-600 mb-4">Create detailed product specifications with AI assistance. Prioritize features using the MoSCoW method and generate user stories automatically.</p>
                  </div>
                </div>
                
                {/* Technical Specs Phase */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-5/12 p-6 order-2 md:order-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Technical Specifications</h3>
                    <p className="text-gray-600 mb-4">Convert product requirements into detailed technical specifications. Our AI suggests app flow, architecture, data models, and API endpoints based on your needs.</p>
                  </div>
                  <div className="w-full md:w-2/12 flex justify-center items-center py-6 order-1 md:order-2">
                    <div className="w-16 h-16 rounded-full bg-[#0F533A]/10 flex items-center justify-center border-4 border-white shadow-lg relative z-10">
                      <div className="w-8 h-8 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold">3</div>
                    </div>
                  </div>
                  <div className="w-full md:w-5/12 p-6 order-3">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 rounded-full bg-[#0F533A] mr-2"></div>
                        <h4 className="font-semibold text-gray-900">Technical Blueprint</h4>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 bg-gray-50">
                        <pre className="whitespace-pre-wrap">
{`// Technical Specification
{
  "stack": "Next.js + Tailwind + PostgreSQL",
  "architecture": "Serverless API + Edge Functions",
  "ui": {
    "theme": "Light with dark mode toggle",
    "colors": ["#0F533A", "#16a34a", "#f8fafc"],
    "components": "Shadcn UI library"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


            {/* 80/20 Rule Banner */}
            <div className="w-screen relative overflow-hidden mb-0 md:mb-0" style={{ marginLeft: 'calc(-50vw + 50%)', width: '100vw' }}>
              <div className="absolute inset-0 bg-[#1e2937] bg-opacity-95"></div>
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                {/* Animated lines */}
                <div className="absolute inset-0 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-px bg-gradient-to-r from-[#0F533A]/0 via-[#0F533A] to-[#0F533A]/0"
                      style={{
                        top: `${30 * (i + 1)}%`,
                        left: '-100%',
                        right: '-100%',
                        animation: `slide ${15 + i * 5}s linear infinite`,
                        opacity: 0.2
                      }}
                    />
                  ))}
                </div>
                
                {/* Geometric pattern on the right */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden hidden md:block">
                  <div className="absolute inset-0 opacity-20">
                    {geometricElements.slice(0, 5).map((rect) => (
                      <div 
                        key={rect.key}
                        className="absolute bg-[#0F533A]"
                        style={{
                          width: `${rect.width}px`,
                          height: `${rect.height}px`,
                          top: `${rect.top}%`,
                          right: `${rect.right}%`,
                          transform: `rotate(${(rect as Rectangle).rotation}deg)`,
                          opacity: rect.opacity
                        }}
                      />
                    ))}
                    {geometricElements.slice(5).map((circle) => (
                      <div 
                        key={circle.key}
                        className="absolute rounded-full border border-[#0F533A]/30"
                        style={{
                          width: `${circle.width}px`,
                          height: `${circle.height}px`,
                          top: `${circle.top}%`,
                          right: `${circle.right}%`,
                          opacity: circle.opacity
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start md:justify-start gap-12">
                  <div className="flex items-center space-x-6 mb-8 md:mb-0">
                    <div className="w-28 h-28 bg-[#0F533A] rounded-lg flex flex-col items-center justify-center font-mono text-white border border-[#0F533A]/20">
                      <span className="font-light text-3xl">80<span className="text-sm opacity-60">%</span></span>
                      <span className="text-xs mt-1 opacity-70 tracking-wider">PLANNING</span>
                    </div>
                    <div className="w-28 h-28 bg-[#2a3441] backdrop-blur-sm rounded-lg flex flex-col items-center justify-center font-mono text-white border border-white/10">
                      <span className="font-light text-3xl">20<span className="text-sm opacity-60">%</span></span>
                      <span className="text-xs mt-1 opacity-70 tracking-wider">EXECUTION</span>
                    </div>
                  </div>
                  <div className="md:ml-8 text-left max-w-md">
                  
                    <h3 className="text-4xl font-light text-white mb-3 flex items-center">
                      The 80/20 Rule of Product Success
                      <span className="ml-4 hidden md:inline-flex items-center">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span 
                            key={i} 
                            className="h-px bg-gradient-to-r from-[#0F533A] to-white/20"
                            style={{ 
                              width: `${30 + i * 15}px`, 
                              marginLeft: '4px',
                              opacity: 0.6 - (i * 0.15)
                            }}
                          ></span>
                        ))}
                      </span>
                    </h3>
                    <p className="text-white/70 font-light text-lg leading-relaxed mb-4">
                      AI-powered planning transforms your product development economics. Invest 80% in precise planning with our AI tools, and watch development costs drop as execution becomes streamlined and focused.
                    </p>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        trackEvent('Get Started Clicked', {
                          'location': '80_20_section',
                        });
                        handleGetStarted();
                      }} 
                      className="inline-flex items-center text-white hover:text-[#16a34a] transition-colors text-sm font-medium"
                    >
                      <span>Start planning smarter</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <style jsx>{`
                @keyframes slide {
                  0% {
                    transform: translateX(-100%);
                  }
                  100% {
                    transform: translateX(100%);
                  }
                }
              `}</style>
            </div>
          </div>
        </section>
        
        {/* Integrations Section */}
        <section id="integrations" ref={integrationsRef} className="pt-0 pb-20 md:pb-24 px-6 bg-white relative overflow-hidden -mt-8 md:mt-0">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Seamless integrations</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Connect with your favorite tools for a smooth workflow
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 mb-20">
              {/* Project Management Tools */}
              <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Project Management
                </h3>
                <p className="text-gray-600 mb-8">
                  Export features to project management tools for team collaboration.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Trello", logo: "/trello.png" },
                    { name: "ClickUp", logo: "/clickup.png" },
                    { name: "JIRA", logo: "/jira.png" }
                  ].map((tool, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-all transform hover:-translate-y-1">
                      {typeof tool.logo === 'string' && tool.logo.startsWith('/') ? (
                        <Image
                          src={tool.logo}
                          alt={tool.name}
                          width={40}
                          height={40}
                          className="mb-2"
                        />
                      ) : (
                        <div className="text-2xl mb-2">{tool.logo}</div>
                      )}
                      <div className="font-medium text-gray-800">{tool.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Code Editors */}
              <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  AI Development
                </h3>
                <p className="text-gray-600 mb-8">
                  Export AI prompts to instantly create a working prototype of your product in your favorite code editor, saving weeks of development time.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Cursor", logo: "/cursor.jpg" },
                    { name: "Replit", logo: "/replit.png" },
                    { name: "Lovable", logo: "/lovable.jpeg" }
                  ].map((editor, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-all transform hover:-translate-y-1">
                      <Image
                        src={editor.logo}
                        alt={editor.name}
                        width={48}
                        height={48}
                        className="rounded-lg mb-3"
                      />
                      <div className="font-medium text-gray-800">{editor.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        
        
        {/* Target Audience Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-[#0F533A]/5 via-white to-white relative overflow-hidden mt-24 md:mt-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Tailored for your team</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Supporting diverse teams with specialized tools for their unique product development needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Software Factories */}
              <div className="bg-white rounded-xl p-6 border-t-4 border border-t-[#0F533A] border-gray-200 shadow-sm transform transition-transform hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0F533A]/10 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#0F533A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Software Agencies</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Transform client requirements into precise specifications that streamline development, improve client communication, and reduce project ambiguity.
                </p>
                <div className="text-sm text-[#0F533A] font-medium">
                  Perfect for: Agencies, Consultancies, Development Studios
                </div>
              </div>
              
              {/* Product Teams */}
              <div className="bg-white rounded-xl p-6 border-t-4 border border-t-[#16a34a] border-gray-200 shadow-sm transform transition-transform hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#16a34a]/10 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#16a34a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Product Teams</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Generate complete product documentation in minutes—from user stories and PRDs to UI specifications and technical requirements—all in one platform.
                </p>
                <div className="text-sm text-[#16a34a] font-medium">
                  Perfect for: Product Managers, UX/UI Designers, Researchers
                </div>
              </div>
              
              {/* Founders & Startups */}
              <div className="bg-white rounded-xl p-6 border-t-4 border border-t-[#0c4a6e] border-gray-200 shadow-sm transform transition-transform hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0c4a6e]/10 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#0c4a6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Founders & Startups</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Reduce time-to-market with structured product planning that turns your vision into actionable roadmaps and solid products.
                </p>
                <div className="text-sm text-[#0c4a6e] font-medium">
                  Perfect for: Solo Founders, Early-stage Startups, Bootstrapped Ventures
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-[#0F533A]/10 via-white to-[#16a34a]/10 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#0F533A]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-gradient-to-tr from-[#16a34a]/10 to-transparent rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to build better products?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join forward-thinking teams who are revolutionizing how products are built. Start your journey from zero to one today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => {
                  trackEvent('Get Started Clicked', {
                    'location': 'cta_section',
                  });
                  handleGetStarted();
                }}
                className="bg-[#0F533A] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#0F533A]/90 transition-all transform hover:-translate-y-1 hover:shadow-xl group"
              >
                Get Started Now
                <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <a 
                href="#workflow" 
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-medium border border-[#0F533A]/20 hover:border-[#0F533A] text-gray-600 hover:text-[#0F533A] transition-all"
              >
                See How It Works
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer ref={footerRef} className="bg-[#0F533A] text-white/90 py-16 px-6">
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
      <MobileMenu />
    </>
  );
};

export default Home; 
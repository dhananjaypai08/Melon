'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      title: "Instant verification",
      description: "Get results in seconds.",
      icon: "⚡"
    },
    {
      title: "Hardware-level trust",
      description: "Powered by device signatures + metadata.",
      icon: "🔒"
    },
    {
      title: "Tamper detection",
      description: "Catch altered or stripped images.",
      icon: "🛡️"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Upload your photo",
      description: "Drag and drop or select your image file",
      icon: "📤"
    },
    {
      step: "2", 
      title: "We verify the proof",
      description: "Signature + metadata validation",
      icon: "🔍"
    },
    {
      step: "3",
      title: "Get your certificate",
      description: "Badge + downloadable proof",
      icon: "🏆"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 leading-[0.9] tracking-tight">
              <span className="gradient-text block">Verify any photo.</span>
              <span className="gradient-text-accent block mt-4">Prove it's real.</span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
              Upload a picture and instantly check if it was truly captured on a specific device, backed by proof metadata.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button className="group relative inline-flex items-center justify-center px-8 py-4 sm:px-12 sm:py-5 text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl">
                <span className="relative z-10">Verify a photo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 sm:px-12 sm:py-5 text-lg sm:text-xl font-semibold text-gray-300 border border-gray-600 rounded-full hover:border-gray-500 hover:text-white transition-all duration-300">
                Learn more
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 sm:py-40 lg:py-48 px-6 sm:px-8 lg:px-12 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-20 sm:mb-24 lg:mb-32 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 sm:mb-10 leading-[0.9] tracking-tight">
              Photo authenticity, <span className="gradient-text">made simple</span>
            </h2>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
              No more guessing if an image is real or tampered. Our platform makes proof transparent and instant.
            </p>
          </div>

          {/* Feature Cards - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`glass rounded-3xl p-8 lg:p-10 text-center hover:scale-105 transition-all duration-300 group h-full flex flex-col justify-between ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${400 + index * 200}ms`}}
              >
                <div>
                  <div className="text-6xl lg:text-7xl mb-8 lg:mb-10 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 gradient-text">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-300 text-lg lg:text-xl leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        </div>
      </div>

      {/* How it Works Section */}
      <section className="py-32 sm:py-40 lg:py-48 px-6 sm:px-8 lg:px-12 relative bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-20 sm:mb-24 lg:mb-32 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '1200ms'}}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 sm:mb-10 leading-[0.9] tracking-tight">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
              Just three steps. Simple, fast, and private.
            </p>
          </div>

          {/* Horizontal Timeline */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 transform -translate-y-1/2 z-0 rounded-full"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-12">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`relative z-10 text-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{transitionDelay: `${1400 + index * 200}ms`}}
                >
                  {/* Step Icon */}
                  <div className="glass rounded-full w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center mx-auto mb-8 lg:mb-10 group hover:scale-110 transition-all duration-300">
                    <span className="text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </span>
                  </div>
                  
                  {/* Step Number */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center mx-auto mb-6 lg:mb-8 font-bold text-xl lg:text-2xl shadow-lg">
                    {step.step}
                  </div>
                  
                  {/* Step Content */}
                  <div className="space-y-4 lg:space-y-6">
                    <h3 className="text-2xl lg:text-3xl font-bold gradient-text">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 text-lg lg:text-xl leading-relaxed max-w-sm mx-auto font-light">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 sm:py-32 lg:py-40 px-6 sm:px-8 lg:px-12 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-6 sm:mb-8">
            PhotoVerify
          </div>
          <p className="text-gray-400 text-lg sm:text-xl lg:text-2xl mb-10 sm:mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Cryptographic proof for photo authenticity
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-lg sm:text-xl text-gray-500">
            <a href="#" className="hover:text-white transition-colors duration-300 font-medium">Privacy</a>
            <a href="#" className="hover:text-white transition-colors duration-300 font-medium">Terms</a>
            <a href="#" className="hover:text-white transition-colors duration-300 font-medium">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

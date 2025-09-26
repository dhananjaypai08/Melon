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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-4 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-4 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 text-center max-w-7xl mx-auto w-full">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 font-medium tracking-wide">
              Photo authenticity, reimagined
            </p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-tight">
              <span className="gradient-text block">Verify any photo.</span>
              <span className="gradient-text-accent block mt-2">Prove it's real.</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              Upload a picture and instantly check if it was truly captured on a specific device, backed by proof metadata.
            </p>
            <div className="flex justify-center">
              <button className="group relative inline-flex items-center justify-center px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 animate-pulse-glow shadow-2xl">
                <span className="relative z-10">Verify a photo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              Photo authenticity, <span className="gradient-text">made simple</span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
              No more guessing if an image is real or tampered. Our platform makes proof transparent and instant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16 lg:mb-20">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`glass rounded-2xl p-6 sm:p-8 text-center hover:scale-105 transition-all duration-300 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${400 + index * 200}ms`}}
              >
                <div className="text-3xl sm:text-4xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 gradient-text">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mockup section */}
          <div className={`glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '1000ms'}}>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Verification Screen</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="w-full h-24 sm:h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  📸 Photo Preview
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3">
                <span className="text-green-400 text-sm sm:text-base">✅</span>
                <span className="text-green-400 font-semibold text-sm sm:text-base">Verified</span>
                <span className="text-gray-400 text-xs sm:text-sm">(Device ID: XXXX)</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                Device: iPhone 15 Pro • Timestamp: 2024-01-15 14:30:22
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-12 sm:mb-16 lg:mb-20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '1200ms'}}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              Just three steps. Simple, fast, and private.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 transform -translate-y-1/2 z-0"></div>
            
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`relative z-10 text-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${1400 + index * 200}ms`}}
              >
                <div className="glass rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group hover:scale-110 transition-all duration-300">
                  <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 sm:mb-4 font-bold text-sm">
                  {step.step}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 gradient-text">
                  {step.title}
                </h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text mb-3 sm:mb-4">
            PhotoVerify
          </div>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
            Cryptographic proof for photo authenticity
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm sm:text-base text-gray-500">
            <a href="#" className="hover:text-white transition-colors duration-300">Privacy</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Terms</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

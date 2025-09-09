import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Fingerprint, 
  Shield, 
  MapPin, 
  BarChart3, 
  Smartphone,
  Camera,
  CheckCircle,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: Fingerprint,
      title: 'Smart Time Tracking',
      description: 'Automated attendance tracking with multiple daily sessions and break management.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Camera,
      title: 'Facial Recognition',
      description: 'AI-powered face detection for secure and contactless check-in/out.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: MapPin,
      title: 'Location Verification',
      description: 'GPS-based location restrictions ensure employees check-in from authorized locations.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive reports and insights with data export capabilities.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Row-level security, encrypted data, and role-based access control.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Works seamlessly across all devices - desktop, tablet, and mobile.',
      color: 'from-teal-500 to-blue-500'
    }
  ];

  const benefits = [
    'Reduce time theft and buddy punching',
    'Streamline payroll processing',
    'Ensure compliance with labor laws',
    'Improve employee accountability',
    'Real-time attendance monitoring',
    'Automated overtime calculations'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-white/20 fixed w-full top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                TrackPoint
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-52 pb-24 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Advanced Biometric
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Workforce Management
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Experience enterprise-grade attendance tracking with facial recognition technology, 
              real-time analytics, and comprehensive workforce optimization.
            </p>
            <div className="flex justify-center items-center mb-12">
              <Link
                to="/register"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how TrackPoint revolutionizes workforce management with cutting-edge biometric technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-emerald-200 transform hover:-translate-y-2"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why Choose TrackPoint?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of companies that trust TrackPoint for their biometric workforce management needs.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">Trusted by 1000+ Companies</h4>
                    <p className="text-gray-600">From startups to enterprises</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-2">99.9<span className="text-2xl lg:text-3xl">%</span></div>
                    <div className="text-gray-600 font-medium">Accuracy Rate</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-2">50K+</div>
                    <div className="text-gray-600 font-medium">Active Users</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-2">24/7</div>
                    <div className="text-gray-600 font-medium">Support</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-2">500+</div>
                    <div className="text-gray-600 font-medium">Companies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Workforce Management?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using TrackPoint's free biometric technology to streamline attendance tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white/90 backdrop-blur-xl text-emerald-600 hover:bg-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="border-2 border-white/80 text-white hover:bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 sm:mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4 sm:mb-6">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Fingerprint className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">TrackPoint</h3>
              </div>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 max-w-md mx-auto sm:mx-0">
                Advanced biometric workforce management solution. Free, secure, and built for modern businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
                <div className="bg-emerald-600/20 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-emerald-500/30">
                  <span className="text-emerald-400 font-semibold text-xs sm:text-sm">100% Free</span>
                </div>
                <div className="bg-teal-600/20 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-teal-500/30">
                  <span className="text-teal-400 font-semibold text-xs sm:text-sm">Open Source</span>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="text-center sm:text-left">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Features</h4>
              <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" />
                  <span>Facial Recognition</span>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" />
                  <span>Location Tracking</span>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-time Analytics</span>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400 flex-shrink-0" />
                  <span>Mobile Responsive</span>
                </li>
              </ul>
            </div>
            
            {/* Quick Links */}
            <div className="text-center sm:text-left">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Links</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li>
                  <Link to="/register" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 block">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 block">
                    Sign In
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 block">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 block">
                    Benefits
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-700/50 pt-6 sm:pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="text-gray-400 text-center lg:text-left">
                <p className="text-sm sm:text-base">&copy; 2025 TrackPoint. Built with React, TypeScript & Supabase.</p>
                <p className="mt-1 text-xs sm:text-sm">Developed By Phyo Min Thein</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Shield className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-400" />
                  <span className="text-xs sm:text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Zap className="w-3 sm:w-4 h-3 sm:h-4 text-teal-400" />
                  <span className="text-xs sm:text-sm">Lightning Fast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

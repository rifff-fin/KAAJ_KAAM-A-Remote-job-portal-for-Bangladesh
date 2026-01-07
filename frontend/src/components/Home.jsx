import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Briefcase, Shield, MessageSquare, TrendingUp, Star, 
  Zap, CheckCircle, Users, Code, Palette, Video, 
  FileText, Bot, Sparkles, Globe, Clock, DollarSign,
  Search, ArrowRight, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import hero from "../assets/hero-illustration.png";
import { AUTH_CHANGE_EVENT, getUser } from "../utils/auth";
import SearchBar from "./SearchBar";

export default function Home() {
  const [user, setUser] = useState(getUser());
  const [liveActivity, setLiveActivity] = useState([
    { icon: "💼", text: "Rifat just hired a UI Designer", time: "2 mins ago" },
    { icon: "💰", text: "Mridul earned ৳5,000 from Logo Design", time: "5 mins ago" },
    { icon: "🚀", text: "Web Dev job posted", time: "3 mins ago" },
  ]);

  const stats = {
    freelancers: 1200,
    jobs: 850,
    paid: 12000000,
    success: 95
  };

  const categories = [
    { name: "Graphics & Design", icon: Palette, color: "from-pink-500 to-rose-500", count: "200+ gigs" },
    { name: "Web Development", icon: Code, color: "from-blue-500 to-cyan-500", count: "150+ gigs" },
    { name: "Mobile Apps", icon: Briefcase, color: "from-purple-500 to-indigo-500", count: "100+ gigs" },
    { name: "Video Editing", icon: Video, color: "from-orange-500 to-amber-500", count: "80+ gigs" },
    { name: "Content Writing", icon: FileText, color: "from-green-500 to-emerald-500", count: "120+ gigs" },
    { name: "AI & Automation", icon: Bot, color: "from-violet-500 to-purple-500", count: "60+ gigs" },
  ];

  const howItWorks = {
    clients: [
      { step: "1", title: "Post a job", desc: "Describe what you need" },
      { step: "2", title: "Choose freelancer", desc: "Review proposals & hire" },
      { step: "3", title: "Pay safely", desc: "Funds held in escrow" },
      { step: "4", title: "Get work done", desc: "Approve & release payment" },
    ],
    freelancers: [
      { step: "1", title: "Create gig", desc: "Showcase your skills" },
      { step: "2", title: "Get orders", desc: "Clients find & hire you" },
      { step: "3", title: "Deliver work", desc: "Complete the project" },
      { step: "4", title: "Get paid", desc: "Receive your earnings" },
    ],
  };

  const testimonials = [
    { text: "Got my job done fast and safely.", rating: 5, author: "Client", role: "Startup Founder" },
    { text: "Best platform for Bangladeshi freelancers.", rating: 5, author: "Freelancer", role: "Web Developer" },
    { text: "The escrow system gives me peace of mind.", rating: 5, author: "Client", role: "Business Owner" },
  ];

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getUser());
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);

  // Animate stats counter
  const [animatedStats, setAnimatedStats] = useState({
    freelancers: 0,
    jobs: 0,
    paid: 0,
    success: 0
  });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats(prev => ({
        freelancers: Math.min(prev.freelancers + Math.ceil(stats.freelancers / steps), stats.freelancers),
        jobs: Math.min(prev.jobs + Math.ceil(stats.jobs / steps), stats.jobs),
        paid: Math.min(prev.paid + Math.ceil(stats.paid / steps), stats.paid),
        success: Math.min(prev.success + Math.ceil(stats.success / steps), stats.success),
      }));
    }, interval);

    setTimeout(() => clearInterval(timer), duration);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-200 rounded-full blur-3xl opacity-20 -z-10 animate-ping"></div>

        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-24 px-4">
          <motion.div
            className="z-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6 drop-shadow-sm">
              Find Talent.<span className="text-blue-600"> Get Work.</span>
              <br /> Build Your Career.
            </h1>

            <p className="text-lg text-gray-600 mb-6 max-w-md">
              The easiest way to hire skilled freelancers or find remote jobs across Bangladesh.
            </p>

            {/* Search Bar */}
            <div className="mb-8 max-w-lg">
              <SearchBar placeholder="Search for services, freelancers, jobs..." />
            </div>

            {!user ? (
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup?role=buyer"
                    className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition inline-flex items-center gap-2"
                  >
                    Hire Talent <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup?role=seller"
                    className="px-6 py-3 rounded-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition inline-flex items-center gap-2"
                  >
                    Start Freelancing <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={user.role === "seller" ? "/seller-dashboard" : "/client-dashboard"}
                  className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="hidden md:block relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <img
              src={hero}
              alt="Freelancing"
              className="w-full mt-[100px] rounded-2xl drop-shadow-xl hover:scale-105 transition-transform duration-700"
            />
          </motion.div>
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 overflow-hidden">
            {liveActivity.map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-2xl">{activity.icon}</span>
                <div>
                  <p className="text-gray-700 font-medium">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular <span className="text-blue-600">Categories</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore services across various categories
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Link to="/gigs" className="block">
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-gray-100 text-center">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                    <p className="text-xs text-gray-500">{cat.count}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{animatedStats.freelancers.toLocaleString()}+</div>
              <div className="text-blue-100">Freelancers</div>
            </motion.div>
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{animatedStats.jobs.toLocaleString()}+</div>
              <div className="text-blue-100">Jobs Posted</div>
            </motion.div>
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-4xl md:text-5xl font-bold mb-2">৳{(animatedStats.paid / 1000000).toFixed(1)}M+</div>
              <div className="text-blue-100">Paid</div>
            </motion.div>
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{animatedStats.success}%</div>
              <div className="text-blue-100">Job Success</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center text-gray-900 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It <span className="text-blue-600">Works</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Clients */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                For Clients
              </h3>
              <div className="space-y-4">
                {howItWorks.clients.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* For Freelancers */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-purple-600" />
                For Freelancers
              </h3>
              <div className="space-y-4">
                {howItWorks.freelancers.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANGLADESH HIGHLIGHT */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Built for Bangladesh 🇧🇩
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold text-gray-900 mb-1">Local Payments</h4>
                <p className="text-sm text-gray-600">bKash, Nagad supported</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold text-gray-900 mb-1">BD Time Support</h4>
                <p className="text-sm text-gray-600">Working hours aligned</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <Globe className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold text-gray-900 mb-1">Bangla-friendly</h4>
                <p className="text-sm text-gray-600">Easy to use interface</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <h4 className="font-semibold text-gray-900 mb-1">Real Local Talent</h4>
                <p className="text-sm text-gray-600">Verified Bangladeshi pros</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-4xl font-bold text-slate-800 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Choose <span className="text-blue-600">KAAJ KAAM?</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="h-64 card-slide">
              <div className="card-slide-content">
                <Briefcase className="mx-auto text-blue-600 w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Verified Freelancers</h3>
                <p className="text-gray-600">
                  Work with trusted professionals from Bangladesh.
                </p>
              </div>
              <div className="card-slide-overlay">
                <p className="text-sm leading-relaxed">
                  ✓ Identity verified<br />
                  ✓ Skill assessments completed<br />
                  ✓ Portfolio reviewed<br />
                  ✓ Proven track records
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="h-64 card-slide">
              <div className="card-slide-content">
                <Shield className="mx-auto text-blue-600 w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p className="text-gray-600">
                  Escrow protection until job completion.
                </p>
              </div>
              <div className="card-slide-overlay">
                <p className="text-sm leading-relaxed">
                  💰 Payment held in escrow<br />
                  🔒 Released after approval<br />
                  🛡️ Full refund protection<br />
                  ✅ Secure transactions
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="h-64 card-slide">
              <div className="card-slide-content">
                <MessageSquare className="mx-auto text-blue-600 w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
                <p className="text-gray-600">
                  Communicate instantly with clients or freelancers.
                </p>
              </div>
              <div className="card-slide-overlay">
                <p className="text-sm leading-relaxed">
                  💬 Instant messaging<br />
                  📎 File sharing<br />
                  🔔 Live notifications<br />
                  👥 Seamless collaboration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center text-gray-900 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What Our <span className="text-blue-600">Users Say</span>
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100"
              >
                <div className="flex mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {item.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.author}</p>
                    <p className="text-xs text-gray-500">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY SECTION */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Shield className="w-16 h-16 mx-auto mb-6 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Safety is Our Priority
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold mb-1">Dispute Support</h4>
                <p className="text-sm text-gray-600">24/7 resolution assistance</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold mb-1">Escrow Protection</h4>
                <p className="text-sm text-gray-600">Secure payment holding</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold mb-1">Verified Users Only</h4>
                <p className="text-sm text-gray-600">KYC verified members</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-center text-white">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Ready to Get Started?
        </motion.h2>

        <motion.p
          className="text-lg text-blue-100 mb-8 max-w-xl mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Join thousands of successful freelancers and clients on Bangladesh's #1 remote work platform
        </motion.p>

        <motion.div 
          className="flex flex-wrap gap-4 justify-center px-4"
          whileHover={{ scale: 1.06 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/signup"
            className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl font-bold transition shadow-xl inline-flex items-center gap-2"
          >
            Join Now — It's Free <Sparkles className="w-5 h-5" />
          </Link>
          <Link
            to="/gigs"
            className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold transition inline-flex items-center gap-2"
          >
            Browse Services <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <h3 className="text-2xl font-bold mb-3 text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-500" />
                KAAJ KAAM
              </h3>
              <p className="text-sm text-gray-400 mb-4">Bangladesh's #1 Remote Work Platform</p>
              <p className="text-xs text-gray-500">Connecting talent with opportunity since 2024</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white">For Clients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={user ? "/post-job" : "/login"} className="hover:text-blue-400 transition">Post a Job</Link></li>
                <li><Link to="/gigs" className="hover:text-blue-400 transition">Browse Freelancers</Link></li>
                <li><Link to="/signup?role=buyer" className="hover:text-blue-400 transition">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white">For Freelancers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={user ? "/jobs" : "/login"} className="hover:text-blue-400 transition">Find Jobs</Link></li>
                <li><Link to={user ? "/create-gig" : "/login"} className="hover:text-blue-400 transition">Create Gig</Link></li>
                <li><Link to="/signup?role=seller" className="hover:text-blue-400 transition">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-blue-400 transition">About Us</button></li>
                <li><button className="hover:text-blue-400 transition">Contact</button></li>
                <li><button className="hover:text-blue-400 transition">Trust & Safety</button></li>
                <li><button className="hover:text-blue-400 transition">FAQ</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400 text-center md:text-left">
              © 2025 KAAJ KAAM • All Rights Reserved
            </div>
            <div className="flex gap-6 text-sm">
              <button className="hover:text-blue-400 transition">Privacy Policy</button>
              <button className="hover:text-blue-400 transition">Terms of Service</button>
              <button className="hover:text-blue-400 transition">Refund Policy</button>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            🇧🇩 Made with ❤️ in Bangladesh • BD Time: {new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka", hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </footer>
    </>
  );
}
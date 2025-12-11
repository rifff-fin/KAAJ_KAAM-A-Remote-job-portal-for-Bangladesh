import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Shield, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import hero from "../assets/hero-illustration.png";

export default function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-200 rounded-full blur-3xl opacity-20 -z-10 animate-ping"></div>

        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-24">
          <motion.div
            className="z-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6 drop-shadow-sm">
              Find Talent.
              <span className="text-blue-600"> Get Work.</span>
              <br /> Build Your Career.
            </h1>

            <p className="text-lg text-gray-600 mb-10 max-w-md animate-fadeIn">
              The easiest way to hire skilled freelancers or find remote jobs across Bangladesh.
            </p>

            {!user ? (
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup?role=buyer"
                    className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition"
                  >
                    Hire Talent
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup?role=seller"
                    className="px-6 py-3 rounded-lg font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
                  >
                    Start Freelancing
                  </Link>
                </motion.div>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={user.role === "seller" ? "/seller-dashboard" : "/client-dashboard"}
                  className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition inline-block"
                >
                  Go to Dashboard
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
 className="w-full  mt-[100px] rounded-2xl drop-shadow-xl hover:scale-105 transition-transform duration-700"

/>


          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto text-center">
          <motion.h2
            className="text-4xl font-bold text-slate-800 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Choose <span className="text-blue-600">KAAJ KAAM?</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Briefcase, title: "Verified Talent", desc: "Trusted & skilled freelancers." },
              { icon: Shield, title: "Secure Payments", desc: "Safe escrow protection until work is done." },
              { icon: MessageSquare, title: "Instant Chat", desc: "Work smoothly with real-time messaging." }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-10 bg-white rounded-2xl shadow-sm border hover:shadow-xl hover:-translate-y-2 transition group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 + i * 0.2 }}
              >
                <item.icon className="mx-auto text-blue-600 w-14 h-14 mb-6 group-hover:scale-110 transition" />
                <h3 className="text-xl font-semibold mb-3 text-slate-800">{item.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-center text-white">
        <motion.h2
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Start Your Freelance Journey Today
        </motion.h2>

        <motion.p
          className="text-lg text-blue-100 mb-8 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Whether you want to hire or earn — our platform connects Bangladesh’s top talent.
        </motion.p>

        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/signup"
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-8 py-4 rounded-lg font-semibold transition shadow-md"
          >
            Join Now — It’s Free
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer bg-white border-t py-14">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xl font-bold mb-3">KAAJ KAAM</h3>
            <p className="text-sm text-gray-500">Bangladesh’s #1 Remote Work Platform</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">For Clients</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/post-job">Post a Job</Link></li>
              <li><Link to="/jobs">Browse Freelancers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">For Freelancers</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/jobs">Find Jobs</Link></li>
              <li><Link to="/create-gig">Create Gig</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><button>About</button></li>
              <li><button>Contact</button></li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-10 text-sm text-gray-400">
          © 2025 KAAJ KAAM • All Rights Reserved • BD Time: {new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}
        </div>
      </footer>
    </>
  );
}
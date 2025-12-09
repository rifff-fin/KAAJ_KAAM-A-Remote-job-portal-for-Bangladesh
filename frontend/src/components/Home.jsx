import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Shield, MessageSquare } from 'lucide-react';

export default function Home() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <>
      {/* Hero Section */}
      <section className="hero relative overflow-hidden">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">
          <div className="z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6">
              Hire Top Freelancers <br /> or Find Remote Jobs in Bangladesh
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of professionals. Post a job, find talent, or start freelancing today.
            </p>
            {!user ? (
              <div className="flex flex-wrap gap-4">
                <Link to="/signup?role=buyer" className="btn-primary hover:opacity-90 hover:scale-105 transition-transform">
                  Hire Talent
                </Link>
                <Link to="/signup?role=seller" className="btn-outline hover:bg-blue-50 hover:text-blue-600 transition">
                  Start Freelancing
                </Link>
              </div>
            ) : (
              <Link
                to={user.role === 'seller' ? '/seller-dashboard' : '/client-dashboard'}
                className="btn-primary mt-8 inline-block hover:opacity-90 hover:scale-105 transition-transform"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
          <div className="hidden md:block">
            <img
              src="/hero-illustration.svg"
              alt="Freelancing"
              className="w-full drop-shadow-xl hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-50 via-transparent to-yellow-50 opacity-40"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-800 mb-14">
            Why Choose <span className="text-blue-600">KAAJ KAAM?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card group hover:bg-blue-600 hover:text-white transition-all duration-300">
              <Briefcase className="mx-auto text-blue-600 group-hover:text-white w-12 h-12 mb-4 transition" />
              <h3 className="text-xl font-semibold mb-2">Verified Freelancers</h3>
              <p className="text-gray-600 group-hover:text-blue-100 transition">
                Work with trusted professionals from Bangladesh.
              </p>
            </div>

            <div className="card group hover:bg-blue-600 hover:text-white transition-all duration-300">
              <Shield className="mx-auto text-blue-600 group-hover:text-white w-12 h-12 mb-4 transition" />
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600 group-hover:text-blue-100 transition">
                Escrow protection until job completion.
              </p>
            </div>

            <div className="card group hover:bg-blue-600 hover:text-white transition-all duration-300">
              <MessageSquare className="mx-auto text-blue-600 group-hover:text-white w-12 h-12 mb-4 transition" />
              <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
              <p className="text-gray-600 group-hover:text-blue-100 transition">
                Communicate instantly with clients or freelancers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Your Freelance Journey?
        </h2>
        <p className="text-lg text-blue-100 mb-8">
          Whether you’re hiring or offering your skills — join Bangladesh’s fastest-growing remote platform.
        </p>
        <Link
          to="/signup"
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-8 py-4 rounded-lg font-semibold transition-all hover:scale-105"
        >
          Join Now — It’s Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">KAAJ KAAM</h3>
            <p className="text-sm text-gray-400">Bangladesh's #1 Remote Job Platform</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/post-job">Post a Job</Link></li>
              <li><Link to="/jobs">Browse Freelancers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">For Freelancers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs">Find Jobs</Link></li>
              <li><Link to="/create-gig">Create Gig</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button className="hover:text-white">About</button></li>
              <li><button className="hover:text-white">Contact</button></li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-10 text-sm text-gray-400">
          © 2025 KAAJ KAAM. All rights reserved. | Bangladesh Time:{" "}
          {new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}
        </div>
      </footer>
    </>
  );
}

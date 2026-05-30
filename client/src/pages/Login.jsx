import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Mail, Lock, ClipboardList, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects email and password, outputs: { token, user: { username, email, ... } }
      const response = await api.post("/auth/login", formData);
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error("No token returned from authentication endpoint");
      }

      // Deploys session states safely across cookies and react context wrapper
      login(token, user);
      toast.success(`Welcome back, ${user?.username || "User"}!`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid authentication credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-50 font-sans">
      {/* Left Column Brand Split View (Hidden on mobile displays) */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-950 via-zinc-950 to-emerald-950 p-12 flex-col justify-between relative overflow-hidden border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wider uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Chronova
          </span>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Maximize Output. Reduce Friction.
          </h1>
          <p className="text-zinc-400 text-lg">
            Access your secure task tracker to view pending alerts, dynamic metrics, and verify scheduled email routines.
          </p>
        </motion.div>
        <p className="text-sm text-zinc-500">© 2026 Chronova Systems. All rights reserved.</p>
      </div>

      {/* Right Column Auth UI Box Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Chronova</h2>
            <p className="text-zinc-400 text-sm">Enter your credentials to manage active schedules.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-hidden focus:border-indigo-500 transition-all placeholder-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-hidden focus:border-indigo-500 transition-all placeholder-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-70 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Identity...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Don't have an operational account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import {
  Activity,
  Shield,
  Lock,
  Mail,
  UserCheck,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useInventory, DEMO_ACCOUNTS } from '../context/InventoryContext';
import { UserRole } from '../types/inventory';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useInventory();
  const [email, setEmail] = useState<string>('admin@apexmetro.health');
  const [password, setPassword] = useState<string>('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleAdminSignIn = () => {
    login('admin@apexmetro.health', 'admin123', 'Hospital Administrator');
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter institutional administrator email');
      return;
    }

    const clean = email.trim().toLowerCase();
    // Validate that administrator credentials are being used
    if (!clean.includes('admin') && clean !== 'admin@apexmetro.health') {
      setErrorMsg('Portal authorization requires Hospital Administrator credentials (admin@apexmetro.health). You can switch between Pharmacist, Inventory Manager, and Procurement Manager roles after logging in.');
      return;
    }

    setErrorMsg(null);
    login(clean, password || 'admin123', 'Hospital Administrator');
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-slate-800/20 overflow-hidden relative z-10">
        {/* Left Side: Hospital Branding & Clinical Vision (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight block">Apex Health Network</span>
                <span className="text-[10px] text-cyan-300 uppercase tracking-widest font-semibold">Clinical Supply Intelligence</span>
              </div>
            </div>

            <div className="pt-6">
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                Predict the Expiry.<br />Consume the Right Batch.<br />Prevent Waste.
              </h1>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Hospital decision-support system integrating deterministic FEFO greedy routing, 0–100 multi-factor expiry scoring, and Gemini 3.8 Flash intelligence.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-8 relative z-10 text-xs">
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full Master Control &amp; Data Modification</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Inter-Hospital Rebalancing &amp; Savings</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Immutable Regulatory Audit Trail</span>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-400">
              Demo PoC Environment • Synthetic Medical Data
            </div>
          </div>
        </div>

        {/* Right Side: Login Form with Admin Credentials (7 cols) */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between bg-white space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hospital Portal Authorization</h2>
                <p className="text-xs text-slate-500 mt-0.5">Administrator credentials required for portal access</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            {/* Admin Credentials Showcase Card */}
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-950">Hospital Administrator Credentials:</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-200/70 text-indigo-800">
                  Required Creds
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Institutional Email</div>
                  <div className="font-mono font-bold text-slate-800 text-xs truncate">admin@apexmetro.health</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Security Password</div>
                  <div className="font-mono font-bold text-slate-800 text-xs">admin123</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-indigo-900">
                  Profile: <strong>Dr. Rajeshwari Rao</strong> (Hospital Administrator)
                </div>
                <button
                  type="button"
                  onClick={handleAdminSignIn}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Sign In as Admin</span>
                </button>
              </div>
            </div>

            {/* Standard Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold">Access Verification Notice</p>
                    <p className="text-[11px] mt-0.5">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@apexmetro.health');
                        setPassword('admin123');
                        setErrorMsg(null);
                      }}
                      className="mt-1.5 text-[11px] font-bold text-indigo-700 underline cursor-pointer block"
                    >
                      Fill Admin Credentials (admin@apexmetro.health)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@apexmetro.health"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Security Password / Key</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter security key (e.g. admin123)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono font-medium"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-800">Role Switching Inside Portal:</span> After authenticating as Administrator, you can seamlessly switch operational personas between <strong>Pharmacist</strong>, <strong>Inventory Manager</strong>, and <strong>Procurement Manager</strong> from the role switcher in the top navigation bar.
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 accent-indigo-600"
                  />
                  <span>Remember session on this clinical workstation</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>Authorize &amp; Enter Portal as Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Apex Metro Super-Speciality Hospital</span>
            <span>Security Standard: ISO-27799 / HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

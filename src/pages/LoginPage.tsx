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
  const [password, setPassword] = useState<string>('••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Hospital Administrator');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter a clinical email address');
      return;
    }

    login(email, password, selectedRole);
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleQuickLogin = (demoEmail: string, role: UserRole) => {
    setEmail(demoEmail);
    setSelectedRole(role);
    login(demoEmail, 'demo123', role);
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

        {/* Right Side: Login Form & Role Presets (7 cols) */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between bg-white space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sign In to Hospital Portal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a role or enter your institutional credentials</p>
              </div>
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>

            {/* Quick 1-Click Role Logins */}
            <div className="mt-5 space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                1-Click Clinical Role Sign-In:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DEMO_ACCOUNTS.map(acc => {
                  const isAdmin = acc.role === 'Hospital Administrator';

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickLogin(acc.email, acc.role)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                        isAdmin
                          ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/60 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {acc.avatar}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-800 truncate text-[11px]">{acc.name}</div>
                        <div className="text-[10px] text-indigo-700 font-semibold truncate">{acc.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Standard Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@hospital.health"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Assigned Operational Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                >
                  <option value="Hospital Administrator">Hospital Administrator (Full Master Control)</option>
                  <option value="Inventory Manager">Inventory Manager (Stock &amp; Transfers)</option>
                  <option value="Pharmacist">Chief Pharmacist (Dispensing &amp; FEFO)</option>
                  <option value="Procurement Manager">Procurement Manager (Purchasing &amp; POs)</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 accent-indigo-600"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-slate-400">Default password: any</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Authorize &amp; Enter Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Apex Metro Super-Speciality Hospital</span>
            <span>Security ID: SEC-SYS-2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

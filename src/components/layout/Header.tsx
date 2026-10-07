import React, { useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  UserCheck,
  RefreshCw,
  PlayCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  LogOut,
  ShieldCheck,
  Sliders,
  ChevronDown,
  Pill,
  Boxes,
  ShoppingCart,
  Shield,
  ArrowRightLeft,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserRole } from '../../types/inventory';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onNavigateTab }) => {
  const {
    currentUser,
    logout,
    userRole,
    switchRole,
    setUserRole,
    selectedHospital,
    setSelectedHospital,
    notifications,
    dismissNotification,
    markAllNotificationsRead,
    runCeftriaxoneDemoScenario,
    loadDemoHospitalData,
    resetDemoData,
  } = useInventory();

  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [searchVal, setSearchVal] = useState<string>('');
  const [scenarioToast, setScenarioToast] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleTriggerScenario = () => {
    runCeftriaxoneDemoScenario();
    setScenarioToast('Loaded: Ceftriaxone 5,000 units / 45 days / Critical Expiry Benchmark');
    setTimeout(() => setScenarioToast(null), 4000);
    if (onNavigateTab) onNavigateTab('expiry');
  };

  const handleSelectRole = (newRole: UserRole) => {
    switchRole(newRole);
    setShowRoleMenu(false);
    setScenarioToast(`Operating persona active: ${newRole}`);
    setTimeout(() => setScenarioToast(null), 3000);
  };

  const roleOptions: {
    role: UserRole;
    title: string;
    name: string;
    badge: string;
    badgeColor: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    desc: string;
  }[] = [
    {
      role: 'Hospital Administrator',
      title: 'Hospital Administrator',
      name: 'Dr. Rajeshwari Rao',
      badge: 'Master CRUD & Governance',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: ShieldCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      desc: 'Master database control, SKU management, audit logs & risk weights',
    },
    {
      role: 'Pharmacist',
      title: 'Chief Pharmacist',
      name: 'Dr. Anita Sharma',
      badge: 'Dispensing & Expiry',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Pill,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      desc: 'FEFO batch allocation, clinical requests, quarantine & expiry triage',
    },
    {
      role: 'Inventory Manager',
      title: 'Inventory Manager',
      name: 'Rajesh Nair',
      badge: 'Stock Logistics',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Boxes,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      desc: 'Warehouse stock counts, batch receipt & inter-hospital transfers',
    },
    {
      role: 'Procurement Manager',
      title: 'Procurement Manager',
      name: 'Kavita Menon',
      badge: 'PO Sourcing',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: ShoppingCart,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      desc: 'Purchase orders, supplier pipeline, safety stock reorder thresholds',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-900 tracking-tight text-xs sm:text-sm leading-tight flex flex-col">
              <span>Predictive Hospital Inventory Intelligence Platform (PHIIP)</span>
              <span className="text-[11px] font-semibold text-indigo-600">with FEFO</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 self-center">
              PoC Intelligence
            </span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items, batches, categories..."
            value={searchVal}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Right: Facility Switcher, Admin Button, Demo Buttons, Notifications, User Profile & Logout */}
        <div className="flex items-center gap-2">
          {/* Admin Dashboard Quick Button */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('admin')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition shadow-2xs"
              title="Access Admin Console to modify all SKUs, batches, locations, and POs"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Admin Master
            </button>
          )}

          {/* 1-Click Ceftriaxone Scenario Button */}
          <button
            onClick={handleTriggerScenario}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition transform active:scale-98"
            title="Launch proposal scenario: Ceftriaxone 5000 stock, 45 days expiry, 2750 excess"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Run Demo Scenario
          </button>

          {/* Load / Reset Data */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition cursor-pointer"
            title="Reset to fresh demo hospital CSV database"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Data</span>
          </button>

          {/* Hospital Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/60 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Hospitals (Network)</option>
              <option value="hosp_apex">Apex Metro Hospital</option>
              <option value="hosp_city">City Health North</option>
              <option value="hosp_stjude">St. Jude Community</option>
            </select>
          </div>

          {/* Notification Center Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-100">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">Hospital Intelligence Alerts</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold">
                      {notifications.length} Total
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No active alerts</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition flex items-start gap-2.5 ${n.read ? 'bg-white text-slate-600' : 'bg-slate-50/80 text-slate-800'}`}
                      >
                        {n.severity === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : n.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : n.severity === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{n.title}</div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span>{n.timestamp}</span>
                            {n.linkTab && onNavigateTab && (
                              <button
                                onClick={() => {
                                  onNavigateTab(n.linkTab!);
                                  setShowNotifMenu(false);
                                }}
                                className="text-indigo-600 font-semibold hover:underline"
                              >
                                {n.actionLabel || 'View Details'} →
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => dismissNotification(n.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Clinical Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowNotifMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition cursor-pointer ${
                userRole === 'Hospital Administrator'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                  : userRole === 'Pharmacist'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                  : userRole === 'Inventory Manager'
                  ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                  : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
              title="Switch operational role between Administrator, Pharmacist, Inventory Manager, and Procurement Manager"
            >
              <div className="flex items-center gap-1.5">
                {userRole === 'Hospital Administrator' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                {userRole === 'Pharmacist' && <Pill className="w-3.5 h-3.5 text-emerald-600" />}
                {userRole === 'Inventory Manager' && <Boxes className="w-3.5 h-3.5 text-blue-600" />}
                {userRole === 'Procurement Manager' && <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />}
                <span className="font-bold text-slate-800">{userRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu Drawer */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-100 p-2.5 space-y-1.5">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Switch Operational Persona</div>
                    <p className="text-[10px] text-slate-500">Change role permissions and active clinical perspective</p>
                  </div>
                  <button
                    onClick={() => setShowRoleMenu(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  {roleOptions.map(opt => {
                    const isCurrent = userRole === opt.role;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.role}
                        onClick={() => handleSelectRole(opt.role)}
                        className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isCurrent
                            ? 'border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-400 shadow-2xs'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${opt.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-800 text-xs truncate">{opt.title}</span>
                            {isCurrent ? (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-600 text-white shrink-0">
                                Active Role
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${opt.badgeColor}`}>
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium truncate">{opt.name}</div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Chip with Logout */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer text-left"
                title="Click to switch operating role"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.avatar || 'DR'}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <span className="font-bold text-slate-800 block truncate max-w-[120px]">{currentUser.name}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold block">{userRole}</span>
                </div>
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Log out of session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigateTab && onNavigateTab('login')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Demo Scenario Toast Notification */}
      {scenarioToast && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{scenarioToast}</span>
          </div>
          <button onClick={() => setScenarioToast(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Restore Factory CSV Baseline Data?
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Confirm action impact for Administrator
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-slate-600 leading-relaxed text-[11px]">
              <div className="font-bold text-slate-800">Purpose &amp; System Impact:</div>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-slate-700">Clears custom edits:</strong> Any items, lots, purchase orders, or hospital facilities added or edited in the Admin Console will be cleared from local storage.</li>
                <li><strong className="text-slate-700">Restores CSV files:</strong> Resets all records back to the static 30 master items, 34 physical batches, 8 hospital facilities, and 8 purchase orders loaded from <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">.csv</code> files.</li>
                <li><strong className="text-slate-700">Recalculates models:</strong> FEFO allocations, expiry risk scores, and rebalancing recommendations will instantly recalculate from clean factory data.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirm(false);
                  setScenarioToast('Database successfully restored to baseline factory CSV dataset.');
                  setTimeout(() => setScenarioToast(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Confirm &amp; Restore Baseline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

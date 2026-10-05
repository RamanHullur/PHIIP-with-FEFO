import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  AlertOctagon,
  Clock,
  TrendingUp,
  ArrowRightLeft,
  ShoppingCart,
  Building,
  SlidersHorizontal,
  Bot,
  FileSpreadsheet,
  FileClock,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  category?: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { stats, actions, transfers, procurements } = useInventory();

  const navItems: NavItem[] = [
    {
      id: 'admin',
      label: 'Admin Master Control',
      icon: ShieldAlert,
      badge: 'Full CRUD',
      badgeColor: 'bg-indigo-500 text-white font-bold',
      category: 'Administration & Master Control',
    },
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      category: 'Overview',
    },
    {
      id: 'inventory',
      label: 'Inventory & Batches',
      icon: Boxes,
      badge: stats.totalSKUs,
      badgeColor: 'bg-slate-100 text-slate-700',
      category: 'Overview',
    },
    {
      id: 'expiry',
      label: 'Will Expire Before Use',
      icon: AlertOctagon,
      badge: stats.criticalExpiryItems > 0 ? `${stats.criticalExpiryItems} Critical` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      category: 'Predictive Intelligence',
    },
    {
      id: 'fefo',
      label: 'FEFO Allocation Engine',
      icon: Clock,
      badge: `${stats.fefoComplianceRate}%`,
      badgeColor: 'bg-emerald-100 text-emerald-700',
      category: 'Predictive Intelligence',
    },
    {
      id: 'consumption',
      label: 'Consumption Analytics',
      icon: TrendingUp,
      category: 'Predictive Intelligence',
    },
    {
      id: 'transfers',
      label: 'Transfer Rebalancing',
      icon: ArrowRightLeft,
      badge: transfers.length > 0 ? transfers.length : undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
      category: 'Action & Optimization',
    },
    {
      id: 'procurement',
      label: 'Smart Procurement',
      icon: ShoppingCart,
      badge: procurements.filter(p => p.action !== 'MAINTAIN').length || undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
      category: 'Action & Optimization',
    },
    {
      id: 'locations',
      label: 'Hospital Network Sites',
      icon: Building,
      category: 'Action & Optimization',
    },
    {
      id: 'whatif',
      label: 'What-If Simulator',
      icon: SlidersHorizontal,
      category: 'Simulation & AI',
    },
    {
      id: 'ai-assistant',
      label: 'Inventory AI Assistant',
      icon: Bot,
      badge: 'Gemini',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-semibold',
      category: 'Simulation & AI',
    },
    {
      id: 'reports',
      label: 'Reports & CSV Import',
      icon: FileSpreadsheet,
      category: 'Compliance & Audit',
    },
    {
      id: 'audit',
      label: 'Audit Trail & Compliance',
      icon: FileClock,
      category: 'Compliance & Audit',
    },
    {
      id: 'tests',
      label: 'Automated Test Runner',
      icon: CheckCheck,
      badge: '7 Tests',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      category: 'Compliance & Audit',
    },
  ];

  // Group by category
  const categories = [
    'Administration & Master Control',
    'Overview',
    'Predictive Intelligence',
    'Action & Optimization',
    'Simulation & AI',
    'Compliance & Audit',
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Category Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6 text-xs">
        {categories.map(cat => {
          const itemsInCat = navItems.filter(item => item.category === cat);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {cat}
              </div>
              <div className="space-y-0.5">
                {itemsInCat.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-400 leading-tight">
        <p className="font-semibold text-slate-300">PoC Decision Support</p>
        <p className="mt-0.5 text-slate-400">
          Deterministic calculations with synthetic inventory. Not clinical medical advice.
        </p>
      </div>
    </aside>
  );
};

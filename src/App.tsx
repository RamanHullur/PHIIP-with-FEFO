import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ItemDetailModal } from './components/inventory/ItemDetailModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ExpiryRiskPage } from './pages/ExpiryRiskPage';
import { FEFOPage } from './pages/FEFOPage';
import { ConsumptionPage } from './pages/ConsumptionPage';
import { TransfersPage } from './pages/TransfersPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { LocationsPage } from './pages/LocationsPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SystemTestsPage } from './pages/SystemTestsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';

function MainApp() {
  const { currentUser } = useInventory();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<{ riskFilter?: string; filter?: string } | undefined>(undefined);
  const [fefoPreloadItem, setFefoPreloadItem] = useState<string | null>(null);

  // If user is not logged in, show Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  const handleNavigate = (tab: string, filter?: any) => {
    setActiveTab(tab);
    if (tab === 'inventory' && filter) {
      setInventoryFilter(filter);
    } else if (tab === 'expiry' && filter) {
      setInventoryFilter(filter);
    }
  };

  const handleOpenItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleNavigateToFEFOFromDrawer = (itemId: string) => {
    setFefoPreloadItem(itemId);
    setActiveTab('fefo');
  };

  const handleNavigateToTransfersFromDrawer = (itemId: string) => {
    setActiveTab('transfers');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={tab => handleNavigate(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onSearch={q => {
            if (q && activeTab !== 'inventory') {
              setActiveTab('inventory');
            }
          }}
          onNavigateTab={tab => handleNavigate(tab)}
        />

        {/* Dynamic Page Body with comfortable non-white healthcare slate background */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {activeTab === 'admin' && <AdminDashboardPage />}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab, filter) => handleNavigate(tab, filter)}
              onSelectItem={handleOpenItem}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              onSelectItem={handleOpenItem}
              initialFilter={inventoryFilter}
            />
          )}

          {activeTab === 'expiry' && (
            <ExpiryRiskPage
              onSelectItem={handleOpenItem}
              onNavigateTab={tab => handleNavigate(tab)}
            />
          )}

          {activeTab === 'fefo' && (
            <FEFOPage
              initialItemId={fefoPreloadItem}
              onSelectItem={handleOpenItem}
            />
          )}

          {activeTab === 'consumption' && <ConsumptionPage />}

          {activeTab === 'transfers' && <TransfersPage onSelectItem={handleOpenItem} />}

          {activeTab === 'procurement' && <ProcurementPage onSelectItem={handleOpenItem} />}

          {activeTab === 'locations' && (
            <LocationsPage onNavigateTab={tab => handleNavigate(tab)} />
          )}

          {activeTab === 'whatif' && <WhatIfPage />}

          {activeTab === 'ai-assistant' && <AIAssistantPage />}

          {activeTab === 'reports' && <ReportsPage />}

          {activeTab === 'audit' && <AuditTrailPage />}

          {activeTab === 'tests' && <SystemTestsPage />}

          {activeTab === 'login' && <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />}
        </main>
      </div>

      {/* Global Item Detail Inspection Drawer */}
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onNavigateToFEFO={handleNavigateToFEFOFromDrawer}
          onNavigateToTransfers={handleNavigateToTransfersFromDrawer}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}

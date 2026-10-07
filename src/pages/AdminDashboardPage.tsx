import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Boxes,
  Layers,
  Building2,
  ShoppingCart,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Save,
  Clock,
  DollarSign,
  Database,
  FileSpreadsheet,
} from 'lucide-react';
import { useInventory, DEMO_ACCOUNTS } from '../context/InventoryContext';
import { Item, Batch, Location, PurchaseOrder, UserRole } from '../types/inventory';
import { DatabaseCsvHub } from '../components/admin/DatabaseCsvHub';

export const AdminDashboardPage: React.FC = () => {
  const {
    items,
    batches,
    locations,
    purchaseOrders,
    currentUser,
    userRole,
    setUserRole,
    switchRole,
    addItem,
    updateItem,
    deleteItem,
    addBatch,
    updateBatch,
    deleteBatch,
    addLocation,
    updateLocation,
    deleteLocation,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  } = useInventory();

  // Active Admin Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'batches' | 'locations' | 'pos' | 'policy' | 'users' | 'database'>('items');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // --- ITEM MODAL STATE ---
  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState<Omit<Item, 'id'>>({
    name: '',
    code: '',
    category: 'Antibiotics',
    manufacturer: '',
    supplier: '',
    unitCost: 100,
    reorderLevel: 500,
    safetyStock: 300,
    unit: 'Vial',
    description: '',
    storageConditions: '',
  });

  // --- BATCH MODAL STATE ---
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchForm, setBatchForm] = useState<Omit<Batch, 'id'>>({
    itemId: items[0]?.id || '',
    batchNumber: '',
    receivedDate: '2026-01-01',
    expiryDate: '2026-12-31',
    quantityReceived: 1000,
    currentStock: 1000,
    locationId: locations[0]?.id || '',
    status: 'active',
    notes: '',
  });

  // --- LOCATION MODAL STATE ---
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState<Omit<Location, 'id'>>({
    name: '',
    type: 'Central Store',
    hospitalId: 'hosp_apex',
    hospitalName: 'Apex Metro Super-Speciality',
  });

  // --- PURCHASE ORDER MODAL STATE ---
  const [poModalOpen, setPoModalOpen] = useState<boolean>(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [poForm, setPoForm] = useState<Omit<PurchaseOrder, 'id'>>({
    poNumber: '',
    itemId: items[0]?.id || '',
    quantity: 1000,
    expectedDate: '2026-11-15',
    status: 'pending',
    supplier: '',
    unitPrice: 100,
  });

  // --- POLICY PARAMETERS STATE ---
  const [policyWeights, setPolicyWeights] = useState({
    expiryRiskWeight: 30,
    excessStockWeight: 25,
    consumptionVelocityWeight: 20,
    demandForecastWeight: 15,
    pendingPOWeight: 10,
    leadTimeDays: 14,
    safetyBufferMultiplier: 1.0,
  });

  // Maps
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations]);

  // Search filtered collections
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.manufacturer.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase().trim();
    return batches.filter(b => {
      const item = itemMap.get(b.itemId);
      const loc = locationMap.get(b.locationId);
      return (
        b.batchNumber.toLowerCase().includes(q) ||
        (item?.name && item.name.toLowerCase().includes(q)) ||
        (item?.code && item.code.toLowerCase().includes(q)) ||
        (loc?.name && loc.name.toLowerCase().includes(q)) ||
        b.status.toLowerCase().includes(q)
      );
    });
  }, [batches, searchQuery, itemMap, locationMap]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.hospitalName.toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  const filteredPOs = useMemo(() => {
    if (!searchQuery.trim()) return purchaseOrders;
    const q = searchQuery.toLowerCase().trim();
    return purchaseOrders.filter(po => {
      const item = itemMap.get(po.itemId);
      return (
        po.poNumber.toLowerCase().includes(q) ||
        (item?.name && item.name.toLowerCase().includes(q)) ||
        po.supplier.toLowerCase().includes(q) ||
        po.status.toLowerCase().includes(q)
      );
    });
  }, [purchaseOrders, searchQuery, itemMap]);

  // Handlers for Items
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      code: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Antibiotics',
      manufacturer: 'Generic Pharma Lab',
      supplier: 'Standard Medical Supplies',
      unitCost: 150,
      reorderLevel: 600,
      safetyStock: 400,
      unit: 'Vial',
      description: '',
      storageConditions: 'Standard ambient',
    });
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: Item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      code: item.code,
      category: item.category,
      manufacturer: item.manufacturer,
      supplier: item.supplier,
      unitCost: item.unitCost,
      reorderLevel: item.reorderLevel,
      safetyStock: item.safetyStock,
      unit: item.unit,
      description: item.description || '',
      storageConditions: item.storageConditions || '',
    });
    setItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItem({ ...editingItem, ...itemForm });
      showToast(`Item "${itemForm.name}" updated successfully.`);
    } else {
      addItem(itemForm);
      showToast(`New item "${itemForm.name}" created successfully.`);
    }
    setItemModalOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const item = itemMap.get(itemId);
    if (!item) return;
    if (confirm(`Are you sure you want to permanently delete "${item.name}" and all its batch lots?`)) {
      const res = deleteItem(itemId);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Handlers for Batches
  const handleOpenAddBatch = () => {
    setEditingBatch(null);
    setBatchForm({
      itemId: items[0]?.id || '',
      batchNumber: `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedDate: '2026-05-01',
      expiryDate: '2027-04-30',
      quantityReceived: 1000,
      currentStock: 1000,
      locationId: locations[0]?.id || '',
      status: 'active',
      notes: '',
    });
    setBatchModalOpen(true);
  };

  const handleOpenEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setBatchForm({
      itemId: batch.itemId,
      batchNumber: batch.batchNumber,
      receivedDate: batch.receivedDate,
      expiryDate: batch.expiryDate,
      quantityReceived: batch.quantityReceived,
      currentStock: batch.currentStock,
      locationId: batch.locationId,
      status: batch.status,
      notes: batch.notes || '',
    });
    setBatchModalOpen(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBatch) {
      updateBatch({ ...editingBatch, ...batchForm });
      showToast(`Batch "${batchForm.batchNumber}" updated.`);
    } else {
      addBatch(batchForm);
      showToast(`New batch "${batchForm.batchNumber}" added to warehouse.`);
    }
    setBatchModalOpen(false);
  };

  const handleDeleteBatch = (batchId: string) => {
    const b = batches.find(x => x.id === batchId);
    if (!b) return;
    if (confirm(`Delete batch lot "${b.batchNumber}"?`)) {
      deleteBatch(batchId);
      showToast(`Batch "${b.batchNumber}" removed.`);
    }
  };

  // Handlers for Locations
  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setLocationForm({
      name: '',
      type: 'General Ward',
      hospitalId: 'hosp_apex',
      hospitalName: 'Apex Metro Super-Speciality',
    });
    setLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: Location) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name,
      type: loc.type,
      hospitalId: loc.hospitalId,
      hospitalName: loc.hospitalName,
    });
    setLocationModalOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocation({ ...editingLocation, ...locationForm });
      showToast(`Location "${locationForm.name}" updated.`);
    } else {
      addLocation(locationForm);
      showToast(`New location "${locationForm.name}" created.`);
    }
    setLocationModalOpen(false);
  };

  const handleDeleteLocation = (locId: string) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;
    if (confirm(`Decommission location "${loc.name}"?`)) {
      const res = deleteLocation(locId);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Handlers for Purchase Orders
  const handleOpenAddPO = () => {
    setEditingPO(null);
    const item = items[0];
    setPoForm({
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      itemId: item?.id || '',
      quantity: 1500,
      expectedDate: '2026-11-20',
      status: 'pending',
      supplier: item?.supplier || 'Standard Supplier',
      unitPrice: item?.unitCost || 100,
    });
    setPoModalOpen(true);
  };

  const handleOpenEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoForm({
      poNumber: po.poNumber,
      itemId: po.itemId,
      quantity: po.quantity,
      expectedDate: po.expectedDate,
      status: po.status,
      supplier: po.supplier,
      unitPrice: po.unitPrice,
    });
    setPoModalOpen(true);
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPO) {
      updatePurchaseOrder({ ...editingPO, ...poForm });
      showToast(`Purchase Order "${poForm.poNumber}" updated.`);
    } else {
      addPurchaseOrder(poForm);
      showToast(`Purchase Order "${poForm.poNumber}" generated.`);
    }
    setPoModalOpen(false);
  };

  const handleDeletePO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    if (confirm(`Delete Purchase Order "${po.poNumber}"?`)) {
      deletePurchaseOrder(poId);
      showToast(`Purchase Order "${po.poNumber}" removed.`);
    }
  };

  // Categories list
  const categories = [
    'Antibiotics',
    'Critical Care',
    'Analgesics',
    'IV Fluids',
    'Consumables & Surgical',
    'Oncology',
    'Laboratory & Reagents',
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Admin Dashboard Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
              Master Admin Control &amp; Data Configuration
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Full Master CRUD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Centralized administrative console for Hospital Administrators. Add, modify, or remove master SKUs, warehouse batch lots, hospital wards, purchase orders, algorithm risk weights, and clinical user permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Authenticated Admin</div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 justify-end">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {currentUser?.name || 'Administrator'}
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            toastMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Master SKUs</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{items.length} Items</div>
          <div className="text-[11px] text-slate-500 mt-1">Catalog items tracked</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Physical Batches</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{batches.length} Lots</div>
          <div className="text-[11px] text-slate-500 mt-1">Active, quarantined &amp; expired</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Hospital Wards</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{locations.length} Locations</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 3 hospital sites</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Purchase Orders</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{purchaseOrders.length} Orders</div>
          <div className="text-[11px] text-slate-500 mt-1">Procurement pipeline</div>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white p-1.5 rounded-2xl shadow-2xs overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'items'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Master Items ({items.length})
        </button>

        <button
          onClick={() => setActiveSubTab('batches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'batches'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Batches / Lots ({batches.length})
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'locations'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Hospital Facilities &amp; Wards ({locations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'pos'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('policy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'policy'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Algorithm &amp; Policy Tuning
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Staff Roles &amp; Access
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Database &amp; CSV Hub (7 Files)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/30 text-white">
            .CSV / .XLS
          </span>
        </button>
      </div>

      {/* --- SUB-TAB 1: MASTER ITEMS MANAGEMENT --- */}
      {activeSubTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hospital Master SKUs Catalog</h2>
              <p className="text-xs text-slate-500">
                Add, edit pricing, safety stock, reorder levels, or remove items ({filteredItems.length} of {items.length} SKUs shown)
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SKU name, code, category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleOpenAddItem}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add SKU
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Manufacturer</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  <th className="py-2.5 px-3 text-right">Safety Stock</th>
                  <th className="py-2.5 px-3 text-right">Reorder Level</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No items matched &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.manufacturer}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.supplier}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">${item.unitCost}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{item.safetyStock} {item.unit}s</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{item.reorderLevel}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: BATCHES MANAGEMENT --- */}
      {activeSubTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hospital Warehouse Batches &amp; Lots</h2>
              <p className="text-xs text-slate-500">
                Control physical stock, expiry dates, locations, and quarantine statuses ({filteredBatches.length} of {batches.length} lots shown)
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search batch lot, item, location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleOpenAddBatch}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Receive Batch
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3 text-center">Lot Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No batch lots matched &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => {
                    const item = itemMap.get(batch.itemId);
                    const loc = locationMap.get(batch.locationId);

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{batch.batchNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item?.name || 'Unknown'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{loc?.name || 'Central Store'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          <input
                            type="number"
                            value={batch.currentStock}
                            onChange={e => updateBatch({ ...batch, currentStock: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-24 text-right px-2 py-1 rounded border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            title="Directly edit physical stock count"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{batch.expiryDate}</td>
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={batch.status}
                            onChange={e => updateBatch({ ...batch, status: e.target.value as any })}
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border cursor-pointer ${
                              batch.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : batch.status === 'quarantine'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="active">ACTIVE</option>
                            <option value="quarantine">QUARANTINE</option>
                            <option value="expired">EXPIRED</option>
                            <option value="depleted">DEPLETED</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditBatch(batch)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit Batch"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: LOCATIONS MANAGEMENT --- */}
      {activeSubTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hospital Facilities &amp; Clinical Wards</h2>
              <p className="text-xs text-slate-500">
                Configure hospital sites, central dispensaries, and inpatient care units ({filteredLocations.length} of {locations.length} locations shown)
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ward name, department, facility..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleOpenAddLocation}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Ward
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Location Name</th>
                  <th className="py-2.5 px-3">Department Type</th>
                  <th className="py-2.5 px-3">Hospital Facility</th>
                  <th className="py-2.5 px-3 text-right">Active Batches Assigned</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No locations matched &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map(loc => {
                    const assignedCount = batches.filter(b => b.locationId === loc.id).length;

                    return (
                      <tr key={loc.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{loc.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                            {loc.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{loc.hospitalName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{assignedCount} Lots</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditLocation(loc)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit Location"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: PURCHASE ORDERS MANAGEMENT --- */}
      {activeSubTab === 'pos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Procurement Purchase Orders Pipeline</h2>
              <p className="text-xs text-slate-500">
                Generate, adjust quantities, update supplier delivery schedules, or cancel POs ({filteredPOs.length} of {purchaseOrders.length} orders shown)
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search PO#, product, supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleOpenAddPO}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create PO
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3">Expected Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No purchase orders matched &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map(po => {
                    const item = itemMap.get(po.itemId);

                    return (
                      <tr key={po.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{po.poNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item?.name || 'Medical Item'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{po.supplier}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {po.quantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">${po.unitPrice}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{po.expectedDate}</td>
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={po.status}
                            onChange={e => updatePurchaseOrder({ ...po, status: e.target.value as any })}
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border cursor-pointer ${
                              po.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : po.status === 'delayed'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : po.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            <option value="pending">PENDING</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="delivered">DELIVERED</option>
                            <option value="delayed">DELAYED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditPO(po)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit PO"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePO(po.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete PO"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 5: ALGORITHM & POLICY TUNING --- */}
      {activeSubTab === 'policy' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Hospital Expiry Risk Scoring Policy &amp; Weights</h2>
            <p className="text-slate-500 mt-1">
              Configure deterministic weights totaling 100% for the 0–100 Expiry Risk calculation engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Days-to-Expiry Risk Weight:</span>
                  <span className="font-mono text-indigo-600">{policyWeights.expiryRiskWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={policyWeights.expiryRiskWeight}
                  onChange={e => setPolicyWeights({ ...policyWeights, expiryRiskWeight: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Excess Inventory Volume Weight:</span>
                  <span className="font-mono text-indigo-600">{policyWeights.excessStockWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={policyWeights.excessStockWeight}
                  onChange={e => setPolicyWeights({ ...policyWeights, excessStockWeight: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Consumption Velocity Weight:</span>
                  <span className="font-mono text-indigo-600">{policyWeights.consumptionVelocityWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={policyWeights.consumptionVelocityWeight}
                  onChange={e => setPolicyWeights({ ...policyWeights, consumptionVelocityWeight: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Demand Forecast Weight:</span>
                  <span className="font-mono text-indigo-600">{policyWeights.demandForecastWeight}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={policyWeights.demandForecastWeight}
                  onChange={e => setPolicyWeights({ ...policyWeights, demandForecastWeight: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Pending Purchase Order Impact Weight:</span>
                  <span className="font-mono text-indigo-600">{policyWeights.pendingPOWeight}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={policyWeights.pendingPOWeight}
                  onChange={e => setPolicyWeights({ ...policyWeights, pendingPOWeight: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Standard Supplier Lead Time:</span>
                  <span className="font-mono text-indigo-600">{policyWeights.leadTimeDays} Days</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={policyWeights.leadTimeDays}
                  onChange={e => setPolicyWeights({ ...policyWeights, leadTimeDays: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setPolicyWeights({
                  expiryRiskWeight: 30,
                  excessStockWeight: 25,
                  consumptionVelocityWeight: 20,
                  demandForecastWeight: 15,
                  pendingPOWeight: 10,
                  leadTimeDays: 14,
                  safetyBufferMultiplier: 1.0,
                });
                showToast('Reset algorithm policy weights to factory defaults (30 / 25 / 20 / 15 / 10).');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Factory Defaults
            </button>

            <button
              onClick={() => showToast('Algorithm policy weights saved and active network-wide.')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save Policy Configuration
            </button>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 6: STAFF ROLES & ACCESS --- */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Hospital Institutional Staff &amp; RBAC Access</h2>
            <p className="text-slate-500 mt-0.5">Role-based access matrix governing clinical dispensaries, stock custody, and administrative overrides</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_ACCOUNTS.map(acc => {
              const isCurrent = currentUser?.id === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition ${
                    isCurrent
                      ? 'border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {acc.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          {acc.name}
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              Current Session
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">{acc.email}</div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {acc.role}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="space-y-0.5 text-slate-600 flex-1">
                      <div><strong>Department:</strong> {acc.department}</div>
                      <div><strong>Facility:</strong> {acc.hospitalName}</div>
                      <div className="text-[10px] text-slate-400">
                        Permissions: {acc.role === 'Hospital Administrator' ? 'Full Master CRUD + Policy' : acc.role === 'Pharmacist' ? 'FEFO Dispense & Batch Tracking' : acc.role === 'Inventory Manager' ? 'Physical Stock & Transfer Rebalancing' : 'PO Issuance & Pipeline Control'}
                      </div>
                    </div>
                    <div className="shrink-0 pt-1 sm:pt-0">
                      {isCurrent ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Active Operating Persona
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            switchRole(acc.role);
                            showToast(`Switched active operational persona to ${acc.role} (${acc.name}).`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Switch to {acc.role}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SUB-TAB 7: DATABASE & CSV/EXCEL REPOSITORY --- */}
      {activeSubTab === 'database' && (
        <DatabaseCsvHub />
      )}

      {/* ============================================================ */}
      {/* ITEM ADD / EDIT MODAL */}
      {/* ============================================================ */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingItem ? `Edit SKU: ${editingItem.name}` : 'Add New Master Hospital SKU'}
              </h3>
              <button onClick={() => setItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Meropenem IV 1g"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">SKU / Code</label>
                  <input
                    type="text"
                    required
                    value={itemForm.code}
                    onChange={e => setItemForm({ ...itemForm, code: e.target.value })}
                    placeholder="e.g. ABX-MERO-02"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-medium"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={itemForm.unitCost}
                    onChange={e => setItemForm({ ...itemForm, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Packaging Unit</label>
                  <input
                    type="text"
                    required
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    placeholder="Vial, Box, etc."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={itemForm.manufacturer}
                    onChange={e => setItemForm({ ...itemForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Primary Supplier</label>
                  <input
                    type="text"
                    required
                    value={itemForm.supplier}
                    onChange={e => setItemForm({ ...itemForm, supplier: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Safety Stock Threshold</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={itemForm.safetyStock}
                    onChange={e => setItemForm({ ...itemForm, safetyStock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Reorder Point</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={itemForm.reorderLevel}
                    onChange={e => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BATCH ADD / EDIT MODAL */}
      {/* ============================================================ */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingBatch ? `Edit Lot: ${editingBatch.batchNumber}` : 'Receive New Batch Lot'}
              </h3>
              <button onClick={() => setBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Target Product</label>
                <select
                  value={batchForm.itemId}
                  onChange={e => setBatchForm({ ...batchForm, itemId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batchNumber}
                    onChange={e => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Storage Location</label>
                  <select
                    value={batchForm.locationId}
                    onChange={e => setBatchForm({ ...batchForm, locationId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.hospitalName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Received Date</label>
                  <input
                    type="date"
                    required
                    value={batchForm.receivedDate}
                    onChange={e => setBatchForm({ ...batchForm, receivedDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={e => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Quantity Received</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchForm.quantityReceived}
                    onChange={e => setBatchForm({ ...batchForm, quantityReceived: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={batchForm.currentStock}
                    onChange={e => setBatchForm({ ...batchForm, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Lot Status</label>
                  <select
                    value={batchForm.status}
                    onChange={e => setBatchForm({ ...batchForm, status: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="quarantine">QUARANTINE</option>
                    <option value="expired">EXPIRED</option>
                    <option value="depleted">DEPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Auditor Notes</label>
                <input
                  type="text"
                  value={batchForm.notes}
                  onChange={e => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="Optional audit notes"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LOCATION ADD / EDIT MODAL */}
      {/* ============================================================ */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingLocation ? `Edit Ward: ${editingLocation.name}` : 'Configure New Hospital Location'}
              </h3>
              <button onClick={() => setLocationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Location / Ward Name</label>
                <input
                  type="text"
                  required
                  value={locationForm.name}
                  onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g. Cardiac Intensive Care Unit"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Department Type</label>
                <select
                  value={locationForm.type}
                  onChange={e => setLocationForm({ ...locationForm, type: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="Central Store">Central Store</option>
                  <option value="ICU">ICU</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Oncology">Oncology</option>
                  <option value="Surgical Suite">Surgical Suite</option>
                  <option value="General Ward">General Ward</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Parent Hospital Facility</label>
                <select
                  value={locationForm.hospitalId}
                  onChange={e => {
                    const hospName =
                      e.target.value === 'hosp_apex'
                        ? 'Apex Metro Super-Speciality'
                        : e.target.value === 'hosp_city'
                        ? 'City Health North Hospital'
                        : 'St. Jude Community Hospital';
                    setLocationForm({ ...locationForm, hospitalId: e.target.value, hospitalName: hospName });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="hosp_apex">Apex Metro Super-Speciality</option>
                  <option value="hosp_city">City Health North Hospital</option>
                  <option value="hosp_stjude">St. Jude Community Hospital</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PURCHASE ORDER ADD / EDIT MODAL */}
      {/* ============================================================ */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingPO ? `Edit Purchase Order: ${editingPO.poNumber}` : 'Create Purchase Order'}
              </h3>
              <button onClick={() => setPoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">PO Tracking Number</label>
                <input
                  type="text"
                  required
                  value={poForm.poNumber}
                  onChange={e => setPoForm({ ...poForm, poNumber: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Target Product</label>
                <select
                  value={poForm.itemId}
                  onChange={e => {
                    const sel = itemMap.get(e.target.value);
                    setPoForm({
                      ...poForm,
                      itemId: e.target.value,
                      supplier: sel?.supplier || poForm.supplier,
                      unitPrice: sel?.unitCost || poForm.unitPrice,
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Order Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={poForm.quantity}
                    onChange={e => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={poForm.unitPrice}
                    onChange={e => setPoForm({ ...poForm, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={poForm.expectedDate}
                    onChange={e => setPoForm({ ...poForm, expectedDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Pipeline Status</label>
                  <select
                    value={poForm.status}
                    onChange={e => setPoForm({ ...poForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="pending">PENDING</option>
                    <option value="shipped">SHIPPED</option>
                    <option value="delivered">DELIVERED</option>
                    <option value="delayed">DELAYED</option>
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Vendor / Supplier</label>
                <input
                  type="text"
                  required
                  value={poForm.supplier}
                  onChange={e => setPoForm({ ...poForm, supplier: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPoModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Save Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

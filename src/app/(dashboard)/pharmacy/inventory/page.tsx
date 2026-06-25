'use client';

import React, { useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';
import { ToastContext } from '@/context/ToastContext';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

// --- Types ---
type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  expiry: string;
  daysToExpiry: number;
};

export default function InventoryManagementPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const toastContext = useContext(ToastContext);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string, field: keyof InventoryItem } | null>(null);
  
  const [showPoModal, setShowPoModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Fetch medicines from the API
  const { data: medicines = [], isLoading } = useQuery({
    queryKey: ['pharmacyInventory', search, category],
    queryFn: () =>
      fetch(`/api/inventory?search=${search}&category=${category}`).then((res) => res.json()),
  });

  const [localInventory, setLocalInventory] = useState<any[]>([]);

  // Sync React Query data to local state for inline editing responsiveness
  useEffect(() => {
    if (medicines) {
      setLocalInventory(medicines);
    }
  }, [medicines]);

  // Mutation to update stock, expiry, or name
  const updateMedicineMutation = useMutation({
    mutationFn: (updated: any) =>
      fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update inventory');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacyInventory'] });
      toastContext?.addToast('Inventory updated successfully', 'success');
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Failed to update inventory', 'error');
    }
  });

  // --- Inline Editing ---
  const handleDoubleClick = (id: string, field: keyof InventoryItem) => {
    if (field === 'name' || field === 'stock' || field === 'expiry') {
      setEditingCell({ id, field });
    }
  };

  const handleEditChange = (id: string, field: keyof InventoryItem, value: string) => {
    setLocalInventory(localInventory.map(item => {
      if (item.id === id) {
        if (field === 'expiry') {
          return { ...item, expiryDate: new Date(value).toISOString() };
        }
        return { ...item, [field]: field === 'stock' ? Number(value) || 0 : value };
      }
      return item;
    }));
  };

  const handleEditBlur = () => {
    if (!editingCell) return;
    const item = localInventory.find(it => it.id === editingCell.id);
    setEditingCell(null);
    if (item) {
      updateMedicineMutation.mutate({
        id: item.id,
        name: item.name,
        stock: Number(item.stock) || 0,
        expiryDate: item.expiryDate || new Date(item.expiry),
      });
    }
  };

  // --- Helpers ---
  const getStatus = (item: InventoryItem) => {
    if (item.daysToExpiry < 7) return { label: 'At Risk / Expired', color: 'bg-red-100 text-red-700 border-red-200' };
    if (item.daysToExpiry < 30 || item.stock < 50) return { label: 'Low Stock / Soon', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Healthy', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  // Map db medicine schema structure to InventoryItem UI structure
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mappedInventory = localInventory.map((med: any) => {
    const expDate = new Date(med.expiryDate);
    const daysToExpiry = differenceInDays(expDate, today);
    return {
      id: med.id,
      name: med.name,
      category: med.category,
      stock: med.stock,
      expiry: med.expiryDate ? format(expDate, 'yyyy-MM-dd') : '',
      daysToExpiry,
    };
  });

  // Filtered Data (already partially filtered in API, but let's keep search filter safe locally)
  const filteredInventory = mappedInventory;

  // --- AI PO Modal ---
  const handleApprovePO = () => {
    setIsApproving(true);
    setTimeout(() => {
      setIsApproving(false);
      setShowPoModal(false);
      if (toastContext) {
        toastContext.addToast('Purchase Order Approved & PDF Exported', 'success');
      }
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{getTranslation(language, 'auto.inventory_management')}</h1>
          <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.track_stock_expiry_dates_and_manage_rest')}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {getTranslation(language, 'auto.bulk_import_csv')}</button>
          <button 
            onClick={() => setShowPoModal(true)}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-lg hover:-translate-y-0.5 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            {getTranslation(language, 'auto.generate_po')}</button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Col: Table */}
        <div className="lg:col-span-3 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50/50">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={getTranslation(language, 'auto.search_inventory')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              />
              <svg className="w-4 h-4 absolute left-4 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{getTranslation(language, 'auto.all_categories')}</option>
              <option value="Antibiotic">{getTranslation(language, 'auto.antibiotic')}</option>
              <option value="Analgesic">{getTranslation(language, 'auto.analgesic')}</option>
              <option value="Antidiabetic">{getTranslation(language, 'auto.antidiabetic')}</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 pl-6">{getTranslation(language, 'auto.medicine_name')}</th>
                  <th className="p-4">{getTranslation(language, 'auto.category')}</th>
                  <th className="p-4">{getTranslation(language, 'auto.stock')}</th>
                  <th className="p-4">{getTranslation(language, 'auto.expiry')}</th>
                  <th className="p-4 pr-6">{getTranslation(language, 'auto.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <svg className="w-5 h-5 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>{getTranslation(language, 'auto.loading_inventory')}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      {getTranslation(language, 'auto.no_medicines_found')}</td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const status = getStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        
                        <td className="p-4 pl-6 font-bold text-slate-900" onDoubleClick={() => handleDoubleClick(item.id, 'name')}>
                          {editingCell?.id === item.id && editingCell?.field === 'name' ? (
                            <input 
                              autoFocus 
                              className="border border-teal-500 px-2 py-1 rounded w-full" 
                              value={item.name} 
                              onChange={(e) => handleEditChange(item.id, 'name', e.target.value)}
                              onBlur={handleEditBlur}
                              onKeyDown={e => e.key === 'Enter' && handleEditBlur()}
                            />
                          ) : (
                            <span className="border-b border-transparent group-hover:border-slate-300 cursor-text" title={getTranslation(language, 'auto.double_click_to_edit')}>{item.name}</span>
                          )}
                        </td>

                        <td className="p-4 text-slate-500">{item.category}</td>
                        
                        <td className="p-4 font-mono font-semibold" onDoubleClick={() => handleDoubleClick(item.id, 'stock')}>
                          {editingCell?.id === item.id && editingCell?.field === 'stock' ? (
                            <input 
                              autoFocus 
                              type="number"
                              className="border border-teal-500 px-2 py-1 rounded w-20" 
                              value={item.stock} 
                              onChange={(e) => handleEditChange(item.id, 'stock', e.target.value)}
                              onBlur={handleEditBlur}
                              onKeyDown={e => e.key === 'Enter' && handleEditBlur()}
                            />
                          ) : (
                            <span className="border-b border-transparent group-hover:border-slate-300 cursor-text" title={getTranslation(language, 'auto.double_click_to_edit')}>{item.stock}</span>
                          )}
                        </td>

                        <td className="p-4" onDoubleClick={() => handleDoubleClick(item.id, 'expiry')}>
                          {editingCell?.id === item.id && editingCell?.field === 'expiry' ? (
                            <input 
                              autoFocus 
                              type="date"
                              className="border border-teal-500 px-2 py-1 rounded w-36" 
                              value={item.expiry} 
                              onChange={(e) => handleEditChange(item.id, 'expiry', e.target.value)}
                              onBlur={handleEditBlur}
                              onKeyDown={e => e.key === 'Enter' && handleEditBlur()}
                            />
                          ) : (
                            <span className="border-b border-transparent group-hover:border-slate-300 cursor-text text-slate-600" title={getTranslation(language, 'auto.double_click_to_edit')}>
                              {new Date(item.expiry).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                            </span>
                          )}
                        </td>

                        <td className="p-4 pr-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                            {status.label}
                          </span>
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 text-xs text-slate-400 bg-slate-50 flex justify-between">
            <span>{getTranslation(language, 'auto.showing')}{filteredInventory.length} {getTranslation(language, 'auto.items')}</span>
            <span>{getTranslation(language, 'auto.tip_double_click_a_cell_to_inline_edit')}</span>
          </div>
        </div>

        {/* Right Col: Expiry Heat Map */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col">
          <h2 className="font-bold text-slate-900 mb-2">{getTranslation(language, 'auto.expiry_heat_map')}</h2>
          <p className="text-xs text-slate-500 mb-6">{getTranslation(language, 'auto.upcoming_30_days_risk_analysis')}</p>

          <div className="flex-1">
            <div className="grid grid-cols-7 gap-1">
              {['M','T','W','T','F','S','S'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 mb-2">{d}</div>
              ))}
              
              {/* Mock Calendar Grid for Heat Map */}
              {Array.from({length: 28}).map((_, i) => {
                // Determine mock risk color (Teal -> Red gradient)
                let bgColor = 'bg-teal-50';
                if (i === 4 || i === 12) bgColor = 'bg-red-500 shadow-sm ring-1 ring-red-600'; // High risk (red)
                else if (i === 18 || i === 22) bgColor = 'bg-amber-400 shadow-sm'; // Medium risk (amber)
                else if (i > 25) bgColor = 'bg-teal-200'; // Low risk
                
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-md ${bgColor} flex items-center justify-center text-[10px] text-white font-bold cursor-help transition-transform hover:scale-110`}
                    title={`Day ${i+1}: ${i===4 ? '50 units expiring' : 'No expiry risk'}`}
                  ></div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-between text-xs text-slate-500 font-bold">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-teal-100"></div> {getTranslation(language, 'auto.safe')}</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-400"></div> {getTranslation(language, 'auto.low')}</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500"></div> {getTranslation(language, 'auto.high_risk')}</div>
          </div>
        </div>
      </div>

      {/* AI Purchase Order Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPoModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl w-full relative z-10 border border-slate-200 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {getTranslation(language, 'auto.ai_restock_suggestions')}<span className="text-[10px] uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">{getTranslation(language, 'auto.beta')}</span>
                  </h2>
                  <p className="text-sm text-slate-500">{getTranslation(language, 'auto.purchase_order_generated_based_on_histor')}</p>
                </div>
              </div>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-6">
              <div className="grid grid-cols-12 p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <div className="col-span-5">{getTranslation(language, 'auto.medicine')}</div>
                <div className="col-span-3 text-center">{getTranslation(language, 'auto.suggested_qty')}</div>
                <div className="col-span-4">{getTranslation(language, 'auto.ai_confidence')}</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {[
                  { name: 'Ibuprofen 400mg', qty: 500, conf: 98, color: 'bg-emerald-500' },
                  { name: 'Vitamin C 1000mg', qty: 1200, conf: 92, color: 'bg-emerald-500' },
                  { name: 'Amoxicillin 250mg', qty: 300, conf: 76, color: 'bg-amber-500' },
                  { name: 'Azithromycin 500mg', qty: 150, conf: 64, color: 'bg-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="grid grid-cols-12 p-3 items-center hover:bg-white transition-colors">
                    <div className="col-span-5 font-bold text-sm text-slate-800">{item.name}</div>
                    <div className="col-span-3 text-center font-mono font-bold text-teal-700 bg-teal-50 mx-4 py-1 rounded border border-teal-100">{item.qty}</div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.conf}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{item.conf}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowPoModal(false)}
                className="flex-1 py-3 text-slate-600 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {getTranslation(language, 'auto.discard')}</button>
              <button 
                onClick={handleApprovePO}
                disabled={isApproving}
                className="flex-1 py-3 text-white font-bold bg-teal-600 rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
              >
                {isApproving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {getTranslation(language, 'auto.processing')}</>
                ) : (
                  'Approve PO & Export'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

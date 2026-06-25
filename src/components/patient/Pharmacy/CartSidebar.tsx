'use client';
import { useContext } from 'react';
import { useCartStore } from '@/store/cartStore';
import { X, Minus, Plus, Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrescriptionUpload } from './PrescriptionUpload';
import { PaymentModal } from '../PaymentModal';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const router = useRouter();

  const handleConfirmOrder = async (address: string, paymentMethod: 'cod' | 'online') => {
    setIsPlacingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            medicineId: item.id,
            quantity: item.quantity,
          })),
          deliveryAddress: address,
          paymentMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const data = await response.json();
      clearCart();
      setIsPaymentModalOpen(false);
      router.push(`/patient/orders/${data.order.id}`);
    } catch (error: any) {
      alert(error.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (items.length >= 2) {
      fetch('/api/ai/drug-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: items }),
      })
        .then(res => res.json())
        .then(data => setInteractions(data.interactions || []))
        .catch(() => setInteractions([]));
    } else {
      setInteractions([]);
    }
  }, [items]);

  if (!isOpen || !isClient) return null;

  const deliveryEstimate = items.length > 0 ? '2-3 business days' : '';

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transition-transform transform translate-x-0">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{getTranslation(language, 'auto.your_cart')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <span className="text-6xl">🛒</span>
              <p>{getTranslation(language, 'auto.your_cart_is_empty')}</p>
              <button onClick={onClose} className="text-teal-600 font-semibold hover:underline">{getTranslation(language, 'auto.continue_shopping')}</button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-teal-50 rounded-lg flex items-center justify-center text-2xl">💊</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.dosage}</p>
                    <p className="text-sm font-black text-teal-700 mt-1">₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 bg-white border rounded shadow-sm hover:border-teal-500 text-slate-600"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 bg-white border rounded shadow-sm hover:border-teal-500 text-slate-600"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {interactions.length > 0 && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-orange-800 font-bold text-sm mb-2 flex items-center gap-2">
                {getTranslation(language, 'auto.ai_drug_interaction_alert')}</h3>
              <div className="space-y-3">
                {interactions.map((interaction, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-orange-100 shadow-sm text-xs">
                    <p className="font-semibold text-slate-800 mb-1">
                      {interaction.medicines.join(' + ')}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        interaction.severity === 'Severe' ? 'bg-red-100 text-red-700' :
                        interaction.severity === 'Moderate' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{interaction.severity}</span>
                    </p>
                    <p className="text-slate-600 mb-1">{interaction.description}</p>
                    <p className="text-orange-700 font-medium">{interaction.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-slate-600">
                <span>{getTranslation(language, 'auto.subtotal')}</span>
                <span className="font-semibold text-slate-800">₹{total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>{getTranslation(language, 'auto.delivery')}</span>
                <span className="text-teal-600 font-medium">{getTranslation(language, 'auto.free')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 pt-2 border-t border-slate-200 border-dashed">
                <span>{getTranslation(language, 'auto.est_delivery')}</span>
                <span>{deliveryEstimate}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowPrescriptionUpload(true)}
              className="mb-3 w-full bg-white border-2 border-teal-100 text-teal-700 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>📄</span> {getTranslation(language, 'auto.auto_add_from_prescription')}</button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={isPlacingOrder}
              className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? 'Processing...' : `Proceed to Checkout • ₹${total().toFixed(2)}`}
            </button>
          </div>
        )}
      </div>

      {showPrescriptionUpload && (
        <PrescriptionUpload
          onClose={() => setShowPrescriptionUpload(false)}
          onDetected={(medicines) => {
            alert(`Detected medicines: ${medicines.map(m => m.name).join(', ')}`);
            setShowPrescriptionUpload(false);
          }}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={total()}
        onConfirm={handleConfirmOrder}
      />
    </>
  );
}

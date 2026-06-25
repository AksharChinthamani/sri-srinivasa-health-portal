'use client';

import { useEffect, useState, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, MapPin, CreditCard, ChevronLeft, Loader2 } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import Link from 'next/link';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const orderId = params.id as string;

  const { data: orders = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['patientOrders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const order = orders.find((o) => o.id === orderId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 space-y-4">
        <Package className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Order Not Found</h2>
        <p>We couldn't find the details for this order.</p>
        <Link href="/patient/pharmacy">
          <button className="px-6 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition">
            Go to Pharmacy
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => router.push('/patient/pharmacy')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 font-medium mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Pharmacy
      </button>

      {/* Success Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-8 text-white text-center shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Order Placed Successfully!</h1>
        <p className="text-teal-50 font-medium max-w-md mx-auto">
          Your order has been received and is currently being processed by our pharmacy team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Order Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-500" /> Order Summary
            </h2>
            
            <div className="space-y-4">
              {(order.items || []).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-lg">💊</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} {item.dosage ? `• ${item.dosage}` : ''}</p>
                    </div>
                  </div>
                  <div className="font-bold text-slate-700">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">₹{order.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-medium text-teal-600">Free</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-dashed border-slate-200 mt-2">
                <span>Total</span>
                <span>₹{order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Info */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Order Info</h3>
            
            <div className="space-y-5">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">Delivery Address</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{order.deliveryAddress}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">Payment Method</p>
                  <p className="text-xs text-slate-500 capitalize flex items-center gap-1.5">
                    {order.paymentMethod === 'online' ? (
                      <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online Payment (Paid)</>
                    ) : order.paymentMethod === 'cod' ? (
                      <><span className="w-2 h-2 rounded-full bg-amber-500"></span> Cash on Delivery</>
                    ) : (
                      'Cash on Delivery'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 rounded-3xl p-6 border border-teal-100">
            <h3 className="text-teal-800 font-bold mb-1">What's next?</h3>
            <p className="text-teal-600 text-xs leading-relaxed">
              You will receive a notification when your order is out for delivery. You can track all your orders from your dashboard.
            </p>
            <Link href="/patient/dashboard">
              <button className="mt-4 w-full bg-white border border-teal-200 text-teal-700 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-100 transition shadow-sm">
                Go to Dashboard
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

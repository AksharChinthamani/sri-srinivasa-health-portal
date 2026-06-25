'use client';
import { useState, useContext } from 'react';
import { X, QrCode, Banknote, MapPin, Loader2 } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (address: string, paymentMethod: 'cod' | 'online') => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, totalAmount, onConfirm }: PaymentModalProps) {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Generate a fake QR code URL via QuickChart (encodes a UPI payment URI)
  // In a real app, this would integrate with Razorpay/Stripe APIs.
  const upiId = 'hospital@upi';
  const qrUrl = `https://quickchart.io/qr?text=upi://pay?pa=${upiId}%26pn=Sri%20Srinivasa%20Hospital%26am=${totalAmount.toFixed(2)}&size=200`;

  const handleConfirm = async () => {
    if (!address.trim()) {
      alert('Please enter a delivery address.');
      return;
    }
    if (!paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onConfirm(address, paymentMethod);
    } catch (e: any) {
      alert(e.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Total: <span className="text-teal-600 font-bold">₹{totalAmount.toFixed(2)}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Address Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-500" /> Delivery Address
            </label>
            <textarea
              placeholder="Enter your complete home address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none h-20"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cod' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Banknote className={`w-8 h-8 ${paymentMethod === 'cod' ? 'text-teal-500' : 'text-slate-400'}`} />
                <span className="font-semibold text-sm">Cash on Delivery</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('online')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'online' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <QrCode className={`w-8 h-8 ${paymentMethod === 'online' ? 'text-teal-500' : 'text-slate-400'}`} />
                <span className="font-semibold text-sm">Online / UPI</span>
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          {paymentMethod === 'online' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center animate-in slide-in-from-top-2 duration-300">
              <p className="text-sm font-bold text-slate-700 mb-4">Scan QR to Pay ₹{totalAmount.toFixed(2)}</p>
              <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-slate-100 mx-auto">
                {/* We use an img tag with the QuickChart URL */}
                <img src={qrUrl} alt="Payment QR Code" className="w-40 h-40 object-contain mx-auto" />
              </div>
              <p className="text-xs text-slate-500 mt-4 px-4 leading-relaxed">
                Open any UPI app (GPay, PhonePe, Paytm) and scan this code. Do not close this window until payment is complete.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !paymentMethod || !address.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : paymentMethod === 'online' ? (
              `I have completed the payment`
            ) : paymentMethod === 'cod' ? (
              `Confirm Order (Pay on Delivery)`
            ) : (
              `Select Payment Method`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

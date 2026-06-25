'use client';
import { useCartStore } from '@/store/cartStore';
import { StockBadge } from './StockBadge';

export function MedicineCard({ medicine }: { medicine: any }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      id: medicine.id,
      name: medicine.name,
      dosage: medicine.dosage,
      price: medicine.price,
      maxStock: medicine.stock,
    });
  };

  const isOutOfStock = medicine.stock === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="h-32 bg-teal-50 rounded-lg mb-4 flex items-center justify-center text-5xl overflow-hidden relative group-hover:bg-teal-100 transition-colors">
        {medicine.imageUrl ? (
          <img src={medicine.imageUrl} alt={medicine.name} className="w-full h-full object-cover mix-blend-multiply" />
        ) : (
          <span>💊</span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-slate-800 line-clamp-1">{medicine.name}</h3>
          <StockBadge status={medicine.stockStatus} />
        </div>
        <p className="text-xs text-slate-500 mt-1">{medicine.dosage} • {medicine.category}</p>
        <p className="text-lg font-black text-teal-700 mt-3">₹{medicine.price.toFixed(2)}</p>
      </div>
      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          isOutOfStock
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]'
        }`}
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}

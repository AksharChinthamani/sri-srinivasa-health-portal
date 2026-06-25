interface Stats {
  revenueToday: number;
  activePatients: number;
  appointmentsToday: number;
  expiringMedicines: number;
  lowStockMedicines: number;
  pendingOrders: number;
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Today\'s Revenue', value: `₹${stats.revenueToday.toFixed(2)}`, icon: '💰' },
    { label: 'Active Patients', value: stats.activePatients, icon: '👤' },
    { label: 'Appointments Today', value: stats.appointmentsToday, icon: '📅' },
    { label: 'Expiring Medicines', value: stats.expiringMedicines, icon: '⚠️' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

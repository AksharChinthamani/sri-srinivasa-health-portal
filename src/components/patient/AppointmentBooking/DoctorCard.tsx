export function DoctorCard({ doctor, isSelected, onSelect }: any) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition ${
        isSelected ? 'border-teal-500 bg-teal-50' : 'hover:border-gray-400'
      }`}
    >
      <div className="flex items-center gap-4">
        <img src={doctor.photo} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
        <div>
          <h3 className="font-semibold">{doctor.name}</h3>
          <p className="text-sm text-gray-600">{doctor.specialty}</p>
          <p className="text-xs text-yellow-500">⭐ {doctor.rating}</p>
        </div>
      </div>
    </div>
  );
}

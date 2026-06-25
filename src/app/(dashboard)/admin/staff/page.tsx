'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { StaffRosterGrid } from '@/components/admin/Staff/StaffRosterGrid';
import { LeaveRequestModal } from '@/components/admin/Staff/LeaveRequestModal';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function StaffRosterPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch staff data
  const { data: staffList = [], isLoading } = useQuery<any[]>({
    queryKey: ['staffRoster', weekStart],
    queryFn: async () => {
      const res = await fetch('/api/admin/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Mutation to update shifts
  const updateShiftsMutation = useMutation({
    mutationFn: (shifts: any[]) =>
      fetch('/api/admin/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRoster'] });
    },
  });

  // Mutation for leave request
  const createLeaveMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/admin/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRoster'] });
    },
  });

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Parse data from active and over ids: "staffId-dayOfWeek"
    const [staffId, dayStr] = active.id.toString().split('-');
    const [overStaffId, overDayStr] = over.id.toString().split('-');
    if (staffId !== overStaffId) return; // only allow same staff for simplicity (or we can move to different staff)

    const day = parseInt(dayStr);
    const overDay = parseInt(overDayStr);
    if (day === overDay) return;

    // Update shift for this staff and day
    const staff = staffList?.find((s: any) => s.id === staffId);
    if (!staff) return;

    // Find shift on source day and target day
    const sourceShift = staff.shifts.find((s: any) => s.dayOfWeek === day);
    const targetShift = staff.shifts.find((s: any) => s.dayOfWeek === overDay);

    const shiftsToUpdate = [];
    if (sourceShift) {
      // Move source shift to target day
      shiftsToUpdate.push({
        id: sourceShift.id,
        staffId: staff.id,
        dayOfWeek: overDay,
        startTime: sourceShift.startTime,
        endTime: sourceShift.endTime,
        type: sourceShift.type,
      });
    }
    if (targetShift) {
      // Move target shift to source day
      shiftsToUpdate.push({
        id: targetShift.id,
        staffId: staff.id,
        dayOfWeek: day,
        startTime: targetShift.startTime,
        endTime: targetShift.endTime,
        type: targetShift.type,
      });
    }

    if (shiftsToUpdate.length > 0) {
      updateShiftsMutation.mutate(shiftsToUpdate);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{getTranslation(language, 'auto.staff_roster')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(prev => addDays(prev, -7))}
            className="p-1 border rounded hover:bg-gray-100"
          >
            ←
          </button>
          <span className="font-medium">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setWeekStart(prev => addDays(prev, 7))}
            className="p-1 border rounded hover:bg-gray-100"
          >
            →
          </button>
          <button className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700">
            {getTranslation(language, 'auto.export_pdf')}</button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-96 bg-gray-200 rounded"></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <StaffRosterGrid
            staff={staffList || []}
            weekStart={weekStart}
            onLeaveRequest={(staff: any) => {
              setSelectedStaff(staff);
              setShowLeaveModal(true);
            }}
            onUpdateShift={(shift: any) => {
              updateShiftsMutation.mutate([shift]);
            }}
          />
        </DndContext>
      )}

      {showLeaveModal && selectedStaff && (
        <LeaveRequestModal
          staff={selectedStaff}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={(data) => {
            createLeaveMutation.mutate({ ...data, staffId: selectedStaff.id });
            setShowLeaveModal(false);
          }}
        />
      )}
    </div>
  );
}

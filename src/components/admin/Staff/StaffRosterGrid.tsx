'use client';
import { useContext } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format, addDays } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

interface StaffRosterGridProps {
  staff: any[];
  weekStart: Date;
  onLeaveRequest: (staff: any) => void;
  onUpdateShift: (shift: any) => void;
}

// Helper to get shift color
const shiftColors = {
  Morning: 'bg-yellow-100 border-yellow-200 text-yellow-800',
  Evening: 'bg-blue-100 border-blue-200 text-blue-800',
  Night: 'bg-purple-100 border-purple-200 text-purple-800',
};

export function StaffRosterGrid({ staff, weekStart, onLeaveRequest, onUpdateShift }: StaffRosterGridProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // For each staff, build a map of shift by day
  const staffData = staff.map((s) => {
    const shiftsByDay: Record<number, any[]> = {};
    s.shifts.forEach((shift: any) => {
      if (!shiftsByDay[shift.dayOfWeek]) shiftsByDay[shift.dayOfWeek] = [];
      shiftsByDay[shift.dayOfWeek].push(shift);
    });
    // Check if any leave request overlaps this week
    const leaves = s.leaveRequests.filter((leave: any) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      // Check if any day of the week falls within leave period
      return days.some(day => day >= start && day <= end);
    });
    return { ...s, shiftsByDay, leaves };
  });

  return (
    <div className="bg-white rounded-lg shadow border overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {getTranslation(language, 'auto.staff')}</th>
            {days.map((day) => (
              <th key={day.toISOString()} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {format(day, 'EEE d')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {staffData.map((staff) => (
            <tr key={staff.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold">
                    {staff.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{staff.user?.name || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500">{staff.role}</div>
                  </div>
                  <button
                    onClick={() => onLeaveRequest(staff)}
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    {getTranslation(language, 'auto.request_leave')}</button>
                </div>
              </td>
              {days.map((day, idx) => {
                const dayOfWeek = idx; // 0=Monday (since weekStartsOn:1)
                const shifts = staff.shiftsByDay[dayOfWeek] || [];
                const hasLeave = staff.leaves.some((leave: any) => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  return day >= start && day <= end && leave.status === 'APPROVED';
                });
                const hasPendingLeave = staff.leaves.some((leave: any) => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  return day >= start && day <= end && leave.status === 'PENDING';
                });

                return (
                  <td key={day.toISOString()} className="px-2 py-2 text-center align-top">
                    {hasLeave ? (
                      <div className="bg-red-100 text-red-700 text-xs p-1 rounded border border-red-200">
                        <Calendar size={12} className="inline mr-1" />
                        {getTranslation(language, 'auto.leave')}</div>
                    ) : hasPendingLeave ? (
                      <div className="bg-yellow-100 text-yellow-700 text-xs p-1 rounded border border-yellow-200">
                        <Clock size={12} className="inline mr-1" />
                        {getTranslation(language, 'auto.pending')}</div>
                    ) : shifts.length > 0 ? (
                      shifts.map((shift: any) => (
                        <DraggableShift
                          key={shift.id}
                          shift={shift}
                          staffId={staff.id}
                          dayOfWeek={dayOfWeek}
                          onUpdateShift={onUpdateShift}
                        />
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Draggable shift component
function DraggableShift({ shift, staffId, dayOfWeek, onUpdateShift: _onUpdateShift }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${staffId}-${dayOfWeek}`,
    data: { shift, staffId, dayOfWeek },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  const colorClass = shiftColors[shift.type as keyof typeof shiftColors] || 'bg-gray-100';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`text-xs p-1 rounded border cursor-grab ${colorClass} mb-1`}
    >
      <div>{shift.type}</div>
      <div className="font-mono">{shift.startTime}–{shift.endTime}</div>
    </div>
  );
}

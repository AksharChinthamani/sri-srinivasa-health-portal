'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { QueueList } from '@/components/admin/QueueView/QueueList';
import { DisplayBoard } from '@/components/admin/QueueView/DisplayBoard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function QueuePage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [displayMode, setDisplayMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery<any[]>({
    queryKey: ['queue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/queue');
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 5000,
  });

  const callNextMutation = useMutation({
    mutationFn: () => fetch('/api/admin/queue/call', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queue'] }),
  });

  const completeTokenMutation = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/admin/queue/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queue'] }),
  });

  const exportPDF = () => {
    if (!tokens) return;
    const doc = new jsPDF();
    doc.text('Daily Queue Report', 14, 15);
    doc.text(`Date: ${format(new Date(), 'PPP')}`, 14, 25);

    const tableData = tokens.map((t: any) => [
      t.tokenNumber,
      t.patient.name,
      t.status,
      t.calledAt ? format(new Date(t.calledAt), 'hh:mm a') : '—',
    ]);

    autoTable(doc, {
      head: [['Token', 'Patient', 'Status', 'Called At']],
      body: tableData,
      startY: 35,
    });
    doc.save('queue-report.pdf');
  };

  if (displayMode) {
    return (
      <DisplayBoard
        tokens={tokens || []}
        onExit={() => setDisplayMode(false)}
      />
    );
  }

  const waitingCount = tokens?.filter((t: any) => t.status === 'WAITING').length || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{getTranslation(language, 'auto.queue_management')}</h1>
          <p className="text-sm text-gray-500">{waitingCount} {getTranslation(language, 'auto.patients_waiting')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => callNextMutation.mutate()}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
          >
            {getTranslation(language, 'auto.call_next')}<span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">
              {waitingCount}
            </span>
          </button>
          <button
            onClick={() => setDisplayMode(true)}
            className="border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            {getTranslation(language, 'auto.display_board')}</button>
          <button
            onClick={exportPDF}
            className="border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            {getTranslation(language, 'auto.export_pdf')}</button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      ) : (
        <QueueList
          tokens={tokens || []}
          onComplete={(id) => completeTokenMutation.mutate(id)}
        />
      )}
    </div>
  );
}

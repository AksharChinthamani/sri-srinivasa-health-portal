'use client';
import { useEffect, useState } from 'react';
import { DownloadCloud, Eye } from 'lucide-react';

export function PrescriptionView({ pathname, fileName }: { pathname: string; fileName?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/blob/signed-url?pathname=${encodeURIComponent(pathname)}`);
        if (!res.ok) throw new Error('Failed to fetch signed URL');
        const data = await res.json();
        setUrl(data.url);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchUrl();
  }, [pathname]);

  if (loading) {
    return <div className="animate-pulse h-12 w-48 bg-slate-100 rounded-xl"></div>;
  }

  if (error || !url) {
    return <div className="text-red-500 text-xs font-semibold">Failed to load attachment</div>;
  }

  return (
    <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 w-fit transition hover:bg-indigo-50">
      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
        <DownloadCloud size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{fileName || 'Attached Document'}</span>
        <div className="flex gap-3 mt-1">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
            <Eye size={12} /> View File
          </a>
        </div>
      </div>
    </div>
  );
}

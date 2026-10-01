import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: string | null;
  saveError: string | null;
}

function formatSavedTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isSaving,
  lastSavedAt,
  saveError,
}) => {
  if (saveError) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 text-red-700 text-xs font-semibold flex items-center gap-2 no-print">
        <AlertCircle size={13} />
        {saveError}
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-1 text-blue-600 text-xs font-semibold flex items-center gap-2 no-print">
        <Loader2 size={13} className="animate-spin" />
        Saving changes…
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className="bg-emerald-50/60 border-b border-emerald-100/60 px-4 py-1 text-emerald-700 text-xs font-medium flex items-center gap-1.5 no-print">
        <CheckCircle2 size={12} className="text-emerald-600" />
        All changes saved locally ({formatSavedTime(lastSavedAt)})
      </div>
    );
  }

  return null;
};

export default SaveIndicator;

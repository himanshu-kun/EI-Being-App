import React, { useState, useEffect } from 'react';
import { EmotionEntry } from '../types';
import { isSampleEntry } from '../sampleData';
import { 
  RotateCcw, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Trash2, 
  Upload, 
  FileText,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export interface EntrySnapshot {
  id: string;
  timestamp: number;
  reason: string;
  userEntriesCount: number;
  userEntries: EmotionEntry[];
  sampleIncluded: boolean;
}

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEntries: EmotionEntry[];
  includeSampleData: boolean;
  onRestoreEntries: (entries: EmotionEntry[]) => void;
  onRestoreSnapshot: (snapshot: EntrySnapshot) => void;
}

export const scanStorageForOrphanedEntries = (existingUserEntries: EmotionEntry[]): EmotionEntry[] => {
  const existingIds = new Set(existingUserEntries.map(e => e.id));
  const discovered: EmotionEntry[] = [];
  const discoveredKeysSeen = new Set<string>();

  const testAndExtract = (rawJson: string | null) => {
    if (!rawJson) return;
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            item &&
            typeof item === 'object' &&
            item.id &&
            Array.isArray(item.selectedEmotions) &&
            !isSampleEntry(item) &&
            !existingIds.has(item.id)
          ) {
            const key = `${item.id}-${item.timestamp}`;
            if (!discoveredKeysSeen.has(key)) {
              discoveredKeysSeen.add(key);
              discovered.push(item as EmotionEntry);
            }
          }
        }
      } else if (parsed && typeof parsed === 'object' && parsed.userEntries && Array.isArray(parsed.userEntries)) {
        for (const item of parsed.userEntries) {
          if (
            item &&
            typeof item === 'object' &&
            item.id &&
            !isSampleEntry(item) &&
            !existingIds.has(item.id)
          ) {
            const key = `${item.id}-${item.timestamp}`;
            if (!discoveredKeysSeen.has(key)) {
              discoveredKeysSeen.add(key);
              discovered.push(item as EmotionEntry);
            }
          }
        }
      }
    } catch {
      // Ignore unparseable storage entries
    }
  };

  try {
    // 1. Scan localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        testAndExtract(localStorage.getItem(key));
      }
    }
    // 2. Scan sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        testAndExtract(sessionStorage.getItem(key));
      }
    }
  } catch (err) {
    console.error('Error scanning storage for orphaned entries', err);
  }

  return discovered;
};

const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  currentUserEntries,
  includeSampleData,
  onRestoreEntries,
  onRestoreSnapshot,
}) => {
  const [snapshots, setSnapshots] = useState<EntrySnapshot[]>([]);
  const [orphanedEntries, setOrphanedEntries] = useState<EmotionEntry[]>([]);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load snapshots from localStorage
    try {
      const rawSnapshots = localStorage.getItem('emotionEntries_snapshots');
      if (rawSnapshots) {
        const parsed: EntrySnapshot[] = JSON.parse(rawSnapshots);
        setSnapshots(Array.isArray(parsed) ? parsed : []);
      } else {
        setSnapshots([]);
      }
    } catch {
      setSnapshots([]);
    }

    // Scan for any orphaned or previously wiped entries across browser storage
    const found = scanStorageForOrphanedEntries(currentUserEntries);
    setOrphanedEntries(found);
  }, [isOpen, currentUserEntries]);

  if (!isOpen) return null;

  const handleRestoreOrphaned = () => {
    if (orphanedEntries.length === 0) return;
    onRestoreEntries(orphanedEntries);
    setStatusMessage({
      text: `Successfully recovered and restored ${orphanedEntries.length} previous reflection entry/entries!`,
      type: 'success',
    });
    setOrphanedEntries([]);
  };

  const handleApplySnapshot = (snapshot: EntrySnapshot) => {
    onRestoreSnapshot(snapshot);
    setStatusMessage({
      text: `Restored snapshot from ${new Date(snapshot.timestamp).toLocaleTimeString()} with ${snapshot.userEntriesCount} entries.`,
      type: 'success',
    });
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      const list = Array.isArray(parsed) ? parsed : parsed.entries || [parsed];
      const validEntries: EmotionEntry[] = [];

      for (const item of list) {
        if (item && item.selectedEmotions && Array.isArray(item.selectedEmotions)) {
          validEntries.push({
            id: item.id || `recovered-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
            selectedEmotions: item.selectedEmotions,
            cause: item.cause || '',
            regulation: item.regulation || null,
            isSample: false,
          });
        }
      }

      if (validEntries.length === 0) {
        setStatusMessage({ text: 'No valid emotion entries found in the provided JSON.', type: 'error' });
        return;
      }

      onRestoreEntries(validEntries);
      setJsonInput('');
      setStatusMessage({ text: `Successfully imported ${validEntries.length} entry/entries!`, type: 'success' });
    } catch (err) {
      setStatusMessage({ text: 'Invalid JSON format. Please verify and try again.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Entries History & Recovery Center
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recover previous reflections, view safety snapshots, or restore backups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div
            className={`p-3 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Current State Summary */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                Current Personal Reflections: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentUserEntries.length}</span>
              </p>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                Demo sample set is currently: <span className="font-semibold">{includeSampleData ? 'Visible (6 demo entries)' : 'Hidden (Your entries only)'}</span>
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center gap-1 border border-emerald-300/40">
              <ShieldCheck className="w-3 h-3" /> Safe Storage
            </span>
          </div>

          {/* Section 1: Discovered Orphaned Entries */}
          {orphanedEntries.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                    {orphanedEntries.length} Recoverable Previous Entry/Entries Found!
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    We discovered previous reflection entries saved in your browser storage that are not in your active list. You can restore them right now with 1 click:
                  </p>
                </div>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pl-7 pr-1">
                {orphanedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg text-xs border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {entry.selectedEmotions.map(e => e.name).join(', ')}
                      </span>
                      {entry.cause && (
                        <span className="text-gray-500 dark:text-gray-400 italic block line-clamp-1">
                          "{entry.cause}"
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pl-7 pt-1">
                <button
                  onClick={handleRestoreOrphaned}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore All {orphanedEntries.length} Entries Now
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Automatic Version Snapshots */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              Automatic Safety Snapshots ({snapshots.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A safety checkpoint is automatically captured whenever entries change. You can jump back to any previous state at any time.
            </p>

            {snapshots.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-center text-xs text-gray-500 border border-gray-100 dark:border-gray-700">
                Snapshots will appear here as you log reflections or update options.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {snapshots.slice(0, 10).map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600/80 flex items-center justify-between transition"
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                          {snapshot.reason}
                        </span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded-full font-bold">
                          {snapshot.userEntriesCount} reflections
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {new Date(snapshot.timestamp).toLocaleDateString()} at{' '}
                        {new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplySnapshot(snapshot)}
                      className="shrink-0 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-600 font-semibold text-xs py-1.5 px-3 rounded-lg transition flex items-center gap-1 shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Manual JSON Import / Backup */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              Manual Backup / JSON Import
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              If you have entries saved in text or JSON format from another session, paste them below:
            </p>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"selectedEmotions": [{"name": "Frustration", "bundleName": "Anger"}], "cause": "Work deadline", "regulation": "Took a walk"}]'
              rows={2}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            {jsonInput.trim().length > 0 && (
              <button
                onClick={handleImportJson}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition"
              >
                Import Entries
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs py-2 px-4 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryModal;

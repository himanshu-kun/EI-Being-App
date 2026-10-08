import React, { useState } from 'react';
import { EmotionEntry } from '../types';
import { isSampleEntry } from '../sampleData';
import { 
  Sparkles, 
  BarChart2, 
  PlusCircle, 
  BookOpen, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  History,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Trash2,
  Info
} from 'lucide-react';
import RemediesBank from './RemediesBank';

interface HomePageProps {
  onAddNewEntry: () => void;
  onViewInsights: () => void;
  onViewAiAnalysis: () => void;
  entries: EmotionEntry[];
  userEntriesCount: number;
  includeSampleData: boolean;
  onToggleSampleData: (enable?: boolean) => void;
  onEdit: (entry: EmotionEntry) => void;
  onView: (entry: EmotionEntry) => void;
  onDelete?: (id: string) => void;
  onOpenRecoveryModal: () => void;
}

const ENTRIES_PER_PAGE = 6;

const HomePage: React.FC<HomePageProps> = ({
  onAddNewEntry,
  onViewInsights,
  onViewAiAnalysis,
  entries,
  userEntriesCount,
  includeSampleData,
  onToggleSampleData,
  onEdit,
  onView,
  onDelete,
  onOpenRecoveryModal,
}) => {
  const [activeTab, setActiveTab] = useState<'remedies' | 'entries'>('remedies');
  const [entriesPage, setEntriesPage] = useState<number>(1);

  const hasEntries = entries.length > 0;
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  // Count entries with recorded regulations/remedies
  const userRemediesCount = entries.filter(e => e.regulation && e.regulation.trim().length > 0).length;

  // Pagination for entries log
  const totalEntriesPages = Math.max(1, Math.ceil(sortedEntries.length / ENTRIES_PER_PAGE));
  const currentEntriesPage = Math.min(entriesPage, totalEntriesPages);
  const paginatedEntries = sortedEntries.slice(
    (currentEntriesPage - 1) * ENTRIES_PER_PAGE,
    currentEntriesPage * ENTRIES_PER_PAGE
  );

  return (
    <div className="space-y-7">
      {/* Hero Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 mb-3 tracking-tight">
          EI Being
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-5 max-w-md">
          Log your emotional states and discover your personal triggers and proven stabilizing remedies.
        </p>

        {/* Action Buttons Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
          <button
            onClick={onAddNewEntry}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add New Entry</span>
          </button>

          <button
            onClick={onViewAiAnalysis}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 relative group"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>AI Triggers & Remedies</span>
            {hasEntries && (
              <span className="absolute -top-2 -right-1 bg-amber-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                AI Ready
              </span>
            )}
          </button>
        </div>

        {hasEntries && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={onViewInsights}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>View Frequency & Volatility Stats</span>
            </button>
          </div>
        )}
      </div>

      {/* Sample Set Control Bar & Recovery Center */}
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Toggle Button for Sample Set */}
          <button
            type="button"
            onClick={() => onToggleSampleData()}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
              includeSampleData
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            }`}
            title="Toggle sample demo set without touching your personal entries"
          >
            {includeSampleData ? (
              <ToggleRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
            <span>Sample Demo Set: {includeSampleData ? 'ON' : 'OFF'}</span>
            <span className="text-[10px] font-normal opacity-80">
              ({includeSampleData ? '6 sample reflections visible' : 'Hidden'})
            </span>
          </button>

          <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{userEntriesCount}</span> Personal Reflection{userEntriesCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Data Recovery / History Button */}
        <button
          onClick={onOpenRecoveryModal}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-600 transition"
        >
          <History className="w-3.5 h-3.5 text-indigo-500" />
          <span>Recover Previous Entries / History</span>
        </button>
      </div>

      {/* Primary Home Tabs Switcher */}
      <div className="bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl flex items-center justify-center max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab('remedies')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'remedies'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Remedies & Stabilization Bank</span>
          {userRemediesCount > 0 && (
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded-full font-bold">
              {userRemediesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('entries')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'entries'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Reflection Logs</span>
          <span className="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.2 rounded-full font-bold">
            {entries.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Personalized Remedies and Stabilization Bank */}
      {activeTab === 'remedies' && (
        <RemediesBank
          entries={entries}
          onAddNewEntry={onAddNewEntry}
          includeSampleData={includeSampleData}
          onToggleSampleData={onToggleSampleData}
        />
      )}

      {/* TAB 2: Recent Reflection Entries List */}
      {activeTab === 'entries' && (
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>Reflection Entries ({entries.length})</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userEntriesCount} personal logged • {includeSampleData ? '6 sample demo entries included' : 'Sample demo set hidden'}
              </p>
            </div>

            {/* Quick Toggle Sample Set Button in List Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleSampleData()}
                className={`text-xs font-semibold py-1 px-3 rounded-lg border transition flex items-center gap-1.5 ${
                  includeSampleData
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                }`}
              >
                {includeSampleData ? (
                  <>
                    <span>Hide Sample Set</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Include Sample Set</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {!hasEntries ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                No Reflection Entries Displayed
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                You currently have no personal entries logged and the sample demo set is toggled off.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={onAddNewEntry}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs transition"
                >
                  Log Your First Entry
                </button>
                <button
                  onClick={() => onToggleSampleData(true)}
                  className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 font-semibold text-xs py-2 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 transition"
                >
                  Turn On Sample Demo Set
                </button>
                <button
                  onClick={onOpenRecoveryModal}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 text-xs font-semibold py-2 px-3 rounded-xl transition"
                >
                  Check Recoverable Entries
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedEntries.map((entry) => {
                  const isSample = isSampleEntry(entry);

                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-xl shadow-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isSample
                          ? 'bg-white dark:bg-gray-800/90 border-amber-200/60 dark:border-amber-900/40 hover:border-amber-300'
                          : 'bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {new Date(entry.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>

                          {/* Personal vs Sample Badge */}
                          {isSample ? (
                            <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Demo Sample
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                              Personal Reflection
                            </span>
                          )}

                          {entry.regulation && (
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Has Remedy
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {entry.selectedEmotions.map((em) => (
                            <span
                              key={em.name}
                              className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                            >
                              {em.name}
                            </span>
                          ))}
                        </div>

                        {entry.cause && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic">
                            "{entry.cause}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => onView(entry)}
                          className="bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold py-1.5 px-3 rounded-lg transition-colors text-xs"
                          aria-label={`View entry from ${new Date(entry.timestamp).toLocaleDateString()}`}
                        >
                          View
                        </button>
                        <button
                          onClick={() => onEdit(entry)}
                          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-1.5 px-3 rounded-lg transition-colors text-xs"
                          aria-label={`Edit entry from ${new Date(entry.timestamp).toLocaleDateString()}`}
                        >
                          Edit
                        </button>
                        {!isSample && onDelete && (
                          <button
                            onClick={() => onDelete(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition text-xs"
                            title="Delete entry"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for 100+ entries */}
              {sortedEntries.length > ENTRIES_PER_PAGE && (
                <div className="flex items-center justify-between pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    Showing {(currentEntriesPage - 1) * ENTRIES_PER_PAGE + 1} to{' '}
                    {Math.min(currentEntriesPage * ENTRIES_PER_PAGE, sortedEntries.length)} of{' '}
                    {sortedEntries.length} entries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEntriesPage((p) => Math.max(1, p - 1))}
                      disabled={currentEntriesPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2.5 py-1 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      Page {currentEntriesPage} of {totalEntriesPages}
                    </span>
                    <button
                      onClick={() => setEntriesPage((p) => Math.min(totalEntriesPages, p + 1))}
                      disabled={currentEntriesPage >= totalEntriesPages}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;

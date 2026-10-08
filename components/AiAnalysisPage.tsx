import React, { useState, useEffect, useMemo } from 'react';
import { EmotionEntry, AIEmotionalReport, EmotionBundleName } from '../types';
import { EMOTION_BUNDLES } from '../constants';
import { 
  Sparkles, 
  ArrowLeft, 
  ShieldAlert, 
  RefreshCw, 
  Quote, 
  Activity, 
  Zap, 
  BookOpen, 
  Check, 
  Info,
  PlusCircle,
  Star
} from 'lucide-react';

interface AiAnalysisPageProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onNavigateToNewEntry: () => void;
  includeSampleData?: boolean;
  onToggleSampleData?: (enable?: boolean) => void;
  userEntriesCount?: number;
  onLoadSampleEntries?: () => void;
}

const AiAnalysisPage: React.FC<AiAnalysisPageProps> = ({ 
  entries, 
  onBack, 
  onNavigateToNewEntry,
  includeSampleData,
  onToggleSampleData,
  userEntriesCount,
  onLoadSampleEntries 
}) => {
  const [report, setReport] = useState<AIEmotionalReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quick rescue playbook interactive state
  const [rescueSelectedBundle, setRescueSelectedBundle] = useState<EmotionBundleName>('Anger');
  const [starredRemedies, setStarredRemedies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('starredRemedies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedPlaybookRemedyId, setSelectedPlaybookRemedyId] = useState<string | null>(null);

  const toggleStar = (remedyId: string) => {
    setStarredRemedies((prev) => {
      const next = prev.includes(remedyId)
        ? prev.filter((id) => id !== remedyId)
        : [remedyId, ...prev];
      try {
        localStorage.setItem('starredRemedies', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save starred remedies', err);
      }
      return next;
    });
  };

  const handleSelectRescueBundle = (bundle: EmotionBundleName) => {
    setRescueSelectedBundle(bundle);
  };

  // Compile all remedies as a Playbook for the selected negative emotion category
  const playbookRemedies = useMemo(() => {
    if (!rescueSelectedBundle) return [];

    // 1. All user-logged entries for this negative emotion bundle with a remedy
    const userProven = entries
      .filter(
        (e) =>
          e.regulation &&
          e.regulation.trim().length > 0 &&
          e.selectedEmotions.some((em) => em.bundleName === rescueSelectedBundle)
      )
      .map((e) => ({
        id: e.id,
        remedyText: e.regulation!.trim(),
        date: new Date(e.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        specificEmotions: e.selectedEmotions.map((em) => em.name).join(', '),
        cause: e.cause ? e.cause.trim() : null,
        sourceType: 'user_proven' as const,
      }));

    // 2. Curated standard complementary options
    const defaults: Record<
      string,
      { id: string; remedyText: string; specificEmotions: string; cause: string | null }[]
    > = {
      Anger: [
        {
          id: 'curated-anger-walk',
          remedyText: '10–15 minute walk in a park or open air to cool down, breathe fresh air, and stop ruminating',
          specificEmotions: 'Frustration, Annoyance, Rage',
          cause: 'Physical displacement metabolizes adrenaline and relieves chest tension',
        },
        {
          id: 'curated-anger-water',
          remedyText: 'Drink cold water slowly and splash cool water on face and wrists',
          specificEmotions: 'Irritation, Agitation',
          cause: 'Triggers the vagus dive response to gently lower heart rate',
        },
      ],
      Fear: [
        {
          id: 'curated-fear-478',
          remedyText: '4-7-8 belly breathing (inhale 4s, hold 7s, exhale 8s for 4 steady cycles)',
          specificEmotions: 'Anxiety, Panic, Nervousness',
          cause: 'Activates parasympathetic relaxation to stop spiral thoughts',
        },
        {
          id: 'curated-fear-grounding',
          remedyText: '5-4-3-2-1 Sensory Grounding: name 5 things seen, 4 touched, 3 heard, 2 smelled, 1 felt',
          specificEmotions: 'Dread, Overwhelm, Worry',
          cause: 'Pulls attention from panic loops back into the physical room',
        },
      ],
      Sadness: [
        {
          id: 'curated-sadness-warmth',
          remedyText: 'Wrap in a warm blanket, step into sunlight, or hold a warm mug of tea',
          specificEmotions: 'Melancholy, Grief, Dejection',
          cause: 'Physical warmth signals emotional safety and eases somatic heaviness',
        },
        {
          id: 'curated-sadness-connect',
          remedyText: '10-minute catch up call with a friend or listen to comforting acoustic music',
          specificEmotions: 'Loneliness, Sorrow, Regret',
          cause: 'Gentle low-pressure connection breaks isolation loops',
        },
      ],
    };

    const curated = (defaults[rescueSelectedBundle] || []).map((c) => ({
      ...c,
      date: 'Recommended',
      sourceType: 'ai_recommended' as const,
    }));

    // Combine user proven entries + curated recommendations
    const combined = [...userProven, ...curated];

    // Starred remedies are listed at the very TOP of the list!
    return combined.sort((a, b) => {
      const aStarred = starredRemedies.includes(a.id);
      const bStarred = starredRemedies.includes(b.id);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      if (a.sourceType === 'user_proven' && b.sourceType !== 'user_proven') return -1;
      if (a.sourceType !== 'user_proven' && b.sourceType === 'user_proven') return 1;
      return 0;
    });
  }, [entries, rescueSelectedBundle, starredRemedies]);

  // Ensure an initial active remedy selection
  useEffect(() => {
    if (playbookRemedies.length > 0 && (!selectedPlaybookRemedyId || !playbookRemedies.some(r => r.id === selectedPlaybookRemedyId))) {
      setSelectedPlaybookRemedyId(playbookRemedies[0].id);
    }
  }, [playbookRemedies, selectedPlaybookRemedyId]);

  const fetchAnalysis = async (entriesToAnalyze: EmotionEntry[]) => {
    if (entriesToAnalyze.length === 0) {
      setReport(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-emotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: entriesToAnalyze }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: AIEmotionalReport = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error('Failed to analyze entries:', err);
      setError(err?.message || 'Failed to complete AI emotional analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length > 0) {
      fetchAnalysis(entries);
    }
  }, [entries.length]);

  const userProvenCountForBundle = useMemo(() => {
    return entries.filter(
      (e) =>
        e.regulation &&
        e.regulation.trim().length > 0 &&
        e.selectedEmotions.some((em) => em.bundleName === rescueSelectedBundle)
    ).length;
  }, [entries, rescueSelectedBundle]);

  const activeRemedy = useMemo(() => {
    if (playbookRemedies.length === 0) return null;
    const found = playbookRemedies.find((r) => r.id === selectedPlaybookRemedyId);
    return found || playbookRemedies[0];
  }, [playbookRemedies, selectedPlaybookRemedyId]);

  const getBundleColor = (bundleName: EmotionBundleName) => {
    const bundle = EMOTION_BUNDLES.find((b) => b.name === bundleName);
    return bundle ? bundle.color : 'bg-gray-500';
  };

  const provenCount = useMemo(() => {
    return entries.filter((e) => e.regulation && e.regulation.trim().length > 0).length;
  }, [entries]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
              AI Triggers & Remedies
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalized emotional intelligence mined from your reflection logs
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            onClick={() => fetchAnalysis(entries)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Re-analyze'}
          </button>
        )}
      </div>

      {/* Empty State when no entries */}
      {entries.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              No Reflection Entries Yet
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Log your emotions, what triggered them, and any strategies you used (like walking in the park, music, breathing). AI will automatically discover your personal triggers and build a stabilization remedy bank.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToNewEntry}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition"
            >
              Add Your First Reflection
            </button>
            {onToggleSampleData && (
              <button
                onClick={() => onToggleSampleData(true)}
                className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold py-2.5 px-6 rounded-lg transition border border-indigo-200 dark:border-indigo-800"
              >
                Turn On Sample Reflections with Remedies
              </button>
            )}
            {!onToggleSampleData && onLoadSampleEntries && (
              <button
                onClick={onLoadSampleEntries}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2.5 px-6 rounded-lg transition border border-gray-200 dark:border-gray-600"
              >
                Load Sample Reflections with Remedies
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900 animate-ping opacity-25"></div>
            <div className="w-16 h-16 rounded-full border-4 border-t-indigo-600 border-indigo-200 dark:border-indigo-800 animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Analyzing Your Emotional Patterns...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Examining triggers, emotional causes, and what helped you stabilize across your entries.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Analysis Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Analysis Content */}
      {report && !isLoading && (
        <>
          {/* Analyzed Entries Count */}
          <div className="bg-white dark:bg-gray-800 rounded-xl px-5 py-3.5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {report.analyzedEntriesCount} Entries Analyzed
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userEntriesCount !== undefined
                    ? `${userEntriesCount} personal reflection${userEntriesCount === 1 ? '' : 's'}${includeSampleData ? ' + 6 demo samples' : ''}`
                    : 'Reflections processed for personalized remedies & stabilization'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {provenCount > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                  {provenCount} Tested Remedies
                </span>
              )}
              {onToggleSampleData && (
                <button
                  onClick={() => onToggleSampleData(!includeSampleData)}
                  className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2.5 py-1.5 rounded-lg transition"
                  title="Toggle sample demo set on/off without disturbing your personal entries"
                >
                  {includeSampleData ? 'Hide Sample Set' : 'Include Sample Set'}
                </button>
              )}
              <button
                onClick={onBack}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              >
                <span>Remedies Bank on Home</span>
                <span>➔</span>
              </button>
            </div>
          </div>

          {/* Quick Mood Rescue Section (Interactive) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Quick Mood Rescue
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select a negative emotion state to open your tested remedy playbook and stabilize fast
                </p>
              </div>

              {/* Negative Emotions Pills Only */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mr-1">
                  Focus:
                </span>
                {EMOTION_BUNDLES.filter((bundle) => ['Anger', 'Fear', 'Sadness'].includes(bundle.name)).map((bundle) => {
                  const isSelected = rescueSelectedBundle === bundle.name;
                  return (
                    <button
                      key={bundle.name}
                      onClick={() => handleSelectRescueBundle(bundle.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${bundle.color}`} />
                      <span>{bundle.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Friendly Notice if no user remedies have been logged for this emotion category yet */}
            {userProvenCountForBundle === 0 && (
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950 dark:text-amber-100">
                      No personal remedies logged for {rescueSelectedBundle} yet
                    </p>
                    <p className="text-amber-900/90 dark:text-amber-200/90 text-xs leading-relaxed">
                      We scanned your reflection history, but haven't found an entry where you noted what helped you navigate <strong>{rescueSelectedBundle}</strong>. When you log a reflection and record what helped you in the regulation step (like taking a walk in the park, breathwork, stretching, or talking to someone), it will automatically be cataloged here as your personalized go-to playbook.
                    </p>
                  </div>
                </div>

                <div className="pl-6 pt-1 flex flex-wrap items-center gap-2">
                  <button
                    onClick={onNavigateToNewEntry}
                    className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Log a Reflection for {rescueSelectedBundle}
                  </button>
                  {onLoadSampleEntries && (
                    <button
                      onClick={onLoadSampleEntries}
                      className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-gray-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-amber-300 dark:border-amber-700 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Load Sample Reflections (With Tested Park Walk)
                    </button>
                  )}
                  <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 italic">
                    Or select and star one of the starter strategies below right now!
                  </span>
                </div>
              </div>
            )}

            {/* Basics of Implementing the Strategy */}
            {activeRemedy && (
              <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-emerald-50/80 dark:from-indigo-950/40 dark:via-gray-900/40 dark:to-emerald-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-indigo-600 text-white rounded-md">
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                      Basics of Implementing The Strategy
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {starredRemedies.includes(activeRemedy.id) && (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> Starred Priority
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-gray-700/60">
                      {activeRemedy.sourceType === 'user_proven' ? 'Proven in Your Reflections' : 'Starter Strategy'}
                    </span>
                  </div>
                </div>

                {/* 3 Simple Action Phases */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  {/* Step 1 */}
                  <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg p-3 border border-gray-200/80 dark:border-gray-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                        Step 1
                      </span>
                      <span className="text-xs text-gray-400 font-semibold hidden md:inline">➔</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Pause & Acknowledge
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                      Pause your current tasks for a few minutes and acknowledge what you are feeling ({rescueSelectedBundle}).
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg p-3 border-2 border-indigo-500/80 dark:border-indigo-500/60 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                        Step 2 • Active Choice
                      </span>
                      <span className="text-xs text-gray-400 font-semibold hidden md:inline">➔</span>
                    </div>
                    <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Follow Your Tested Strategy
                    </p>
                    <p className="text-[11px] text-indigo-900 dark:text-indigo-100 font-semibold leading-relaxed bg-indigo-50/70 dark:bg-indigo-950/60 p-1.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                      "{activeRemedy.remedyText}"
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg p-3 border border-gray-200/80 dark:border-gray-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                        Step 3
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Check Back In
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                      Check back in with your body after 10–15 minutes to notice if your tension has stabilized.
                    </p>
                  </div>
                </div>

                {/* Minimalist Flow Reminder */}
                <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 pt-0.5 font-medium">
                  Pause your current tasks for a few minutes/acknowledge ➔ follow one of your tested strategy ➔ check back in with your body after 10-15 minutes
                </p>
              </div>
            )}

            {/* The Remedy Playbook List for the Selected Category */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    {rescueSelectedBundle} Remedies Playbook ({playbookRemedies.length})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click any remedy to choose it as your active strategy. Star remedies to pin them at the top.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {starredRemedies.filter(id => playbookRemedies.some(r => r.id === id)).length} Starred
                  </span>
                  <span>•</span>
                  <span>
                    {userProvenCountForBundle} User Logged
                  </span>
                </div>
              </div>

              {/* Playbook Cards */}
              <div className="space-y-2.5">
                {playbookRemedies.map((remedy) => {
                  const isSelected = activeRemedy?.id === remedy.id;
                  const isStarred = starredRemedies.includes(remedy.id);
                  const isProven = remedy.sourceType === 'user_proven';

                  return (
                    <div
                      key={remedy.id}
                      onClick={() => setSelectedPlaybookRemedyId(remedy.id)}
                      className={`cursor-pointer rounded-xl p-4 transition-all border ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                          : isProven
                          ? 'border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/15 dark:bg-emerald-950/10 hover:border-emerald-300 dark:hover:border-emerald-700'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          {/* Tags row */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isStarred && (
                              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300/60 dark:border-amber-700/60">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> Pinned at Top
                              </span>
                            )}

                            {isProven ? (
                              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Proven in Reflection ({remedy.date})
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                Starter Strategy
                              </span>
                            )}

                            {remedy.specificEmotions && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                Emotions: {remedy.specificEmotions}
                              </span>
                            )}
                          </div>

                          {/* Strategy text */}
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                            {remedy.remedyText}
                          </h4>

                          {/* Cause / context if recorded */}
                          {remedy.cause && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 pt-0.5">
                              <Quote className="w-3 h-3 shrink-0 text-gray-400 mt-0.5" />
                              <span className="italic">
                                {isProven ? 'Context when logged:' : 'Helpful context:'} "{remedy.cause}"
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Action buttons: Star & Choose */}
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(remedy.id);
                            }}
                            title={isStarred ? 'Unstar remedy' : 'Star remedy to pin at top'}
                            className={`p-1.5 rounded-lg transition ${
                              isStarred
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                                : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaybookRemedyId(remedy.id);
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                Selected
                              </>
                            ) : (
                              'Choose'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* AI Mindful Recommendations */}
          {report.aiRecommendations && report.aiRecommendations.length > 0 && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Recommendations for Your Emotional Practice
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {report.aiRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-gray-700 dark:text-gray-300 leading-relaxed shadow-xs"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AiAnalysisPage;

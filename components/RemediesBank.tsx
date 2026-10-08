import React, { useState, useMemo } from 'react';
import { EmotionEntry, EmotionBundleName } from '../types';
import { EMOTION_BUNDLES } from '../constants';
import { 
  BookOpen, 
  Star, 
  Search, 
  Check, 
  Quote, 
  PlusCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface RemediesBankProps {
  entries: EmotionEntry[];
  onAddNewEntry: () => void;
  includeSampleData?: boolean;
  onToggleSampleData?: (enable?: boolean) => void;
  onLoadSampleEntries?: () => void;
}

interface BankRemedy {
  id: string;
  title: string;
  moodCategory: EmotionBundleName;
  allBundles: EmotionBundleName[];
  targetEmotions: string[];
  description: string;
  sourceType: 'user_proven' | 'ai_recommended';
  causeContext?: string | null;
  date: string;
  timestamp?: number;
}

const CURATED_STARTER_REMEDIES: BankRemedy[] = [
  {
    id: 'curated-anger-walk',
    title: '10–15 minute walk in a park or open air',
    moodCategory: 'Anger',
    allBundles: ['Anger'],
    targetEmotions: ['Frustration', 'Annoyance', 'Rage'],
    description: 'Physical displacement and rhythmic movement metabolize adrenaline, open airways, and halt repetitive frustration loops.',
    sourceType: 'ai_recommended',
    causeContext: 'Useful when feeling sudden impatience, workplace friction, or rising anger',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-anger-water',
    title: 'Cold water dive reflex & deliberate hydration',
    moodCategory: 'Anger',
    allBundles: ['Anger'],
    targetEmotions: ['Irritation', 'Agitation'],
    description: 'Splash cool water on face and wrists and drink a tall glass of cold water slowly to physically trigger the vagal brake and lower heart rate.',
    sourceType: 'ai_recommended',
    causeContext: 'Rapid somatic reset when feeling overheated or emotionally agitated',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-fear-478',
    title: '4-7-8 Parasympathetic Belly Breathing',
    moodCategory: 'Fear',
    allBundles: ['Fear'],
    targetEmotions: ['Anxiety', 'Panic', 'Nervousness'],
    description: 'Inhale through nose for 4 seconds, hold breath for 7 seconds, exhale slowly through mouth for 8 seconds. Repeat for 4 steady cycles.',
    sourceType: 'ai_recommended',
    causeContext: 'Directly downregulates the sympathetic fight-or-flight nervous response',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-fear-grounding',
    title: '5-4-3-2-1 Sensory Grounding Technique',
    moodCategory: 'Fear',
    allBundles: ['Fear'],
    targetEmotions: ['Dread', 'Overwhelm', 'Worry'],
    description: 'Name 5 things you see, 4 you can physically touch, 3 you hear, 2 you smell, and 1 you taste or physically feel in the room.',
    sourceType: 'ai_recommended',
    causeContext: 'Anchors awareness into the physical room away from speculative panic spirals',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-sadness-warmth',
    title: 'Somatic Comfort & Warmth Reset',
    moodCategory: 'Sadness',
    allBundles: ['Sadness'],
    targetEmotions: ['Melancholy', 'Grief', 'Dejection'],
    description: 'Wrap yourself in a warm blanket, step into gentle natural sunlight, or hold a warm mug of tea with both hands.',
    sourceType: 'ai_recommended',
    causeContext: 'Physical warmth signals somatic safety and gently eases internal heaviness',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-sadness-connect',
    title: 'Low-Pressure Connection or Uplifting Audio',
    moodCategory: 'Sadness',
    allBundles: ['Sadness'],
    targetEmotions: ['Loneliness', 'Sorrow', 'Regret'],
    description: 'Send a gentle low-pressure text to a supportive friend, listen to soothing acoustic music, or step outside for 5 minutes.',
    sourceType: 'ai_recommended',
    causeContext: 'Breaks withdrawal loops without demanding forced cheerfulness',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-joy-savoring',
    title: '2-Minute Savoring & Anchor Journaling',
    moodCategory: 'Joy',
    allBundles: ['Joy'],
    targetEmotions: ['Happiness', 'Contentment', 'Pride'],
    description: 'Spend 2 minutes writing down what made this moment work well to encode positive memories into long-term emotional resilience.',
    sourceType: 'ai_recommended',
    causeContext: 'Reinforces positive cognitive pathways and gratitude',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-love-gratitude',
    title: 'Expressive Gratitude & Warmth Outreach',
    moodCategory: 'Love',
    allBundles: ['Love'],
    targetEmotions: ['Affection', 'Compassion', 'Belonging'],
    description: 'Send a brief, sincere note of appreciation to someone who supported you or made a difference in your day.',
    sourceType: 'ai_recommended',
    causeContext: 'Deepens interpersonal safety and strengthens social connection bonds',
    date: 'Starter Strategy',
  },
  {
    id: 'curated-surprise-orienting',
    title: 'Orienting Breath & Fact Verification',
    moodCategory: 'Surprise',
    allBundles: ['Surprise'],
    targetEmotions: ['Shock', 'Astonishment', 'Confusion'],
    description: 'Take 3 steady breaths to let the unexpected shock dissipate before reacting, distinguishing verified facts from quick assumptions.',
    sourceType: 'ai_recommended',
    causeContext: 'Stabilizes cognitive processing following unexpected situations',
    date: 'Starter Strategy',
  },
];

const ITEMS_PER_PAGE = 5;

const RemediesBank: React.FC<RemediesBankProps> = ({
  entries,
  onAddNewEntry,
  includeSampleData,
  onToggleSampleData,
  onLoadSampleEntries,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showStarredOnly, setShowStarredOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Starred remedies persisted in localStorage
  const [starredRemedies, setStarredRemedies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('starredRemedies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // Compile user-proven remedies directly from logged entries where regulation is recorded
  const userProvenRemedies = useMemo<BankRemedy[]>(() => {
    return entries
      .filter((e) => e.regulation && e.regulation.trim().length > 0)
      .map((e) => {
        const primaryBundle = e.selectedEmotions[0]?.bundleName || 'Anger';
        const allBundles = Array.from(new Set(e.selectedEmotions.map((em) => em.bundleName)));
        return {
          id: `proven-${e.id}`,
          title: e.regulation!.trim(),
          moodCategory: primaryBundle,
          allBundles,
          targetEmotions: e.selectedEmotions.map((em) => em.name),
          description: e.regulation!.trim(),
          sourceType: 'user_proven',
          causeContext: e.cause ? e.cause.trim() : null,
          date: new Date(e.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          timestamp: e.timestamp,
        };
      });
  }, [entries]);

  // Combine user-proven remedies + curated starters (avoid duplicates if similar)
  const allRemedies = useMemo<BankRemedy[]>(() => {
    const combined = [...userProvenRemedies, ...CURATED_STARTER_REMEDIES];

    // Starred items stay at the very top!
    // Within each group, user-proven remedies are prioritized first
    return combined.sort((a, b) => {
      const aStarred = starredRemedies.includes(a.id);
      const bStarred = starredRemedies.includes(b.id);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      if (a.sourceType === 'user_proven' && b.sourceType !== 'user_proven') return -1;
      if (a.sourceType !== 'user_proven' && b.sourceType === 'user_proven') return 1;
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      return 0;
    });
  }, [userProvenRemedies, starredRemedies]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRemedies.length };
    EMOTION_BUNDLES.forEach((b) => {
      counts[b.name] = allRemedies.filter(
        (r) => r.moodCategory === b.name || r.allBundles.includes(b.name)
      ).length;
    });
    return counts;
  }, [allRemedies]);

  // Filtered list
  const filteredRemedies = useMemo(() => {
    return allRemedies.filter((remedy) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const matchesCategory =
          remedy.moodCategory === selectedCategory ||
          remedy.allBundles.includes(selectedCategory as EmotionBundleName);
        if (!matchesCategory) return false;
      }

      // Starred filter
      if (showStarredOnly && !starredRemedies.includes(remedy.id)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = remedy.title.toLowerCase().includes(q);
        const matchesDescription = remedy.description.toLowerCase().includes(q);
        const matchesContext = remedy.causeContext?.toLowerCase().includes(q) || false;
        const matchesEmotions = remedy.targetEmotions.some((em) => em.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDescription && !matchesContext && !matchesEmotions) {
          return false;
        }
      }

      return true;
    });
  }, [allRemedies, selectedCategory, showStarredOnly, starredRemedies, searchQuery]);

  // Reset pagination when filter criteria change
  const totalPages = Math.max(1, Math.ceil(filteredRemedies.length / ITEMS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedRemedies = useMemo(() => {
    const startIndex = (effectivePage - 1) * ITEMS_PER_PAGE;
    return filteredRemedies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRemedies, effectivePage]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const getBundleColor = (bundleName: EmotionBundleName) => {
    const bundle = EMOTION_BUNDLES.find((b) => b.name === bundleName);
    return bundle ? bundle.color : 'bg-gray-500';
  };

  const provenCount = userProvenRemedies.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-5">
      {/* Header with Title and Proven Stat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/80 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Personalized Remedies & Stabilization Bank
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Strategies that have helped you regain balance, mapped to each mood category
          </p>
        </div>

        <div className="flex items-center gap-2">
          {provenCount > 0 ? (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{provenCount} Tested in Reflections</span>
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1 rounded-full">
              Starter Strategies Active
            </span>
          )}
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => handleCategorySelect('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span>All Categories</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedCategory === 'all' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
          }`}>
            {categoryCounts.all || 0}
          </span>
        </button>

        {EMOTION_BUNDLES.map((bundle) => {
          const isSelected = selectedCategory === bundle.name;
          const count = categoryCounts[bundle.name] || 0;
          return (
            <button
              key={bundle.name}
              onClick={() => handleCategorySelect(bundle.name)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${bundle.color}`} />
              <span>{bundle.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search remedies (e.g., walk, breathing, water, call, pause)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => {
            setShowStarredOnly(!showStarredOnly);
            setCurrentPage(1);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shrink-0 ${
            showStarredOnly
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${showStarredOnly ? 'fill-amber-400 text-amber-500' : 'text-gray-400'}`} />
          <span>Starred Only</span>
          {starredRemedies.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
              {starredRemedies.length}
            </span>
          )}
        </button>
      </div>

      {/* Remedies List (Compact cards with pagination to prevent page elongation) */}
      <div className="space-y-3">
        {paginatedRemedies.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              No remedies found matching your criteria.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Whenever you log a reflection with "How you managed the feeling", it is automatically categorized here as your proven stabilization remedy.
            </p>
            <div className="pt-1 flex flex-wrap justify-center gap-2">
              <button
                onClick={onAddNewEntry}
                className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Log a Reflection with Remedy
              </button>
              {onToggleSampleData && (
                <button
                  onClick={() => onToggleSampleData(!includeSampleData)}
                  className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {includeSampleData ? 'Hide Sample Remedies' : 'Include Sample Remedies'}
                </button>
              )}
            </div>
          </div>
        ) : (
          paginatedRemedies.map((remedy) => {
            const isStarred = starredRemedies.includes(remedy.id);
            const isProven = remedy.sourceType === 'user_proven';

            return (
              <div
                key={remedy.id}
                className={`rounded-xl p-4 transition-all border ${
                  isStarred
                    ? 'border-amber-300/80 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs'
                    : isProven
                    ? 'border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/15 dark:bg-emerald-950/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Badge row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${getBundleColor(
                          remedy.moodCategory
                        )}`}
                      >
                        For {remedy.moodCategory}
                      </span>

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
                        <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          Starter Strategy
                        </span>
                      )}

                      {remedy.targetEmotions.length > 0 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                          Emotions: {remedy.targetEmotions.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Remedy Title / Text */}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                      {remedy.title}
                    </h3>

                    {/* Context / Cause Quote if logged */}
                    {remedy.causeContext && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 pt-0.5">
                        <Quote className="w-3 h-3 shrink-0 text-gray-400 mt-0.5" />
                        <span className="italic">
                          {isProven ? 'Context when logged:' : 'Helpful context:'} "{remedy.causeContext}"
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Star Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleStar(remedy.id)}
                    title={isStarred ? 'Unstar remedy' : 'Star remedy to pin at top'}
                    className={`p-2 rounded-lg transition shrink-0 ${
                      isStarred
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                        : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls - Prevents Page Elongation for 100+ Entries */}
      {filteredRemedies.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/80 text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing {(effectivePage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(effectivePage * ITEMS_PER_PAGE, filteredRemedies.length)} of{' '}
            {filteredRemedies.length} remedies
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={effectivePage === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              Page {effectivePage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={effectivePage >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemediesBank;

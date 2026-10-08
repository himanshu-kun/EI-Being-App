
import React, { useState } from 'react';
import { Emotion, EmotionEntry } from '../../types';
import { Sparkles, Check, Clock } from 'lucide-react';

interface AddRegulationProps {
  regulation: string;
  setRegulation: (regulation: string) => void;
  onSave: () => void;
  onSkip: () => void;
  onBack: () => void;
  selectedEmotions?: Emotion[];
  cause?: string;
  pastEntries?: EmotionEntry[];
}

const AddRegulation: React.FC<AddRegulationProps> = ({
  regulation,
  setRegulation,
  onSave,
  onSkip,
  onBack,
  selectedEmotions = [],
  cause = '',
  pastEntries = [],
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);

  // Extract proven remedies from past entries that match the current emotion bundles
  const currentBundles = selectedEmotions.map((e) => e.bundleName);
  const pastMatchingRemedies = pastEntries
    .filter((entry) => {
      if (!entry.regulation || entry.regulation.trim().length === 0) return false;
      return entry.selectedEmotions.some((e) => currentBundles.includes(e.bundleName));
    })
    .map((entry) => ({
      text: entry.regulation!,
      date: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      emotions: entry.selectedEmotions.map((e) => e.name).join(', '),
    }))
    // De-duplicate similar regulation text
    .filter((item, index, self) => index === self.findIndex((t) => t.text.toLowerCase().trim() === item.text.toLowerCase().trim()))
    .slice(0, 3);

  const handleFetchAiRemedy = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/suggest-remedy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmotions,
          cause,
          pastEntries,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAiSuggestion(data);
      }
    } catch (err) {
      console.error('Failed to get AI remedy suggestion:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyText = (text: string) => {
    if (regulation.trim().length === 0) {
      setRegulation(text);
    } else {
      setRegulation(`${regulation}\n${text}`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">How might you respond?</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Think about how you could navigate or regulate these feelings. This is optional.
      </p>

      {/* Past Proven Remedies Section */}
      {pastMatchingRemedies.length > 0 && (
        <div className="mb-4 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" /> What Helped You In Past Reflections:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pastMatchingRemedies.map((remedy, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyText(remedy.text)}
                className="text-left text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-600 p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition shadow-2xs group"
                title="Click to apply to your response"
              >
                <span className="font-medium group-hover:underline">"{remedy.text}"</span>
                <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Logged on {remedy.date}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion helper */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Your Regulation or Action Plan
        </label>
        <button
          type="button"
          onClick={handleFetchAiRemedy}
          disabled={aiLoading}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
          {aiLoading ? 'Thinking...' : 'Suggest Stabilizing Idea'}
        </button>
      </div>

      {aiSuggestion && (
        <div className="mb-4 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {aiSuggestion.title}
            </span>
            <button
              type="button"
              onClick={() => handleApplyText(aiSuggestion.suggestion || aiSuggestion.title)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Use This
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {aiSuggestion.suggestion}
          </p>
          {aiSuggestion.actionSteps && (
            <ul className="list-disc pl-4 text-gray-600 dark:text-gray-400 space-y-0.5">
              {aiSuggestion.actionSteps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-6">
        <textarea
          value={regulation}
          onChange={(e) => setRegulation(e.target.value)}
          placeholder="e.g., I took a 15-minute walk in the park to cool down, or practiced 5 slow breaths..."
          className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row-reverse sm:justify-between items-center gap-4">
        <div className="flex gap-4">
            <button
                onClick={onSave}
                disabled={regulation.trim().length === 0}
                className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                Save Entry
            </button>
            <button onClick={onSkip} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium px-4">
                Skip
            </button>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
          Back
        </button>
      </div>
    </div>
  );
};

export default AddRegulation;

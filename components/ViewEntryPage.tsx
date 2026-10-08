
import React from 'react';
import { EmotionEntry } from '../types';
import { EMOTION_BUNDLES } from '../constants';

interface ViewEntryPageProps {
  entry: EmotionEntry;
  onBack: () => void;
}

const ViewEntryPage: React.FC<ViewEntryPageProps> = ({ entry, onBack }) => {

  const getBundleColor = (bundleName: string) => {
    const bundle = EMOTION_BUNDLES.find(b => b.name === bundleName);
    return bundle ? bundle.color.replace('bg-', 'border-') : 'border-gray-500';
  };

  const getBundleTextColor = (bundleName: string) => {
    const bundle = EMOTION_BUNDLES.find(b => b.name === bundleName);
    return bundle ? bundle.textColor : 'text-gray-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Entry from {new Date(entry.timestamp).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </h2>
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          Back
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">You felt:</h3>
        <div className="flex flex-wrap gap-2">
          {entry.selectedEmotions.map(emotion => (
            <span 
              key={emotion.name} 
              className={`px-3 py-1 text-sm font-medium rounded-full border-2 ${getBundleColor(emotion.bundleName)} ${getBundleTextColor(emotion.bundleName)}`}
            >
              {emotion.name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">What was the cause?</h3>
        <p className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          {entry.cause}
        </p>
      </div>

      {entry.regulation && (
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Personal Stabilizing Remedy (Coping Bank)
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {entry.regulation}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            This strategy is cataloged for your AI Triggers & Remedies recommendations when you experience similar emotions.
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewEntryPage;
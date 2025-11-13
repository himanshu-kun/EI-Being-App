import React from 'react';
import { EmotionEntry } from '../types';

interface HomePageProps {
  onAddNewEntry: () => void;
  onViewInsights: () => void;
  entries: EmotionEntry[];
  onEdit: (entry: EmotionEntry) => void;
  onView: (entry: EmotionEntry) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onAddNewEntry, onViewInsights, entries, onEdit, onView }) => {
  const hasEntries = entries.length > 0;
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          EI Being
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Your personal space to understand and nurture your emotional well-being.
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <button
            onClick={onAddNewEntry}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
          >
            Add New Entry
          </button>
          {hasEntries && (
            <button
              onClick={onViewInsights}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              View Insights
            </button>
          )}
        </div>
      </div>

      {hasEntries && (
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 text-center sm:text-left">
            Recent Entries
          </h2>
          <div className="space-y-4">
            {sortedEntries.map(entry => (
              <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {[...new Set(entry.selectedEmotions.map(e => e.bundleName))].join(', ') || 'Journal Entry'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(entry)}
                    className="bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    aria-label={`View entry from ${new Date(entry.timestamp).toLocaleDateString()}`}
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(entry)}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    aria-label={`Edit entry from ${new Date(entry.timestamp).toLocaleDateString()}`}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

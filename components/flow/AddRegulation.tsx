
import React from 'react';

interface AddRegulationProps {
  regulation: string;
  setRegulation: (regulation: string) => void;
  onSave: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const AddRegulation: React.FC<AddRegulationProps> = ({
  regulation,
  setRegulation,
  onSave,
  onSkip,
  onBack,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">How might you respond?</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Think about how you could navigate these feelings. This is optional.
      </p>

      <div className="mb-6">
        <textarea
          value={regulation}
          onChange={(e) => setRegulation(e.target.value)}
          placeholder="e.g., I could take a few deep breaths, or talk to someone..."
          className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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

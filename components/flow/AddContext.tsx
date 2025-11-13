
import React from 'react';

interface AddContextProps {
  cause: string;
  setCause: (cause: string) => void;
  timestamp: number;
  setTimestamp: (timestamp: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddContext: React.FC<AddContextProps> = ({
  cause,
  setCause,
  timestamp,
  setTimestamp,
  onNext,
  onBack,
}) => {
  // Helper to format the numeric timestamp into the string required by datetime-local input.
  // It adjusts for timezone to ensure the user's local time is displayed.
  const formatTimestampForInput = (ts: number) => {
    const date = new Date(ts);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When the input changes, parse its string value back into a numeric timestamp.
    const date = new Date(e.target.value);
    setTimestamp(date.getTime());
  };

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="entry-datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          When did this happen?
        </label>
        <input
          type="datetime-local"
          id="entry-datetime"
          value={formatTimestampForInput(timestamp)}
          onChange={handleTimestampChange}
          className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>

      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">What's going on?</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Describe the situation or reason for these feelings.</p>

      <div className="mb-6">
        <textarea
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="e.g., I had a great conversation with a friend..."
          className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={cause.trim().length === 0}
          className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AddContext;
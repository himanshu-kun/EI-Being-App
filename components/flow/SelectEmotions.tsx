import React, { useState } from 'react';
import { Emotion, EmotionBundleName } from '../../types';
import { EMOTION_BUNDLES } from '../../constants';

interface SelectEmotionsProps {
  selectedEmotions: Emotion[];
  onSelectionChange: (emotions: Emotion[]) => void;
  onNext: () => void;
  onCancel: () => void;
}

const EmotionIcon: React.FC<{ bundleName: EmotionBundleName; }> = ({ bundleName }) => {
  const iconProps = {
    className: `w-6 h-6 mr-3`,
    // Fix: Changed string "true" to boolean true to satisfy the Booleanish type for the 'aria-hidden' attribute.
    'aria-hidden': true,
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: "2",
    stroke: "currentColor"
  };

  switch (bundleName) {
    case 'Love':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    case 'Joy':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4.06 4.06 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'Surprise':
      return (
        <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01" />
            <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'Anger':
       return (
        <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 15s-1.5-2-4-2-4 2-4 2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9.5L10 11" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 9.5L14 11" />
        </svg>
      );
    case 'Sadness':
      return (
        <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 15s-1.5-2-4-2-4 2-4 2" />
        </svg>
      );
    case 'Fear':
      return (
        <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01" />
            <path d="M15 15a3 3 0 01-6 0h6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return null;
  }
};


const SelectEmotions: React.FC<SelectEmotionsProps> = ({
  selectedEmotions,
  onSelectionChange,
  onNext,
  onCancel,
}) => {
  const [openBundle, setOpenBundle] = useState<EmotionBundleName | null>(null);

  const toggleEmotion = (emotion: Emotion) => {
    const isSelected = selectedEmotions.some(e => e.name === emotion.name && e.bundleName === emotion.bundleName);
    if (isSelected) {
      onSelectionChange(selectedEmotions.filter(e => e.name !== emotion.name));
    } else {
      onSelectionChange([...selectedEmotions, emotion]);
    }
  };

  const isSelected = (emotion: Emotion) => {
    return selectedEmotions.some(e => e.name === emotion.name);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">How are you feeling right now?</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Select one or more emotions from the bundles below.</p>

      <div className="space-y-2 mb-6">
        {EMOTION_BUNDLES.map(bundle => (
          <div key={bundle.name}>
            <button
              onClick={() => setOpenBundle(openBundle === bundle.name ? null : bundle.name)}
              className={`w-full text-left p-4 rounded-lg font-semibold flex justify-between items-center transition-all ${bundle.color} text-white`}
            >
              <div className="flex items-center">
                <EmotionIcon bundleName={bundle.name} />
                <span>{bundle.name}</span>
              </div>
              <span className="text-2xl font-light">{openBundle === bundle.name ? '−' : '+'}</span>
            </button>
            {openBundle === bundle.name && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-b-lg">
                {bundle.emotions.map(emotionName => {
                  const emotion: Emotion = { name: emotionName, bundleName: bundle.name };
                  return (
                    <button
                      key={emotionName}
                      onClick={() => toggleEmotion(emotion)}
                      className={`p-2 rounded-md text-sm transition-colors ${
                        isSelected(emotion)
                          ? `${bundle.color} text-white`
                          : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                      }`}
                    >
                      {emotionName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={selectedEmotions.length === 0}
          className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SelectEmotions;

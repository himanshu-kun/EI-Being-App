
import React, { useState, useEffect } from 'react';
import { Emotion, EmotionEntry } from '../types';
import SelectEmotions from './flow/SelectEmotions';
import AddContext from './flow/AddContext';
import AddRegulation from './flow/AddRegulation';

interface NewEntryFlowProps {
  onSave: (entry: EmotionEntry) => void;
  onCancel: () => void;
  existingEntry?: EmotionEntry | null;
}

const ProgressBar: React.FC<{ step: number; totalSteps: number }> = ({ step, totalSteps }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-8">
      <div 
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
        style={{ width: `${(step / totalSteps) * 100}%` }}
      ></div>
    </div>
);


const NewEntryFlow: React.FC<NewEntryFlowProps> = ({ onSave, onCancel, existingEntry }) => {
  const [step, setStep] = useState(1);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [cause, setCause] = useState('');
  const [regulation, setRegulation] = useState('');
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    if (existingEntry) {
      setSelectedEmotions(existingEntry.selectedEmotions);
      setCause(existingEntry.cause);
      setRegulation(existingEntry.regulation || '');
      setTimestamp(existingEntry.timestamp);
    } else {
      // Reset for new entry flow
      setSelectedEmotions([]);
      setCause('');
      setRegulation('');
      setTimestamp(Date.now());
    }
  }, [existingEntry]);

  const handleSave = (finalRegulation: string | null) => {
    const entryData: EmotionEntry = {
      id: existingEntry ? existingEntry.id : crypto.randomUUID(),
      timestamp: timestamp,
      selectedEmotions,
      cause,
      regulation: finalRegulation,
    };
    onSave(entryData);
  };
  
  const handleSkipRegulation = () => {
    handleSave(null);
  };
  
  const handleSaveRegulation = () => {
    handleSave(regulation);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 text-center">{existingEntry ? 'Edit Entry' : 'New Entry'}</h2>
        <ProgressBar step={step} totalSteps={3} />
        {step === 1 && (
            <SelectEmotions
            selectedEmotions={selectedEmotions}
            onSelectionChange={setSelectedEmotions}
            onNext={() => setStep(2)}
            onCancel={onCancel}
            />
        )}
        {step === 2 && (
            <AddContext
            cause={cause}
            setCause={setCause}
            timestamp={timestamp}
            setTimestamp={setTimestamp}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            />
        )}
        {step === 3 && (
            <AddRegulation
            regulation={regulation}
            setRegulation={setRegulation}
            onSave={handleSaveRegulation}
            onSkip={handleSkipRegulation}
            onBack={() => setStep(2)}
            />
        )}
    </div>
  );
};

export default NewEntryFlow;
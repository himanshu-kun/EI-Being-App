import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import NewEntryFlow from './components/NewEntryFlow';
import InsightsPage from './components/InsightsPage';
import ViewEntryPage from './components/ViewEntryPage';
import { EmotionEntry } from './types';

type View = 'home' | 'entry-flow' | 'insights' | 'view-entry';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<EmotionEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<EmotionEntry | null>(null);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('emotionEntries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error("Failed to load entries from localStorage", error);
    }
  }, []);

  const saveEntries = (updatedEntries: EmotionEntry[]) => {
    try {
      setEntries(updatedEntries);
      localStorage.setItem('emotionEntries', JSON.stringify(updatedEntries));
    } catch (error) {
      console.error("Failed to save entries to localStorage", error);
    }
  };

  const handleSaveEntry = (entryToSave: EmotionEntry) => {
    const isEditing = entries.some(e => e.id === entryToSave.id);

    const updatedEntries = isEditing
      ? entries.map(entry => (entry.id === entryToSave.id ? entryToSave : entry))
      : [...entries, entryToSave];

    saveEntries(updatedEntries);
    setCurrentView('home');
    setEditingEntry(null);
  };

  const handleStartNewEntry = () => {
    setEditingEntry(null);
    setCurrentView('entry-flow');
  };

  const handleStartEdit = (entry: EmotionEntry) => {
    setEditingEntry(entry);
    setCurrentView('entry-flow');
  };

  const handleStartView = (entry: EmotionEntry) => {
    setViewingEntry(entry);
    setCurrentView('view-entry');
  };

  const handleViewInsights = () => {
    setCurrentView('insights');
  };

  const handleCancelFlow = () => {
    setCurrentView('home');
    setEditingEntry(null);
  };

  const handleBackFromView = () => {
      setCurrentView('home');
      setViewingEntry(null);
  }

  const renderView = () => {
    switch (currentView) {
      case 'entry-flow':
        return <NewEntryFlow onSave={handleSaveEntry} onCancel={handleCancelFlow} existingEntry={editingEntry} />;
      case 'insights':
        return <InsightsPage entries={entries} onBack={() => setCurrentView('home')} />;
      case 'view-entry':
        return viewingEntry && <ViewEntryPage entry={viewingEntry} onBack={handleBackFromView} />;
      case 'home':
      default:
        return (
          <HomePage
            onAddNewEntry={handleStartNewEntry}
            onViewInsights={handleViewInsights}
            entries={entries}
            onEdit={handleStartEdit}
            onView={handleStartView}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { StoryWeaver } from './components/StoryWeaver';
import { ChatInterface } from './components/ChatInterface';

// Define the view modes
enum AppView {
  STORY = 'STORY',
  CHAT = 'CHAT'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.STORY);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              StoryWeaver AI
            </h1>
          </div>
          
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrentView(AppView.STORY)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === AppView.STORY
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Story Weaver
            </button>
            <button
              onClick={() => setCurrentView(AppView.CHAT)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === AppView.CHAT
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat Assistant
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full h-full">
          {currentView === AppView.STORY ? (
            <StoryWeaver />
          ) : (
            <ChatInterface />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 StoryWeaver AI. Powered by Google Gemini 3 Pro & 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AnalysisResult } from './components/AnalysisResult';
import { Logo } from './components/Logo';
import { verifyNews, fetchLatestNews } from './services/gemini';
import { AppState, VerificationResult, AppView } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    history: [],
    isAnalyzing: false,
    currentResult: null,
    error: null,
    trendingNews: [],
    isFetchingTrending: false,
    view: AppView.SPLASH,
  });
  
  const [input, setInput] = useState('');

  // Handle Splash Screen Timer
  useEffect(() => {
    if (state.view === AppView.SPLASH) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, view: AppView.SEARCH }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.view]);

  const loadTrending = async () => {
    setState(prev => ({ ...prev, isFetchingTrending: true }));
    try {
      const news = await fetchLatestNews();
      setState(prev => ({ ...prev, trendingNews: news, isFetchingTrending: false }));
    } catch (err) {
      console.error("Error fetching trending news", err);
      setState(prev => ({ ...prev, isFetchingTrending: false }));
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('veritas_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, history: parsed }));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    loadTrending();
  }, []);

  useEffect(() => {
    localStorage.setItem('veritas_history', JSON.stringify(state.history));
  }, [state.history]);

  const handleVerify = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const query = overrideInput || input;
    if (!query.trim() || state.isAnalyzing) return;

    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null, 
      currentResult: null,
      view: AppView.RESULT // Transition to result view immediately to show loading state
    }));
    
    if (overrideInput) setInput(overrideInput);

    try {
      const result = await verifyNews(query);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentResult: result,
        history: [result, ...prev.history].slice(0, 10),
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: err.message || 'An unexpected error occurred.',
        view: AppView.SEARCH // Go back on error
      }));
    }
  };

  const handleHistoryItemClick = (item: VerificationResult) => {
    setState(prev => ({ ...prev, currentResult: item, view: AppView.RESULT }));
    setInput(item.query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setState(prev => ({ ...prev, view: AppView.SEARCH, currentResult: null }));
    setInput('');
  };

  // --- RENDERING VIEWS ---

  if (state.view === AppView.SPLASH) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
        <div className="relative px-4 text-center">
          <div className="absolute inset-0 bg-blue-600 rounded-full blur-3xl opacity-10 animate-pulse"></div>
          <div className="relative animate-in zoom-in duration-1000 flex flex-col items-center">
            <div className="mb-10">
              <Logo size="lg" animate />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tighter mb-4 uppercase whitespace-nowrap">
              Smart News <span className="text-blue-500">Analyser</span>
            </h1>
            <div className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 animate-[loading_2.5s_ease-in-out_forwards]"></div>
            </div>
            <p className="mt-6 text-slate-500 text-[8px] font-black tracking-[0.3em] uppercase opacity-60">
              Initializing Probabilistic Evidence Engine
            </p>
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Layout>
      {state.view === AppView.SEARCH ? (
        <div className="max-w-4xl mx-auto px-4 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              AI-Powered Probabilistic Verifier
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Truth in the <br/>
              <span className="text-blue-500">Information.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Smart News Analyser uses real-time search grounding and probabilistic inference to separate fact from fiction.
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-3xl shadow-2xl border border-slate-800 mb-20 transition-all focus-within:ring-4 ring-blue-900/20">
            <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow relative">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste a headline, social claim, or URL..."
                  className="w-full pl-14 pr-6 py-5 rounded-2xl text-white text-lg placeholder:text-slate-600 focus:outline-none bg-slate-800 border-none"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 px-10 py-5 rounded-2xl font-bold text-white text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-900/40"
              >
                Analyze
              </button>
            </form>
          </div>

          {/* Trending Grid */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                Breaking News
              </h3>
              <button 
                onClick={loadTrending}
                className="text-sm font-bold text-blue-400 hover:bg-blue-500/10 px-3 py-1 rounded-lg transition-colors"
              >
                {state.isFetchingTrending ? 'Fetching...' : 'Refresh'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.isFetchingTrending ? (
                [1,2,3].map(i => <div key={i} className="h-40 bg-slate-900 rounded-3xl animate-pulse border border-slate-800"></div>)
              ) : (
                state.trendingNews.map((news, i) => (
                  <div 
                    key={i}
                    onClick={() => handleVerify(undefined, news.headline)}
                    className="group bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-900/20 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3 block">{news.category}</span>
                      <h4 className="font-bold text-slate-200 text-lg line-clamp-2 leading-snug group-hover:text-white transition-colors">
                        {news.headline}
                      </h4>
                    </div>
                    <div className="mt-6 flex items-center text-xs font-bold text-slate-500 group-hover:text-blue-400 transition-colors">
                      Verify Truth <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* History */}
          {state.history.length > 0 && (
            <div className="pt-10 border-t border-slate-800">
              <h3 className="text-lg font-bold text-slate-600 uppercase tracking-widest mb-8">History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item)}
                    className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all"
                  >
                    <div className={`w-2 h-10 rounded-full ${item.score > 70 ? 'bg-emerald-500' : item.score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                    <div className="flex-grow overflow-hidden">
                      <h4 className="font-bold text-slate-200 text-sm truncate">{item.query}</h4>
                      <p className="text-xs text-slate-500">{item.level} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4 mb-10">
            <button 
              onClick={goBack}
              className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all shadow-sm"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">Analysis Result</h2>
              <p className="text-sm text-slate-500 truncate max-w-md">{input}</p>
            </div>
          </div>

          {state.isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-microchip text-blue-600 text-2xl animate-pulse"></i>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Claims...</h3>
                <p className="text-slate-500 max-w-sm">Cross-referencing priors with real-time web evidence and historical news archives.</p>
              </div>
            </div>
          ) : state.error ? (
            <div className="bg-rose-900/20 border border-rose-500/20 p-8 rounded-3xl text-center">
              <i className="fas fa-circle-exclamation text-4xl text-rose-500 mb-4"></i>
              <h3 className="text-lg font-bold text-rose-100 mb-2">Verification Failed</h3>
              <p className="text-rose-400 mb-6">{state.error}</p>
              <button onClick={goBack} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold">Try Again</button>
            </div>
          ) : state.currentResult ? (
            <AnalysisResult result={state.currentResult} />
          ) : null}
        </div>
      )}
    </Layout>
  );
};

export default App;

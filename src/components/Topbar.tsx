import { Menu, Search, Lightbulb, Keyboard, Home } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import BusinessSwitcher from './BusinessSwitcher';
import NotificationCenter from './NotificationCenter';
import { HealthScoreBadge } from '../pages/dashboard/HealthScore';

interface TopbarProps { onMenuClick: () => void; title?: string; }

export default function Topbar({ onMenuClick, title = 'Dashboard' }: TopbarProps) {
  const { setCommandOpen, walkthroughOpen, setWalkthroughOpen, business, lang, setLang } = useDemo();
  const location = useLocation();

  return (
    <header className="h-14 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center px-4 lg:px-5 gap-3 sticky top-0 z-20">
      <button className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg p-1.5 transition-colors" onClick={onMenuClick}>
        <Menu size={19} />
      </button>

      {/* Page title + mini breadcrumb */}
      <div className="flex-1 lg:flex-none min-w-0">
        <h1 className="text-white font-semibold text-sm truncate">{title}</h1>
        {location.pathname !== '/dashboard' && (
          <p className="text-slate-600 text-xs hidden sm:block truncate">
            Dashboard › {title}
          </p>
        )}
      </div>

      {/* Search pill — desktop */}
      <div className="hidden lg:flex flex-1 max-w-xs">
        <button
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-400 transition-colors group"
        >
          <Search size={13} className="group-hover:text-slate-300 transition-colors" />
          <span className="flex-1 text-left text-xs">Search customers, products...</span>
          <kbd className="text-slate-700 text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Home link */}
        <Link
          to="/"
          className="hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
          title="Back to Home page"
        >
          <Home size={13} />
          <span className="hidden lg:block">Home</span>
        </Link>
        <BusinessSwitcher />
        <HealthScoreBadge />

        {/* EN/AR toggle */}
        <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-xs">
          <button onClick={() => setLang('EN')} className={`px-2.5 py-1.5 font-medium transition-colors ${lang === 'EN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>EN</button>
          <button onClick={() => setLang('AR')} className={`px-2.5 py-1.5 font-medium transition-colors ${lang === 'AR' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>AR</button>
        </div>

        {/* Guide button */}
        <button
          onClick={() => setWalkthroughOpen(!walkthroughOpen)}
          className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${walkthroughOpen ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-glow-blue' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
          title="Sales Walkthrough"
        >
          <Lightbulb size={13} />
          <span className="hidden md:block">Guide</span>
        </button>

        {/* Mobile search */}
        <button onClick={() => setCommandOpen(true)} className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg p-1.5 transition-colors">
          <Search size={18} />
        </button>

        <NotificationCenter />

        {/* Keyboard shortcut hint */}
        <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))} className="hidden xl:flex items-center justify-center w-7 h-7 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-slate-500 hover:text-slate-300 transition-colors" title="Keyboard shortcuts (?)">
          <Keyboard size={13} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-black cursor-pointer shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow">
          {business.name[0]}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Sun, Moon, LogOut, Copy, Mail, AlertCircle, ChevronDown, ChevronUp, Maximize2, Minimize2, ArrowLeft, ArrowRight, BookOpen, ShieldCheck, FileText, GraduationCap, ExternalLink, Globe, FolderOpen, PhoneCall, User, CheckCircle2 } from 'lucide-react';
import { USER_DIRECTORY, PLAYBOOK_PAGES } from './constants';
import { UserProfile } from './types';

// --- Components ---

/**
 * Layout component that wraps the entire application.
 * Handles navigation, theme toggling, and authentication checks.
 */
const Layout = ({ children, user, setUser, theme, toggleTheme }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGetStarted = location.pathname === '/get-started';

  if (isGetStarted) return <>{children}</>;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!user && path !== '/licensing' && path !== '/') {
      e.preventDefault();
      navigate('/get-started', { state: { from: path } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <header className="bg-[#0f172a] border-b-4 border-[#1d4ed8] text-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            <Link to={user ? "/dashboard" : "/"} className="text-2xl font-bold tracking-tight hover:opacity-90">
              Agency Playbook
            </Link>
            
            <nav className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <Link 
                to="/dashboard" 
                onClick={(e) => handleNavClick(e, '/dashboard')}
                className={`font-bold hover:text-white transition-colors ${location.pathname === '/dashboard' ? 'text-white underline underline-offset-8 decoration-2' : 'text-[#dbeafe]'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/documentation" 
                onClick={(e) => handleNavClick(e, '/documentation')}
                className={`font-bold hover:text-white transition-colors ${location.pathname === '/documentation' ? 'text-white underline underline-offset-8 decoration-2' : 'text-[#dbeafe]'}`}
              >
                Documentation
              </Link>
              <Link 
                to="/templates" 
                onClick={(e) => handleNavClick(e, '/templates')}
                className={`font-bold hover:text-white transition-colors ${location.pathname === '/templates' ? 'text-white underline underline-offset-8 decoration-2' : 'text-[#dbeafe]'}`}
              >
                Templates
              </Link>
              <Link 
                to="/licensing" 
                className={`font-bold hover:text-white transition-colors ${location.pathname.startsWith('/licensing') ? 'text-white underline underline-offset-8 decoration-2' : 'text-[#dbeafe]'}`}
              >
                Licensing
              </Link>
              <Link to="/feedback" target="_blank" rel="noopener noreferrer" className="font-bold text-[#dbeafe] hover:text-white transition-colors">
                Feedback
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-bold"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              {user && (
                <button 
                  onClick={() => { localStorage.removeItem('userName'); setUser(null); }}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-5 py-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-10 text-center opacity-30 text-xs mt-auto">
        <p>&copy; {new Date().getFullYear()} Daniel Lottinger State Farm | Internal Use Only</p>
      </footer>

      <Toast />
    </div>
  );
};

const Toast = () => (
  <div id="toast" className="fixed bottom-8 left-1/2 -translate-x-1/2 invisible opacity-0 transition-all duration-300 bg-[#0f172a] text-white px-6 py-4 rounded-xl border border-[#1d4ed8] font-bold z-50">
    Copied to clipboard
  </div>
);

const showToast = (message: string) => {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.remove('invisible', 'opacity-0');
    toast.classList.add('visible', 'opacity-100');
    setTimeout(() => {
      toast.classList.add('invisible', 'opacity-0');
      toast.classList.remove('visible', 'opacity-100');
    }, 3000);
  }
};

const ProtectedRoute = ({ children, user, requiredUser }: { children: React.ReactNode, user: UserProfile | null, requiredUser?: string }) => {
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/get-started" state={{ from: location.pathname }} replace />;
  }

  if (requiredUser && user.full !== requiredUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Custom hook to handle token replacement in templates.
 * Replaces NAME, TIMEDAY, DAY, and CUSTOMER with dynamic values.
 */
const useTokens = (user: UserProfile | null) => {
  const getTimeDay = () => new Date().getHours() < 12 ? 'morning' : 'afternoon';
  const getDayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const applyTokens = (text: string) => {
    if (!text) return '';
    const currentName = user?.full.split(' ')[0] || 'Agent';
    return text
      .replace(/NAME/g, currentName)
      .replace(/TIMEDAY/g, getTimeDay())
      .replace(/DAY/g, getDayName())
      .replace(/-CUSTOMER-/g, 'CUSTOMER')
      .replace(/CUSTOMER/g, 'CUSTOMER');
  };

  return { applyTokens };
};

/**
 * Reusable card for text templates with token replacement and copy functionality.
 */
const TemplateCard = ({ title, text, user }: { title: string, text: string, user: UserProfile | null, key?: React.Key }) => {
  const { applyTokens } = useTokens(user);
  const displayText = applyTokens(text);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    showToast('Template copied to clipboard!');
  };

  return (
    <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)] flex flex-col h-full">
      <h4 className="font-bold text-[#1d4ed8] mb-1">{title}</h4>
      <div className="flex-grow p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--text)] mb-4 leading-relaxed whitespace-pre-wrap">
        {displayText}
      </div>
      <button 
        onClick={handleCopy}
        className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-bold hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2 text-xs"
      >
        <Copy size={14} /> Copy Text
      </button>
    </div>
  );
};

/**
 * Reusable card for email templates with token replacement, copy, and mailto functionality.
 */
const EmailTemplateCard = ({ title, text, user }: { title: string, text: string, user: UserProfile | null, key?: React.Key }) => {
  const { applyTokens } = useTokens(user);
  const displayText = applyTokens(text);

  const handleCopy = () => {
    // Strip HTML tags for plain text copy
    const plainText = displayText.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(plainText);
    showToast('Template copied to clipboard!');
  };

  const handleOpenOutlook = () => {
    // Strip HTML tags for mailto link
    const plainText = displayText.replace(/<[^>]*>/g, '');
    const lines = plainText.split('\n');
    let subject = '';
    let body = '';

    if (lines.length > 0 && lines[0].toLowerCase().startsWith('subject:')) {
      subject = lines[0].replace(/subject:/i, '').trim();
      body = lines.slice(1).join('\n').trimStart();
    } else {
      body = plainText;
    }
    showToast('Outlook Opening');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)] flex flex-col h-full">
      <h4 className="font-bold text-[#1d4ed8] mb-1">{title}</h4>
      <div className="flex-grow p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--text)] mb-4 leading-relaxed whitespace-pre-wrap markdown-body">
        <Markdown rehypePlugins={[rehypeRaw]}>{displayText}</Markdown>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleCopy}
          className="bg-[#1e3a8a] text-white py-3 rounded-lg font-bold hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Copy size={14} /> Copy Text
        </button>
        <button 
          onClick={handleOpenOutlook}
          className="bg-[var(--panel)] text-[var(--brand)] border-2 border-[var(--brand)] py-3 rounded-lg font-bold hover:bg-[var(--accent)] transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Mail size={14} /> Open Outlook
        </button>
      </div>
    </div>
  );
};

// --- Pages ---

const Home = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 md:p-12">
      <div className="max-w-3xl">
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Welcome
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          One place for templates, documentation, and SOPs.
        </h1>
        <p className="text-[var(--muted)] text-lg">
          Agency Playbook is your home base for repeatable workflows, team references,
          onboarding materials, and day-to-day process documentation.
        </p>
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Link to="/templates" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Templates</h3>
        <p className="text-[var(--muted)] mb-4">Ready-to-copy forms, scripts, checklists, and worksheets.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Internal Use</span>
      </Link>
      <Link to="/documentation" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">📒</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Documentation</h3>
        <p className="text-[var(--muted)] mb-4">Internal standards for task notes, service requests, and scheduling.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Reference</span>
      </Link>
      <Link to="/licensing" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">🎓</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Licensing</h3>
        <p className="text-[var(--muted)] mb-4">Study guides, exam prep, and licensing requirements for P&C and Life.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Public Access</span>
      </Link>
    </div>
  </div>
);

const GetStarted = ({ setUser }: any) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleAccess = () => {
    const matchedKey = Object.keys(USER_DIRECTORY).find(
      key => key.toLowerCase() === name.trim().toLowerCase()
    );

    if (matchedKey) {
      localStorage.setItem('userName', matchedKey);
      setUser(USER_DIRECTORY[matchedKey]);
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } else {
      setError('Access Denied. Please enter an authorized name.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[var(--bg)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-10"
      >
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Secure Access
        </span>
        <h1 className="text-3xl font-bold mb-4">Agency Playbook</h1>
        <p className="text-[var(--muted)] mb-8">Please enter your authorized name to access your templates and dashboard.</p>

        <div className="space-y-6">
          <div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyPress={(e) => e.key === 'Enter' && handleAccess()}
              placeholder="Enter your name..." 
              className="w-full px-5 py-4 rounded-xl border border-[var(--line)] bg-[var(--template-bg)] text-[var(--text)] focus:border-[#1d4ed8] outline-none transition-all"
            />
            {error && <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
          </div>

          <button 
            onClick={handleAccess}
            className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-bold hover:bg-[#1d4ed8] transition-all transform hover:-translate-y-1 shadow-lg"
          >
            Access Playbook
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-[var(--line)] flex justify-between items-center">
          <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest">Internal Use Only</span>
          <Link to="/" className="text-[#1d4ed8] text-sm font-bold hover:underline">Back Home</Link>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user }: { user: UserProfile }) => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Main Playbook
      </span>
      <h1 className="text-3xl font-bold mb-2">Welcome, {user.full}</h1>
      <p className="text-[var(--muted)]">Select a section below to open your playbook.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: "Sales Hub", desc: "Pipeline management and production standards.", icon: "💰", tag: "Growth", link: "/sales" },
        { title: "Service Hub", desc: "Policy changes, claims, and client retention.", icon: "🛠️", tag: "Support", link: "/service" },
        { title: "Licensing", desc: "Study guides and exam prep for P&C and Life Exams.", icon: "🎓", tag: "Education", link: "/licensing" },
        { title: "Agency Directory", desc: "Quick links and team contact information.", icon: "🔗", tag: "Tools", link: "/directory" },
        { title: "Documentation Hub", desc: "Sales and Service internal standards and note formats.", icon: "📚", tag: "Reference", link: "/documentation" },
        { title: "Email Signature", desc: "Generate your professional agency email signature.", icon: "✍️", tag: "Tools", link: "/signature" },
        { title: "Feedback", desc: "Report an issue or suggest a new playbook script.", icon: "📣", tag: "Maintenance", link: "/feedback" },
      ].map((tile, i) => (
        <Link 
          key={i}
          to={tile.link} 
          className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1"
        >
          <div className="text-4xl mb-4">{tile.icon}</div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">{tile.title}</h3>
          <p className="text-[var(--muted)] mb-4">{tile.desc}</p>
          <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">{tile.tag}</span>
        </Link>
      ))}
    </div>
  </div>
);

const ServiceHub = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Retention & Support
      </span>
      <h1 className="text-3xl font-bold mb-2">Service Hub</h1>
      <p className="text-[var(--muted)]">Manage existing policies, billing inquiries, and CUSTOMER documentation standards.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link to="/service/templates" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Service Templates</h3>
        <p className="text-[var(--muted)] mb-4">Cancellations, vehicle swaps, and billing reminder texts.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Templates</span>
      </Link>

      <Link to="/service/documentation" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">🛠️</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Service Documentation</h3>
        <p className="text-[var(--muted)] mb-4">Internal notes for DSS, billing, and policy changes.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Internal</span>
      </Link>
    </div>
  </div>
);

const ServiceDocumentation = () => {
  const sections = [
    {
      title: "Vehicle Changes",
      desc: "Requirements for Adding, Removing, or Replacing Vehicles",
      items: [
        {
          name: "Add a Vehicle",
          req: "VIN, Finance Co, Date",
          template: "Subject: Add Vehicle\n\nNotes:\nVIN: \nFinance Co: \nDate Of Purchase: \nAnything Pertinent: "
        },
        {
          name: "Remove/Replace Vehicle",
          req: "Vehicle ID, Reason, Confirmation",
          template: "Subject: Remove Vehicle\n\nNotes:\nVehicle: \nReason: \nConfirmation: See text for confirmation."
        }
      ]
    },
    {
      title: "Driver Changes",
      desc: "Requirements for Adding or Removing Drivers",
      items: [
        {
          name: "Add a Driver",
          req: "Name, DL, DOB",
          template: "Subject: Add Driver\n\nNotes:\nName: \nDL: \nDOB: "
        },
        {
          name: "Remove Driver",
          req: "Name, Reason, Confirmation",
          template: "Subject: Remove Driver\n\nNotes:\nDriver: \nReason: \nConfirmation: See text for confirmation."
        }
      ]
    },
    {
      title: "Cancellations & Billing",
      desc: "Internal notes for lost business or billing inquiries",
      items: [
        {
          name: "Cancel Policy",
          req: "Who/How Much? + Confirmation",
          template: "Subject: Cancel Policy\n\nNotes:\nCarrier/Price: \nLine of Biz: \nConfirmation: See text for confirmation."
        },
        {
          name: "Billing Question",
          req: "Notate CUSTOMER questions and concerns",
          template: "Subject: Billing Question\n\nNotes:\nPH Concern: "
        }
      ]
    }
  ];

  const [openSection, setOpenSection] = useState<number | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Notes format copied!');
  };

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/service" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Service Hub
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Reference Guide
        </span>
        <h1 className="text-3xl font-bold mb-2">Documentation Standards</h1>
        <p className="text-[var(--muted)]">Internal standards for task notes, service requests, and scheduling.</p>
      </section>

      <div className="bg-[var(--accent)] border-l-4 border-[#1d4ed8] p-6 rounded-r-xl shadow-sm">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <span>📅</span> Service Scheduling Rule
        </h3>
        <p className="text-[var(--text)] mb-3">For any service calls, schedule the task for <strong>Brittany</strong>:</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]"></span>
            <span><strong>Before Lunch:</strong> Schedule for <span className="underline decoration-[#1d4ed8] decoration-2 underline-offset-2">today</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]"></span>
            <span><strong>After Lunch:</strong> Schedule for <span className="underline decoration-[#1d4ed8] decoration-2 underline-offset-2">tomorrow</span></span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{section.title}</h3>
                <p className="text-sm text-[var(--muted)]">{section.desc}</p>
              </div>
              {openSection === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openSection === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {section.items.map((item, j) => (
                        <div key={j} className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)] flex flex-col h-full">
                          <h4 className="font-bold text-[#1d4ed8] mb-1">{item.name}</h4>
                          <p className="text-xs text-[var(--muted)] mb-4 italic">Required: {item.req}</p>
                          <div className="flex-grow p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--text)] mb-4 font-mono whitespace-pre-wrap">
                            {item.template}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(item.template)}
                            className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-bold hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <Copy size={14} />
                            Copy Notes Format
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServiceTemplates = ({ user }: { user: UserProfile | null }) => {
  const sections = [
    {
      title: "Billing & Payments",
      desc: "Past due reminders, declined payments, and inactive policy alerts.",
      items: [
        {
          name: "Past Due Reminder",
          text: "Hi CUSTOMER. This is a friendly reminder that your State Farm payment of XXXX is past due. Please call or text us at 281-547-7209 or 24/7 at 800-440-0998. You may also pay online at https://www.statefarm.com/customer-care/insurance-bill-pay. Please note this must be received prior to XXXX to maintain continuous coverage. ~NAME State Farm",
          isEmail: true
        },
        {
          name: "Declined Payment",
          text: "Hi CUSTOMER. Your payment of XXXX was declined and your account is past due. Please call or text us at 281-547-7209 or 24/7 @ 800-440-0998. You may also pay online at https://www.statefarm.com/customer-care/insurance-bill-pay. Must be received prior to XXXX to remain in good standing. ~NAME State Farm",
          isEmail: true
        },
        {
          name: "Last Day to Pay (Urgent)",
          text: "Hi CUSTOMER. Friendly reminder your State Farm payment of XXXX is past due and YOUR POLICY IS SCHEDULED TO CANCEL AT MIDNIGHT FOR NONPAYMENT. Please call 281-547-7209 or pay online immediately. MUST BE RECEIVED BEFORE MIDNIGHT TONIGHT to maintain coverage. ~NAME State Farm",
          isEmail: true
        },
        {
          name: "Inactive Policy Alert",
          text: "Hi CUSTOMER. Your State Farm policy is currently INACTIVE AND YOU HAVE NO COVERAGE effective XXXX. In order to reinstate, we need a payment of XXXX or your policy will terminate. Contact us at 281-547-7209 to reinstate. ~NAME State Farm",
          isEmail: true
        }
      ]
    },
    {
      title: "Drive Safe & Save (DSS)",
      desc: "Setup reminders, mileage requests, and troubleshooting.",
      items: [
        {
          name: "DSS Setup (Initial)",
          text: "Hi CUSTOMER. Our records show your Bluetooth beacon was delivered. To keep your discount, complete setup in the app. Text SETUP to 42407 to download or call 888-559-1922 for help. Watch: http://st8.fm/mobilesetup. ~ NAME State Farm",
          isEmail: true
        },
        {
          name: "DSS Not Transmitting",
          text: "Hi CUSTOMER. Your State Farm Drive Safe & Save™ beacon is not transmitting data on your XXXX. Please log in to the app for messages or visit st8.fm/dsstroubleshoot. Your discount may be impacted if action is not taken. If beacon is not working, let us know! ~NAME State Farm",
          isEmail: true
        }
      ]
    },
    {
      title: "Policy Maintenance (Emails)",
      desc: "Total loss, household driving exposure, and alarm recertification.",
      items: [
        {
          name: "Totaled Vehicle Email",
          text: "Subject: Update regarding your Total Loss Claim\n\nGood TIMEDAY CUSTOMER, this is NAME State Farm regarding your claim on the YYYY MMM MMMM. Claims has deemed the vehicle a total loss. I hope all involved are ok! We need to know if there are plans to replace the vehicle to determine what is best for your policy. Call 281-547-7209 with any questions.",
          isEmail: true
        },
        {
          name: "Driving Exposure Email",
          text: "Subject: Action Required: Household Driver Information\n\nHi CUSTOMER, XXXXX (DOB XXXXXX) has been identified as a possible driving exposure in your household. Does XXXXX live with you and/or drive your vehicle? If so, they need to be added to the policy. Please provide relationship, marital status, and a copy of their license.",
          isEmail: true
        }
      ]
    },
    {
      title: "Modernization (Mod) Renewals",
      desc: "Templates for policies migrating to the new system.",
      items: [
        {
          name: "Mod Renewal (E-Sig Email)",
          text: "Subject: Important: E-Signature needed for your State Farm Renewal\n\nGood Morning CUSTOMER, State Farm sent an e-signature packet for your upcoming renewal. We are moving to a new modernized system. The downside is all old documents need to be replaced with new ones reflecting new policy numbers. Please complete at your earliest convenience to ensure renewal. Call 281-547-7209 with questions!",
          isEmail: true
        },
        {
          name: "Mod Renewal (E-Sig Text)",
          text: "Good Morning CUSTOMER. State Farm sent an e-sig packet for your renewal. We are moving to a new modernized system and old documents must be replaced with new ones reflecting new policy numbers. Please complete this at your earliest convenience to ensure a smooth renewal. Thanks!",
          isEmail: false
        }
      ]
    },
    {
      title: "Birthdays",
      desc: "English and Spanish birthday greetings.",
      items: [
        {
          name: "Happy Birthday (English)",
          text: "Happy Birthday CUSTOMER! From all of us here at NAME State Farm, we wish you a wonderful day! 😊🎈🎂",
          isEmail: false
        },
        {
          name: "Happy Birthday (Spanish)",
          text: "¡Feliz cumpleaños CUSTOMER! ¡De parte de todos nosotros en NAME State Farm, esperamos que tengas un día maravilloso! 😊",
          isEmail: false
        }
      ]
    }
  ];

  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/service" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Service Hub
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Service Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Service Templates</h1>
        <p className="text-[var(--muted)]">Standard service messages for billing, DSS, and policy updates.</p>
      </section>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{section.title}</h3>
                <p className="text-sm text-[var(--muted)]">{section.desc}</p>
              </div>
              {openSection === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openSection === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {section.items.map((item, idx) => (
                        item.isEmail ? (
                          <EmailTemplateCard key={idx} title={item.name} text={item.text} user={user} />
                        ) : (
                          <TemplateCard key={idx} title={item.name} text={item.text} user={user} />
                        )
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const Documentation = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Reference Library
      </span>
      <h1 className="text-3xl font-bold mb-2">Documentation Hub</h1>
      <p className="text-[var(--muted)]">Select a department below to view internal note standards, binding checklists, and compliance rules.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link to="/sales/documentation" className="group bg-[var(--panel)] border border(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">💰</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Sales Documentation</h3>
        <p className="text-[var(--muted)] mb-4">Binding checklists, lead sourcing rules, and new business note formats.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Internal Sales</span>
      </Link>
      <Link to="/service/documentation" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">🛠️</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Service Documentation</h3>
        <p className="text-[var(--muted)] mb-4">Billing notes, DSS troubleshooting protocols, and policy change standards.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Internal Service</span>
      </Link>
    </div>
  </div>
);

const SalesHub = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Sales & Growth
      </span>
      <h1 className="text-3xl font-bold mb-2">Sales Hub</h1>
      <p className="text-[var(--muted)]">Access all sales-related templates, scripts, and post-sale service tools.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: "Templates Library", desc: "The master list of email and text templates for all lead types.", icon: "📁", tag: "Templates", link: "/sales/templates" },
        { title: "Word Tracks", desc: "Live phone scripts for X-Dates, Winbacks, and Lead follow-ups.", icon: "📞", tag: "Scripts", link: "/sales/wordtracks" },
        { title: "After Sales Service", desc: "Onboarding, review requests, and referral follow-ups.", icon: "🤝", tag: "Service", link: "/sales/after-sales" },
        { title: "Sales Documentation", desc: "Binding checklists, note formats, and lead sourcing rules.", icon: "📒", tag: "Internal", link: "/sales/documentation" },
      ].map((tile, i) => (
        <Link 
          key={i}
          to={tile.link} 
          className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1"
        >
          <div className="text-4xl mb-4">{tile.icon}</div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">{tile.title}</h3>
          <p className="text-[var(--muted)] mb-4">{tile.desc}</p>
          <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">{tile.tag}</span>
        </Link>
      ))}
    </div>
  </div>
);

const TemplatesHub = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <Link to="/dashboard" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Resource Hub
      </span>
      <h1 className="text-3xl font-bold mb-2">Templates Hub</h1>
      <p className="text-[var(--muted)]">Select a department below to access specific email and text templates.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link to="/sales/templates" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">💰</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Sales Templates</h3>
        <p className="text-[var(--muted)] mb-4">Internet leads, X-Dates, Winbacks, and active prospect follow-ups.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Sales</span>
      </Link>
      <Link to="/service/templates" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">🛠️</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Service Templates</h3>
        <p className="text-[var(--muted)] mb-4">Cancellations, vehicle swaps, billing reminders, and policy maintenance.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Service</span>
      </Link>
    </div>
  </div>
);

const SalesTemplates = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <Link to="/sales" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Back to Sales Hub
      </Link>
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Agency Resources
      </span>
      <h1 className="text-3xl font-bold mb-2">Templates Library</h1>
      <p className="text-[var(--muted)] mb-8">Click a tile below to access specific email and text templates for your daily workflow.</p>

      <div className="bg-[var(--accent)] border-2 border-dashed border-[#1d4ed8] rounded-[var(--radius)] p-6">
        <h3 className="font-bold text-lg mb-4 text-[#1d4ed8] flex items-center gap-2">
          <BookOpen size={20} /> How to Use These Templates
        </h3>
        <ul className="space-y-3 text-sm font-medium list-disc list-inside text-[var(--brand-dark)]">
          <li>Select a category from the grid below.</li>
          <li>Click the <strong>"Copy Text"</strong> button to grab text for texts/chats.</li>
          <li>Click <strong>"Open Outlook"</strong> to launch Email automatically.</li>
          <li>Your producer name is automatically inserted into most templates.</li>
        </ul>
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: "Internet Leads", desc: "Templates for ILP's and SF.com Leads Steps 1-10", tag: "Sales", link: "/sales/templates/internet-leads" },
        { title: "Winback", desc: "Re-engaging past CUSTOMERS & quotes", tag: "Sales", link: "/sales/templates/winback" },
        { title: "X-Dates", desc: "Follow-ups for upcoming renewal dates.", tag: "Sales", link: "/sales/templates/xdate" },
        { title: "Quote Emails", desc: "Email templates for sending quotes.", tag: "Sales", link: "/sales/templates/quoteemails" },
        { title: "Follow Up", desc: "Ongoing templates for active prospects", tag: "Sales", link: "/sales/templates/follow-up" },
        { title: "Check In", desc: "Relationship maintenance & reviews", tag: "Service", link: "/sales/templates/check-in" },
        { title: "Closing", desc: "Finalizing the sale & binding policies.", tag: "Binding", link: "/sales/templates/closing" },
        { title: "After Sales", desc: "Post-sale support & referrals", tag: "Service", link: "/sales/after-sales" },
        { title: "Word Tracks", desc: "Live phone scripts for all scenarios", tag: "Scripts", link: "/sales/wordtracks" },
      ].map((tile, i) => (
        <Link 
          key={i}
          to={tile.link} 
          className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">{tile.title}</h3>
          <p className="text-[var(--muted)] mb-4">{tile.desc}</p>
          <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">{tile.tag}</span>
        </Link>
      ))}
    </div>
  </div>
);

const SalesDocumentation = () => {
  const sections = [
    {
      title: "Lead & List Labeling",
      desc: "Subject line standards for different lead sources",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)]">
            <h4 className="font-bold text-[#1d4ed8] mb-3">Winback Labels</h4>
            <ul className="text-sm space-y-2 text-[var(--text)]">
              <li><strong>WINBACK:</strong> Previous policy from our office</li>
              <li><strong>WINBACKx1:</strong> Worked already and kicked</li>
              <li><strong>WX1:</strong> Past Winback List</li>
              <li><strong>Month Year:</strong> Current Winback List</li>
            </ul>
          </div>
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)]">
            <h4 className="font-bold text-[#1d4ed8] mb-3">Zip & Lead Labels</h4>
            <ul className="text-sm space-y-2 text-[var(--text)]">
              <li><strong>ZL / Zip / Count:</strong> Current Ziplist (Copy from Campaign)</li>
              <li><strong>ZL1:</strong> Past Ziplist</li>
              <li><strong>Quote:</strong> Today's lead currently quoting</li>
              <li><strong>S5 – S10:</strong> Previous days leads currently working</li>
              <li><strong>SF1 / XL1 / XA1:</strong> Past SF, ILP, or Old Leads</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Returned ILPs",
      desc: "Note requirements for lead provider credits",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)]">
            <h4 className="font-bold text-[#1d4ed8] mb-3">Return Reasons</h4>
            <ul className="text-sm space-y-2 text-[var(--text)]">
              <li><strong>No Current Insurance:</strong> Note "No current insurance, consumer reports"</li>
              <li><strong>No Driver's License:</strong> Select from dropdown</li>
              <li><strong>Bad Number:</strong> If number is invalid</li>
              <li><strong>CUSTOMER Does Not Exist:</strong> Valid number, wrong person. Note "wrong number"</li>
            </ul>
          </div>
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)]">
            <h4 className="font-bold text-[#1d4ed8] mb-3">Ineligible Leads</h4>
            <p className="text-sm text-[var(--muted)] mb-3 italic">Ineligible leads are <strong>not returnable</strong>. Kick to next renewal.</p>
            <div className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-bold text-center">
              Format: Ineligible – [Month][Two Digit Year]
              <div className="text-xs font-normal mt-1 text-[var(--muted)]">Example: Ineligible – Dec25</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Opportunity Management",
      desc: "Closing reasons and marketing source standards",
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-[#1d4ed8]/5 border-l-4 border-[#1d4ed8] rounded-r-xl">
            <p className="text-sm text-[var(--text)]">
              <strong>Closed Not Won:</strong> Rare. For non-ILPs, add <code>Closed – Reason Why</code> to the end of the subject line.
              <br />
              <span className="text-xs text-[var(--muted)] italic">Ex: ZIP | MONTH-YEAR – Closed Bad Number</span>
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--accent)] text-[var(--brand-dark)] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 border-b border-[var(--line)]">Lead Type</th>
                  <th className="px-4 py-3 border-b border-[var(--line)]">Source</th>
                  <th className="px-4 py-3 border-b border-[var(--line)]">Sub-Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {[
                  { type: "State Farm", src: "Statefarm.com", sub: "—" },
                  { type: "Internet Lead", src: "Internet Lead Provider", sub: "—" },
                  { type: "ZipList", src: "Marketing", sub: "Other" },
                  { type: "Winback", src: "Marketing", sub: "Direct Mail" },
                  { type: "Inter-Office", src: "Win Back", sub: "—" },
                  { type: "Walk In / Call In", src: "Office Location", sub: "—" },
                  { type: "Outbound Call", src: "Outbound Calling", sub: "(Update new Pivot Opp)" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[var(--accent)]/30 transition-colors">
                    <td className="px-4 py-3 font-bold">{row.type}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.src}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.sub}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  ];

  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Sales Hub
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Sales Reference
        </span>
        <h1 className="text-3xl font-bold mb-2">Sales Documentation</h1>
        <p className="text-[var(--muted)]">Internal standards for lead labeling, opportunity tracking, and ILP returns.</p>
      </section>

      <div className="p-6 bg-[#22c55e]/5 border-l-4 border-[#22c55e] rounded-r-xl">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <span className="text-xl">🔄</span> Task Transition Standard
        </h3>
        <p className="text-sm text-[var(--muted)] mb-2">To maintain a clean track record of contact attempts:</p>
        <ul className="text-sm space-y-1 list-disc list-inside text-[var(--text)]">
          <li><strong>ILP / SF Leads:</strong> Upon hitting <u>Step 10</u>, close the task and create a new one with a future date.</li>
          <li><strong>Winback / Zip / Previous:</strong> Upon hitting <u>Step 6</u>, close the task and create a new one with a future date.</li>
        </ul>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{section.title}</h3>
                <p className="text-sm text-[var(--muted)]">{section.desc}</p>
              </div>
              {openSection === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openSection === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {section.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const InternetLeads = ({ user }: { user: UserProfile | null }) => {
  const { applyTokens } = useTokens(user);
  const [isSFLeads, setIsSFLeads] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "Step 1: The \"Double Tap\"",
      desc: "Immediate action within 1-5 minutes of lead arrival",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)] h-full">
            <h4 className="font-bold text-[#1d4ed8] mb-1">Ghost Quote</h4>
            <p className="text-sm text-[var(--muted)]">Complete initial quote and save PDF to folder before calling.</p>
          </div>
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)] h-full">
            <h4 className="font-bold text-[#1d4ed8] mb-1">Call 1 & 2</h4>
            <p className="text-sm text-[var(--muted)] mb-3">Call, hang up, wait 10 seconds and call back (Double Tap).</p>
            <div className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-xs italic text-[var(--muted)]">
              No Voicemail on first attempt. If they answer: See Word Track
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Day 1 Sequence",
      desc: "Intro texts sent 3-5 minutes apart",
      content: (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setIsSFLeads(!isSFLeads)}
              className="px-4 py-2 bg-[var(--accent)] text-[var(--brand-dark)] rounded-full text-xs font-bold hover:bg-[var(--line)] transition-colors flex items-center gap-2"
            >
              Switch to {isSFLeads ? 'Standard Leads' : 'State Farm Leads'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isSFLeads ? (
              <>
                <TemplateCard 
                  title="Text 1: Greeting"
                  text={`Good TIMEDAY CUSTOMER! It's NAME with State Farm. \nWe received your request for a auto insurance quote. \nI'm working on that for you now—I'll have those numbers over shortly.\nThanks // NAME // State Farm // 281.547.7209`}
                  user={user}
                />
                <TemplateCard 
                  title="Text 2: The Hook"
                  text={`Just putting the final touches on some great options at a competitive rate...\nLooking forward to your feedback!`}
                  user={user}
                />
              </>
            ) : (
              <>
                <TemplateCard 
                  title="SF Leads Text 1: Greeting"
                  text="Good morning, CUSTOMER. Happy DAY. It’s NAME, w/ State Farm, we received your request from our website for a AUTO/HOME quote. Let me take a look at everything and I will get back to you in a few…"
                  user={user}
                />
                <TemplateCard 
                  title="SF Leads Text 2: The Hook"
                  text="Just putting the final touches on some great options at a competitive rate. Looking forward to your feedback"
                  user={user}
                />
              </>
            )}
            <div className="md:col-span-2">
              <EmailTemplateCard 
                title="Missing Info Email"
                text={`Subject: State Farm - Quote Request Received\n\nHello CUSTOMER,\n\nWe received your request for a quote.\n\nHowever, it looks like we need a little bit more info to make sure we get you an accurate quote.\n\nWhat would be a good time to give you a call?`}
                user={user}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Day 1 Quote & Email",
      desc: "Providing the quote",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title='The "Price" Text'
            text={`Your quote's ready, CUSTOMER! \nYou could be covered for as little as ⭐$XX/mo⭐! \nHow does this compare to your current coverage?\nThanks // NAME // State Farm // 281.547.7209`}
            user={user}
          />
          <EmailTemplateCard 
            title="Quote Email"
            text={`Subject: State Farm - Quote Request Received - Initial Quote Included\n\nGood News, CUSTOMER! \nWe received your request for an auto insurance quote and your initial quote is ready!\n\nPending validation of your info, you could be covered for as little as $XX /mo with State Farm!\n\nI have attached a copy of the quote for your review.\nLet me know a good time to connect with you and review the quote.`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "Step 4: Day 1 Afternoon Wrap-up",
      desc: "One last touch before EOD",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)] flex flex-col h-full">
            <h4 className="font-bold text-[#1d4ed8] mb-1">Afternoon Voicemail</h4>
            <div className="flex-grow p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--text)] mb-4 leading-relaxed italic whitespace-pre-wrap">
              {applyTokens(`Hello CUSTOMER. Hope your day is going well. This is NAME with State Farm.\n\nWe received your online request for an auto insurance quote, and I was just reaching out to make sure we had all the details correct so we can get you an accurate quote.\n\nI have a preliminary quote prepared for you at ⭐$XXX⭐. I have also emailed and texted a copy to you.\n\nIf you have any questions or would like to review the details you can reply to my email, call or text at 281.547.7209 any time.`)}
            </div>
          </div>
          <TemplateCard 
            title="EOD Text"
            text="Hey CUSTOMER, just touching base before I head out for the day. Did you have any questions on the quote? - Thanks, NAME // State Farm"
            user={user}
          />
        </div>
      )
    },
    {
      title: "Step 5",
      desc: "Follow-up",
      content: (
        <TemplateCard 
          title="Day 2 Text" 
          text="Good TIMEDAY CUSTOMER! Just looking for some feedback — How did that quote compare to your current coverage? - Thanks // NAME // State Farm // 281.547.7209" 
          user={user} 
        />
      )
    },
    {
      title: "Step 6",
      desc: "Follow-up & Email 2",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="Day 3 Text" 
            text="CUSTOMER, I haven't heard back, so I'm not sure if you got the quote I sent. Would you like me to resend it? - NAME // State Farm" 
            user={user} 
          />
          <EmailTemplateCard 
            title="Step 06 Email 2"
            text={`Subject: Initial quote from State Farm\n\nGood afternoon, CUSTOMER.\n\nI was just looking for some feedback on the quote I sent over a few days ago.\n\nI have not heard back and not sure if you received it.\n\nWould you like me to resend it?`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "Step 7",
      desc: "Follow-up",
      content: (
        <TemplateCard 
          title="Day 5 Text" 
          text="Hey CUSTOMER! I still have that $XX quote saved for you. Do you have a few minutes to review and make sure we didn't miss anything? - NAME // State Farm" 
          user={user} 
        />
      )
    },
    {
      title: "Step 8",
      desc: "Follow-up & Email 3",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="Day 8 Text" 
            text="Good TIMEDAY, CUSTOMER. If you are paying more than $XX for auto insurance. We could save you money every month. Call or Text NAME to switch to State Farm 281.547.7209" 
            user={user} 
          />
          <EmailTemplateCard 
            title="Step 08 Email 3"
            text={`Subject: Even if you don’t go with State Farm, make sure you have adequate coverage.\n\nGood afternoon, CUSTOMER.\n\nIf you are paying more than $XX for auto insurance.\nWe could save you money every month.\n\nWhat would be a good time to give you a call to discuss?`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "Step 9",
      desc: "Follow-up",
      content: (
        <TemplateCard 
          title="Day 15 Text" 
          text="CUSTOMER, quick question... are you still shopping for insurance? - Thanks // NAME // State Farm // 281.547.7209" 
          user={user} 
        />
      )
    },
    {
      title: "Step 10",
      desc: "Final Follow-up",
      content: (
        <TemplateCard 
          title="Day 21 Text" 
          text="CUSTOMER, I wanted to reach out one last time… I’ll be in touch at your next auto renewal. In the meantime, if you decide you’re ready to get started, I have your quote of ⭐$XXX⭐ saved. Thanks // NAME // State Farm // 281-547-7209" 
          user={user} 
        />
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Sales Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Internet Lead Templates</h1>
        <p className="text-[var(--muted)]">Standardized sequence for ILP and StateFarm.com leads (Steps 1-10).</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const WinbackTemplates = ({ user }: { user: UserProfile | null }) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "WX1 - Week 1",
      desc: "Initial Outreach",
      content: (
        <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)]">
          <h4 className="font-bold text-[#1d4ed8] mb-1">Call - Double Tap</h4>
          <p className="text-sm text-[var(--muted)] italic">Call, hang up, wait 10 seconds and call back. No voicemail on first attempt.</p>
        </div>
      )
    },
    {
      title: "WX2 & WX2A - Week 2",
      desc: "Recent Price Decrease Outreach",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TemplateCard 
              title="WX2 Text"
              text="Hello CUSTOMER, it's NAME w/ State Farm. Looks like you had State Farm coverage that ended back in MONTH/YEAR. We want to let you know about State Farm’s recent price decreases, and maybe your renewal is coming up soon. So, the timing to get a quote couldn’t be better. Would you mind if I sent one over? Thanks // NAME // State Farm // 281.547.7209"
              user={user}
            />
            <TemplateCard 
              title="WX2A Text"
              text="Hello CUSTOMER, it's NAME w/ State Farm. Not sure if you remember but I helped you with your last policy that ended back in MONTH/YEAR. We want to let you know about State Farm’s recent price decreases, and maybe your renewal is coming up soon. So, the timing to get a quote couldn’t be better. Would you mind if I sent one over? Thanks // NAME // State Farm // 281.547.7209"
              user={user}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmailTemplateCard 
              title="WX2 Email"
              text={`Subject: Fresh Quote for CUSTOMER to come back to State Farm\n\nHello CUSTOMER, it's NAME w/ State Farm.\n\nLooks like you had State Farm coverage that ended back in MONTH YEAR.\n\nWe want to let you know that State Farm recently had a price decrease, and maybe your renewal is coming up soon.\nSo, the timing to get a quote couldn’t be better.\n\nWould you mind if I sent one over?`}
              user={user}
            />
            <EmailTemplateCard 
              title="WX2-A Email"
              text={`Subject: Fresh Quote for CUSTOMER to come back to State Farm\n\nHello CUSTOMER, it's NAME w/ State Farm.\n\nLooks like you had State Farm coverage that ended back in MONTH YEAR.\n\nWe want to let you know that State Farm recently had a price decrease, and maybe your renewal is coming up soon.\nSo, the timing to get a quote couldn’t be better.\n\nWould you mind if I sent one over?`}
              user={user}
            />
          </div>
        </div>
      )
    },
    {
      title: "WX3",
      desc: "Week 3 Outreach",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="WX3 Text" 
            text="Good TIMEDAY, CUSTOMER. It’s NAME with State Farm. Got a quick question for you. Have you had an opportunity to think about coming back over to State Farm? Would you mind if I sent over a quote, including our recent price decrease? Thanks // NAME // State Farm // 281.547.7209" 
            user={user} 
          />
          <EmailTemplateCard 
            title="WX3 Email"
            text={`Subject: CUSTOMER, State Farm has a fresh quote for you\n\nGood afternoon, CUSTOMER. It’s NAME with State Farm.\nGot a quick question for you.\n\nHave you had an opportunity to think about coming back over to State Farm?\nWould you mind if I sent over a quote, including our recent price decrease?`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "WX4",
      desc: "Week 4 Outreach",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="WX4 Text" 
            text="Hey CUSTOMER, we know insurance rates have been crazy recently. Especially with State Farm’s recent rate decrease. We would love the opportunity to bring you back. Reply with “Let’s Go” and we’ll get a quote ready for you. Thanks // NAME // State Farm // 281.547.7209" 
            user={user} 
          />
          <EmailTemplateCard 
            title="WX4 Email"
            text={`Subject: CUSTOMER, it's crazy out there. Do you trust what is important is protected?\n\nHey CUSTOMER, we know insurance rates have been crazy recently.\n\nEspecially with State Farm’s recent rate decrease.\nWe would love the opportunity to bring you back to State Farm.\n\nReply with “Let’s Go” and we’ll get a quote ready for you.`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "WX5",
      desc: "Week 5 Outreach",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="WX5 Text" 
            text="Switching insurance for a better rate is completely understandable. Would you be opposed to switching back to State Farm if we can beat your current rate? Let’s get a fresh quote and see what we can do. Thanks // NAME // State Farm // 281.547.7209" 
            user={user} 
          />
          <EmailTemplateCard 
            title="WX5 Email"
            text={`Subject: CUSTOMER Would you be opposed to a better price and coverage? State Farm can help.\n\nHey CUSTOMER, it's NAME w/ State Farm.\nSwitching insurance for a better rate is completely understandable.\n\nWould you be opposed to switching back to State Farm if we can beat your current rate?\nLet’s get you a fresh quote and see what we can do.`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "WX6",
      desc: "Week 6 Outreach",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="WX6 Text" 
            text="CUSTOMER, maybe now is not a good time to look at your insurance. I understand. Let me know if you decide to take a look. Otherwise, I will try again in a few months. Thanks // NAME // State Farm // 281.547.7209" 
            user={user} 
          />
          <EmailTemplateCard 
            title="WX6 Email"
            text={`Subject: Bye, for now NAME\n\nCUSTOMER, maybe now is not a good time to look at your insurance.\nI understand. Let me know if you decide to take a look.\nOtherwise, I will try again in a few months.`}
            user={user}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Winback Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Winback Templates</h1>
        <p className="text-[var(--muted)]">Re-engaging former households with recent price decrease messaging.</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const XDateTemplates = ({ user }: { user: UserProfile | null }) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "X1 – Double Tap Call",
      desc: "XA – AGED / XL – LEAD",
      content: (
        <div className="bg-[var(--template-bg)] p-6 rounded-xl border border-[var(--line)]">
          <h4 className="font-bold text-[#1d4ed8] mb-1">Call Only</h4>
          <p className="text-sm text-[var(--muted)] italic">No text or email for Step 1. Focus on the live conversation.</p>
        </div>
      )
    },
    {
      title: "X2-X4: Outreach Sequence",
      desc: "XA (Aged) and XL (Lead) Templates",
      content: (
        <div className="space-y-8">
          {[
            { step: "X2", aged: "Hello, CUSTOMER. It’s NAME with State Farm! We provided you with a quote some time ago and it looks like you may have a renewal coming up soon and State Farm recently had a price decrease. The timing to get a quote couldn’t be better. Would you mind if I sent one over? Thanks // NAME // State Farm // 281.547.7209", lead: "Hello, CUSTOMER. It’s NAME with State Farm, I helped you with a quote when you were shopping for insurance in MONTH. It looks like your renewal is coming up soon and State Farm recently lowered prices. The timing to get a quote couldn’t be better. Would you mind if I sent one over? Thanks // NAME // State Farm // 281.547.7209" },
            { step: "X3", aged: "Good TIMEDAY, CUSTOMER. It’s NAME with State Farm. Got a quick question for you. Have you had an opportunity to get a fresh insurance quote? State Farm recently had a price decrease. Would you mind if I sent over a quote, including the decrease? Thanks // NAME // State Farm // 281.547.7209", lead: "Hey there, CUSTOMER. NAME with State Farm here. Wanted to reach out and ask…Have you received an auto insurance quote to compare with your upcoming renewal? If not, you could be missing out. Especially with State Farm’s recently lowered prices. May I send over a quote and get your feedback? Thanks // NAME // State Farm // 281.547.7209" },
            { step: "X4", aged: "We know insurance rates have been crazy for a while now. However, State Farm has had several price decreases on auto and home insurance. Would you be opposed to looking at a quote including State Farms’ most recent price decrease? Thanks // NAME // State Farm // 281.547.7209", lead: "Hey CUSTOMER. Did you receive your renewal letter for your auto coverage yet? Looks like your renewal is coming up quickly. I just wanted to send you a quote and see how we compare. Can I email that over to you? Thanks // NAME // State Farm // 281.547.7209" }
          ].map((s, i) => (
            <div key={i} className="space-y-4">
              <h4 className="font-bold text-[#1d4ed8] border-b border-[var(--line)] pb-2">{s.step} Outreach</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TemplateCard 
                  title={`${s.step} - XA (Aged)`}
                  text={s.aged}
                  user={user}
                />
                <TemplateCard 
                  title={`${s.step} - XL (Lead)`}
                  text={s.lead}
                  user={user}
                />
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "X5-X6: Final Touches",
      desc: "Closing the loop",
      content: (
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="font-bold text-[#1d4ed8] border-b border-[var(--line)] pb-2">X5 Outreach</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TemplateCard 
                title="X5 - XA (Aged)"
                text="Hey CUSTOMER, were you able to find adequate insurance coverage that you were happy to pay for? NAME // State Farm // 281.547.7209"
                user={user}
              />
              <TemplateCard 
                title="X5 - XL (Lead)"
                text="Hey CUSTOMER, were you able to find adequate insurance coverage that you were happy to pay for? NAME // State Farm // 281.547.7209"
                user={user}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-[#1d4ed8] border-b border-[var(--line)] pb-2">X6 Outreach</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TemplateCard 
                title="X6 - XA (Aged)"
                text="CUSTOMER, I know you are busy and just wanted to reach out one last time…When you’re ready to have that discussion about what’s important to you about your insurance, I’m here! I’ll check with you in a few months and see if we can get what you love protected then. Thanks // NAME // State Farm // 281.547.7209"
                user={user}
              />
              <TemplateCard 
                title="X6 - XL (Lead)"
                text="CUSTOMER, I know you are busy and just wanted to reach out one last time…If you decide you’re ready to have that discussion about what’s important to you about your insurance, I’m here! Otherwise, I’ll be back at your next renewal! Thanks // NAME // State Farm // 281.547.7209"
                user={user}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          X-Date Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">X-Date Templates</h1>
        <p className="text-[var(--muted)]">Previous ILP or SF lead with upcoming renewal date.</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuoteEmailTemplates = ({ user }: { user: UserProfile | null }) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "Quote – Auto + Home + Plup",
      desc: "Comprehensive bundle quote",
      content: (
        <EmailTemplateCard 
          title="Quote – Auto + Home + Plup"
          text={`Subject: State Farm Auto and Home Bundle Quotes For CUSTOMER\n\nHey CUSTOMER, it was good chatting with you earlier.\nThanks for giving me the opportunity to quote your Auto and Home insurance.\n\nIf you have any questions or want more information reach out anytime. I am here to help.\nI worked up 2 options for your home and auto coverage.\nBoth options have the same deductibles – and can be adjusted if necessary.\n<u>Auto</u> – $XXX\n<u>Home</u> – 1% Policy and 2% Wind and Hail\n\nThe dwelling coverage is at $XXX, and the basis for deductibles, with an additional 20% for Increased Dwelling covering the home for $XXX.\nBoth the dwelling and the deductibles can be increased or decreased based on your preferences.\n\nOption 1 is probably what you are used too. Pretty standard coverages for both home and auto and should be similar to what you have now.\n\nThe second option is much more robust coverage for $XX more per month than Option 1 and includes what is known as an Umbrella.\nI included some reading material on the Umbrella coverage and details for more info on how this coverage works.\n\nThe biggest potential loss clients face is loss due to lawsuit.\nIf you happened to be in an auto accident and the other driver was injured and decides to sue, an Umbrella policy would protect you from this lawsuit.\n\nThis basically doubles your auto liability coverage and adds an additional 1 million dollars of liability coverage that follows you everywhere.\nOption 1 offers 1 million in liability as well, but only provides coverage when on your property. This coverage does not extend to you when you are on vacation or at the grocery store, like the Umbrella does.\nThis is reduced to $100,000 in Option 2, as the Umbrella covers this.   \n\nI also included a few suggested additional optional coverages below and can be added to either option. These are not included in the quotes but can be added if you want them.\n_______________________________________________________________________\n\n<b>Option 1 – Auto and Home</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX\n_______________________________________________________________________\n\n<b>Option 2 – Auto, Home and Umbrella</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nUmbrella - $XX per month / $XXX per year\nMonthly $XXX\n_______________________________________________________________________\n\n<b>Optional Coverages</b> (per month / per year)\nIf you want to know more about these let me know.\n\n<u>Back up of Sewer and Drain</u> – plus $XX/$XXX\nIf water from rain or flooding were to back up into the drains inside the home.\n\n<u>ID Theft</u> – plus $2.08/$25\nCovers costs of recovering, restoring, and monitoring your credit and identity if it were stolen in a cyber-attack.\nHas a separate deductible of $500.\n\n<u>Home Systems Protection</u> – plus $8.25/$99\nCovers the breakdown of water heaters, air conditioners, furnaces, electrical panels and permanently installed appliances.\nOperates similar to a warranty and has a separate deductible of $500.\n\n<u>Seepage and Leakage</u> – plus $XX/$XXX\nDamage from broken or busted pipes are already covered. Covers the damage caused by water from a leaky pipe.\n* <u>Dwelling Foundation</u> – plus $XX/$XX\n  Loss from settling, cracking, shrinking, enlarging, or expanding of the foundation, floor slab, or footings that support the dwelling as a result of a covered Seepage and Leakage loss.`}
          user={user}
        />
      )
    },
    {
      title: "Quote – Auto + Home",
      desc: "Standard bundle quote",
      content: (
        <EmailTemplateCard 
          title="Quote – Auto + Home"
          text={`Subject: State Farm Auto and Home Bundle Quotes For CUSTOMER\n\nHey CUSTOMER, it was good chatting with you earlier.\nThanks for giving me the opportunity to quote your Auto and Home insurance.\n\nI worked up the auto + home bundle quote for you. \n\nFirst on the auto –\nWe matched the coverages to what you currently have with COMPANY.\n\nNext on the home –\nThe dwelling and deductibles can be adjusted based on your preferences. \n\nI also included a few suggested additional optional coverages below. \nThese are not included in the quotes but can be added if you want them.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nLet me know how this compares to your current rates\n_______________________________________________________________________\n\n<b>Option 1 – Auto Only</b> – (Delete if not needed)\nAuto - $XXX per month / $XXXX per 6 months\n_______________________________________________________________________\n\n<b>Option 2 – Auto and Home Bundle</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nUmbrella - $XX per month / $XXX per year\nMonthly $XXX\n_______________________________________________________________________\n\n<b>Optional Coverages</b> (per month / per year)\nIf you want to know more about these let me know.\n\n<u>Back up of Sewer and Drain</u> – plus $XX/$XXX\nIf water from rain or flooding were to back up into the drains inside the home.\n\n<u>ID Theft</u> – plus $2.08/$25\nCovers costs of recovering, restoring, and monitoring your credit and identity if it were stolen in a cyber-attack.\nHas a separate deductible of $500.\n\n<u>Home Systems Protection</u> – plus $8.25/$99\nCovers the breakdown of water heaters, air conditioners, furnaces, electrical panels and permanently installed appliances.\nOperates similar to a warranty and has a separate deductible of $500.\n\n<u>Seepage and Leakage</u> – plus $XX/$XXX\nDamage from broken or busted pipes are already covered. Covers the damage caused by water from a leaky pipe.\n* <u>Dwelling Foundation</u> – plus $XX/$XX\n  Loss from settling, cracking, shrinking, enlarging, or expanding of the foundation, floor slab, or footings that support the dwelling as a result of a covered Seepage and Leakage loss.`}
          user={user}
        />
      )
    },
    {
      title: "Quote – Auto + Dover Bay Home",
      desc: "Dover Bay specific bundle",
      content: (
        <EmailTemplateCard 
          title="Quote – Auto + Dover Bay Home"
          text={`Subject: State Farm Auto and Home Bundle Quotes For CUSTOMER\n\nHey CUSTOMER, it was good chatting with you earlier.\nThanks for giving me the opportunity to quote your Auto and Home insurance.\n\nI worked up the auto + home bundle quote for you. \n\nFirst on the auto –\nWe matched the coverages to what you currently have with COMPANY.\n\nNext on the home –\nThe dwelling coverage is at $XXX, and the basis for deductibles, which we have set for the lowest possible which is 1% for the policy and 5% for hurricane. \n\nWe provide two quote options to choose from, the main difference is the roof coverage, dwelling coverage, personal property and loss of use is reduced on one, this is page 2 of the Home quote.\n\nThe higher coverage option, page 1 of the Home quote, includes replacement cost coverage for the roof and includes an additional 20% for Increased Dwelling covering the home for $XXX more for a total of $XXX , additional to increases in personal property and loss of use. \n\nThe deductibles can be increased based on your preferences. \n\n<b>Auto and Home Quote 1</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX\n\n<b>Auto and Home Quote 2</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX`}
          user={user}
        />
      )
    },
    {
      title: "Bundle - Adding Home",
      desc: "Adding home to existing auto account",
      content: (
        <EmailTemplateCard 
          title="Bundle - Adding Home"
          text={`Subject: State Farm Home Bundle Quote for CUSTOMER\n\nHey CUSTOMER, it was good chatting with you earlier.\n\nI worked up the bundle quote to add your home to your State Farm account.\n\nYour home quote is attached, if it looks good, we would be able to add the auto + home bundle discount and would save you $XX per month on your auto, your new auto rate is below.\n\nI also included a few suggested additional optional coverages below. \nThese are not included in the quotes but can be added if you want them.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nLet me know how this compares to your current rates\n_______________________________________________________________________\n\n<b>Auto and Home</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX\n_______________________________________________________________________\n\n<b>Optional Home Coverages</b> (per month / per year)\nIf you want to know more about these let me know.\n\n<u>Back up of Sewer and Drain</u> – plus $XX/$XXX\nIf water from rain or flooding were to back up into the drains inside the home.\n\n<u>Dwelling Foundation</u> – plus $XX/$XX\nLoss from settling, cracking, shrinking, enlarging, or expanding of the foundation, floor slab, or footings that support the dwelling.\n\n<u>ID Theft</u> – plus $2.08/$25\nCovers costs of recovering, restoring, and monitoring your credit and identity if it were stolen in a cyber-attack.\nHas a separate deductible of $500.\n\n<u>Home Systems Protection</u> – plus $8.25/$99\nCovers the breakdown of water heaters, air conditioners, furnaces, electrical panels and permanently installed appliances.\nOperates similar to a warranty and has a separate deductible of $500.\n\n<u>Seepage and Leakage</u> – plus $XX/$XXX\nDamage from broken or busted pipes are already covered. Covers the damage caused by water from a leaky pipe.\n* <u>Dwelling Foundation</u> – plus $XX/$XX\n  Loss from settling, cracking, shrinking, enlarging, or expanding of the foundation, floor slab, or footings that support the dwelling as a result of a covered Seepage and Leakage loss.`}
          user={user}
        />
      )
    },
    {
      title: "Bundle - Adding Dover Bay Home",
      desc: "Adding Dover Bay home to existing auto account",
      content: (
        <EmailTemplateCard 
          title="Bundle - Adding Dover Bay Home"
          text={`Subject: State Farm Home Bundle Quote for CUSTOMER\n\nHey CUSTOMER, it was good chatting with you earlier.\n\nI worked up the bundle quote to add your home to your State Farm account.\n\nYour home quote is attached, if it looks good, we would be able to add the auto + home bundle discount and would save you $XX per month on your auto, your new auto rate is below.\n\nThe dwelling coverage is at $XXX, and the basis for deductibles, which we have set for the lowest possible which is 1% for the policy and 5% for hurricane. \n\nWe provide two quote options to choose from, the main difference is the roof coverage, dwelling coverage, personal property and loss of use is reduced on one, this is page 2 of the Home quote.\n\nThe higher coverage option, page 1 of the Home quote, includes replacement cost coverage for the roof and includes an additional 20% for Increased Dwelling covering the home for $XXX more for a total of $XXX , additional to increases in personal property and loss of use. \n\nThe deductibles can be increased based on your preferences. \n\n<b>Auto and Home Quote 1</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX\n\n<b>Auto and Home Quote 2</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX`}
          user={user}
        />
      )
    },
    {
      title: "Bundle - Adding Auto",
      desc: "Adding auto to existing home account",
      content: (
        <EmailTemplateCard 
          title="Bundle - Adding Auto"
          text={`Subject: State Farm Auto Bundle Quote for CUSTOMER\n\nI worked up the bundle quote to add your auto to your State Farm account.\n\nWe have matched the coverage on your current auto policy. \nWith your coverages at XXX/XXX and a deductible of $XXX\n\nYour auto quote is attached, if it looks good, we would be able to add the auto + home bundle discount and would save you $XX per month on your home, your new home rate is below.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nLet me know how this compares to your current rates.\n\n_______________________________________________________________________\n\n<b>Auto and Home</b>\nAuto - $XXX per month / $XXXX per 6 months\nHome - $XXX per month / $XXXX per year\nMonthly $XXX`}
          user={user}
        />
      )
    },
    {
      title: "Cold Call Quote – Auto + Home Pivot",
      desc: "Post-cold call auto quote with home pivot",
      content: (
        <EmailTemplateCard 
          title="Cold Call Quote – Auto + Home Pivot"
          text={`Subject: State Farm Auto Quote for CUSTOMER\n\nHello CUSTOMER,\n\nIt was good speaking with you earlier.\nThanks for giving me the opportunity to quote your auto insurance.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nYour auto quote is attached, if it looks good, we can quote your home as well and see if the bundle makes sense. \n\nLet me know how this compares to your current coverage.`}
          user={user}
        />
      )
    },
    {
      title: "Cold Call Quote – Auto Only",
      desc: "Post-cold call auto quote",
      content: (
        <EmailTemplateCard 
          title="Cold Call Quote – Auto Only"
          text={`Subject: State Farm Auto Quote for CUSTOMER\n\nHello CUSTOMER,\n\nIt was good speaking with you earlier.\nThanks for giving me the opportunity to quote your auto insurance.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nYour auto quote is attached, let me know how this compares to your current coverage.`}
          user={user}
        />
      )
    },
    {
      title: "Cold Call Quote – Auto Winback",
      desc: "Post-cold call winback auto quote",
      content: (
        <EmailTemplateCard 
          title="Cold Call Quote – Auto Winback"
          text={`Subject: State Farm Auto Quote for CUSTOMER\n\nHello CUSTOMER,\n\nIt was good speaking with you earlier.\nThanks for giving me the opportunity to quote your Auto insurance.\n\nHopefully, we can bring you back to State Farm, so we can provide you with a great experience.\n\nYour auto quote is attached, if it looks good, we can quote your homeowners as well and see if the bundle makes sense. \n\nLet me know how this compares to your current coverage.`}
          user={user}
        />
      )
    },
    {
      title: "Cold Call Quote – Home Only",
      desc: "Post-cold call home quote",
      content: (
        <EmailTemplateCard 
          title="Cold Call Quote – Home Only"
          text={`Subject: State Farm Home Quote for CUSTOMER\n\nHello NAME,\n\nIt was good speaking with you earlier.\nThanks for giving me the opportunity to quote your Home insurance.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nYour home quote is attached, let me know how this compares to your current coverage and if you have any questions. \n\nI also included a few suggested additional optional coverages below. \nThese are not included in the quotes but can be added if you want them.\n\nHopefully, we can save you a few dollars a year, which will allow me to provide you with a great experience. \n\nLet me know how this compares to your current coverage.\n_______________________________________________________________________\n\nOptional Home Coverages (per month / per year)\nIf you want to know more about these let me know.\n\n<u>Back up of Sewer and Drain</u> – plus $XX/$XXX\nIf water from rain or flooding were to back up into the drains inside the home.\n\n<u>Dwelling Foundation</u> – plus $XX/$XX\nLoss from settling, cracking, shrinking, enlarging, or expanding of the foundation, floor slab, or footings that support the dwelling.\n\n<u>ID Theft</u> – plus $2.08/$25\nCovers costs of recovering, restoring, and monitoring your credit and identity if it were stolen in a cyber-attack.\nHas a separate deductible of $500.\n\n<u>Home Systems Protection</u> – plus $8.25/$99\nCovers the breakdown of water heaters, air conditioners, furnaces, electrical panels and permanently installed appliances.\nOperates similar to a warranty and has a separate deductible of $500.\n\n<u>Seepage and Leakage</u> – plus $XX/$XXX\nDamage from broken or busted pipes are already covered. Covers the damage caused by water from a leaky pipe.\n* <u>Dwelling Foundation</u> – plus $XX/$XX\n  Loss from settling, cracking, shrinking, enlarging, or expanding of the foundation, floor slab, or footings that support the dwelling as a result of a covered Seepage and Leakage loss.`}
          user={user}
        />
      )
    },
    {
      title: "Cold Call Quote – High",
      desc: "When quotes are higher than current",
      content: (
        <EmailTemplateCard 
          title="Cold Call Quote – High"
          text={`Subject: State Farm Quotes\n\nNAME,\n\nThanks for the opportunity to quote your insurance.\n\nUnfortunately, we are going to be higher for auto than your current coverage.\n\nLooks like your next renewal is in MONTH, I will check back with you then and see if we can get you a good quote.`}
          user={user}
        />
      )
    },
    {
      title: "Dover Bay Service - Policy Renewal Decrease",
      desc: "Renewal decrease notification",
      content: (
        <EmailTemplateCard 
          title="Dover Bay Service - Policy Renewal Decrease"
          text={`Subject: State Farm Dover Bay Homeowner's Renewal\n\nHello CUSTOMER, this is Mark with your State Farm office. \nYour home is up for renewal again on MONTH DAY. \n\nI have good news this time, we are seeing a decrease of $XXX for the year on the upcoming policy.\n\nA copy of the quote is attached. Just let me know if you would like me to process this renewal for you.`}
          user={user}
        />
      )
    },
    {
      title: "Dover Bay Service - Policy Renewal Increase",
      desc: "Renewal increase notification",
      content: (
        <EmailTemplateCard 
          title="Dover Bay Service - Policy Renewal Increase"
          text={`Subject: State Farm Dover Bay Homeowner's Renewal\n\nHello CUSTOMER, this is Mark with your State Farm office.\nYour home is up for renewal again on MONTH DAY. \n\nA copy of the quote is attached. Just let me know if you would like me to process this renewal for you.`}
          user={user}
        />
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Sales Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Quote Email Templates</h1>
        <p className="text-[var(--muted)]">Email templates for sending quotes to prospects.</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const FollowUpTemplates = ({ user }: { user: UserProfile | null }) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "F1 – Immediately After Emailed Quotes",
      desc: "Initial Follow-up",
      content: (
        <TemplateCard 
          title="F1 Text"
          text="Hey CUSTOMER. Thank you for the opportunity to quote your auto insurance. Let me know what you think and if you have any questions. Thanks // NAME // State Farm // 281.547.7209"
          user={user}
        />
      )
    },
    {
      title: "F2 – Next Day After Quote",
      desc: "Follow-up & Email",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="F2 Text"
            text="Good afternoon, CUSTOMER. Quick question, I just wanted to make sure. Did you get the quotes I sent over? Thanks // NAME"
            user={user}
          />
          <EmailTemplateCard 
            title="F2 Email"
            text={`Subject: State Farm Quotes\n\nGood afternoon, CUSTOMER.\n\nQuick question, I just wanted to make sure.\n\nDid you get the quotes I sent over?`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "F3 – Day 2 After Quote",
      desc: "Follow-up & Email",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="F3 Text"
            text="Just wanted to reach out and see if you had any questions about the coverage or quotes, we discussed the other day. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <EmailTemplateCard 
            title="F3 Email"
            text={`Subject: State Farm Quote\n\nHello CUSTOMER,\n\nJust wanted to reach out and see if you had any questions about the coverage or quotes, we discussed the other day.`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "F4 – Day 4 After Quote",
      desc: "Follow-up & Email",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="F4 Text"
            text="Hello CUSTOMER, how did you want to move forward with the quotes we sent over? Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <EmailTemplateCard 
            title="F4 Email"
            text={`Subject: State Farm Quotes\n\nHello CUSTOMER,\n\nHow did you want to move forward with the quotes we sent over?`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "F5 – Day 7 After Quote",
      desc: "Follow-up & Email",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="F5 Text"
            text="Hey CUSTOMER. I know you’re busy and don’t want to bug. Just wanted to see if you had the opportunity to review the quotes and if you had any feedback. Let me know how you would like to proceed. Thanks // NAME"
            user={user}
          />
          <EmailTemplateCard 
            title="F5 Email"
            text={`Subject: State Farm Quotes\n\nHey CUSTOMER.\n\nI know you’re busy and don’t want to bug.\n\nJust wanted to see if you had the opportunity to review the quotes and if you had any feedback.\n\nLet me know how you would like to proceed.`}
            user={user}
          />
        </div>
      )
    },
    {
      title: "F6 – Day 12 After Quote",
      desc: "Final Follow-up & Email",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="F6 Text"
            text="Good afternoon, CUSTOMER. To keep from annoying you with endless texts and calls, I will reach out in a few MONTHS/WEEKS when we get closer to your next renewal in MONTH. I have your quote for $XXX saved, if at any point you want to get started call, text or email anytime. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <EmailTemplateCard 
            title="F6 Email"
            text={`Subject: Future Quote from State Farm\n\nGood afternoon, CUSTOMER.\n\nTo keep from annoying you with endless texts and calls, I will reach out in a few MONTHWEEK when we get closer to your next renewal in MONTH.\n\nI have your quote for $XXX saved, if at any point you want to get started call or text anytime.`}
            user={user}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Sales Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Follow-up Templates</h1>
        <p className="text-[var(--muted)]">Standard follow-up messages for active quotes.</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const CheckInTemplates = ({ user }: { user: UserProfile | null }) => {
  const templates = [
    {
      title: "Call 1 - Voicemail",
      text: "Hey CUSTOMER, it’s NAME from your State Farm office. I wanted to reach out and make sure everything is well. Also, I wanted to let you know that if we bundled your auto and home insurance, we could reduce your auto insurance by $XXX per month. Would you mind if I sent over a home quote? Thanks // NAME // State Farm // 281.547.7209"
    },
    {
      title: "Call 2 + 2 weeks",
      text: "Hello CUSTOMER. If you ever need anything reach out to our office, we will be happy to help. We will check back with you again soon. If you need anything let us know. Thanks // NAME // State Farm // 281.547.7209"
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Retention Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Check-in Templates</h1>
        <p className="text-[var(--muted)]">Staying top-of-mind with prospects and former CUSTOMERS.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((t, i) => (
          <TemplateCard key={i} title={t.title} text={t.text} user={user} />
        ))}
      </div>
    </div>
  );
};

const ClosingTemplates = ({ user }: { user: UserProfile | null }) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "Step 2: Send Text 1",
      desc: "Initial post-sale confirmation",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TemplateCard 
            title="Auto Only"
            text="Your auto policy is all set up and ready to go, CUSTOMER! You should receive a few emails … One with the receipt and ID cards. Let me know if you don’t get it. I also sent you a welcome email with all my contact info, if you ever need anything reach out any time! Thanks, NAME"
            user={user}
          />
          <TemplateCard 
            title="Auto + Renter's"
            text="Your auto + renter's policies are all set up and ready to go, CUSTOMER! You should receive a few emails from me…One with the receipt and ID cards, and one with the renter's insurance for the landlord and one for your records. Let me know if any go missing. I also sent you a welcome email with all of my contact info, if you ever need anything reach out any time! Thanks, NAME"
            user={user}
          />
          <TemplateCard 
            title="Auto + Home"
            text="Your auto + home policies are all set and ready to go, CUSTOMER! You should receive a few emails from me…One with the receipt and ID cards, and one with the homeowner’s insurance. Let me know if any go missing. I also sent you a welcome email with all of my contact info, if you ever need anything reach out any time! Thanks, NAME"
            user={user}
          />
        </div>
      )
    },
    {
      title: "Step 3: Follow-up Actions",
      desc: "DSS, Auto Pay, and Signatures",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TemplateCard 
              title="Text 2 – Drive Safe and Save"
              text="We have you signed up for the Drive Safe and Save program that includes a participation discount. To participate and retain the discount, please download the State Farm app and complete enrollment. I sent you an email to create your account login. You can download the State Farm app from the Apple or Android app store. Enrollment and setup for Drive Safe & Save must be completed within the app."
              user={user}
            />
            <TemplateCard 
              title="Text 3 – Auto Pay"
              text="We also sent you an email to sign up for automatic payments. All you have to do is click confirm to enroll. If you do not enroll you will have to manually make payments via the State Farm app, online or by calling us at the office @ 281.547.7209."
              user={user}
            />
            <TemplateCard 
              title="Text 4 - Sig Doc"
              text="Finally…😂 the last email is for an electronic signature document to accept the coverage. Just open the document in your email and follow the prompts to sign. Let me know if you have any questions or missing any of the emails."
              user={user}
            />
            <TemplateCard 
              title="Confirmed Receipt / Thanks"
              text="You are very welcome. If you have a moment, could you leave me a review? Thanks // NAME // State Farm // 281.547.7209 https://www.daniellottinger.com/reviews"
              user={user}
            />
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-[#1d4ed8] border-b border-[var(--line)] pb-2">Reviews & Dec Pages</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TemplateCard 
                title="Review Request"
                text="It’s NAME with State Farm, hope everything is going great. I wanted to ask a quick favor, would you mind letting Google know about your experience with me and State Farm? Please include my NAME and how I was able to help you with your insurance. \*/ https://www.daniellottinger.com/reviews \*/"
                user={user}
              />
              <EmailTemplateCard 
                title="Dec Page - Applicant Copy"
                text="CUSTOMER,\n\nHere is a copy of your homeowner's declarations page for your records."
                user={user}
              />
              <EmailTemplateCard 
                title="Dec Page - Mortgagee Copy"
                text="CUSTOMER,\n\nHere is a copy of the homeowner's declarations page for the mortgage company if they ever ask for it."
                user={user}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 4: Final Check List",
      desc: "Post-bound workflow",
      content: (
        <div className="bg-[var(--template-bg)] p-8 rounded-xl border border-[var(--line)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-[#1d4ed8] flex items-center gap-2">
                <CheckCircle2 size={18} /> Post-Bound Workflow
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                  <span>Set <strong>Service</strong> tasks</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                  <span>Set <strong>Onboard</strong> task</span>
                </li>
              </ul>
              
              <h4 className="font-bold text-[#1d4ed8] mt-6 flex items-center gap-2">
                <FileText size={18} /> Opportunity Details
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                  <span>Marketing source</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                  <span>Premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                  <span>Quote Provided</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                  <span>Discussed Date</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center justify-center border-l border-[var(--line)] pl-8">
              <div className="text-6xl mb-4 animate-bounce">🔔</div>
              <h3 className="text-2xl font-black text-[#1d4ed8] text-center">RING THE BELL!!</h3>
              <p className="text-[var(--muted)] text-sm mt-2">Celebrate the win with the team!</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Sales Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">Closing Templates</h1>
        <p className="text-[var(--muted)]">Finalizing the sale and getting documents signed.</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const AfterSalesTemplates = ({ user }: { user: UserProfile | null }) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const steps = [
    {
      title: "Service Tasks",
      desc: "Auto Pay, Steer Clear, and Signatures",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="Auto Pay Set Up 1"
            text="CUSTOMER, if you would like to be on auto pay, there is an electronic signature required to confirm the auto payment set up. I just resent the email, let me know if you do not receive it. If you do not want to be on auto pay let me know and I will discontinue the notices. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Auto Pay Set Up 2"
            text="CUSTOMER, hope your day is treating you well. I emailed you the link to confirm your automatic payments. All you have to do is click on the link to confirm and verify. If you did not receive the email, please let me know. Thanks! ~NAME w/ State Farm 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Auto Pay Set Up 3"
            text="Hey CUSTOMER. Just wanted to let you know that your State Farm bill is due on the DATE. We have not yet received the auto pay enrollment agreement. In order to make a payment you will need to call into the office or make the payment online or on the app. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Steer Clear Form"
            text="CUSTOMER, hope you are doing well. I emailed you the Steer Clear Form, please have your SON/DAUGHTER CUSTOMER sign the form and return to us asap. This is a huge discount on your auto insurance that you do not want to miss out on. If you did not receive it let me know. Thanks! ~NAME w/ State Farm 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Sig Doc"
            text="Hello, CUSTOMER. Real quick, I emailed you a document State Farm needs your signature for your auto coverage. It’s an e-sign so all you have to do it follow the instructions in your email and then on the document. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
        </div>
      )
    },
    {
      title: "Drive Safe 'N Save Order",
      desc: "Ordering the beacons",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="Notification 1 – Day After"
            text="Hello CUSTOMER, just wanted to say thanks for choosing State Farm and our office. I also wanted to remind you about the Drive Safe and Save devices. I sent you an email to set up a log in for the app, after you download and get logged into the app, click the Safe and Save icon at the bottom of the app. Then scroll down a little and you will see “Your Vehicles” click enroll and follow the prompts to order the Drive Safe and Save beacons. If you have any questions or issues let me know. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Notification 2 – 2 Days After"
            text="Hello CUSTOMER! When we set up your auto policy last week, we enrolled you into Drive Safe and Save with a monthly discount of $XX. In order to complete the set up, you need to log in to your account on the app and order the devices for your vehicles and they will be shipped to you. If you have any questions let me know. Thanks! ~NAME w/ State Farm. 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Notification 3 – Every Other Day"
            text="CUSTOMER! You are at risk! Of losing the Drive Safe and Save discount of $XX every month. The devices must be ordered and setup to keep the discount. Please log in to the app and order your devices asap. Thanks // NAME // State Farm. 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Notification 4 – After Removal Date"
            text="CUSTOMER, just wanted to remind you to order and set up the Drive Safe and Save devices from StateFarm.com or the app. The discount of $XX was applied to your monthly rate. If the Drive Safe & Save devices are not ordered and set up, the initial participation discount will be removed effective XX/XX/2025 and added to your next bill. ~NAME w/ State Farm. 281.547.7209"
            user={user}
          />
        </div>
      )
    },
    {
      title: "Drive Safe 'N Save Set-Up",
      desc: "Setting up the beacons",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateCard 
            title="Notification 1 – Day after delivery"
            text="Hey CUSTOMER! Your Drive Safe and Save module should be delivered. Let me know if you have not received it or have any issues. Here is a quick video with instructions on how to set it up: http://st8.fm/mobilesetup. Thanks! ~NAME w/ State Farm."
            user={user}
          />
          <TemplateCard 
            title="Notification 2 – + 2 Days"
            text="Hello CUSTOMER! Courtesy reminder to complete the set up for the Drive Safe ‘N Save Device, in order to keep your discount of $ XX per month. Here is a link to a video tutorial that can walk you through the process: http://st8.fm/mobilesetup. If you have any questions, please let me know as soon as possible. Thanks! ~NAME w/ State Farm. 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Notification 3 – Weekend Reminder"
            text="CUSTOMER, just wanted to say I hope you have a great weekend. During this wonderful weekend you are about to have, could you do me a huge favor?? Set up your Drive Safe and Save device. It should only take about 5 minutes and then you can enjoy the rest of your weekend and the monthly $XX discount on your auto insurance. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Notification 4 – M/W/F Check"
            text="Just another reminder from State Farm! Make sure you set up your Drive Safe and Save on your phone and place the device in your vehicles. If you need assistance with the setup, please reach out we would be happy to help you. If not completed, you will lose the discounts received, as well as, going forward."
            user={user}
          />
          <TemplateCard 
            title="Notification 5 – Risk Alert"
            text="CUSTOMER! You are at risk! Of losing a major discount on your auto insurance coverage as well as having to pay back the discounts you have already received. Drive Safe and Save is saving you $ XX every month. Since this is a participation discount you will get charged for the discounts you have already received plus lose the $ XX per month. Please set up as soon as possible. Thanks // NAME // State Farm. 281.547.7209"
            user={user}
          />
          <TemplateCard 
            title="Notification 6 – Last Chance"
            text="Good afternoon, CUSTOMER. This is your last chance. If your Drive Safe and Save is not set up by MONTH/DAY you will lose the discount! Since this is a participation discount, you will lose the discount of $XX per month and be charged for the discounts you have already received. If you need assistance in setting this up let me know. Thanks // NAME // State Farm // 281.547.7209"
            user={user}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales/templates" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Onboarding Workflow
        </span>
        <h1 className="text-3xl font-bold mb-2">After-Sales Templates</h1>
        <p className="text-[var(--muted)]">Onboarding new CUSTOMERS and ensuring compliance.</p>
      </section>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const WordTracks = ({ user }: { user: UserProfile | null }) => {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const { applyTokens } = useTokens(user);

  const sections = [
    {
      title: "X-Date Script",
      subtitle: "Focus: Calling On Previous Quotes",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#1d4ed8] border-y border-r border-[var(--line)]">
            <div className="space-y-4">
              <div>
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">1. The Greeting</span>
                <p className="text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: applyTokens("\"<strong>-CUSTOMER-?</strong> Hey <strong>-CUSTOMER-</strong>! It’s just <strong>NAME</strong> here with State Farm. Hope your <strong>DAY</strong> is going well.\"") }} />
                <div className="mt-2 ml-6 border-l-2 border-[var(--line)] pl-4 text-base italic text-[var(--muted)]">
                  Mirroring: "That’s awesome... Good to hear... Just another day in paradise over here."
                </div>
              </div>

              <div className="ml-6">
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">Hook A: General (X-CUSTOMER)</span>
                <p className="text-[var(--text)] leading-relaxed">
                  "We know insurance rates have been unreliable recently, especially with State Farm's recent rate decrease. That’s why we wanted to ask real quick… You wouldn’t be opposed to saving money on insurance or getting better coverage, right?"
                </p>
              </div>

              <div className="ml-6">
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">Hook B: Follow-up (XL-CUSTOMER)</span>
                <p className="text-[var(--text)] leading-relaxed">
                  "Not sure if you remember but we spoke about your <strong>–AUTO/HOME–</strong> coverage back in <strong>–MONTH–</strong>. It looks like your auto renewal is coming up and State Farm just had a price decrease."
                </p>
              </div>

              <div className="ml-6">
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">Hook C: Older Quotes (XA-CUSTOMER)</span>
                <p className="text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: applyTokens("\"<strong>-CUSTOMER-</strong>, I know it might have been a while since we spoke… but we worked on a quote for you in the past. Maybe a year or 2 ago? Well, State Farm just had a price decrease and… It looks like you may have an auto insurance renewal coming up and we wanted to reach out and see if we can get you a fresh quote so you can compare? <strong>How’s that sound?</strong>\"") }} />
              </div>

              <div>
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">2. Discovery & Motivation</span>
                <p className="text-[var(--text)] leading-relaxed">
                  "I am probably going to ask a few questions that you might not have been asked before... we do things a bit differently here. The people we know the best, we can protect the best. I promise to be quick though. <strong>Fair?</strong>"
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                    <span className="text-[var(--text)]">Who are you with for insurance currently? And you’ve been with <strong>–COMPANY–</strong> for how long?</span>
                  </li>
                  <li className="ml-6 border-l-2 border-[var(--line)] pl-4 italic text-[var(--muted)] text-base">
                    Response (2+ renewals): "That’s awesome, just the type of client we are looking for!"
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                    <span className="text-[var(--text)]">When you got that policy did anyone at <strong>–COMPANY–</strong> go over your coverages with you and explain how they work?</span>
                  </li>
                  <li className="ml-6 border-l-2 border-[var(--line)] pl-4 italic text-[var(--muted)] text-base">
                    Mirror "No": "No? Oh, that’s interesting."
                  </li>
                </ul>
              </div>

              <p className="text-[var(--text)] leading-relaxed font-medium">
                "As we work up this quote for you, what’s most important to you, <strong>price or coverage?</strong>"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                  <strong className="text-[#1d4ed8] block mb-2 text-base">If Price:</strong>
                  <p className="text-sm text-[var(--text)] leading-relaxed italic">"I get it, we always want to make sure we are getting the best value."</p>
                </div>
                <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                  <strong className="text-[#1d4ed8] block mb-2 text-base">If Coverage:</strong>
                  <p className="text-sm text-[var(--text)] leading-relaxed italic">"Absolutely. That’s the whole point of insurance, right?"</p>
                </div>
              </div>

              <p className="text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: applyTokens("\"<strong>-CUSTOMER-</strong>, what has you shopping for a different insurance company?\"") }} />
              <div className="ml-6 border-l-2 border-[var(--line)] pl-4 text-base italic text-[var(--muted)]">
                Don’t know? No worries. "You must be on auto pay?"
              </div>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "Do you happen to remember how much you are paying?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "Ok, let me ask you this…If you happened to be involved in an auto accident you would want the insurance company to cover that right?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "So, if you had to come out of pocket say 5 or even 10 grand to cover the loss your would probably fire –COMPANY–, right?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "It would make sense to be covered for all accidents and not just some right? We find that 90% of the people we talk to don’t have adequate coverage for all accidents."
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "First lets determine what your coverage should be so that never happens to you. <strong>Fair enough?</strong>"
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Lead Script",
      subtitle: "Focus: New Quote Requests",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#1d4ed8] border-y border-r border-[var(--line)]">
            <div className="space-y-4">
              <div>
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">1. The Greeting</span>
                <p className="text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: applyTokens("\"<strong>-CUSTOMER-?</strong> Hey <strong>-CUSTOMER-</strong>! It’s just <strong>NAME</strong> here with State Farm. Hope your <strong>DAY</strong> is going well.\"") }} />
                <div className="mt-2 ml-6 border-l-2 border-[var(--line)] pl-4 text-base italic text-[var(--muted)]">
                  Mirroring: "That’s awesome... Good to hear... Just another day in paradise over here."
                </div>
              </div>

              <div className="ml-6">
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">Hook: Quote Request</span>
                <p className="text-[var(--text)] leading-relaxed">
                  "We received a request for an auto/home insurance quote... and just wanted to reach out and make sure we have all the details correct so we can get you an accurate quote. I just need a few minutes to get that quote."
                </p>
              </div>

              <div>
                <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">2. Discovery & Motivation</span>
                <p className="text-[var(--text)] leading-relaxed">
                  "I am probably going to ask a few questions that you might not have been asked before... we do things a bit differently here. The people we know the best, we can protect the best. I promise to be quick though. <strong>Fair?</strong>"
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                    <span className="text-[var(--text)]">Who are you with for insurance currently? And you’ve been with <strong>–COMPANY–</strong> for how long?</span>
                  </li>
                  <li className="ml-6 border-l-2 border-[var(--line)] pl-4 italic text-[var(--muted)] text-base">
                    Response (2+ renewals): "That’s awesome, just the type of client we are looking for!"
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                    <span className="text-[var(--text)]">When you got that policy did anyone at <strong>–COMPANY–</strong> go over your coverages with you and explain how they work?</span>
                  </li>
                  <li className="ml-6 border-l-2 border-[var(--line)] pl-4 italic text-[var(--muted)] text-base">
                    Mirror "No": "No? Oh, that’s interesting."
                  </li>
                </ul>
              </div>

              <p className="text-[var(--text)] leading-relaxed font-medium">
                "As we work up this quote for you, what’s most important to you, <strong>price or coverage?</strong>"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                  <strong className="text-[#1d4ed8] block mb-2 text-base">If Price:</strong>
                  <p className="text-sm text-[var(--text)] leading-relaxed italic">"I get it, we always want to make sure we are getting the best value."</p>
                </div>
                <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                  <strong className="text-[#1d4ed8] block mb-2 text-base">If Coverage:</strong>
                  <p className="text-sm text-[var(--text)] leading-relaxed italic">"Absolutely. That’s the whole point of insurance, right?"</p>
                </div>
              </div>

              <p className="text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: applyTokens("\"<strong>-CUSTOMER-</strong>, what has you shopping for a different insurance company?\"") }} />
              <div className="ml-6 border-l-2 border-[var(--line)] pl-4 text-base italic text-[var(--muted)]">
                Don’t know? No worries. "You must be on auto pay?"
              </div>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "Do you happen to remember how much you are paying?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "Ok, let me ask you this…If you happened to be involved in an auto accident you would want the insurance company to cover that right?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "So, if you had to come out of pocket say 5 or even 10 grand to cover the loss your would probably fire –COMPANY–, right?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "It would make sense to be covered for all accidents and not just some right? We find that 90% of the people we talk to don’t have adequate coverage for all accidents."
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4">
                "First lets determine what your coverage should be so that never happens to you. <strong>Fair enough?</strong>"
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Winback Script",
      subtitle: "Focus: Returning CUSTOMERS",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#1d4ed8] border-y border-r border-[var(--line)]">
            <div className="space-y-4">
              <p className="text-[var(--text)] leading-relaxed" dangerouslySetInnerHTML={{ __html: applyTokens("\"Hello <strong>-CUSTOMER-</strong>. <strong>NAME</strong> with State Farm here.\"") }} />
              <p className="text-[var(--text)] leading-relaxed">
                "I was just reaching out because we noticed your State Farm coverage ended back in…<strong>MONTH/YEAR</strong>."
              </p>
              <p className="text-[var(--text)] leading-relaxed">
                "State Farm recently had another rate decrease and I wanted to ask if I could send over a fresh quote including those decreases."
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                  <strong className="text-[#1d4ed8] block mb-2 text-base">Yes?</strong>
                  <p className="text-sm text-[var(--text)] leading-relaxed italic">"Ok Great..."</p>
                </div>
                <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                  <strong className="text-[#1d4ed8] block mb-2 text-base">No?</strong>
                  <p className="text-sm text-[var(--text)] leading-relaxed italic">"Would you be opposed to taking a look at a quote if I could beat what you are currently paying?"</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                <li className="flex gap-2">
                  <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                  <span className="text-[var(--text)]">Who do you have your coverage with now?</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                  <span className="text-[var(--text)]">Do you remember what your currently paying?</span>
                </li>
              </ul>

              <p className="text-[var(--text)] leading-relaxed mt-4">
                "If I were to present you with a quote with a better price or coverage would you consider coming back to State Farm?"
              </p>
              <p className="text-[var(--text)] leading-relaxed mt-4 font-medium">
                "Let’s take a look at your coverages and see what we can do"
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Closing 1",
      subtitle: "Data Verification & Eligibility",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#1d4ed8] border-y border-r border-[var(--line)]">
            <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">1. Info Check</span>
            <p className="text-[var(--text)] mb-4">Just a few questions and we can get a quote started. Just need to make sure we have all of your information correct.</p>
            <ul className="space-y-3">
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span className="text-[var(--text)]">I have your address as…Is that correct?</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span className="text-[var(--text)]">I have your date of birth as... is that correct?</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-[var(--text)]">DRIVERS – Any other drivers in the household besides yourself?</span>
                  <span className="text-base text-[var(--muted)] italic">Any drivers have any violations or licenses suspensions?</span>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-[var(--text)]">VEHICLES – What vehicles do you currently insure?</span>
                  <span className="text-base text-[var(--muted)] italic">What was the approximate month and year you got those vehicles?</span>
                </div>
              </li>
            </ul>

            <p className="text-[var(--text)] mt-6 mb-4">Sorry about all the ridiculous questions, this helps us determine eligibility and what discounts and bundles we can apply…last one.</p>
            <p className="text-[var(--text)] font-medium">Do you own or rent there on -name of street/city-?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">OWN</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Who do you have your homeowners insurance with?</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Do you have a mortgage, or is the home paid off?</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Do you currently have the home and auto bundled?</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">RENT</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Who do you have your renters insurance with?</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Apartment? – Does the complex require you to have renters insurance?</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Do you have it through the complex or is it bundled with your auto?</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
              <strong className="text-[#1d4ed8] block mb-2 uppercase tracking-wider text-base">Drive Safe & Save</strong>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Another optional discount that is available is a participation discount that State Farm calls Drive Safe…and Save it’s similar to programs from other insurance companies.
              </p>
              <div className="mt-4 space-y-2 text-sm text-[var(--text)]">
                <p>We will mail you a small battery powered bluetooth device all you have to do is download the app and connect the device. Other than that you do not have to interact with the app or the device. You do not have to tell it you were not driving if you weren’t in your car. And you can’t be penalized.</p>
                <p dangerouslySetInnerHTML={{ __html: applyTokens("The worst thing that could happen is State Farm says…“<strong>-CUSTOMER-</strong>…you are the worst driver in Texas. We are unenrolling you from the program. You can keep the insurance, just not the discount.”") }} />
                <p>Although, I have never seen that happen. We already have this discount included, we can leave this on if you’d like to participate… or, I can give you a quote with and without.</p>
              </div>
            </div>

            <p className="mt-6 font-bold text-[var(--text)]">Ok, now I can show you the advantage of working with State Farm and a human and why I enjoy having these conversations…explanation of coverages.</p>
          </div>
        </div>
      )
    },
    {
      title: "Closing 2",
      subtitle: "The Aggravating vs. The Devastating",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#eab308] border-y border-r border-[var(--line)]">
            <span className="text-[#1d4ed8] font-bold block mb-2 uppercase tracking-wider text-base">1. Coverages</span>
            <p className="text-[var(--text)] font-medium">First the aggravating things then the devastating.</p>
            <p className="text-[var(--text)] mt-4"><strong>So, the aggravating –</strong></p>
            <ul className="mt-2 space-y-2 text-[var(--text)]">
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>Deductibles I have at $1000 is that good or do you prefer $500?</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>Would you like to have a rental car if you are in an accident?</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>I have towing added unless you already have Triple A.</span>
              </li>
            </ul>

            <p className="text-[var(--text)] mt-6"><strong>Now for the scary stuff…the devastating…The worst case, there is an accident…and it is your fault.</strong></p>
            <ul className="mt-2 space-y-2 text-[var(--text)]">
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>I see you have, property damage coverage of up to 25 or 50 thousand</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>Did you speak with someone at –COMPANY– to get that coverage? NO?</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>Do you know how an at fault auto accident claim is handled?</span>
              </li>
            </ul>

            <p className="text-[var(--text)] mt-4">After your insurance pays up to the limit, currently 25 or 50 thousand they will come after you for the rest. Might I make a suggestion here? Let me ask you something…</p>
            
            <ul className="mt-4 space-y-3 text-[var(--text)]">
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>Do you know what the average new car price is?... Believe it or not It’s skyrocketed with everything else and is now about 48 grand.</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 bg-[#1d4ed8] mt-2.5 flex-shrink-0"></span>
                <span>How about this one… Do you know what the most popular selling vehicle is? New and used, It’s actually the Ford F-150. You’re sure to see at least 1 or 2 on the way home….Right? Most are worth more than 25k.</span>
              </li>
            </ul>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[var(--bg)] border-l-2 border-[#1d4ed8] border-y border-r border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">25k Property Damage</strong>
                <p className="text-sm text-[var(--text)] leading-relaxed">Both have a value of way more than the 25 thousand dollar coverage you currently have, leaving you exposed and not covered for all accidents. So, worst case, if you were in an accident with the average new car or an F-150 and did 30 thousand dollars in damage or more, do you know who would pay the difference?</p>
              </div>
              <div className="p-4 bg-[var(--bg)] border-l-2 border-[#1d4ed8] border-y border-r border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">50k Property Damage</strong>
                <p className="text-sm text-[var(--text)] leading-relaxed">The average value of a new vehicle at 48 grand is really close to the 50k coverage you currently have, potentially, leaving you exposed and not covered for all accidents. So, worst case, if you were in an accident with the average new car or an F-150 and did 60 thousand dollars in damage or more, do you know who would pay the difference?</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[var(--text)]">If you had to come out of pocket to cover that 5 to 10k difference you would fire me….Look I don’t want to get fired?….</p>
              <p className="font-bold text-[var(--text)] mt-4 text-lg">Let’s double your coverage for $XX per month so you are adequately covered and I don’t have to worried about being fired. That sounds fair, right?</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Closing 3",
      subtitle: "Finalizing & Closing",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#22c55e] border-y border-r border-[var(--line)]">
            <p className="text-[var(--text)] font-medium" dangerouslySetInnerHTML={{ __html: applyTokens("Awesome! So, <strong>-CUSTOMER-</strong> to get switched over to State Farm…We would just need a few things to get this done for you…") }} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">For the Auto…</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Financing company for any vehicles still financed</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Would you like to be on auto pay? and is the (current date OR effective date good for that)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Would you like to use a card or bank account?</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">For the Home…</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>The mortgage company and loan number? (If still financed)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Do you pay for the home insurance directly or is it paid through your escrow?</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">For the Renters…</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>How does the apartment complex want to be listed on the insurance?</span>
                  </li>
                  <li className="mt-2 ml-6 border-l-2 border-[var(--line)] pl-3 italic text-[var(--muted)] text-base">I do not know? No worries. Sometimes they will give you a move in checklist, that will have insurance info on it. Do they give you something like that? NO? (Put apartment complex name and address.)</li>
                </ul>
              </div>
            </div>

            <p className="text-[var(--text)] mt-8 font-medium">This will take me about 10 minutes to get set up and submitted for you.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">Auto Only</strong>
                <p className="text-sm text-[var(--text)] leading-relaxed">Once everything is set up, I will send you a few emails, one with the receipt, one with the ID Cards and one for the auto pay, we just need you to click confirm to verify you want to be on auto pay. You will also get a welcome email with a link to download the State Farm app and have access to your digital ID cards.</p>
              </div>
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">+Home</strong>
                <p className="text-sm text-[var(--text)] leading-relaxed">I will also send you two copies of the declarations page. One for your records and one for the mortgage company if they ever ask for one.</p>
              </div>
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-2">+Renters</strong>
                <p className="text-sm text-[var(--text)] leading-relaxed">I will also send you two copies of the declarations page. One for your records and one for the landlord/complex.</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[var(--text)]">When I get everything finished up I will send you a text letting you know everything is in your email so you can find it. One last thing before I let you go, can I ask a quick favor? How would you say your experience has been with me?</p>
              <p className="font-bold text-[var(--text)] mt-4">In the welcome email, there will be a link to our review page. Would you mind leaving me a review? Thanks!</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Closing Checklist",
      subtitle: "Final Verification & Service Steps",
      content: (
        <div className="space-y-6">
          <div className="bg-[var(--template-bg)] p-6 rounded-xl border-l-4 border-[#1d4ed8] border-y border-r border-[var(--line)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AUTO Section */}
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">AUTO</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Financing - Lien or Lease</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Payment - Auto Pay</span>
                  </li>
                </ul>
              </div>

              {/* HOME Section */}
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">HOME</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Year Built</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Roof Year (Metal?)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Financing?</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <div className="flex flex-col">
                      <span>Escrow?</span>
                      <span className="text-xs text-[var(--muted)] italic">(Yes? No SFB)</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* DOVER BAY HOME Section */}
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">DOVER BAY HOME</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>PBRIT - Eligibility</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Proof Current Auto</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>ERC</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Financing?</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <div className="flex flex-col">
                      <span>Escrow?</span>
                      <span className="text-xs text-[var(--muted)] italic">(Yes? No ACH FORM)</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* ENDORSEMENTS Section */}
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">ENDORSEMENTS</strong>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Pipe Leakage and Seepage</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Dwelling Foundation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Home Systems</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>ID Theft</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                    <span>Back up Sewer and Drain</span>
                  </li>
                </ul>
              </div>

              {/* SERVICE Section */}
              <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-lg md:col-span-2">
                <strong className="text-[#1d4ed8] block mb-3 uppercase tracking-wider text-base">SERVICE</strong>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="text-sm space-y-2 text-[var(--text)]">
                    <li className="flex gap-2">
                      <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                      <span>Issued?</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                      <div className="flex flex-col">
                        <span>Drive Safe and Save?</span>
                        <span className="text-xs text-[var(--muted)] italic">(Explained)</span>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                      <div className="flex flex-col">
                        <span>Auto Pay?</span>
                        <span className="text-xs text-[var(--muted)] italic">(Email Confirmation)</span>
                      </div>
                    </li>
                  </ul>
                  <ul className="text-sm space-y-2 text-[var(--text)]">
                    <li className="flex gap-2">
                      <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                      <div className="flex flex-col">
                        <span>Steer Clear?</span>
                        <span className="text-xs text-[var(--muted)] italic">(No Accidents or Violations Under 25, Signature Document)</span>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                      <div className="flex flex-col">
                        <span>Selection Rejection?</span>
                        <span className="text-xs text-[var(--muted)] italic">(Signature Document)</span>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1 h-1 bg-[#1d4ed8] mt-2 flex-shrink-0"></span>
                      <span>Survey?</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/sales" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Sales Hub
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Sales Mastery
        </span>
        <h1 className="text-3xl font-bold mb-2">Word Tracks</h1>
        <p className="text-[var(--muted)]">Live phone call word tracks for the Daniel Lottinger Agency team.</p>
      </section>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{section.title}</h3>
                {section.subtitle && <p className="text-sm text-[var(--muted)]">{section.subtitle}</p>}
              </div>
              {openSection === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openSection === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="mt-4">
                      {section.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const Feedback = ({ user }: { user: UserProfile }) => {
  const [type, setType] = useState('Suggestion');
  const [page, setPage] = useState('General/Other');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) {
      alert("Please enter some details before sending.");
      return;
    }

    const subject = `Playbook Feedback: ${type} from ${user.full}`;
    const body = `FEEDBACK REPORT\n` +
                 `--------------------------\n` +
                 `From: ${user.full} (${user.title})\n` +
                 `Type: ${type}\n` +
                 `Page Reference: ${page}\n\n` +
                 `DETAILS:\n${message}\n\n` +
                 `--------------------------\n` +
                 `Sent via Agency Playbook Feedback Portal`;

    showToast('Outlook Opening');
    window.location.href = `mailto:mark@daniellottinger.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Maintenance
        </span>
        <h1 className="text-3xl font-bold mb-2">Feedback Portal</h1>
        <p className="text-[var(--muted)]">Report an issue, suggest a new script, or request a documentation update.</p>
      </section>

      <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1d4ed8]">Feedback Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--template-bg)] text-[var(--text)] outline-none focus:border-[#1d4ed8]"
              >
                <option>Suggestion</option>
                <option>Bug/Error</option>
                <option>New Script Request</option>
                <option>Update Request</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1d4ed8]">Page Reference</label>
              <select 
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--template-bg)] text-[var(--text)] outline-none focus:border-[#1d4ed8]"
              >
                <option value="General/Other">General / Other</option>
                {PLAYBOOK_PAGES.map(p => <option key={p.url} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#1d4ed8]">Details</label>
            <textarea 
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the suggestion or issue here..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--template-bg)] text-[var(--text)] outline-none focus:border-[#1d4ed8] resize-none"
            />
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-bold hover:bg-[#1d4ed8] transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Send Feedback to Mark
          </button>
        </div>
      </div>
    </div>
  );
};

const Directory = () => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const quickLinks = [
    { name: "Texas Dept of Insurance", url: "https://www.tdi.texas.gov", desc: "State licensing and compliance portal." },
    { name: "Sircon", url: "https://platform.sircon.com", desc: "Licensing and compliance management." },
    { name: "State Farm Agency Hub", url: "https://sf.com/agencyhub", desc: "Internal agency resource portal." },
  ];

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Agency Tools
        </span>
        <h1 className="text-3xl font-bold mb-2">Agency Directory</h1>
        <p className="text-[var(--muted)]">Quick access to team contact information and external portals.</p>
      </section>

      <div className="grid grid-cols-1 gap-8">
        {/* Agency Directory */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User size={20} className="text-[#1d4ed8]" />
            Team Directory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(USER_DIRECTORY).map(([key, profile]) => (
              <div key={key} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden transition-all">
                <div className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {profile.full.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    <div className="font-bold text-lg">{profile.full}</div>
                    <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold">{profile.title}</div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button 
                    onClick={() => setExpandedUser(expandedUser === key ? null : key)}
                    className="w-full py-2 bg-[var(--accent)] text-[var(--brand-dark)] rounded-lg text-xs font-bold hover:bg-[var(--line)] transition-colors flex items-center justify-center gap-2"
                  >
                    {expandedUser === key ? 'Hide Contact' : 'View Contact'}
                    {expandedUser === key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedUser === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-3 border-t border-[var(--line)] mt-4">
                          <div className="flex items-center gap-3 text-sm">
                            <Mail size={14} className="text-[#1d4ed8]" />
                            <a href={`mailto:${profile.email}`} className="hover:underline">{profile.email}</a>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <PhoneCall size={14} className="text-[#1d4ed8]" />
                            <span>{profile.phone}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6 pt-10 border-t border-[var(--line)]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe size={20} className="text-[#1d4ed8]" />
            Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link, i) => (
              <a 
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 bg-[var(--panel)] border border-[var(--line)] rounded-xl hover:border-[#1d4ed8] transition-all group shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold group-hover:text-[#1d4ed8] transition-colors">{link.name}</h3>
                  <ExternalLink size={14} className="text-[var(--muted)] group-hover:text-[#1d4ed8]" />
                </div>
                <p className="text-xs text-[var(--muted)]">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Email Signature Generator component.
 * Allows users to generate and copy a professional agency signature.
 */
const Signature = ({ user }: { user: UserProfile }) => {
  const baseUrl = "images"; // Use relative path to public/images
  const icons = {
    addr: `${baseUrl}/mappin.png`,
    phone: `${baseUrl}/phone.png`,
    web: `${baseUrl}/website.png`,
    fb: `${baseUrl}/facebook.png`,
    sfLogo: `${baseUrl}/statefarmlogo.png` 
  };

  const copySignature = () => {
    const el = document.getElementById('outlookSig');
    if (el) {
      const range = document.createRange();
      range.selectNode(el);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
      showToast('Signature copied to clipboard!');
    }
  };

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Tools
        </span>
        <h1 className="text-3xl font-bold mb-2">Email Signature Generator</h1>
        <p className="text-[var(--muted)]">Generate your professional agency signature. Copy and paste directly into Outlook.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-xl border border-[var(--line)] shadow-sm text-[#1f2937]" id="outlookSig">
            <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.2', color: '#1f2937' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d32f2f', margin: '0' }}>{user.full}</div>
              <div style={{ fontSize: '16px', color: '#4b5563', marginBottom: '12px' }}>{user.title}</div>
              <table border={0} cellPadding={0} cellSpacing={0} width="180" style={{ marginBottom: '14px' }}>
                <tbody>
                  <tr>
                    <td align="center">
                      <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2.2px', display: 'block' }}>DANIEL LOTTINGER</span>
                      <img src={icons.sfLogo} alt="State Farm" width="150" style={{ display: 'block' }} />
                    </td>
                  </tr>
                </tbody>
              </table>
              <table border={0} cellPadding={0} cellSpacing={0} style={{ fontSize: '15px', color: '#374151' }}>
                <tbody>
                  <tr><td style={{ paddingRight: '8px' }}><img src={icons.addr} width="16" /></td><td>21901 State Highway 249, Houston, TX 77070</td></tr>
                  <tr><td style={{ paddingRight: '8px' }}><img src={icons.phone} width="16" /></td><td>281.547.7209</td></tr>
                  <tr><td style={{ paddingRight: '8px' }}><img src={icons.web} width="16" /></td><td><a href="https://daniellottinger.com" style={{ color: '#1d4ed8' }}>daniellottinger.com</a></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <button 
            onClick={copySignature}
            className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-bold hover:bg-[#1d4ed8] transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2"
          >
            <Copy size={18} />
            Copy Signature for Outlook
          </button>
        </div>

        <div className="bg-[var(--accent)] border-2 border-dashed border-[#1d4ed8] rounded-[var(--radius)] p-8">
          <h3 className="text-xl font-bold mb-4 text-[#1d4ed8]">How to Use</h3>
          <ol className="space-y-4 text-sm font-medium list-decimal list-inside">
            <li>Click the "Copy Signature" button above.</li>
            <li>Open Outlook and go to <span className="font-bold">File &gt; Options &gt; Mail &gt; Signatures</span>.</li>
            <li>Create a new signature and <span className="font-bold">Paste (Ctrl+V)</span> into the box.</li>
            <li>Click Save and set as your default for new messages.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const Licensing = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Team Resources
      </span>
      <h1 className="text-3xl font-bold mb-2">Licensing & Education</h1>
      <p className="text-[var(--muted)]">
        Access study materials, renewal requirements, and continuing education 
        links to keep your insurance licenses active and compliant.
      </p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link to="/licensing/get-licensed" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">📜</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Get Licensed</h3>
        <p className="text-[var(--muted)] mb-4">How to get your license and become an insurance sales producer.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">New Agents</span>
      </Link>

      <Link to="/licensing/pc" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">🏠</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Property & Casualty</h3>
        <p className="text-[var(--muted)] mb-4">Study guides, exam prep, and state-specific regulations for P&C licensing.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">P&C Exam</span>
      </Link>
      
      <Link to="/licensing/life" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">❤️</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Life, Health & Accident</h3>
        <p className="text-[var(--muted)] mb-4">Resources for Life and Health license, including product-specific training.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Life Exam</span>
      </Link>
      
      <div className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 opacity-60">
        <div className="text-4xl mb-4">🎓</div>
        <h3 className="text-xl font-bold mb-2">Continuing Ed</h3>
        <p className="text-[var(--muted)] mb-4">Access approved courses for your license renewal.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Coming Soon</span>
      </div>
    </div>
  </div>
);

const GetLicensed = () => {
  const steps = [
    {
      title: "1. Becoming an Insurance Producer",
      desc: "Role overview and state requirements",
      content: "A producer is the primary point of contact for clients. Requirements include being 18+ years old and completing pre-licensing education."
    },
    {
      title: "2. Fingerprints & Background Check",
      desc: "Security clearance and vendor info",
      content: "Schedule your appointment via IdentoGO. You will need your fingerprinting receipts for the final application."
    },
    {
      title: "3. Studying for the Exam",
      desc: "Access study guides and definitions",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Link to="/licensing/life" className="p-4 bg-[var(--template-bg)] border border-[var(--line)] rounded-xl hover:border-[#1d4ed8] transition-colors">
            <div className="font-bold mb-1">Life Study Guide</div>
            <div className="text-xs text-[var(--muted)]">Policy types and term definitions.</div>
          </Link>
          <Link to="/licensing/pc" className="p-4 bg-[var(--template-bg)] border border-[var(--line)] rounded-xl hover:border-[#1d4ed8] transition-colors">
            <div className="font-bold mb-1">P&C Study Guide</div>
            <div className="text-xs text-[var(--muted)]">Home and Auto insurance fundamentals.</div>
          </Link>
        </div>
      )
    },
    {
      title: "4. Applying for License",
      desc: "NIPR application and fee processing",
      content: "Apply through the NIPR website once you have your passing exam score and fingerprinting confirmation."
    },
    {
      title: "5. Your First Day",
      desc: "Onboarding and system setup",
      content: "Report to the office to set up your CRM logins and receive your agent welcome kit from the Agency Owner."
    }
  ];

  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/licensing" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to Licensing
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          New Agent Onboarding
        </span>
        <h1 className="text-3xl font-bold mb-2">Get Licensed</h1>
        <p className="text-[var(--muted)]">Follow these five steps to become a licensed producer at the agency.</p>
      </section>

      <div className="space-y-4 max-w-3xl">
        {steps.map((step, i) => (
          <div key={i} className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <button 
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)] transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
              </div>
              {openStep === i ? <ChevronUp size={20} className="text-[#1d4ed8]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
              {openStep === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--line)]">
                    <div className="p-4 bg-[var(--template-bg)] rounded-xl border-l-4 border-[#1d4ed8] text-[var(--text)]">
                      {step.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const PCHub = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <Link to="/licensing" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Back to Licensing
      </Link>
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Licensing & Education
      </span>
      <h1 className="text-3xl font-bold mb-2">Property & Casualty</h1>
      <p className="text-[var(--muted)]">Master the fundamentals of Home, Auto, and Liability insurance.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Link to="/licensing/pc/study-guide" className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 hover:border-[#1d4ed8] hover:shadow-[var(--shadow-hover)] transition-all transform hover:-translate-y-1">
        <div className="text-4xl mb-4">📖</div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1d4ed8] transition-colors">Study Guide</h3>
        <p className="text-[var(--muted)] mb-4">Deep dive into policy structures, endorsements, and the legal aspects of P&C insurance.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Slide Deck</span>
      </Link>

      <div className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 opacity-60">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-xl font-bold mb-2">Definitions</h3>
        <p className="text-[var(--muted)] mb-4">Quick reference for P&C terminology like subrogation, indemnity, and exclusions.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Coming Soon</span>
      </div>
      
      <div className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 opacity-60">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-xl font-bold mb-2">Knowledge Check</h3>
        <p className="text-[var(--muted)] mb-4">Test your mastery of P&C concepts with interactive practice questions and scenarios.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Coming Soon</span>
      </div>
    </div>
  </div>
);

const LifeHub = () => (
  <div className="space-y-10">
    <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
      <Link to="/licensing" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Back to Licensing
      </Link>
      <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
        Licensing & Education
      </span>
      <h1 className="text-3xl font-bold mb-2">Life Insurance Resources</h1>
      <p className="text-[var(--muted)]">Study materials, exam guides, and key terminology for Life licensing.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 opacity-60">
        <div className="text-4xl mb-4">📖</div>
        <h3 className="text-xl font-bold mb-2">Study Guide</h3>
        <p className="text-[var(--muted)] mb-4">Comprehensive breakdown of policy types, provisions, and state-specific regulations.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Coming Soon</span>
      </div>

      <div className="group bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8 opacity-60">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-xl font-bold mb-2">Definitions</h3>
        <p className="text-[var(--muted)] mb-4">A quick-reference glossary of essential life insurance terms and industry jargon.</p>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold px-3 py-1 rounded-full">Coming Soon</span>
      </div>
    </div>
  </div>
);

const PCStudyGuide = () => {
  const slides = [
    { img: "images/pcstudy/pcstudy00.png", alt: "Cover" },
    { img: "images/pcstudy/pcstudy01.png", alt: "Risk" },
    { img: "images/pcstudy/pcstudy02.png", alt: "DICE" },
    { img: "images/pcstudy/pcstudy03.png", alt: "Legal" },
    { img: "images/pcstudy/pcstudy04.png", alt: "Prop vs Liab" },
    { img: "images/pcstudy/pcstudy05.png", alt: "Valuation" },
    { img: "images/pcstudy/pcstudy06.png", alt: "Perils" },
    { img: "images/pcstudy/pcstudy07.png", alt: "Negligence" },
    { img: "images/pcstudy/pcstudy08.png", alt: "Defense" },
    { img: "images/pcstudy/pcstudy09.png", alt: "Residential" },
    { img: "images/pcstudy/pcstudy10.png", alt: "Commercial" },
    { img: "images/pcstudy/pcstudy11.png", alt: "Professional" },
    { img: "images/pcstudy/pcstudy12.png", alt: "Compliance" },
    { img: "images/pcstudy/pcstudy13.png", alt: "Safety Nets" },
    { img: "images/pcstudy/pcstudy14.png", alt: "Anomalies" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="space-y-10">
      <section className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <Link to="/licensing/pc" className="text-[#1d4ed8] text-sm font-bold flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft size={14} /> Back to P&C Hub
        </Link>
        <span className="inline-block bg-[var(--accent)] text-[var(--brand-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Slide Deck
        </span>
        <h1 className="text-3xl font-bold mb-2">P&C Study Guide</h1>
        <p className="text-[var(--muted)]">Interactive visual guide for the Texas Property & Casualty exam.</p>
      </section>

      <div className={`relative group ${isFullscreen ? 'fixed inset-0 z-[200] bg-black flex flex-col' : 'max-w-4xl mx-auto'}`}>
        <div className={`relative bg-black rounded-t-[var(--radius)] overflow-hidden ${isFullscreen ? 'flex-grow' : 'aspect-video shadow-2xl border border-[var(--line)]'}`}>
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              src={slides[currentIndex].img} 
              alt={slides[currentIndex].alt}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          
          {/* Overlay Controls */}
          <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={prevSlide} className="p-3 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
              <ArrowLeft size={24} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={nextSlide} className="p-3 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
              <ArrowRight size={24} />
            </button>
          </div>
        </div>

        <div className={`bg-[var(--panel)] border border-[var(--line)] border-t-0 rounded-b-[var(--radius)] px-6 py-4 flex items-center justify-between shadow-lg ${isFullscreen ? 'rounded-none border-x-0 border-b-0' : ''}`}>
          <button onClick={prevSlide} className="px-4 py-2 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-[#1d4ed8] transition-all text-sm uppercase tracking-wider">
            Prev
          </button>
          
          <div className="text-center">
            <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Slide</div>
            <div className="font-bold text-lg">{currentIndex + 1} / {slides.length}</div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-[var(--accent)] text-[#1d4ed8] rounded-lg hover:bg-[#1d4ed8] hover:text-white transition-all flex items-center gap-2 text-sm font-bold"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
            <button onClick={nextSlide} className="px-4 py-2 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-[#1d4ed8] transition-all text-sm uppercase tracking-wider">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-10">
        <Link to="/licensing/pc" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] rounded-xl font-bold hover:border-[#1d4ed8] hover:text-[#1d4ed8] transition-all shadow-sm">
          <ArrowLeft size={18} />
          Back to Property and Casualty Hub
        </Link>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState('light');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('userName');
    if (savedUser && USER_DIRECTORY[savedUser]) {
      setUser(USER_DIRECTORY[savedUser]);
    }
    
    const savedTheme = localStorage.getItem('siteTheme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    setAuthReady(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('siteTheme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  if (!authReady) return null;

  return (
    <Router>
      <Layout 
        user={user} 
        setUser={setUser} 
        theme={theme} 
        toggleTheme={toggleTheme}
      >
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/get-started" element={<GetStarted setUser={setUser} />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute user={user}><TemplatesHub /></ProtectedRoute>} />
          <Route path="/documentation" element={<ProtectedRoute user={user}><Documentation /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute user={user}><Feedback user={user} /></ProtectedRoute>} />
          <Route path="/signature" element={<ProtectedRoute user={user}><Signature user={user} /></ProtectedRoute>} />
          <Route path="/service" element={<ProtectedRoute user={user}><ServiceHub /></ProtectedRoute>} />
          <Route path="/service/templates" element={<ProtectedRoute user={user}><ServiceTemplates user={user} /></ProtectedRoute>} />
          <Route path="/service/documentation" element={<ProtectedRoute user={user}><ServiceDocumentation /></ProtectedRoute>} />
          
          <Route path="/sales" element={<ProtectedRoute user={user}><SalesHub /></ProtectedRoute>} />
          <Route path="/sales/templates" element={<ProtectedRoute user={user}><SalesTemplates /></ProtectedRoute>} />
          <Route path="/sales/templates/internet-leads" element={<ProtectedRoute user={user}><InternetLeads user={user} /></ProtectedRoute>} />
          <Route path="/sales/templates/winback" element={<ProtectedRoute user={user}><WinbackTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/templates/xdate" element={<ProtectedRoute user={user}><XDateTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/templates/quoteemails" element={<ProtectedRoute user={user}><QuoteEmailTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/templates/follow-up" element={<ProtectedRoute user={user}><FollowUpTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/templates/check-in" element={<ProtectedRoute user={user}><CheckInTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/templates/closing" element={<ProtectedRoute user={user}><ClosingTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/after-sales" element={<ProtectedRoute user={user}><AfterSalesTemplates user={user} /></ProtectedRoute>} />
          <Route path="/sales/documentation" element={<ProtectedRoute user={user}><SalesDocumentation /></ProtectedRoute>} />
          <Route path="/sales/wordtracks" element={<ProtectedRoute user={user}><WordTracks user={user} /></ProtectedRoute>} />

          <Route path="/licensing" element={<Licensing />} />
          <Route path="/licensing/get-licensed" element={<GetLicensed />} />
          <Route path="/licensing/pc" element={<PCHub />} />
          <Route path="/licensing/pc/study-guide" element={<PCStudyGuide />} />
          <Route path="/licensing/life" element={<LifeHub />} />
          <Route path="/directory" element={<ProtectedRoute user={user}><Directory /></ProtectedRoute>} />
          
          {/* Fallback for missing pages */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

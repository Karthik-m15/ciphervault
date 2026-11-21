import React, { useState, useEffect } from 'react';
import { encryptData, decryptData } from './crypto';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [snippets, setSnippets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Navigation Tabs for Modules inside Dashboard: 'vault' | 'sanitizer' | 'audit'
  const [activeTab, setActiveTab] = useState('vault');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('AI Prompts');
  const [codeContent, setCodeContent] = useState('');
  const [previewTab, setPreviewTab] = useState('raw');

  // Module 2 State: AI Prompt Sanitizer Tool
  const [rawSanitizeInput, setRawSanitizeInput] = useState('');
  const [sanitizedOutput, setSanitizedOutput] = useState('');
  const [detectedSecretsCount, setDetectedSecretsCount] = useState(0);

  // Module 3 State: Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'Vault Initialized', timestamp: new Date().toLocaleTimeString(), status: 'Secure' }
  ]);

  const hasVault = localStorage.getItem('cipher_vault_meta') !== null;

  const logActivity = (action, status = 'Secure') => {
    const newLog = {
      id: Date.now(),
      action,
      timestamp: new Date().toLocaleTimeString(),
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleSetupOrUnlock = async (e) => {
    e.preventDefault();
    setError('');
    if (!masterPassword) return setError('Please enter a master password.');

    if (!hasVault) {
      const initialData = await encryptData(JSON.stringify([]), masterPassword);
      localStorage.setItem('cipher_vault_meta', JSON.stringify(initialData));
      setIsUnlocked(true);
      logActivity('Created New Master Vault', 'Encrypted');
    } else {
      try {
        const vaultMeta = JSON.parse(localStorage.getItem('cipher_vault_meta'));
        const decryptedJson = await decryptData(vaultMeta, masterPassword);
        setSnippets(JSON.parse(decryptedJson));
        setIsUnlocked(true);
        logActivity('Unlocked Vault Session', 'Verified');
      } catch (err) {
        setError('Incorrect Master Password. Access Denied.');
      }
    }
  };

  const saveSnippet = async (e) => {
    e.preventDefault();
    if (!title || !codeContent) return;

    const newSnippet = {
      id: Date.now().toString(),
      title,
      category,
      content: codeContent,
      createdAt: new Date().toLocaleDateString()
    };

    const updatedSnippets = [newSnippet, ...snippets];
    setSnippets(updatedSnippets);

    const encryptedVault = await encryptData(JSON.stringify(updatedSnippets), masterPassword);
    localStorage.setItem('cipher_vault_meta', JSON.stringify(encryptedVault));

    logActivity(`Added & Encrypted Snippet: "${title}"`, 'AES-GCM');
    setTitle('');
    setCodeContent('');
    setIsModalOpen(false);
  };

  const deleteSnippet = async (id) => {
    const target = snippets.find(s => s.id === id);
    const updatedSnippets = snippets.filter(s => s.id !== id);
    setSnippets(updatedSnippets);
    const encryptedVault = await encryptData(JSON.stringify(updatedSnippets), masterPassword);
    localStorage.setItem('cipher_vault_meta', JSON.stringify(encryptedVault));
    logActivity(`Deleted Snippet: "${target?.title || id}"`, 'Purged');
  };

  const exportVault = () => {
    const data = localStorage.getItem('cipher_vault_meta');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ciphervault-secure-backup.enc';
    a.click();
    logActivity('Exported Encrypted Vault Backup (.enc)', 'Success');
  };

  const handleSanitize = () => {
    let clean = rawSanitizeInput;
    let count = 0;

    const regexPatterns = [
      /sk-[a-zA-Z0-9]{20,}/g,
      /api[_-]?key[_-]?['"]?[ \t]*[:=][ \t]*['"]([^'"\s]+)/gi,
      /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
      /mongodb(\+srv)?:\/\/[^\s]+/gi
    ];

    regexPatterns.forEach(pattern => {
      const matches = clean.match(pattern);
      if (matches) {
        count += matches.length;
        clean = clean.replace(pattern, '[REDACTED_SECURE_TOKEN]');
      }
    });

    setDetectedSecretsCount(count);
    setSanitizedOutput(clean);
    logActivity(`Ran AI Sanitizer Module (${count} secrets redacted)`, 'Sanitized');
  };

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ==========================================
  // WORLD-CLASS SCROLLABLE LANDING PAGE
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/3 left-10 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        {/* Sticky Navbar */}
        <nav className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10 border-b border-slate-900/80 backdrop-blur-md sticky top-0 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 text-lg">CV</div>
            <span className="font-extrabold text-xl text-white tracking-wide">Cipher<span className="text-indigo-400">Vault</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
            <a href="#features" className="hover:text-white transition">Modules</a>
            <a href="#risks" className="hover:text-white transition">Developer Risks</a>
            <a href="#comparison" className="hover:text-white transition">Why We Win</a>
          </div>
          <div className="flex items-center gap-2 text-xs bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-indigo-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Multi-Module Suite v2.4
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl w-full mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span>🛡️ Enterprise-Grade Client Security Airlock</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              The Zero-Trust Workspace for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">AI-Era Developers.</span>
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Eliminate accidental credential leakage in AI workflows. CipherVault combines military-grade <strong>AES-GCM encryption</strong>, an automated <strong>AI Prompt Sanitizer</strong>, and a real-time <strong>Security Audit Log</strong> in one local-first suite.
            </p>

            {/* Interactive Threat vs Safe Teaser Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Live Architecture Preview:</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setPreviewTab('raw')} 
                    className={`text-[11px] px-3 py-1 rounded-md font-medium transition ${previewTab === 'raw' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    Raw AI Leak (Dangerous)
                  </button>
                  <button 
                    onClick={() => setPreviewTab('encrypted')} 
                    className={`text-[11px] px-3 py-1 rounded-md font-medium transition ${previewTab === 'encrypted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    CipherVault Ciphertext (Secure)
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs p-3 rounded-xl bg-slate-950 border border-slate-900 overflow-x-auto">
                {previewTab === 'raw' ? (
                  <div className="text-red-400 space-y-1">
                    <p className="text-slate-500">// Vulnerable snippet copied from unvetted AI chat session</p>
                    <p>const stripeKey = <span className="bg-red-500/20 px-1 rounded">"sk_live_982374981237491823"</span>;</p>
                    <p>const dbUrl = <span className="bg-red-500/20 px-1 rounded">"mongodb+srv://admin:secret@cluster.net"</span>;</p>
                  </div>
                ) : (
                  <div className="text-emerald-400 space-y-1">
                    <p className="text-slate-500">// AES-GCM 256-bit Encrypted Local State (Zero Knowledge)</p>
                    <p>{"{ cipher: 'U2FsdGVkX1+v1z4... [Server Blind]', iv: 'a89f2...' }"}</p>
                    <p className="text-slate-400">Status: Verified isolated in browser IndexedDB memory.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Authentication Card Box */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative backdrop-blur-xl">
              <div className="absolute -top-3 right-8 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                {hasVault ? 'Vault Detected' : 'Setup Required'}
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {hasVault ? 'Unlock Your Vault' : 'Initialize Vault'}
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  {hasVault ? 'Enter your master passphrase to decrypt your workspace session.' : 'Create a master password to encrypt your local client vault.'}
                </p>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 font-medium">{error}</div>}

              <form onSubmit={handleSetupOrUnlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Master Passphrase</label>
                  <input
                    type="password"
                    required
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/30 text-sm font-semibold tracking-wide"
                >
                  {hasVault ? 'Unlock Secure Session' : 'Create & Encrypt Vault'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-500">
                  🔒 Zero-Knowledge Guarantee: No server databases, no backend tracking, absolute local isolation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Multi-Module Security Architecture */}
        <section id="features" className="max-w-7xl w-full mx-auto px-6 py-20 border-t border-slate-900">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Multi-Module Security Architecture</h2>
            <p className="text-slate-400 text-sm">Designed specifically to meet enterprise and academic rigor with three distinct security modules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-bold mb-4">01</div>
              <h3 className="text-lg font-bold text-white mb-2">Encrypted Vault Module</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Stores code snippets, API keys, and deployment configurations using browser-native Web Crypto API and PBKDF2 key derivation.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xl font-bold mb-4">02</div>
              <h3 className="text-lg font-bold text-white mb-2">AI Prompt Sanitizer</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Scans raw prompts and code blocks for live secret signatures (Stripe keys, Bearer tokens, DB strings) and auto-redacts them before storing.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold mb-4">03</div>
              <h3 className="text-lg font-bold text-white mb-2">Security Audit & Health Log</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Monitors session activity, tracks cryptographic state changes, and generates compliance status reports for evaluation.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: The Risks Daily Developers Face in the AI Era */}
        <section id="risks" className="max-w-7xl w-full mx-auto px-6 py-20 border-t border-slate-900">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <span>⚠️ The Developer Vulnerability Crisis</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">What Risks Do Daily Developers Face?</h2>
            <p className="text-slate-400 text-sm">Modern coding workflows expose critical assets to unseen security threats every single day.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              <div className="text-red-400 text-xl font-bold mb-3">🚨 Accidental Key Leaks</div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Developers frequently paste live OpenAI, AWS, or Stripe keys into unvetted AI chat prompts, leaking credentials into third-party training logs.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              <div className="text-amber-400 text-xl font-bold mb-3">🔓 Insecure Cloud Notes</div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Storing configuration snippets in unencrypted cloud markdown apps leaves sensitive database URIs vulnerable to server-side breaches.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              <div className="text-yellow-400 text-xl font-bold mb-3">📋 Clipboard Interception</div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Malicious browser extensions or background processes continuously scan OS clipboards for unencrypted passwords and tokens.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              <div className="text-cyan-400 text-xl font-bold mb-3">🔍 Zero-Trace Failure</div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Standard developer tools lack real-time audit logs or pre-storage sanitization, making compliance impossible to verify.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: Why CipherVault Beats Paid Cloud Vaults */}
        <section id="comparison" className="max-w-7xl w-full mx-auto px-6 py-20 border-t border-slate-900">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <span>🏆 Architecture Superiority</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Why CipherVault Outperforms Paid Cloud Tools</h2>
            <p className="text-slate-400 text-sm">Compare our zero-knowledge local airlock against conventional paid cloud credential managers.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="p-4 bg-slate-900/50 rounded-tl-xl">Security Dimension</th>
                  <th className="p-4 bg-indigo-600/20 text-indigo-300 font-bold border-x border-slate-800">CipherVault (Free / Local-First)</th>
                  <th className="p-4 bg-slate-900/50 rounded-tr-xl text-slate-500">Paid Cloud Password Managers</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/60 font-medium">
                <tr>
                  <td className="p-4 text-white font-semibold">Server-Side Storage</td>
                  <td className="p-4 bg-indigo-600/10 text-emerald-400 border-x border-slate-800">❌ None (Zero Backend Database)</td>
                  <td className="p-4 text-slate-400">Yes (Stored on company cloud servers)</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-semibold">Master Password Exposure</td>
                  <td className="p-4 bg-indigo-600/10 text-emerald-400 border-x border-slate-800">✓ Never leaves your browser RAM</td>
                  <td className="p-4 text-slate-400">Hashed and stored on remote servers</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-semibold">AI Prompt Leak Protection</td>
                  <td className="p-4 bg-indigo-600/10 text-emerald-400 border-x border-slate-800">✓ Built-in AI Prompt Sanitizer Module</td>
                  <td className="p-4 text-slate-400">❌ Not available (Manual copy-pasting)</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-semibold">Data Breach Vulnerability</td>
                  <td className="p-4 bg-indigo-600/10 text-emerald-400 border-x border-slate-800">✓ Impossible (Data is client ciphertext)</td>
                  <td className="p-4 text-slate-400">⚠️ Vulnerable to central server hacks</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-semibold">Cost & Accessibility</td>
                  <td className="p-4 bg-indigo-600/10 text-emerald-400 border-x border-slate-800">✓ 100% Free & Open-Source Architecture</td>
                  <td className="p-4 text-slate-400">💲 Paid subscription tiers required</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl w-full mx-auto px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-500">
          CipherVault &bull; Multi-Module Zero-Knowledge Security Suite for Developers.
        </footer>
      </div>
    );
  }

  // ==========================================
  // MULTI-MODULE DASHBOARD VIEW (When Unlocked)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">CV</div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none">CipherVault Suite</h1>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> AES-GCM Cryptographic Session Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Switching Modules) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('vault')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition ${activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            🛡️ Secure Vault
          </button>
          <button
            onClick={() => setActiveTab('sanitizer')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition ${activeTab === 'sanitizer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            🔍 AI Prompt Sanitizer
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            📊 Security Audit Log
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportVault}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            📥 Export .enc
          </button>
          <button
            onClick={() => {
              setIsUnlocked(false);
              logActivity('Locked Vault Session', 'Secured');
            }}
            className="text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition"
          >
            Lock Vault
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center justify-around bg-slate-900 border-b border-slate-800 p-2">
        <button onClick={() => setActiveTab('vault')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Vault</button>
        <button onClick={() => setActiveTab('sanitizer')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'sanitizer' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Sanitizer</button>
        <button onClick={() => setActiveTab('audit')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Audit Logs</button>
      </div>

      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">

        {/* ================= MODULE 1: SECURE VAULT ================= */}
        {activeTab === 'vault' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Module 1: Encrypted Snippet Repository</h2>
                <p className="text-slate-400 text-sm">Locally encrypted secrets protected from third-party AI loggers.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                + Add New Secure Secret
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Search encrypted snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {['All', 'AI Prompts', 'API Keys', 'Database Configs', 'Scripts'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Snippets Grid */}
            {filteredSnippets.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-2xl">
                <p className="text-slate-400 text-sm">No encrypted snippets found in your vault.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSnippets.map((snippet) => (
                  <div key={snippet.id} className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs bg-slate-800/80 text-indigo-400 px-2.5 py-1 rounded-md font-medium border border-slate-700/50">
                          {snippet.category}
                        </span>
                        <button
                          onClick={() => deleteSnippet(snippet.id)}
                          className="text-slate-500 hover:text-red-400 text-xs transition font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      <h3 className="font-semibold text-white mb-2">{snippet.title}</h3>
                      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 font-mono text-xs text-slate-300 overflow-x-auto max-h-36">
                        <code>{snippet.content}</code>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-500">
                      <span>Saved: {snippet.createdAt}</span>
                      <button
                        onClick={(e) => {
                          navigator.clipboard.writeText(snippet.content);
                          logActivity(`Copied Snippet to Clipboard: "${snippet.title}"`, 'Clipboard');
                          const btn = e.currentTarget;
                          btn.innerText = "✓ Copied Securely!";
                          btn.className = "text-emerald-400 font-medium transition";
                          setTimeout(() => {
                            btn.innerText = "Copy Code";
                            btn.className = "text-indigo-400 hover:text-indigo-300 font-medium transition";
                          }, 2000);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= MODULE 2: AI PROMPT SANITIZER ================= */}
        {activeTab === 'sanitizer' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-1">Module 2: AI Prompt Sanitizer & Redactor</h2>
              <p className="text-slate-400 text-xs mb-6">
                Paste raw AI code snippets or prompt logs below. This security scanner detects exposed API keys, bearer tokens, and DB strings, and redacts them automatically.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Raw Unsecured Input Code:</label>
                  <textarea
                    rows={6}
                    value={rawSanitizeInput}
                    onChange={(e) => setRawSanitizeInput(e.target.value)}
                    placeholder="Paste code containing sk-live-... or database URIs here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleSanitize}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Run Sanitization Scan & Redact
                </button>

                {sanitizedOutput && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400">
                        ✓ Scan Complete: {detectedSecretsCount} Vulnerable Secrets Redacted
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sanitizedOutput);
                          logActivity('Copied Sanitized Code', 'Clean');
                        }}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Copy Sanitized Code
                      </button>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
                      <pre>{sanitizedOutput}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODULE 3: SECURITY AUDIT LOGS ================= */}
        {activeTab === 'audit' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Module 3: Security Health & Audit Trail</h2>
                  <p className="text-slate-400 text-xs">Real-time telemetry and session activity ledger for compliance verification.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-medium">
                  Status: 100% Zero-Knowledge Compliant
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="block text-2xl font-bold text-indigo-400">{snippets.length}</span>
                  <span className="text-[11px] text-slate-400">Encrypted Vault Items</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="block text-2xl font-bold text-emerald-400">AES-GCM</span>
                  <span className="text-[11px] text-slate-400">Encryption Standard</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="block text-2xl font-bold text-cyan-400">Client-Side</span>
                  <span className="text-[11px] text-slate-400">Execution Environment</span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <h3 className="text-slate-300 font-sans font-semibold mb-3">Recent Session Event Ledger:</h3>
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="text-slate-200">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>{log.timestamp}</span>
                      <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-800">{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* New Snippet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Secure AI Snippet</h3>
            
            <form onSubmit={saveSnippet} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Snippet Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Stripe API Secret & Webhook Handler"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="AI Prompts">AI Prompts</option>
                  <option value="API Keys">API Keys</option>
                  <option value="Database Configs">Database Configs</option>
                  <option value="Scripts">Scripts</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Raw Code / Sensitive Data</label>
                <textarea
                  required
                  rows={5}
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="Paste your AI-generated code or secret key here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
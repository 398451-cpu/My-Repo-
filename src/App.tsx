import React, { useState } from 'react';
import {
  FolderGit2,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Terminal,
  Eye,
  Edit3,
  GitBranch,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'edit'>('preview');
  const [readmeContent, setReadmeContent] = useState<string>(
    '# My-Repo-\n\nWelcome to **My-Repo-**, imported from GitHub (`398451-cpu/My-Repo-`).\n\nThis application has been migrated to Google AI Studio with Node.js 22, Vite, and React.'
  );

  const repoName = '398451-cpu/My-Repo-';
  const cloneUrl = 'https://github.com/398451-cpu/My-Repo-.git';

  const copyCloneCmd = () => {
    navigator.clipboard.writeText(`git clone ${cloneUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 antialiased flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Repository</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                {repoName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              id="github-link-btn"
              href={`https://github.com/${repoName}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <button
              id="copy-clone-btn"
              onClick={copyCloneCmd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Clone'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Status / Overview Banner */}
        <div id="repo-status-card" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-slate-900">Successfully Migrated</p>
                <p className="text-xs text-slate-500">Configured for AI Studio web runtime</p>
              </div>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-4 flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Branch & Engine</p>
                <p className="text-sm font-semibold text-slate-900">main / Vite + React</p>
                <p className="text-xs text-slate-500">Port 3000 (0.0.0.0)</p>
              </div>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-4 flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Environment</p>
                <p className="text-sm font-semibold text-slate-900">Node.js 22 Runtime</p>
                <p className="text-xs text-slate-500">Clean SPA build ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout: File Tree & Readme Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer Card */}
          <div id="file-explorer-card" className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Files</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">1 item</span>
            </div>

            <div className="space-y-1">
              <button
                id="file-item-readme"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-900 border border-slate-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>README.md</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Root</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-2">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Quick Commands</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="text-slate-500"># Start dev server</div>
                <div className="text-emerald-400">npm run dev</div>
                <div className="text-slate-500 pt-1"># Production build</div>
                <div className="text-emerald-400">npm run build</div>
              </div>
            </div>
          </div>

          {/* Document / Readme Viewer Card */}
          <div id="readme-viewer-card" className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            {/* Header / Tabs */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">README.md</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">Markdown</span>
              </div>

              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium">
                <button
                  id="tab-preview-btn"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  id="tab-edit-btn"
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'edit'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  id="tab-raw-btn"
                  onClick={() => setActiveTab('raw')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'raw'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1">
              {activeTab === 'preview' && (
                <div id="readme-preview-content" className="space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My-Repo-</h2>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ready
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Welcome to <strong className="text-slate-900">My-Repo-</strong>, imported from GitHub (
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono">
                      398451-cpu/My-Repo-
                    </code>
                    ).
                  </p>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-xs text-slate-600 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Info className="w-4 h-4 text-indigo-600" />
                      <span>Repository Details</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
                      <li>Source Repository: <span className="font-mono text-slate-800">398451-cpu/My-Repo-</span></li>
                      <li>Environment: <span className="text-slate-800 font-medium">Node.js 22 (Express / Vite SPA)</span></li>
                      <li>Listening Port: <span className="font-mono text-slate-800">3000 (0.0.0.0)</span></li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'edit' && (
                <div id="readme-edit-area" className="flex flex-col h-full space-y-3">
                  <p className="text-xs text-slate-500">Edit your README markdown in real-time:</p>
                  <textarea
                    id="readme-textarea"
                    value={readmeContent}
                    onChange={(e) => setReadmeContent(e.target.value)}
                    className="w-full h-64 p-3.5 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-y"
                    placeholder="Enter markdown..."
                  />
                </div>
              )}

              {activeTab === 'raw' && (
                <div id="readme-raw-area">
                  <pre className="p-4 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {readmeContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

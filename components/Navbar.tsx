'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  SlidersHorizontal, 
  Workflow, 
  Radio,
  ChevronRight,
  ChevronDown,
  Check,
  Upload
} from 'lucide-react';
import { DocumentRecord } from '@/lib/types/idp';

export type ActiveTab = 
  | 'WORKBENCH' 
  | 'REVIEW_QUEUE' 
  | 'BATCH_INGEST' 
  | 'RULE_ENGINE' 
  | 'API_WEBHOOKS';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingReviewCount: number;
  exceptionCount: number;
  currentDocument?: DocumentRecord;
  documents?: DocumentRecord[];
  onSelectDocument?: (id: string) => void;
  onOpenUploadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  pendingReviewCount,
  exceptionCount,
  currentDocument,
  documents = [],
  onSelectDocument,
  onOpenUploadModal
}) => {
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDocDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format document category for breadcrumbs
  const getDocumentCategory = (type?: string) => {
    switch (type) {
      case 'INVOICE': return 'Invoices';
      case 'PURCHASE_ORDER': return 'Purchase Orders';
      case 'LEGAL_CONTRACT': return 'Contracts';
      case 'TAX_FORM_W2': return 'Tax Forms';
      case 'MEDICAL_INTAKE': return 'Medical Intake';
      case 'IDENTITY_DOCUMENT': return 'Identities';
      default: return 'Documents';
    }
  };

  const categoryName = getDocumentCategory(currentDocument?.documentType);
  const fileName = currentDocument?.fileName || 'Acronis_Cloud_Invoice_INV-8920.pdf';

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-13 gap-4">
          
          {/* Left: Minimal App Identifier & Live Pipeline Status Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onTabChange('WORKBENCH')}
              className="flex items-center gap-2 text-left focus:outline-none group"
            >
              {/* Minimal geometric symbol */}
              <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-mono font-bold text-xs tracking-tighter group-hover:bg-white transition">
                CX
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition">
                CortexIDP
              </span>
            </button>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-zinc-800" />

            {/* Subtle dot status indicator "Live Pipeline" */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Live Pipeline</span>
            </div>
          </div>

          {/* Center: Breadcrumb Navigation */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <button 
              onClick={() => onTabChange('WORKBENCH')}
              className="hover:text-zinc-200 transition"
            >
              Document Studio
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            
            <span className="text-zinc-400">{categoryName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

            {/* Active Document Dropdown Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDocDropdownOpen(!docDropdownOpen)}
                className="flex items-center gap-1.5 text-zinc-100 font-mono hover:text-white bg-zinc-900/60 hover:bg-zinc-800/60 px-2 py-1 rounded border border-zinc-800 transition max-w-[260px] truncate"
              >
                <span className="truncate">{fileName}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
              </button>

              {docDropdownOpen && documents.length > 0 && (
                <div className="absolute left-0 mt-1.5 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-zinc-800/80 flex items-center justify-between">
                    <span>Loaded Documents ({documents.length})</span>
                    {onOpenUploadModal && (
                      <button
                        onClick={() => {
                          setDocDropdownOpen(false);
                          onOpenUploadModal();
                        }}
                        className="text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {documents.map(doc => {
                      const isCurrent = doc.id === currentDocument?.id;
                      const isApproved = doc.status === 'AUTO_APPROVED' || doc.status === 'MANUALLY_APPROVED';
                      const isErr = doc.status === 'EXCEPTION_FLAGGED' || doc.status === 'OCR_QUALITY_FAILED';

                      return (
                        <button
                          key={doc.id}
                          onClick={() => {
                            if (onSelectDocument) onSelectDocument(doc.id);
                            onTabChange('WORKBENCH');
                            setDocDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-zinc-800/70 transition ${
                            isCurrent ? 'bg-zinc-800/50 text-white font-medium' : 'text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isErr ? 'bg-rose-500' : isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            <span className="truncate font-mono text-[11px]">{doc.fileName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {Math.round(doc.overallConfidence * 100)}%
                            </span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: View Switchers, Environment Badge & User Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Minimal Nav Links / View Toggles */}
            <nav className="hidden md:flex items-center gap-1 text-xs">
              <button
                onClick={() => onTabChange('WORKBENCH')}
                className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                  activeTab === 'WORKBENCH'
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                Studio
              </button>

              <button
                onClick={() => onTabChange('REVIEW_QUEUE')}
                className={`px-2.5 py-1 rounded transition text-xs font-medium flex items-center gap-1.5 ${
                  activeTab === 'REVIEW_QUEUE'
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <span>Queue</span>
                {(pendingReviewCount > 0 || exceptionCount > 0) && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {pendingReviewCount + exceptionCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('BATCH_INGEST')}
                className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                  activeTab === 'BATCH_INGEST'
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                Ingest
              </button>

              <button
                onClick={() => onTabChange('RULE_ENGINE')}
                className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                  activeTab === 'RULE_ENGINE'
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                Rules
              </button>

              <button
                onClick={() => onTabChange('API_WEBHOOKS')}
                className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                  activeTab === 'API_WEBHOOKS'
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                API
              </button>
            </nav>

            {/* Subtle Divider */}
            <div className="hidden md:block h-4 w-px bg-zinc-800" />

            {/* Environment Badge */}
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 tracking-tight">
              PRODUCTION
            </span>

            {/* Clean User Avatar */}
            <div 
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 flex items-center justify-center text-xs font-medium text-zinc-200 cursor-pointer transition select-none"
              title="Signed in as ops-lead@cortex.ai"
            >
              OP
            </div>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-zinc-800/60 scrollbar-none text-xs">
          <button
            onClick={() => onTabChange('WORKBENCH')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'WORKBENCH' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => onTabChange('REVIEW_QUEUE')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'REVIEW_QUEUE' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            Queue ({pendingReviewCount + exceptionCount})
          </button>
          <button
            onClick={() => onTabChange('BATCH_INGEST')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'BATCH_INGEST' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            Ingest
          </button>
          <button
            onClick={() => onTabChange('RULE_ENGINE')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'RULE_ENGINE' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => onTabChange('API_WEBHOOKS')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'API_WEBHOOKS' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            API
          </button>
        </div>

      </div>
    </header>
  );
};

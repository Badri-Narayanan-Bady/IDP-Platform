'use client';

import React, { useState, useRef } from 'react';
import { Navbar, ActiveTab } from '@/components/Navbar';
import { MetricsBar } from '@/components/MetricsBar';
import { DocumentWorkbench } from '@/components/DocumentWorkbench';
import { HumanReviewQueue } from '@/components/HumanReviewQueue';
import { BatchProcessor } from '@/components/BatchProcessor';
import { SchemaRuleManager } from '@/components/SchemaRuleManager';
import { DeveloperHub } from '@/components/DeveloperHub';
import { SAMPLE_DOCUMENTS } from '@/lib/data/sample-documents';
import { DocumentRecord, DocumentType } from '@/lib/types/idp';
import { DOCUMENT_SCHEMAS } from '@/lib/schemas/registry';
import { 
  Upload, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Plus
} from 'lucide-react';

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>(SAMPLE_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string>(SAMPLE_DOCUMENTS[0].id);
  const [activeTab, setActiveTab] = useState<ActiveTab>('WORKBENCH');
  
  // Quick Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [uploadText, setUploadText] = useState<string>('');
  const [uploadSchema, setUploadSchema] = useState<DocumentType | 'AUTO'>('AUTO');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currently active selected document
  const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  // Update a document in the collection
  const handleUpdateDocument = (updatedDoc: DocumentRecord) => {
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
  };

  // When a newly processed document arrives
  const handleDocumentProcessed = (newDoc: DocumentRecord) => {
    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
    setActiveTab('WORKBENCH');
    setUploadNotice(`Now viewing: "${newDoc.fileName}". Grounding polygons & extracted entities are ready.`);
  };

  // Quick Ingest Handler from Modal
  const handleProcessUpload = async (bypassGating = false) => {
    if (!uploadFile && !uploadText.trim()) {
      setUploadError('Please select a document file (PDF, PNG, JPG, TXT) or paste text content.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/idp/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadText.trim() || undefined,
          imageBase64: uploadFile?.base64 || undefined,
          mimeType: uploadFile?.mimeType || 'text/plain',
          fileName: uploadFile?.name || `Document_${new Date().toISOString().substring(0, 10)}.txt`,
          documentTypeHint: uploadSchema !== 'AUTO' ? uploadSchema : undefined,
          forceOverride: bypassGating,
        }),
      });

      const data = await response.json();

      if (response.status === 422 && data.status === 'OCR_QUALITY_FAILED') {
        setUploadError(`OCR Quality Gating Failed: ${data.ocrQualityReport?.reasons?.[0] || data.error}. Discarded early before pipeline.`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to process document');
      }

      const docResult: DocumentRecord = data;
      handleDocumentProcessed(docResult);
      
      // Reset modal state
      setUploadFile(null);
      setUploadText('');
      setIsUploadModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failure';
      setUploadError(`Ingestion Error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadFile({
        name: file.name,
        base64: reader.result as string,
        mimeType: file.type || 'application/pdf',
      });
    };
    reader.readAsDataURL(file);

    if (file.type.startsWith('text/') || /\.(txt|json|csv|log)$/i.test(file.name)) {
      const textReader = new FileReader();
      textReader.onload = () => {
        if (typeof textReader.result === 'string') {
          setUploadText(textReader.result);
        }
      };
      textReader.readAsText(file);
    }
  };

  // Bulk Approve in Review Queue
  const handleBulkApprove = (docIds: string[]) => {
    setDocuments(prev => prev.map(d => {
      if (docIds.includes(d.id)) {
        return {
          ...d,
          status: 'MANUALLY_APPROVED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Staff Bulk Approver',
          webhookStatus: 'DELIVERED',
          webhookDestination: 'SAP S/4HANA (Batch Sync)',
          auditTrail: [
            ...d.auditTrail,
            {
              id: `aud-${Date.now()}-${d.id}`,
              timestamp: new Date().toISOString(),
              actor: 'Human Reviewer (Bulk Batch)',
              action: 'APPROVED' as const,
              notes: 'Bulk approved via Review Queue.'
            }
          ]
        };
      }
      return d;
    }));
  };

  // Next document in queue
  const handleNextDocument = () => {
    const currentIndex = documents.findIndex(d => d.id === selectedDocId);
    if (currentIndex >= 0 && currentIndex < documents.length - 1) {
      setSelectedDocId(documents[currentIndex + 1].id);
    } else {
      setSelectedDocId(documents[0].id);
    }
  };

  // Counts for Review Queue badge
  const pendingReviewCount = documents.filter(d => d.status === 'NEEDS_REVIEW').length;
  const exceptionCount = documents.filter(d => d.status === 'EXCEPTION_FLAGGED').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        pendingReviewCount={pendingReviewCount}
        exceptionCount={exceptionCount}
        currentDocument={activeDoc}
        documents={documents}
        onSelectDocument={setSelectedDocId}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4">
        
        {/* Top Operational Metrics Bar */}
        <MetricsBar documents={documents} />

        {/* Upload Success Notice */}
        {uploadNotice && (
          <div className="mb-3 p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
            <button
              onClick={() => setUploadNotice(null)}
              className="text-xs text-zinc-400 hover:text-white font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Split-Screen Document Workbench */}
        {activeTab === 'WORKBENCH' && (
          <div className="space-y-3">
            
            {/* Quick document switcher strip with prominent Upload Button */}
            <div className="flex items-center justify-between gap-3 bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/80">
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
                <span className="text-[11px] font-mono text-zinc-500 pl-1 shrink-0 uppercase tracking-wider">Docs:</span>
                {documents.map(d => {
                  const isCurrent = d.id === activeDoc?.id;
                  const isError = d.status === 'EXCEPTION_FLAGGED' || d.status === 'OCR_QUALITY_FAILED';
                  const isApproved = d.status === 'AUTO_APPROVED' || d.status === 'MANUALLY_APPROVED';

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDocId(d.id)}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                          : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isError ? 'bg-rose-500' : isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="truncate max-w-[160px]">{d.fileName}</span>
                      <span className="text-[10px] text-zinc-500">
                        {Math.round(d.overallConfidence * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Upload Document CTA Button */}
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium shrink-0 transition"
                title="Upload a new document (PDF, PNG, JPG, or Text)"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Upload</span>
              </button>

            </div>

            {/* Document Workbench Component */}
            {activeDoc ? (
              <DocumentWorkbench
                document={activeDoc}
                onUpdateDocument={handleUpdateDocument}
                onNextDocument={handleNextDocument}
              />
            ) : (
              <div className="p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800">
                No active document selected.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Human Review Queue (HITL) */}
        {activeTab === 'REVIEW_QUEUE' && (
          <HumanReviewQueue
            documents={documents}
            onSelectDocument={doc => {
              setSelectedDocId(doc.id);
              setActiveTab('WORKBENCH');
            }}
            onBulkApprove={handleBulkApprove}
          />
        )}

        {/* Tab 3: Batch Ingestion & Processing Lab */}
        {activeTab === 'BATCH_INGEST' && (
          <BatchProcessor
            onDocumentProcessed={handleDocumentProcessed}
            onNavigateToStudio={doc => {
              setSelectedDocId(doc.id);
              setActiveTab('WORKBENCH');
            }}
          />
        )}

        {/* Tab 4: Schema & Rule Engine */}
        {activeTab === 'RULE_ENGINE' && (
          <SchemaRuleManager />
        )}

        {/* Tab 5: Developer API Hub & Webhooks */}
        {activeTab === 'API_WEBHOOKS' && (
          <DeveloperHub documents={documents} />
        )}

      </main>

      {/* Quick Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in duration-100">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Upload Document for Processing</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Target Schema Selector */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="text-zinc-400 font-medium">Target Schema:</label>
              <select
                value={uploadSchema}
                onChange={e => setUploadSchema(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                <option value="AUTO">Zero-Shot Autonomous Classification</option>
                {Object.values(DOCUMENT_SCHEMAS).map(s => (
                  <option key={s.type} value={s.type}>{s.displayName}</option>
                ))}
              </select>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                uploadFile
                  ? 'border-emerald-500/80 bg-emerald-500/5'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.json,.csv"
                onChange={handleModalFileSelect}
                className="hidden"
              />
              
              {uploadFile ? (
                <div className="space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-100 font-mono">{uploadFile.name}</div>
                  <div className="text-[11px] text-emerald-400 font-mono">File staged for pipeline extraction</div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setUploadFile(null);
                    }}
                    className="text-xs text-rose-400 hover:underline mt-1"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload className="w-6 h-6 text-zinc-500 mx-auto" />
                  <div className="text-xs text-zinc-300 font-medium">
                    Click to select file or drag &amp; drop
                  </div>
                  <p className="text-[11px] text-zinc-500">PDF, PNG, JPG, or TXT</p>
                </div>
              )}
            </div>

            {/* Paste OCR Stream Alternative */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Or Paste Raw OCR / Text:</label>
              <textarea
                rows={3}
                value={uploadText}
                onChange={e => setUploadText(e.target.value)}
                placeholder="Paste OCR text stream, billing slip, or contract text..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleProcessUpload()}
                disabled={isUploading || (!uploadFile && !uploadText.trim())}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Run Pipeline</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Clean Minimal Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-3 text-xs text-zinc-500">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <div suppressHydrationWarning>CortexIDP &copy; {new Date().getFullYear()} &bull; Intelligent Document Processing</div>
          <div className="text-zinc-600">
            Pipeline v2.4 • Active
          </div>
        </div>
      </footer>

    </div>
  );
}

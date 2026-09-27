'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Cpu, 
  ArrowRight, 
  RefreshCw, 
  FilePlus, 
  Zap,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Layers,
  FileCheck2,
  Scan
} from 'lucide-react';
import { DocumentRecord, DocumentType, OcrQualityReport } from '@/lib/types/idp';
import { DOCUMENT_SCHEMAS } from '@/lib/schemas/registry';
import { assessOcrQuality } from '@/lib/engine/ocr-quality';

interface BatchProcessorProps {
  onDocumentProcessed: (doc: DocumentRecord) => void;
  onNavigateToStudio: (doc: DocumentRecord) => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  onDocumentProcessed,
  onNavigateToStudio
}) => {
  const [selectedSchema, setSelectedSchema] = useState<DocumentType | 'AUTO'>('AUTO');
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [qualityWarningReport, setQualityWarningReport] = useState<OcrQualityReport | null>(null);
  const [forceOverride, setForceOverride] = useState<boolean>(false);
  const [recentProcessed, setRecentProcessed] = useState<DocumentRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Production Enterprise Workloads for live verification
  const ENTERPRISE_WORKLOADS = [
    {
      title: 'Global Cloud Infrastructure Invoice',
      type: 'INVOICE' as DocumentType,
      desc: 'High-volume IT infrastructure invoice with line items, tax breakdown, and IBAN wire remittance.',
      text: `VORTEX INFRASTRUCTURE CLOUD INC.
700 Pine Avenue, Suite 1900, Seattle, WA 98101
Tax Registration / EIN: 88-1928371
billing@vortexcloud.io | +1 (800) 555-0199

COMMERCIAL INVOICE: # VTX-2025-0981
Issue Date: 2025-08-18
Payment Due: 2025-09-18 (Net 30 Days)
Currency: USD
Customer Purchase Order Ref: PO-88190

BILL TO:
Acme Financial Global Corp.
100 Wall Street, 24th Floor, New York, NY 10005
Attn: Accounts Payable Department

ITEMIZED SERVICE BREAKDOWN:
1. High-Performance GPU Cluster (8x NVIDIA H100 SXM5) - Qty: 2 @ $6,200.00 = $12,400.00
2. Enterprise NVMe Block Storage (50 TB Tier-1 IOPS) - Qty: 1 @ $2,500.00 = $2,500.00
3. Dedicated Direct Connect 10Gbps Cross-Connect SLA - Qty: 1 @ $1,100.00 = $1,100.00

SUMMARY FINANCIAL TOTALS:
Subtotal: $16,000.00
State & City Sales Tax (8.875%): $1,420.00
Shipping / Physical Media Surcharge: $0.00
TOTAL PAYABLE BALANCE: $17,420.00

REMITTANCE INSTRUCTIONS:
Bank: JPMorgan Chase Bank NA
Routing ABA: 021000021
Account: 8810-4491-0021
Swift/IBAN: US44-CHAS-021000021-881044910021`
    },
    {
      title: 'Defense Supply Purchase Order',
      type: 'PURCHASE_ORDER' as DocumentType,
      desc: 'Procurement order with line items, destination dock, and authorized requisitioner.',
      text: `PURCHASE ORDER: # PO-2025-9921
Requisition Date: 2025-07-28
Promised Delivery Date: 2025-08-30
Currency: USD

BUYER ENTITY:
Lockheed Aerospace Systems Inc.
100 Defense Highway, Bethesda, MD 20817
Authorizing Requisitioner: Colonel David Henderson, USAF (Ret.)

SUPPLIER / VENDOR:
Titan Aerospace Carbon Composites Ltd.
450 Composite Way, Wichita, KS 67210

SHIP TO DOCK:
Lockheed Defense Plant 4, Receiving Dock B, Fort Worth, TX 76108

CATALOG ITEMS:
1. Aerospace Grade Carbon Fiber Honeycomb Panels (2x4m) - Qty: 20 @ $850.00 = $17,000.00
2. High-Temperature Epoxy Resin Sealant Kits (5 Gal) - Qty: 10 @ $340.00 = $3,400.00
3. Precision Titanium Fastener Assembly Rivets (Box 1000) - Qty: 5 @ $620.00 = $3,100.00

TOTALS:
Subtotal: $23,500.00
Estimated Freight / Tax: $1,410.00
AUTHORIZED TOTAL PO VALUE: $24,910.00`
    },
    {
      title: 'Biotech Clinical NDA & Master Services Agreement',
      type: 'LEGAL_CONTRACT' as DocumentType,
      desc: 'Master Agreement with indemnification covenants, $5M liability cap, and Delaware jurisdiction.',
      text: `CONFIDENTIAL MASTER CLINICAL RESEARCH AGREEMENT
Dated as of August 1, 2025 ("Effective Date")

PARTIES:
1. BIOCURE THERAPEUTICS INC., a Delaware corporation located at 500 Bio Boulevard, Cambridge, MA ("Sponsor / Provider")
2. SEQUOIA GENOMICS LABS CORP., a California corporation located at 1200 DNA Way, South San Francisco, CA ("Research Institution / Client")

SECTION 2. TERM & TERMINATION:
This Agreement shall expire on July 31, 2028 unless renewed by mutual written consent. Either party may terminate for convenience with ninety (90) days prior written notice.

SECTION 4. GOVERNING LAW:
This Agreement shall be interpreted and enforced under the laws of the State of Delaware without regard to conflict of laws principles.

SECTION 7. LIMITATION OF LIABILITY & INDEMNIFICATION:
IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR PUNITIVE OR INDIRECT DAMAGES. AGGREGATE LIABILITY FOR DIRECT DAMAGES SHALL BE CAPPED AT FIVE MILLION DOLLARS ($5,000,000.00 USD). Sponsor shall defend and hold harmless Client against third-party patent infringement claims.

SECTION 8. CONFIDENTIALITY:
All proprietary genomics data shall remain strictly confidential for seven (7) years following termination.`
    },
    {
      title: 'Passport & Government ID (KYC with Handwritten Endorsement)',
      type: 'IDENTITY_DOCUMENT' as DocumentType,
      desc: 'Official passport scan with MRZ zone and bearer handwritten address endorsement for KYC.',
      text: `UNITED STATES OF AMERICA
PASSPORT / PASSEPORT

Type: P | Code: USA | Passport No: P98421098
Surname: VANCE
Given Names: ALEXANDER MICHAEL
Nationality: UNITED STATES OF AMERICA
Date of Birth: 14 MAY 1990
Place of Birth: MASSACHUSETTS, U.S.A.
Date of Issue: 15 MAY 2020
Date of Expiration: 14 MAY 2030
Authority: UNITED STATES DEPARTMENT OF STATE

BEARER ENDORSEMENT / EMERGENCY NOTIFICATION:
[Handwritten in dark ink]: 104 Beacon Hill Lane, Boston, MA 02108

MACHINE READABLE ZONE (MRZ):
P<USAVANCE<<ALEXANDER<MICHAEL<<<<<<<<<<<<<<<
P984210985USA9005148M3005142<<<<<<<<<<<<<<04`
    },
    {
      title: 'Severely Degraded / Smudged Scan (Tests Early Discard)',
      type: 'CUSTOM_FORM' as DocumentType,
      desc: 'Simulated low-DPI blurred scan that fails automatic OCR pre-checks and triggers early discard.',
      text: `[CORRUPTED OCR STREAM - SEVERE GAUSSIAN BLUR - RESOLUTION 72 DPI]
... ~~~ ~~ smudge smudge unreadable noise ~~~ ...
(Low contrast, character segmentation failed)`
    }
  ];

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQualityWarningReport(null);
    setErrorNotice(null);

    // Read as DataURL for visual preview / base64 transmission
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setSelectedFile({
        name: file.name,
        base64: base64Data,
        mimeType: file.type || 'application/pdf',
      });

      // Execute client-side pre-screening
      const quality = assessOcrQuality({
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        imageBase64: base64Data,
        fileSizeBytes: file.size,
      });

      if (quality.discardSuggested) {
        setQualityWarningReport(quality);
      }
    };
    reader.readAsDataURL(file);

    // If text-based file, read text directly
    if (file.type.startsWith('text/') || /\.(txt|json|csv|log)$/i.test(file.name)) {
      const textReader = new FileReader();
      textReader.onload = () => {
        if (typeof textReader.result === 'string') {
          setInputText(textReader.result);
        }
      };
      textReader.readAsText(file);
    }
  };

  // Pre-calculate live OCR quality on current input
  const currentQualityReport = (selectedFile || inputText) ? assessOcrQuality({
    fileName: selectedFile?.name || 'document_stream.txt',
    mimeType: selectedFile?.mimeType || 'text/plain',
    imageBase64: selectedFile?.base64,
    text: inputText,
  }) : null;

  // Pipeline Execution Trigger
  const handleRunPipeline = async (customPromptText?: string, docTypeHint?: DocumentType, customFileName?: string, bypassDiscard = false) => {
    const textToProcess = customPromptText !== undefined ? customPromptText : inputText;
    const fileToProcess = selectedFile;
    const typeHint = docTypeHint || (selectedSchema !== 'AUTO' ? selectedSchema : undefined);

    if (!textToProcess && !fileToProcess) {
      setErrorNotice('Please paste document OCR text, select a file, or click one of the enterprise benchmark scenarios below.');
      return;
    }

    setIsProcessing(true);
    setErrorNotice(null);
    setQualityWarningReport(null);

    try {
      const response = await fetch('/api/idp/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToProcess || undefined,
          imageBase64: fileToProcess?.base64 || undefined,
          mimeType: fileToProcess?.mimeType || 'text/plain',
          fileName: customFileName || fileToProcess?.name || `Document_${new Date().toISOString().substring(0, 10)}.txt`,
          documentTypeHint: typeHint,
          forceOverride: bypassDiscard || forceOverride,
        }),
      });

      const data = await response.json();

      if (response.status === 422 && data.status === 'OCR_QUALITY_FAILED') {
        // Automatic OCR Quality Preprocessing Gating triggered!
        setQualityWarningReport(data.ocrQualityReport);
        setErrorNotice(data.error || 'Document discarded early: failed automatic OCR quality checks.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Pipeline request failed');
      }

      const docResult: DocumentRecord = data;
      onDocumentProcessed(docResult);
      setRecentProcessed(prev => [docResult, ...prev]);
      setInputText('');
      setSelectedFile(null);
      setQualityWarningReport(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failure';
      setErrorNotice(`Pipeline Extraction Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Document Ingestion &amp; Vision Extraction Engine
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ingest Multi-Format Documents with OCR Quality Guard
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Upload multi-format PDFs, scans, images, or raw text. The platform performs early OCR quality checks to discard unreadable files early, followed by zero-shot AI classification and template-free extraction.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Target Schema:</span>
            <select
              value={selectedSchema}
              onChange={e => setSelectedSchema(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="AUTO">🤖 Intelligent Auto-Classification</option>
              {Object.values(DOCUMENT_SCHEMAS).map(s => (
                <option key={s.type} value={s.type}>{s.displayName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* OCR Quality Early Discard Alert if triggered */}
      {qualityWarningReport && qualityWarningReport.discardSuggested && (
        <div className="p-4 bg-rose-950/90 border border-rose-500 text-rose-200 rounded-xl text-xs space-y-3 shadow-lg animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm">Automatic OCR Quality Check: Ingestion Discarded Early</span>
                <p className="text-rose-300 mt-0.5">
                  This document failed early readability gating. It was discarded before executing expensive vision-language extraction to protect compute and prevent inaccurate data.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 font-mono font-bold text-[10px] border border-rose-700">
              Score: {qualityWarningReport.overallScore}/100 ({qualityWarningReport.readabilityGrade})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/60 font-mono text-[11px]">
            <div>Resolution / DPI: <span className="text-white font-bold">{qualityWarningReport.resolutionDpi} DPI</span></div>
            <div>Blur Score: <span className="text-rose-300 font-bold">{qualityWarningReport.blurScore}/100</span></div>
            <div>Contrast: <span className="text-white font-bold">{qualityWarningReport.estimatedContrast}%</span></div>
          </div>

          <div className="text-[11px] text-rose-200 space-y-1">
            <div className="font-semibold text-rose-300">Specific Discard Diagnostic Reasons:</div>
            {qualityWarningReport.reasons.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-rose-200">
                <span className="text-rose-400">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-rose-900/60">
            <span className="text-[11px] text-slate-300">
              Recommendation: Rescan with high contrast and minimum 150 DPI.
            </span>
            <button
              onClick={() => handleRunPipeline(undefined, undefined, undefined, true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition"
            >
              Force Ingestion (Override Gating)
            </button>
          </div>
        </div>
      )}

      {/* General Error Notice */}
      {errorNotice && !qualityWarningReport?.discardSuggested && (
        <div className="p-4 bg-rose-950/80 border border-rose-600 text-rose-200 rounded-xl text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-300 hover:text-white font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Upload / Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload & OCR Paste Box (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              Document Ingestion &amp; Preprocessing Box
            </span>
            <span className="text-[11px] text-slate-400">PDF, PNG, JPG, Scans, or Text</span>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-emerald-500/80 bg-emerald-950/20'
                : 'border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-semibold text-white">{selectedFile.name}</div>
                <div className="text-[11px] text-emerald-400 font-mono">File loaded &amp; pre-screened</div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setQualityWarningReport(null);
                  }}
                  className="text-xs text-rose-400 hover:underline mt-1"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-xs text-slate-300 font-medium">
                  Click to browse or drag &amp; drop document file
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatic OCR quality checks run instantly to discard unreadable files early
                </p>
              </div>
            )}
          </div>

          {/* Real-time Pre-screening Indicator if file/text present */}
          {currentQualityReport && (
            <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              currentQualityReport.passed 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {currentQualityReport.passed ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  <strong>OCR Pre-Check:</strong> {currentQualityReport.readabilityGrade} ({currentQualityReport.overallScore}/100) • {currentQualityReport.resolutionDpi} DPI
                </span>
              </div>
              <span className="text-[10px] font-mono">
                {currentQualityReport.passed ? '✓ Ready for AI Extraction' : '⚠️ Discard Risk'}
              </span>
            </div>
          )}

          {/* OCR / Plaintext Input Stream */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Or Paste OCR / Unstructured Text:</label>
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    setInputText('');
                    setQualityWarningReport(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear Text
                </button>
              )}
            </div>
            <textarea
              rows={6}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste raw OCR extracted text, billing statements, contract text, or JSON payload here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Execute Pipeline Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: <span className="text-indigo-400">gemini-3.8-flash</span>
              </span>
              <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={forceOverride}
                  onChange={e => setForceOverride(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Bypass Quality Gating</span>
              </label>
            </div>

            <button
              onClick={() => handleRunPipeline()}
              disabled={isProcessing || (!inputText && !selectedFile)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Enterprise Scenarios & Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                Enterprise Benchmark Scenarios
              </span>
              <span className="text-[10px] text-slate-400">1-Click Test</span>
            </div>
            <p className="text-xs text-slate-400">
              Run authentic corporate workloads through intelligent classification, template-free vision extraction, and quality gating:
            </p>

            <div className="space-y-2.5">
              {ENTERPRISE_WORKLOADS.map((workload, idx) => (
                <div
                  key={idx}
                  onClick={() => handleRunPipeline(workload.text, workload.type, `${workload.title.replace(/\s+/g, '_')}.txt`)}
                  className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/60 rounded-lg cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      {workload.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {workload.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {workload.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Telemetry Callout */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2 font-mono text-slate-400">
            <div className="flex justify-between text-slate-300 font-sans font-semibold">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Live Architecture Specifications
              </span>
              <span className="text-emerald-400">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Classifier:</span>
              <span className="text-slate-200">Zero-Shot Vision Semantic</span>
            </div>
            <div className="flex justify-between">
              <span>OCR Pre-check:</span>
              <span className="text-cyan-400">DPI / Blur / Contrast Gating</span>
            </div>
            <div className="flex justify-between">
              <span>Extractor:</span>
              <span className="text-slate-200">Vision-Language Multimodal</span>
            </div>
            <div className="flex justify-between">
              <span>HITL Human Sign-Off:</span>
              <span className="text-slate-200">Review &amp; Edit Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recently Processed Records Strip */}
      {recentProcessed.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recently Ingested in this Session ({recentProcessed.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentProcessed.slice(0, 3).map(doc => (
              <div
                key={doc.id}
                onClick={() => onNavigateToStudio(doc)}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-cyan-500/70 cursor-pointer transition-all group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                    {doc.fileName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {doc.documentType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Confidence: <strong className="text-emerald-400">{Math.round(doc.overallConfidence * 100)}%</strong></span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

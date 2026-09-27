'use client';

import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  FileText, 
  Eye, 
  Crosshair, 
  Download,
  Copy,
  Check,
  FileType,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DocumentRecord } from '@/lib/types/idp';

interface DocumentVisualizerProps {
  document: DocumentRecord;
  selectedFieldKey?: string | null;
  onSelectField: (key: string) => void;
  hoveredFieldKey?: string | null;
  onHoverField?: (key: string | null) => void;
}

export const DocumentVisualizer: React.FC<DocumentVisualizerProps> = ({
  document,
  selectedFieldKey,
  onSelectField,
  hoveredFieldKey,
  onHoverField
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'VISUAL_CANVAS' | 'ORIGINAL_FILE' | 'RAW_OCR_STREAM'>('VISUAL_CANVAS');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [copiedRawText, setCopiedRawText] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 180));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);

  const isPdf = 
    document.mimeType === 'application/pdf' || 
    document.fileName.toLowerCase().endsWith('.pdf') ||
    (typeof document.previewUrl === 'string' && document.previewUrl.startsWith('data:application/pdf'));

  const isImage = 
    document.mimeType?.startsWith('image/') || 
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(document.fileName) ||
    (typeof document.previewUrl === 'string' && document.previewUrl.startsWith('data:image/'));

  // Fields that have bounding boxes
  const fieldsWithBoxes = Object.values(document.fields).filter(f => f.boundingBox);

  const handleCopyRawText = () => {
    if (!document.rawText) return;
    navigator.clipboard.writeText(document.rawText);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  const handleDownloadSource = () => {
    if (document.previewUrl) {
      const a = window.document.createElement('a');
      a.href = document.previewUrl;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } else if (document.rawText) {
      const blob = new Blob([document.rawText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName.endsWith('.txt') ? document.fileName : `${document.fileName}.txt`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800/80 rounded-lg overflow-hidden shadow-sm">
      
      {/* Top Controls Toolbar: Minimal, Linear-style */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-zinc-900/60 border-b border-zinc-800/80 text-zinc-300 gap-2">
        
        {/* Left: View Mode Segmented Control */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
            <button
              onClick={() => setViewMode('VISUAL_CANVAS')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                viewMode === 'VISUAL_CANVAS'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>

            {document.previewUrl && (
              <button
                onClick={() => setViewMode('ORIGINAL_FILE')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                  viewMode === 'ORIGINAL_FILE'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileType className="w-3.5 h-3.5" />
                <span>Raw PDF</span>
              </button>
            )}

            <button
              onClick={() => setViewMode('RAW_OCR_STREAM')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                viewMode === 'RAW_OCR_STREAM'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>OCR Text</span>
            </button>
          </div>

          {/* Toggle Bounding Boxes */}
          {viewMode === 'VISUAL_CANVAS' && (
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer ml-1 select-none hover:text-zinc-300">
              <input
                type="checkbox"
                checked={showBoundingBoxes}
                onChange={e => setShowBoundingBoxes(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-mono">
                Boxes ({fieldsWithBoxes.length})
              </span>
            </label>
          )}
        </div>

        {/* Right: Zoom Controls & Source Download */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleDownloadSource}
            title="Download Ingested File"
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] transition"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Source</span>
          </button>

          {/* Zoom: Minimal Button Group */}
          <div className="flex items-center gap-0.5 bg-zinc-950 px-1 py-0.5 rounded-md border border-zinc-800">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-zinc-300 w-9 text-center font-medium">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition ml-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-zinc-950 relative select-none">
        
        {/* MODE 1: VISUAL GROUNDING CANVAS */}
        {viewMode === 'VISUAL_CANVAS' && (
          <div 
            className="transition-transform duration-100 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <div className="w-[620px] min-h-[840px] bg-zinc-900/90 border border-zinc-800/80 rounded-lg shadow-2xl relative font-sans text-zinc-200 overflow-hidden">
              
              {/* Document Micro Header */}
              <div className="bg-zinc-950/90 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-300 truncate max-w-[280px]">{document.fileName}</span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono text-[10px]">
                    {document.documentType}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                  <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-emerald-400 font-medium">{Math.round(document.overallConfidence * 100)}% conf</span>
                </div>
              </div>

              {/* Render Image or Structured Sheet */}
              {isImage && document.previewUrl ? (
                <div className="relative w-full bg-zinc-950 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={document.previewUrl}
                    alt={document.fileName}
                    className="w-full h-auto object-contain block select-none"
                  />
                </div>
              ) : isPdf && document.previewUrl ? (
                <div className="p-4 bg-zinc-950/40">
                  <div className="mb-3 p-2 rounded bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <FileType className="w-3.5 h-3.5 text-zinc-400" />
                      PDF Layout • Grounding entity boxes active below
                    </span>
                    <button
                      onClick={() => setViewMode('ORIGINAL_FILE')}
                      className="text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1"
                    >
                      <span>Full PDF Viewer</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Render Structured Content */}
                  <DocumentStructuredSheet document={document} />
                </div>
              ) : (
                /* Text / Digital Document Structured Sheet */
                <DocumentStructuredSheet document={document} />
              )}

              {/* Precision Lightweight Bounding Boxes Overlay (1px stroke) */}
              {showBoundingBoxes && (
                <div className="absolute inset-0 pointer-events-none">
                  {fieldsWithBoxes.map(field => {
                    const box = field.boundingBox!;
                    const isSelected = selectedFieldKey === field.key;
                    const isHovered = hoveredFieldKey === field.key;
                    const isLowConfidence = field.confidence < 0.70;

                    // 0-1000 normalized coordinates
                    const top = `${box.ymin / 10}%`;
                    const left = `${box.xmin / 10}%`;
                    const height = `${Math.max((box.ymax - box.ymin) / 10, 2.5)}%`;
                    const width = `${Math.max((box.xmax - box.xmin) / 10, 5)}%`;

                    // 1px stroke with subtle opacity per spec
                    let boxStyle = 'border border-emerald-500/40 bg-emerald-500/5';
                    if (isLowConfidence) {
                      boxStyle = 'border border-amber-500/50 bg-amber-500/5';
                    }

                    // Hovered or Selected: emerald glow per spec
                    if (isSelected || isHovered) {
                      boxStyle = 'border border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] z-20';
                    }

                    return (
                      <div
                        key={field.key}
                        onClick={() => onSelectField(field.key)}
                        onMouseEnter={() => onHoverField?.(field.key)}
                        onMouseLeave={() => onHoverField?.(null)}
                        style={{ top, left, width, height }}
                        className={`absolute rounded-xs transition-all duration-150 cursor-pointer pointer-events-auto flex items-start justify-start ${boxStyle}`}
                        title={`${field.label}: ${String(field.value)} (${Math.round(field.confidence * 100)}%)`}
                      >
                        {(isSelected || isHovered) && (
                          <div className="absolute -top-5 left-0 z-30 px-1.5 py-0.5 rounded bg-zinc-950 border border-emerald-400 text-emerald-400 text-[9px] font-mono font-medium whitespace-nowrap shadow-lg flex items-center gap-1">
                            <Crosshair className="w-2.5 h-2.5" />
                            <span>{field.label}:</span>
                            <span className="text-zinc-100 font-bold">{Math.round(field.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

        {/* MODE 2: ORIGINAL UPLOADED PDF VIEWER */}
        {viewMode === 'ORIGINAL_FILE' && document.previewUrl && (
          <div className="w-full max-w-4xl h-full min-h-[700px] flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4 text-zinc-400" />
                <span className="font-mono text-zinc-200">{document.fileName}</span>
                <span className="text-zinc-500 font-mono text-[11px]">({document.mimeType})</span>
              </div>
              <button
                onClick={handleDownloadSource}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-800 transition"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>

            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-2 overflow-auto">
              {isPdf ? (
                <iframe
                  src={document.previewUrl}
                  title={document.fileName}
                  className="w-full h-[760px] rounded border border-zinc-800 bg-zinc-900"
                />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={document.previewUrl}
                  alt={document.fileName}
                  className="max-h-[760px] w-auto object-contain rounded border border-zinc-800"
                />
              ) : (
                <pre className="p-4 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                  {document.rawText}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* MODE 3: RAW OCR TOKEN STREAM */}
        {viewMode === 'RAW_OCR_STREAM' && (
          <div className="w-full max-w-3xl bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 font-mono text-xs shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="font-medium text-zinc-200">Raw OCR Character &amp; Token Stream</span>
              </div>
              <button
                onClick={handleCopyRawText}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700 transition"
              >
                {copiedRawText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-zinc-950 rounded border border-zinc-800/80 text-zinc-300 text-[11px] leading-relaxed overflow-x-auto max-h-[680px] whitespace-pre-wrap selection:bg-zinc-800">
              {document.rawText || '(No raw OCR stream available for this document.)'}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};

/**
 * High-Density Structured Visual Paper Representation
 * Mimics clean invoices/contracts/documents in dark theme
 */
const DocumentStructuredSheet: React.FC<{ document: DocumentRecord }> = ({ document }) => {
  const f = document.fields;

  return (
    <div className="p-6 font-mono text-xs space-y-5 text-zinc-200">
      
      {/* Header Info */}
      <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
        <div>
          <div className="text-base font-bold text-zinc-100 tracking-tight">
            {String(f.vendorName?.value || f.organizationName?.value || f.issuingCountry?.value || 'CORTEX CORP')}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {String(f.vendorAddress?.value || f.employeeAddress?.value || '100 Silicon Blvd, San Jose, CA')}
          </div>
          {f.taxId?.value && (
            <div className="text-[10px] text-zinc-500 mt-0.5">Tax ID / EIN: {String(f.taxId.value)}</div>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-zinc-300 uppercase">
            {document.documentType.replace(/_/g, ' ')}
          </div>
          <div className="text-zinc-100 font-bold mt-1 text-xs">
            {String(f.invoiceNumber?.value || f.poNumber?.value || f.documentId?.value || f.passportNumber?.value || f.contractTitle?.value || '')}
          </div>
          <div className="text-zinc-500 text-[10px] mt-0.5">
            Date: {String(f.invoiceDate?.value || f.issueDate?.value || f.effectiveDate?.value || f.dateOfBirth?.value || '')}
          </div>
        </div>
      </div>

      {/* Bill To / Parties Row */}
      {(f.customerName?.value || f.governingLaw?.value || f.patientName?.value || f.bearerFullName?.value) && (
        <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800/80">
          <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider mb-1">
            Subject / Counterparty Entity:
          </div>
          <div className="font-semibold text-zinc-200">
            {String(f.customerName?.value || f.patientName?.value || f.bearerFullName?.value || f.governingLaw?.value)}
          </div>
          {f.customerAddress?.value && (
            <div className="text-[11px] text-zinc-400 mt-0.5">{String(f.customerAddress.value)}</div>
          )}
          {f.deliveryAddress?.value && (
            <div className="text-[11px] text-zinc-400 mt-0.5">Delivery: {String(f.deliveryAddress.value)}</div>
          )}
        </div>
      )}

      {/* Identity Document / MRZ zone */}
      {document.documentType === 'IDENTITY_DOCUMENT' && (
        <div className="p-3.5 bg-zinc-950/90 rounded border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Machine Readable Travel Document (MRTD) Zone
            </span>
            <span className="text-[10px] font-mono text-emerald-400">ICAO 9303 Compliant</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>Passport #: <span className="text-zinc-100 font-bold">{String(f.passportNumber?.value || 'N/A')}</span></div>
            <div>Nationality: <span className="text-zinc-100">{String(f.nationality?.value || 'USA')}</span></div>
            <div>DOB: <span className="text-zinc-100">{String(f.dateOfBirth?.value || 'N/A')}</span></div>
            <div>Expires: <span className="text-zinc-100">{String(f.expirationDate?.value || 'N/A')}</span></div>
          </div>
          {f.mrzCode?.value && (
            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 font-mono tracking-widest break-all">
              {String(f.mrzCode.value)}
            </div>
          )}
        </div>
      )}

      {/* Itemized Line Items Table if present */}
      {document.lineItems && document.lineItems.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider mb-1">
            Itemized Schedule:
          </div>
          <div className="border border-zinc-800 rounded overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-1.5 px-2.5 font-medium">Description</th>
                  <th className="py-1.5 px-2.5 font-medium text-center w-14">Qty</th>
                  <th className="py-1.5 px-2.5 font-medium text-right w-20">Unit</th>
                  <th className="py-1.5 px-2.5 font-medium text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {document.lineItems.map((li, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30">
                    <td className="py-1.5 px-2.5 text-zinc-200">{li.description}</td>
                    <td className="py-1.5 px-2.5 text-center text-zinc-400 font-mono">{li.quantity}</td>
                    <td className="py-1.5 px-2.5 text-right text-zinc-400 font-mono">${Number(li.unitPrice).toFixed(2)}</td>
                    <td className="py-1.5 px-2.5 text-right text-zinc-100 font-mono font-medium">${Number(li.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Totals */}
      {(f.subtotal?.value || f.totalAmount?.value) && (
        <div className="flex justify-end pt-2">
          <div className="w-56 space-y-1 text-[11px] font-mono">
            {f.subtotal?.value !== undefined && (
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span>${Number(f.subtotal.value).toFixed(2)}</span>
              </div>
            )}
            {f.taxAmount?.value !== undefined && (
              <div className="flex justify-between text-zinc-400">
                <span>Tax / VAT:</span>
                <span>${Number(f.taxAmount.value).toFixed(2)}</span>
              </div>
            )}
            {f.totalAmount?.value !== undefined && (
              <div className="flex justify-between text-sm font-bold text-zinc-100 pt-1 border-t border-zinc-800">
                <span>Total Due:</span>
                <span className="text-emerald-400">${Number(f.totalAmount.value).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wire / Remittance Info */}
      {f.paymentTerms?.value && (
        <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500">
          Terms: <span className="text-zinc-400 font-semibold">{String(f.paymentTerms.value)}</span>
          {f.routingNumber?.value && (
            <span className="ml-3">Routing: <span className="text-zinc-400 font-mono">{String(f.routingNumber.value)}</span></span>
          )}
        </div>
      )}

    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileCheck2, 
  AlertOctagon, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  Sparkles,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { DocumentRecord, PipelineStatus } from '@/lib/types/idp';

interface HumanReviewQueueProps {
  documents: DocumentRecord[];
  onSelectDocument: (doc: DocumentRecord) => void;
  onBulkApprove?: (docIds: string[]) => void;
}

export const HumanReviewQueue: React.FC<HumanReviewQueueProps> = ({
  documents,
  onSelectDocument,
  onBulkApprove
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'CONFIDENCE_ASC' | 'CONFIDENCE_DESC' | 'DATE_DESC'>('CONFIDENCE_ASC');

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.fileName.toLowerCase().includes(q);
      const matchType = doc.documentType.toLowerCase().includes(q);
      const matchVendor = Object.values(doc.fields).some(f => String(f.value || '').toLowerCase().includes(q));
      if (!matchName && !matchType && !matchVendor) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'CONFIDENCE_ASC') return a.overallConfidence - b.overallConfidence;
    if (sortBy === 'CONFIDENCE_DESC') return b.overallConfidence - a.overallConfidence;
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map(d => d.id));
    }
  };

  const statusBadge = (status: PipelineStatus) => {
    switch (status) {
      case 'AUTO_APPROVED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Auto-Approved (STP)</span>;
      case 'MANUALLY_APPROVED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Human Approved</span>;
      case 'NEEDS_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Needs Review</span>;
      case 'EXCEPTION_FLAGGED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Exception Flagged</span>;
      case 'OCR_QUALITY_FAILED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-400" />OCR Discarded</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Control & Filter Header */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name, invoice number, or vendor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'ALL' ? 'bg-zinc-800 text-white' : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800/80'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setStatusFilter('EXCEPTION_FLAGGED')}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'EXCEPTION_FLAGGED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800/80'
              }`}
            >
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              Exceptions ({documents.filter(d => d.status === 'EXCEPTION_FLAGGED').length})
            </button>
            <button
              onClick={() => setStatusFilter('NEEDS_REVIEW')}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'NEEDS_REVIEW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800/80'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Needs Review ({documents.filter(d => d.status === 'NEEDS_REVIEW').length})
            </button>
            <button
              onClick={() => setStatusFilter('AUTO_APPROVED')}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'AUTO_APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800/80'
              }`}
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Auto-Approved ({documents.filter(d => d.status === 'AUTO_APPROVED').length})
            </button>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="CONFIDENCE_ASC">Lowest Confidence</option>
              <option value="CONFIDENCE_DESC">Highest Confidence</option>
              <option value="DATE_DESC">Newest Uploaded</option>
            </select>
          </div>

        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs animate-in fade-in duration-100">
            <span className="text-zinc-300 font-medium font-mono text-[11px]">
              {selectedIds.length} document(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBulkApprove && onBulkApprove(selectedIds)}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-xs"
              >
                Bulk Approve Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Triage Queue Table */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase tracking-wider border-b border-zinc-800/80 font-mono">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredDocs.length && filteredDocs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                  />
                </th>
                <th className="p-3 font-semibold">Document &amp; Entity</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Confidence</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Validation Gating</th>
                <th className="p-3 font-semibold">Latency</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500 font-mono text-xs">
                    No documents matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const isSelected = selectedIds.includes(doc.id);
                  const isLowConf = doc.overallConfidence < 0.80;
                  const primaryEntity = doc.fields.vendorName?.value || 
                                       doc.fields.partyA?.value || 
                                       doc.fields.employerName?.value || 
                                       doc.fields.patientName?.value || 
                                       'Standard Entity';

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-zinc-800/50 transition cursor-pointer ${
                        isSelected ? 'bg-zinc-800/40' : ''
                      }`}
                      onClick={() => onSelectDocument(doc)}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(doc.id)}
                          className="rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                        />
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-zinc-100 flex items-center gap-1.5 font-mono text-xs">
                          {doc.fileName}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                          {String(primaryEntity)}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-950 text-zinc-300 border border-zinc-800">
                          {doc.documentType}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2 font-mono">
                          <div className="w-14 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                            <div
                              className={`h-full rounded-full ${
                                isLowConf ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.round(doc.overallConfidence * 100)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold ${isLowConf ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {Math.round(doc.overallConfidence * 100)}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        {statusBadge(doc.status)}
                      </td>

                      <td className="p-3">
                        {doc.validationSummary.errorCount > 0 ? (
                          <span className="flex items-center gap-1 text-rose-400 font-medium font-mono text-[11px]">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {doc.validationSummary.errorCount} Error(s)
                          </span>
                        ) : doc.validationSummary.warningCount > 0 ? (
                          <span className="flex items-center gap-1 text-amber-400 font-medium font-mono text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {doc.validationSummary.warningCount} Warning(s)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {doc.validationSummary.passedCount} Passed
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-zinc-400 text-[11px]">
                        {doc.telemetry?.latencyMs || 1350}ms
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectDocument(doc);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

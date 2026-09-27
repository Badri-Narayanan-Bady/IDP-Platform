'use client';

import React from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldCheck
} from 'lucide-react';
import { DocumentRecord } from '@/lib/types/idp';

interface MetricsBarProps {
  documents: DocumentRecord[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ documents }) => {
  const total = documents.length || 1;
  const autoApproved = documents.filter(d => d.status === 'AUTO_APPROVED').length;
  const manuallyApproved = documents.filter(d => d.status === 'MANUALLY_APPROVED').length;
  const needsReview = documents.filter(d => d.status === 'NEEDS_REVIEW').length;
  const exceptions = documents.filter(d => d.status === 'EXCEPTION_FLAGGED').length;
  
  const stpRate = Math.round((autoApproved / total) * 100);
  const avgConfidence = Math.round(
    (documents.reduce((acc, d) => acc + (d.overallConfidence || 0), 0) / total) * 100
  );
  const avgLatency = Math.round(
    documents.reduce((acc, d) => acc + (d.telemetry?.latencyMs || 1400), 0) / total
  );
  const totalCost = documents.reduce((acc, d) => acc + (d.telemetry?.estimatedCostUsd || 0.00035), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
      
      {/* STP Rate Metric */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-medium text-zinc-400">STP Rate</span>
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-zinc-100 font-mono">{stpRate}%</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Straight-through auto approval</p>
      </div>

      {/* Confidence Score */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-medium text-zinc-400">Mean Confidence</span>
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-zinc-100 font-mono">{avgConfidence}%</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Field calibration</p>
      </div>

      {/* Review Backlog */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-medium text-zinc-400">Pending Review</span>
          <AlertTriangle className={`w-3.5 h-3.5 ${needsReview + exceptions > 0 ? 'text-amber-400' : 'text-zinc-600'}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-semibold font-mono ${needsReview + exceptions > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>
            {needsReview + exceptions}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">items</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{exceptions} exceptions flagged</p>
      </div>

      {/* Approved Documents */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-medium text-zinc-400">Approved</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-emerald-400 font-mono">{autoApproved + manuallyApproved}</span>
          <span className="text-[10px] text-zinc-500 font-mono">/ {documents.length}</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Dispatched to ERP</p>
      </div>

      {/* Latency */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-medium text-zinc-400">Avg Latency</span>
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-zinc-100 font-mono">{(avgLatency / 1000).toFixed(2)}s</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Pipeline throughput</p>
      </div>

      {/* Compute Cost */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-medium text-zinc-400">Compute Cost</span>
          <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-zinc-100 font-mono">${totalCost.toFixed(4)}</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Gemini vision inference</p>
      </div>

    </div>
  );
};

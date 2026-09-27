'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  Code, 
  Globe, 
  Download, 
  ExternalLink,
  Shield,
  Layers,
  Database
} from 'lucide-react';
import { DocumentRecord } from '@/lib/types/idp';

interface DeveloperHubProps {
  documents: DocumentRecord[];
}

export const DeveloperHub: React.FC<DeveloperHubProps> = ({ documents }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [webhookTarget, setWebhookTarget] = useState<string>('SAP_S4HANA');
  const [customEndpoint, setCustomEndpoint] = useState<string>('https://erp.acme-corp.internal/api/v2/ap-invoices');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'CURL' | 'NODE' | 'PYTHON'>('CURL');

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSimulateWebhook = () => {
    if (!selectedDoc) return;
    setIsDispatching(true);
    setDispatchResult(null);

    setTimeout(() => {
      setIsDispatching(false);
      setDispatchResult({
        status: 200,
        statusText: 'OK',
        timestamp: new Date().toISOString(),
        destination: webhookTarget,
        endpoint: customEndpoint,
        hmacSignature: `sha256=${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        deliveryLatencyMs: 148,
        responsePayload: {
          success: true,
          erpTransactionId: `SAP-TXN-${Date.now()}`,
          documentId: selectedDoc.id,
          status: 'COMMITTED_TO_LEDGER',
          message: `Document ${selectedDoc.fileName} successfully ingested into ${webhookTarget} accounts payable journal.`
        }
      });
    }, 900);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Document ID', 'File Name', 'Type', 'Status', 'Confidence', 'Primary Entity', 'Total/Amount', 'Processed At'];
    const rows = documents.map(d => {
      const primaryEntity = d.fields.vendorName?.value || d.fields.partyA?.value || d.fields.patientName || d.fields.employerName || 'N/A';
      const amount = d.fields.totalAmount?.value || d.fields.primaryAmount?.value || d.fields.box1Wages?.value || 'N/A';
      return [
        `"${d.id}"`,
        `"${d.fileName}"`,
        `"${d.documentType}"`,
        `"${d.status}"`,
        `"${Math.round(d.overallConfidence * 100)}%"`,
        `"${String(primaryEntity).replace(/"/g, '""')}"`,
        `"${amount}"`,
        `"${d.processedAt || d.uploadedAt}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `cortex_idp_batch_export_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Code snippets
  const curlCode = `curl -X POST "https://your-domain.com/api/idp/process" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "ACRONIS CLOUD SYSTEMS INC.\\nInvoice Number: INV-2025-0892\\nTotal Due: $15,660.00",
    "documentTypeHint": "INVOICE",
    "confidenceThresholdAutoApprove": 0.90
  }'`;

  const nodeCode = `import fetch from 'node-fetch';

const response = await fetch('https://your-domain.com/api/idp/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: rawOcrDocumentString,
    documentTypeHint: 'INVOICE',
  }),
});

const data = await response.json();
console.log('Extracted Schema:', data.fields);
console.log('STP Status:', data.status);`;

  const pythonCode = `import requests

url = "https://your-domain.com/api/idp/process"
payload = {
    "text": raw_ocr_document_string,
    "documentTypeHint": "INVOICE",
    "confidenceThresholdAutoApprove": 0.90
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
record = response.json()
print(f"Extraction Confidence: {record['overallConfidence']}")
print(f"Line Items: {record['lineItems']}")`;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            Developer Integration Hub
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            REST API, Webhook Dispatcher & Enterprise Data Export
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seamlessly integrate CortexIDP into your backend systems, microservices, and ERP workflows (SAP, NetSuite, Salesforce, Snowflake).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          Export All Records (CSV)
        </button>
      </div>

      {/* Grid: Webhook Dispatcher Simulator + API Code Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Webhook Dispatcher Simulator (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Live ERP Webhook Dispatch Simulator
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">HMAC Signed</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Simulate transmitting a validated extraction payload to your destination ERP or downstream lakehouse with cryptographic HMAC-SHA256 signature verification.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Select Document to Transmit:</label>
                <select
                  value={selectedDocId}
                  onChange={e => setSelectedDocId(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-sans focus:outline-none focus:border-indigo-500"
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fileName} ({d.documentType} • {Math.round(d.overallConfidence * 100)}% conf)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Enterprise Target System:</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: 'SAP_S4HANA', label: 'SAP S/4HANA' },
                    { id: 'NETSUITE', label: 'Oracle NetSuite' },
                    { id: 'SNOWFLAKE', label: 'Snowflake' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWebhookTarget(t.id)}
                      className={`p-2 rounded-lg border text-xs font-medium text-center transition ${
                        webhookTarget === t.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Destination Webhook URL:</label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <button
              onClick={handleSimulateWebhook}
              disabled={isDispatching || !selectedDoc}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isDispatching ? (
                <span>Signing & Dispatching Webhook...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Webhook Event</span>
                </>
              )}
            </button>

            {/* Webhook Response Output */}
            {dispatchResult && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-800/60 space-y-2 animate-fade-in text-xs font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    HTTP 200 OK Delivered ({dispatchResult.deliveryLatencyMs}ms)
                  </span>
                  <span className="text-[10px] text-slate-400">{dispatchResult.timestamp.substring(11, 19)} UTC</span>
                </div>

                <div className="text-[11px] text-slate-400 break-all">
                  <span className="text-slate-500">Signature:</span> {dispatchResult.hmacSignature.substring(0, 32)}...
                </div>

                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300 text-[11px] whitespace-pre-wrap">
                  {JSON.stringify(dispatchResult.responsePayload, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: API Code Sandbox (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              Direct Pipeline API Endpoint
            </span>

            {/* Code Language Switcher */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveCodeTab('CURL')}
                className={`px-2.5 py-1 rounded font-mono font-medium transition ${
                  activeCodeTab === 'CURL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveCodeTab('NODE')}
                className={`px-2.5 py-1 rounded font-mono font-medium transition ${
                  activeCodeTab === 'NODE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveCodeTab('PYTHON')}
                className={`px-2.5 py-1 rounded font-mono font-medium transition ${
                  activeCodeTab === 'PYTHON' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
            <button
              onClick={() => handleCopy(
                activeCodeTab === 'CURL' ? curlCode : activeCodeTab === 'NODE' ? nodeCode : pythonCode,
                'api-code'
              )}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Copy Code"
            >
              {copiedCode === 'api-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <pre className="text-[11px] leading-relaxed">
              {activeCodeTab === 'CURL' && curlCode}
              {activeCodeTab === 'NODE' && nodeCode}
              {activeCodeTab === 'PYTHON' && pythonCode}
            </pre>
          </div>

          {/* Pipeline Specifications */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Supported Encodings</div>
              <div className="text-slate-200 mt-1 font-mono">multipart/form-data, Base64, raw/utf-8</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Rate Limit & Throughput</div>
              <div className="text-slate-200 mt-1 font-mono">500 req/sec • Auto-scaled cloud workers</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

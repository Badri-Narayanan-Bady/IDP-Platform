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
  Database,
  Share2,
  Workflow,
  Sparkles,
  Bot
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
          erpTransactionId: `${webhookTarget}-TXN-${Date.now()}`,
          documentId: selectedDoc.id,
          status: 'COMMITTED_TO_LEDGER',
          message: `Document ${selectedDoc.fileName} successfully ingested into ${webhookTarget} accounts payable journal via RPA connector.`
        }
      });
    }, 900);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Document ID', 'File Name', 'Type', 'Status', 'Confidence', 'Primary Entity', 'Total/Amount', 'Processed At'];
    const rows = documents.map(d => {
      const primaryEntity = d.fields.vendorName?.value || d.fields.partyA?.value || d.fields.patientName?.value || d.fields.employerName?.value || 'N/A';
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
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            Developer Integration Hub
          </div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            REST API, ERP Integrations &amp; Webhook Dispatcher
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connect CortexIDP with ERP (SAP S/4HANA, NetSuite), CRM, RPA bots (UiPath, Automation Anywhere), and downstream accounting software via HMAC-signed webhooks and REST endpoints.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export All Records (CSV)</span>
        </button>
      </div>

      {/* Grid: Webhook Dispatcher Simulator + API Code Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Webhook Dispatcher Simulator (6 cols) */}
        <div className="lg:col-span-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-4 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                Live ERP &amp; RPA Webhook Dispatch Simulator
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">HMAC-SHA256 Signed</span>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              Transmit validated IDP payloads to your destination enterprise software (SAP, NetSuite, Salesforce, UiPath RPA bots) with cryptographic signature validation.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-zinc-400 font-medium">Select Document to Transmit:</label>
                <select
                  value={selectedDocId}
                  onChange={e => setSelectedDocId(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-sans focus:outline-none focus:border-zinc-700"
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fileName} ({d.documentType} • {Math.round(d.overallConfidence * 100)}% conf)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-medium">Enterprise Target System / Connector:</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[
                    { id: 'SAP_S4HANA', label: 'SAP S/4HANA' },
                    { id: 'NETSUITE', label: 'Oracle NetSuite' },
                    { id: 'UIPATH_RPA', label: 'UiPath RPA Bot' },
                    { id: 'SNOWFLAKE', label: 'Snowflake' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWebhookTarget(t.id)}
                      className={`p-1.5 rounded border text-[11px] font-medium text-center transition ${
                        webhookTarget === t.id
                          ? 'bg-zinc-800 text-zinc-100 border-emerald-500/60 shadow-xs'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-medium">Destination Webhook URL:</label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <button
              onClick={handleSimulateWebhook}
              disabled={isDispatching || !selectedDoc}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs transition disabled:opacity-50"
            >
              {isDispatching ? (
                <span>Signing &amp; Dispatching Webhook...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Webhook Event</span>
                </>
              )}
            </button>

            {/* Webhook Response Output */}
            {dispatchResult && (
              <div className="p-3 bg-zinc-950 rounded border border-emerald-500/30 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    HTTP 200 OK Delivered ({dispatchResult.deliveryLatencyMs}ms)
                  </span>
                  <span className="text-[10px] text-zinc-500">{dispatchResult.timestamp.substring(11, 19)} UTC</span>
                </div>

                <div className="text-[10px] text-zinc-500 break-all">
                  <span>Signature:</span> {dispatchResult.hmacSignature.substring(0, 32)}...
                </div>

                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-300 text-[11px] whitespace-pre-wrap">
                  {JSON.stringify(dispatchResult.responsePayload, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: API Code Sandbox (6 cols) */}
        <div className="lg:col-span-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Code className="w-3.5 h-3.5 text-zinc-400" />
              Direct Pipeline API Endpoint
            </span>

            {/* Code Language Switcher */}
            <div className="flex bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveCodeTab('CURL')}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition ${
                  activeCodeTab === 'CURL' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveCodeTab('NODE')}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition ${
                  activeCodeTab === 'NODE' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveCodeTab('PYTHON')}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition ${
                  activeCodeTab === 'PYTHON' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
            <button
              onClick={() => handleCopy(
                activeCodeTab === 'CURL' ? curlCode : activeCodeTab === 'NODE' ? nodeCode : pythonCode,
                'api-code'
              )}
              className="absolute top-2.5 right-2.5 p-1 rounded bg-zinc-850 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 border border-zinc-750 transition"
              title="Copy Code"
            >
              {copiedCode === 'api-code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>

            <pre className="text-[11px] leading-relaxed">
              {activeCodeTab === 'CURL' && curlCode}
              {activeCodeTab === 'NODE' && nodeCode}
              {activeCodeTab === 'PYTHON' && pythonCode}
            </pre>
          </div>

          {/* Pipeline Specifications */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">Supported Encodings</div>
              <div className="text-zinc-300 mt-0.5 text-[11px]">multipart/form-data, Base64, raw/utf-8</div>
            </div>
            <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">Rate Limit &amp; Throughput</div>
              <div className="text-zinc-300 mt-0.5 text-[11px]">500 req/sec • Auto-scaled workers</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

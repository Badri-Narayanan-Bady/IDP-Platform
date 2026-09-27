'use client';

import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Settings, 
  Code, 
  Check, 
  HelpCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import { DOCUMENT_SCHEMAS } from '@/lib/schemas/registry';
import { DocumentType } from '@/lib/types/idp';

export const SchemaRuleManager: React.FC = () => {
  const [selectedSchemaType, setSelectedSchemaType] = useState<DocumentType>('INVOICE');
  const [autoApproveThreshold, setAutoApproveThreshold] = useState<number>(90);
  const [reviewThreshold, setReviewThreshold] = useState<number>(70);
  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({
    MATH_SUM_CHECK: true,
    DATE_ORDER_CHECK: true,
    REQUIRED_FIELDS: true,
    TAX_W2_MATH_CHECK: true,
    EIN_FORMAT_CHECK: true,
    HIPAA_CONSENT_CHECK: true,
    LOW_CONFIDENCE_FLAG: true,
  });
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const currentSchema = DOCUMENT_SCHEMAS[selectedSchemaType];

  const toggleRule = (ruleKey: string) => {
    setEnabledRules(prev => ({ ...prev, [ruleKey]: !prev[ruleKey] }));
  };

  const handleSaveConfig = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            Configurable Governance &amp; Rules
          </div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            Schema Registry &amp; Deterministic Rule Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Define extraction schemas, customize field constraints, set confidence SLA thresholds, and configure mathematical validation rules.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Rules Configuration</span>
        </button>
      </div>

      {saveToast && (
        <div className="p-2.5 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg text-xs flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rules and threshold configuration saved successfully. Active on all future documents.</span>
        </div>
      )}

      {/* Grid: Threshold Controls + Rule Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Col: SLA Confidence Thresholds (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-4 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            SLA Confidence Thresholds
          </div>

          {/* Auto-Approve STP Threshold Slider */}
          <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-400">Straight-Through (STP) Threshold</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">{autoApproveThreshold}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="99"
              value={autoApproveThreshold}
              onChange={e => setAutoApproveThreshold(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-400 font-sans">
              Documents with confidence &ge; {autoApproveThreshold}% and zero rule violations are automatically passed directly to ERP without human touch.
            </p>
          </div>

          {/* Review Threshold Slider */}
          <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-amber-400">Human Review Trigger</span>
              <span className="font-mono font-bold text-amber-400 text-xs">{reviewThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              value={reviewThreshold}
              onChange={e => setReviewThreshold(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-400 font-sans">
              Documents below {reviewThreshold}% or with non-fatal warnings are routed to the HITL Review Queue.
            </p>
          </div>

          {/* Core Deterministic Rules Toggles */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Deterministic Verification Checks
            </span>

            <div className="space-y-2 text-xs">
              {[
                { id: 'MATH_SUM_CHECK', name: 'Arithmetic Sum Integrity', desc: 'Verify Line Items & Subtotal + Tax + Shipping == Total' },
                { id: 'DATE_ORDER_CHECK', name: 'Chronological Integrity', desc: 'Enforce Due Date >= Issue Date and Expiry >= Effective Date' },
                { id: 'REQUIRED_FIELDS', name: 'Required Fields Presence', desc: 'Reject or flag any missing mandatory schema keys' },
                { id: 'TAX_W2_MATH_CHECK', name: 'FICA Tax Rate Verification', desc: 'Validate 6.2% Social Security and 1.45% Medicare ratios' },
                { id: 'HIPAA_CONSENT_CHECK', name: 'HIPAA Consent Verification', desc: 'Flag unsigned medical intake authorization signatures' },
              ].map(rule => (
                <label
                  key={rule.id}
                  className="flex items-start gap-2.5 p-2 bg-zinc-950 rounded border border-zinc-800 cursor-pointer hover:border-zinc-700 transition select-none"
                >
                  <input
                    type="checkbox"
                    checked={!!enabledRules[rule.id]}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-0.5 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <div>
                    <div className="font-medium text-zinc-200 text-xs">{rule.name}</div>
                    <div className="text-[10px] text-zinc-500 font-sans">{rule.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Schema Inspector & Field Catalog (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-4 space-y-4 shadow-xs">
          
          {/* Schema Selector Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Document Schema Definitions
            </span>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {(Object.keys(DOCUMENT_SCHEMAS) as DocumentType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedSchemaType(type)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium whitespace-nowrap transition ${
                    selectedSchemaType === type
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Schema Header */}
          <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-1 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-100">{currentSchema.displayName}</h3>
              <span className="text-[11px] font-mono text-zinc-500">Category: {currentSchema.category}</span>
            </div>
            <p className="text-xs text-zinc-400">{currentSchema.description}</p>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              Supports Tabular Line Items: <span className="text-emerald-400 font-medium">{currentSchema.supportsLineItems ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Fields Table */}
          <div className="border border-zinc-800 rounded-md overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950 text-zinc-400 text-[11px] font-mono border-b border-zinc-800 sticky top-0 uppercase">
                  <tr>
                    <th className="p-2.5 font-medium">Field Key</th>
                    <th className="p-2.5 font-medium">Display Label</th>
                    <th className="p-2.5 font-medium">Type</th>
                    <th className="p-2.5 font-medium">Required</th>
                    <th className="p-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {currentSchema.fields.map(field => (
                    <tr key={field.key} className="hover:bg-zinc-800/40">
                      <td className="p-2.5 font-mono text-zinc-200 text-xs font-medium">{field.key}</td>
                      <td className="p-2.5 font-medium text-zinc-300">{field.label}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-800">
                          {field.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-xs">
                        {field.required ? (
                          <span className="text-rose-400 font-medium">Mandatory</span>
                        ) : (
                          <span className="text-zinc-500">Optional</span>
                        )}
                      </td>
                      <td className="p-2.5 text-zinc-400 text-[11px] max-w-xs">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

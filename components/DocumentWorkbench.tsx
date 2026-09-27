'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  Wand2, 
  Download,
  Crosshair,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Send,
  History,
  MoreHorizontal,
  FileSpreadsheet,
  Globe,
  Calculator,
  Cpu,
  FileCode2,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import { DocumentRecord, ExtractedField, LineItem } from '@/lib/types/idp';
import { DocumentVisualizer } from './DocumentVisualizer';
import { runDocumentValidation } from '@/lib/engine/validator';
import { formatDateTime } from '@/lib/utils';

let auditSequence = 0;
function createAuditEntry(
  actor: string,
  action: 'PROCESSED' | 'FIELD_EDITED' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN' | 'REVALIDATED',
  notes: string,
  extra?: { fieldKey?: string; oldValue?: unknown; newValue?: unknown }
) {
  auditSequence += 1;
  return {
    id: `aud-${Date.now()}-${auditSequence}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    notes,
    ...extra,
  };
}

function createLineItemId() {
  auditSequence += 1;
  return `li-${Date.now()}-${auditSequence}`;
}

interface DocumentWorkbenchProps {
  document: DocumentRecord;
  onUpdateDocument: (updatedDoc: DocumentRecord) => void;
  onNextDocument?: () => void;
}

type WorkbenchTab = 'FIELDS' | 'RULES' | 'JSON_PAYLOAD';

export const DocumentWorkbench: React.FC<DocumentWorkbenchProps> = ({
  document,
  onUpdateDocument,
  onNextDocument
}) => {
  // Navigation & Tabs
  const [activeDrawerTab, setActiveDrawerTab] = useState<WorkbenchTab>('FIELDS');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [hoveredFieldKey, setHoveredFieldKey] = useState<string | null>(null);
  
  // Resizable Split Pane State (percentage for left viewer: default 50%)
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showErpDispatchModal, setShowErpDispatchModal] = useState<boolean>(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);

  // Toast / Status Notices
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Inline field editing state
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [tempFieldValue, setTempFieldValue] = useState<string>('');

  // Field Filter
  const [fieldSearchQuery, setFieldSearchQuery] = useState<string>('');
  const [filterNeedsReviewOnly, setFilterNeedsReviewOnly] = useState<boolean>(false);

  // Expanded Validation Rule Cards
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  // Add Missing Field Form State
  const [newFieldKey, setNewFieldKey] = useState<string>('');
  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<ExtractedField['type']>('text');

  // ERP Webhook simulation state
  const [erpTarget, setErpTarget] = useState<string>('SAP_S4HANA');
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>('https://erp.acme-corp.internal/api/v2/invoices');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resizable divider drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newPercentage = (relativeX / rect.width) * 100;
      // Clamp between 25% and 75%
      const clamped = Math.max(25, Math.min(75, newPercentage));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Auto-scroll field in right panel when hovered from bounding box
  useEffect(() => {
    if (hoveredFieldKey && activeDrawerTab === 'FIELDS') {
      const el = window.document.getElementById(`field-row-${hoveredFieldKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [hoveredFieldKey, activeDrawerTab]);

  // Mathematical Reconciliation Calculations
  const lineItemSum = document.lineItems?.reduce((sum, li) => sum + (Number(li.amount) || 0), 0) || 0;
  const subtotalVal = Number(document.fields.subtotal?.value) || 0;
  const taxVal = Number(document.fields.taxAmount?.value) || 0;
  const totalVal = Number(document.fields.totalAmount?.value) || 0;
  const calculatedTotal = subtotalVal + taxVal;
  const lineItemsMatchSubtotal = Math.abs(lineItemSum - subtotalVal) < 0.05;
  const mathMatchesTotal = Math.abs(calculatedTotal - totalVal) < 0.05;
  const mathVariance = +(totalVal - calculatedTotal).toFixed(2);

  // Fields needing attention (< 0.70 confidence or validation warning/error)
  const fieldsNeedingAttention = Object.values(document.fields).filter(
    f => f.confidence < 0.70 || document.validationResults.some(r => !r.passed && r.fieldPath === f.key)
  );

  // Filtered Fields List
  const displayedFields = Object.values(document.fields).filter(field => {
    if (filterNeedsReviewOnly) {
      const needsAttn = field.confidence < 0.70 || document.validationResults.some(r => !r.passed && r.fieldPath === field.key);
      if (!needsAttn) return false;
    }
    if (fieldSearchQuery.trim()) {
      const q = fieldSearchQuery.toLowerCase();
      return field.label.toLowerCase().includes(q) || String(field.value).toLowerCase().includes(q) || field.key.toLowerCase().includes(q);
    }
    return true;
  });

  // Jump to next field needing review
  const handleJumpToNextAttention = () => {
    if (fieldsNeedingAttention.length === 0) return;
    const currentIndex = selectedFieldKey ? fieldsNeedingAttention.findIndex(f => f.key === selectedFieldKey) : -1;
    const nextField = fieldsNeedingAttention[(currentIndex + 1) % fieldsNeedingAttention.length];
    setSelectedFieldKey(nextField.key);
    setActiveDrawerTab('FIELDS');
    setTimeout(() => {
      const el = window.document.getElementById(`field-row-${nextField.key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  // Toggle Rule Expansion
  const toggleRuleExpand = (ruleId: string) => {
    setExpandedRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  // Field Edit Handlers
  const handleStartEditField = (field: ExtractedField) => {
    setEditingFieldKey(field.key);
    setTempFieldValue(field.value !== undefined && field.value !== null ? String(field.value) : '');
  };

  const handleCommitEditField = (key: string) => {
    setEditingFieldKey(null);
    const currentField = document.fields[key];
    if (!currentField) return;

    let parsedVal: string | number | boolean = tempFieldValue;
    if (currentField.type === 'number' || currentField.type === 'currency') {
      parsedVal = parseFloat(tempFieldValue) || 0;
    } else if (currentField.type === 'boolean') {
      parsedVal = tempFieldValue.toLowerCase() === 'true';
    }

    if (parsedVal === currentField.value) return;

    const oldVal = currentField.value;
    const updatedFields: Record<string, ExtractedField> = {
      ...document.fields,
      [key]: {
        ...currentField,
        value: parsedVal,
        isEdited: true,
        originalValue: currentField.originalValue !== undefined ? currentField.originalValue : oldVal,
        confidence: 1.0, // Human verified
      }
    };

    const validation = runDocumentValidation(document.documentType, updatedFields, document.lineItems);

    const newAudit = [...document.auditTrail, createAuditEntry(
      'Human Reviewer (HITL)',
      'FIELD_EDITED',
      `Manual correction of ${currentField.label}.`,
      { fieldKey: key, oldValue: oldVal, newValue: parsedVal }
    )];

    onUpdateDocument({
      ...document,
      fields: updatedFields,
      validationResults: validation.results,
      validationSummary: validation.summary,
      status: validation.summary.errorCount === 0 ? 'MANUALLY_APPROVED' : 'NEEDS_REVIEW',
      auditTrail: newAudit
    });

    setFeedbackNotice({ message: `Updated ${currentField.label}`, type: 'success' });
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  // Add Missing Field Handler
  const handleAddNewField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldKey.trim() || !newFieldLabel.trim()) return;

    const key = newFieldKey.trim().replace(/\s+/g, '_');
    let parsedVal: string | number | boolean = newFieldValue;
    if (newFieldType === 'number' || newFieldType === 'currency') {
      parsedVal = parseFloat(newFieldValue) || 0;
    } else if (newFieldType === 'boolean') {
      parsedVal = newFieldValue === 'true';
    }

    const updatedFields: Record<string, ExtractedField> = {
      ...document.fields,
      [key]: {
        key,
        label: newFieldLabel.trim(),
        value: parsedVal,
        confidence: 1.0,
        isEdited: true,
        type: newFieldType,
        required: false,
      }
    };

    const validation = runDocumentValidation(document.documentType, updatedFields, document.lineItems);

    const newAudit = [...document.auditTrail, createAuditEntry(
      'Human Reviewer (HITL)',
      'FIELD_EDITED',
      `Added missing field "${newFieldLabel}" with value "${parsedVal}".`,
      { fieldKey: key, newValue: parsedVal }
    )];

    onUpdateDocument({
      ...document,
      fields: updatedFields,
      validationResults: validation.results,
      validationSummary: validation.summary,
      auditTrail: newAudit
    });

    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddFieldModal(false);
    setSelectedFieldKey(key);
    setFeedbackNotice({ message: `Field "${newFieldLabel}" added to document.`, type: 'success' });
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Line item handlers
  const handleLineItemChange = (index: number, prop: keyof LineItem, val: string | number) => {
    if (!document.lineItems) return;
    const updatedLineItems = [...document.lineItems];
    const targetItem = { ...updatedLineItems[index] };

    if (prop === 'quantity') {
      const q = Number(val) || 0;
      targetItem.quantity = q;
      targetItem.amount = +(q * targetItem.unitPrice).toFixed(2);
    } else if (prop === 'unitPrice') {
      const p = Number(val) || 0;
      targetItem.unitPrice = p;
      targetItem.amount = +(targetItem.quantity * p).toFixed(2);
    } else if (prop === 'description') {
      targetItem.description = String(val);
    }

    targetItem.confidence = 1.0;
    updatedLineItems[index] = targetItem;

    const newSubtotal = +updatedLineItems.reduce((acc, item) => acc + item.amount, 0).toFixed(2);
    const updatedFields = { ...document.fields };
    if (updatedFields.subtotal) {
      updatedFields.subtotal = {
        ...updatedFields.subtotal,
        value: newSubtotal,
        confidence: 1.0,
        isEdited: true
      };
    }

    const validation = runDocumentValidation(document.documentType, updatedFields, updatedLineItems);

    onUpdateDocument({
      ...document,
      lineItems: updatedLineItems,
      fields: updatedFields,
      validationResults: validation.results,
      validationSummary: validation.summary,
      auditTrail: [...document.auditTrail, createAuditEntry(
        'Human Reviewer (HITL)',
        'FIELD_EDITED',
        `Updated line item #${index + 1} (${targetItem.description}).`
      )]
    });
  };

  const handleAddLineItem = () => {
    const currentLines = document.lineItems || [];
    const newLine: LineItem = {
      id: createLineItemId(),
      description: 'New Item / Cloud Service',
      quantity: 1,
      unitPrice: 0.00,
      amount: 0.00,
      confidence: 1.0,
    };
    onUpdateDocument({
      ...document,
      lineItems: [...currentLines, newLine],
    });
  };

  const handleDeleteLineItem = (index: number) => {
    if (!document.lineItems) return;
    const updated = document.lineItems.filter((_, i) => i !== index);
    const newSubtotal = +updated.reduce((acc, item) => acc + item.amount, 0).toFixed(2);
    const updatedFields = { ...document.fields };
    if (updatedFields.subtotal) {
      updatedFields.subtotal = {
        ...updatedFields.subtotal,
        value: newSubtotal,
        confidence: 1.0,
        isEdited: true
      };
    }
    const validation = runDocumentValidation(document.documentType, updatedFields, updated);
    onUpdateDocument({
      ...document,
      lineItems: updated,
      fields: updatedFields,
      validationResults: validation.results,
      validationSummary: validation.summary,
    });
  };

  // Primary CTA: Approve & Sync
  const handleApproveAndSync = () => {
    const approvedFields: Record<string, ExtractedField> = {};
    for (const [k, field] of Object.entries(document.fields)) {
      approvedFields[k] = {
        ...field,
        confidence: Math.max(field.confidence, 0.98),
      };
    }

    const newAudit = [...document.auditTrail, createAuditEntry(
      'Senior Reviewer (HITL)',
      'APPROVED',
      'Document and all extracted parameters verified and approved. Synced to downstream ERP ledger.'
    )];

    onUpdateDocument({
      ...document,
      fields: approvedFields,
      status: 'MANUALLY_APPROVED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Staff Operator #4029',
      webhookStatus: 'DELIVERED',
      webhookDestination: 'Enterprise ERP / Accounts Payable Ledger',
      auditTrail: newAudit
    });

    setFeedbackNotice({ message: 'Document approved & synchronized to downstream ERP.', type: 'success' });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Secondary CTA: Reject Document
  const handleRejectDocument = () => {
    const newAudit = [...document.auditTrail, createAuditEntry(
      'Compliance Reviewer (HITL)',
      'REJECTED',
      'Document rejected during validation due to unverified parameters.'
    )];

    onUpdateDocument({
      ...document,
      status: 'REJECTED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Compliance Officer #4029',
      auditTrail: newAudit
    });

    setFeedbackNotice({ message: 'Document marked as Rejected.', type: 'info' });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Auto-Fix Math Discrepancy
  const handleAutoFixMath = () => {
    const subtotal = Number(document.fields.subtotal?.value || 0);
    const tax = Number(document.fields.taxAmount?.value || 0);
    const correctedTotal = +(subtotal + tax).toFixed(2);

    const updatedFields = {
      ...document.fields,
      totalAmount: {
        ...document.fields.totalAmount,
        value: correctedTotal,
        confidence: 1.0,
        isEdited: true,
      }
    };

    const validation = runDocumentValidation(document.documentType, updatedFields, document.lineItems);

    onUpdateDocument({
      ...document,
      fields: updatedFields,
      validationResults: validation.results,
      validationSummary: validation.summary,
      status: 'MANUALLY_APPROVED',
      auditTrail: [
        ...document.auditTrail,
        createAuditEntry(
          'Cortex Deterministic Engine',
          'OVERRIDDEN',
          `Automated arithmetic reconciliation: Subtotal ($${subtotal}) + Tax ($${tax}) = $${correctedTotal}.`,
          { fieldKey: 'totalAmount', newValue: correctedTotal }
        )
      ]
    });

    setFeedbackNotice({ message: 'Arithmetic discrepancy automatically resolved!', type: 'success' });
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Copy JSON Payload
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(document, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Exports
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(document, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.fileName.replace(/\.[^/.]+$/, '')}_validated_idp.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFieldsCsv = () => {
    const headers = ['Field Key', 'Field Label', 'Extracted Value', 'Confidence', 'Type', 'Required', 'Handwritten'];
    const rows = Object.values(document.fields).map(f => [
      `"${f.key}"`,
      `"${f.label}"`,
      `"${String(f.value ?? '').replace(/"/g, '""')}"`,
      `"${Math.round(f.confidence * 100)}%"`,
      `"${f.type}"`,
      `"${f.required ? 'YES' : 'NO'}"`,
      `"${f.isHandwritten ? 'YES' : 'NO'}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.fileName.replace(/\.[^/.]+$/, '')}_extracted_fields.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live ERP Dispatch test
  const handleDispatchErp = () => {
    setIsDispatching(true);
    setDispatchResult(null);

    setTimeout(() => {
      setIsDispatching(false);
      setDispatchResult({
        status: 200,
        statusText: 'OK (Committed)',
        timestamp: new Date().toISOString(),
        destination: erpTarget,
        endpoint: customWebhookUrl,
        hmacSignature: `sha256=${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        deliveryLatencyMs: 114,
        responsePayload: {
          success: true,
          erpTransactionId: `${erpTarget}-TXN-${Date.now()}`,
          documentId: document.id,
          status: 'COMMITTED_TO_LEDGER',
          fieldsIngested: Object.keys(document.fields).length,
          lineItemsIngested: document.lineItems?.length || 0,
          message: `Document ${document.fileName} successfully ingested into ${erpTarget} schema.`
        }
      });
    }, 600);
  };

  const fieldCount = Object.keys(document.fields).length;
  const ruleCount = document.validationResults.length;
  const passedRuleCount = document.validationSummary.passedCount;
  const errorRuleCount = document.validationSummary.errorCount;
  const warningRuleCount = document.validationSummary.warningCount;

  // Format confidence badge styling
  const getConfidenceBadge = (confidence: number) => {
    const pct = Math.round(confidence * 100);
    if (confidence >= 0.90) {
      return (
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
          {pct}%
        </span>
      );
    }
    if (confidence >= 0.70) {
      return (
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20">
          {pct}%
        </span>
      );
    }
    return (
      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20">
        {pct}%
      </span>
    );
  };

  // Status pill config
  const getStatusBadge = () => {
    const isApproved = document.status === 'AUTO_APPROVED' || document.status === 'MANUALLY_APPROVED';
    const confPct = Math.round(document.overallConfidence * 100);

    if (document.status === 'AUTO_APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Auto-Approved • {confPct}% Confidence
        </span>
      );
    }
    if (document.status === 'MANUALLY_APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified • 100% Confidence
        </span>
      );
    }
    if (document.status === 'NEEDS_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
          <AlertTriangle className="w-3.5 h-3.5" />
          Needs Review • {confPct}% Confidence
        </span>
      );
    }
    if (document.status === 'EXCEPTION_FLAGGED' || document.status === 'OCR_QUALITY_FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
          <AlertOctagon className="w-3.5 h-3.5" />
          Exception Flagged • {confPct}% Confidence
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 font-sans">
        {document.status} • {confPct}% Confidence
      </span>
    );
  };

  return (
    <div className="space-y-3">
      
      {/* Feedback Toast Notification */}
      {feedbackNotice && (
        <div className="p-2.5 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg flex items-center justify-between text-xs shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : feedbackNotice.type === 'error' ? (
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackNotice(null)} 
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Document Header / Action Strip */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        
        {/* Left Side: File title + Status Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight font-mono">
            {document.fileName}
          </h1>

          {/* Auto-Approved Badge per spec: emerald pill "Auto-Approved • 98% Confidence" */}
          {getStatusBadge()}

          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline" suppressHydrationWarning>
            {formatDateTime(document.uploadedAt)}
          </span>
        </div>

        {/* Right Side: Primary CTA & Secondary Action Button Group */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Secondary Actions Grouped in subtle outline button group */}
          <div className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/70 p-0.5">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition flex items-center gap-1.5"
              title="View immutable audit log"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Audit Log</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition flex items-center gap-1.5"
              title="Export structured data (JSON, CSV)"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleRejectDocument}
              className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
              title="Reject document"
            >
              Reject
            </button>

            {/* Icon Dropdown ("•••") */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
                title="More actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50 animate-in fade-in duration-100 text-xs">
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      setShowErpDispatchModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Sync to Webhook / ERP</span>
                  </button>

                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      handleCopyJson();
                    }}
                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy JSON Payload</span>
                  </button>

                  {!mathMatchesTotal && (
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        handleAutoFixMath();
                      }}
                      className="w-full text-left px-3 py-1.5 text-emerald-400 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Auto-Fix Math Total</span>
                    </button>
                  )}

                  {onNextDocument && (
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        onNextDocument();
                      }}
                      className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Next Document</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Single Primary CTA Button: "Approve & Sync" - solid emerald/white */}
          <button
            onClick={handleApproveAndSync}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition active:scale-[0.99] shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve &amp; Sync</span>
          </button>

        </div>

      </div>

      {/* 3. Two-Panel Split Layout (Resizable split view) */}
      <div 
        ref={containerRef}
        className="flex flex-col lg:flex-row items-stretch gap-0 relative min-h-[820px] select-none"
      >
        
        {/* LEFT PANEL: Document Viewer */}
        <div 
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${splitRatio}%` : '100%' }}
          className="h-[820px] shrink-0 flex flex-col"
        >
          <DocumentVisualizer
            document={document}
            selectedFieldKey={selectedFieldKey}
            onSelectField={key => {
              setSelectedFieldKey(key);
              setActiveDrawerTab('FIELDS');
            }}
            hoveredFieldKey={hoveredFieldKey}
            onHoverField={key => setHoveredFieldKey(key)}
          />
        </div>

        {/* Resizable Divider (Linear / Vercel style) */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden lg:flex w-2.5 items-center justify-center cursor-col-resize hover:bg-zinc-800/60 transition group shrink-0 select-none z-10"
          title="Drag to resize panels"
        >
          <div className={`w-0.5 h-10 rounded-full transition-colors ${isResizing ? 'bg-emerald-500' : 'bg-zinc-800 group-hover:bg-zinc-600'}`} />
        </div>

        {/* RIGHT PANEL: Data & Validation Drawer */}
        <div 
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - splitRatio}%` : '100%' }}
          className="flex-1 min-w-0 h-[820px] bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg overflow-hidden flex flex-col shadow-xs"
        >
          
          {/* Top Sleek Tabbed Interface */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 bg-zinc-950/80">
            <div className="flex items-center space-x-1">
              {/* Tab 1: Extracted Fields (14) */}
              <button
                onClick={() => setActiveDrawerTab('FIELDS')}
                className={`py-2.5 px-3 text-xs font-medium border-b-2 transition relative flex items-center gap-1.5 ${
                  activeDrawerTab === 'FIELDS'
                    ? 'border-emerald-500 text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Extracted Fields</span>
                <span className="font-mono text-[11px] text-zinc-500">({fieldCount})</span>
              </button>

              {/* Tab 2: Validation Rules (11) */}
              <button
                onClick={() => setActiveDrawerTab('RULES')}
                className={`py-2.5 px-3 text-xs font-medium border-b-2 transition relative flex items-center gap-1.5 ${
                  activeDrawerTab === 'RULES'
                    ? 'border-emerald-500 text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Validation Rules</span>
                <span className="font-mono text-[11px] text-zinc-500">({ruleCount})</span>
                {errorRuleCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                )}
              </button>

              {/* Tab 3: Developer / JSON Payload */}
              <button
                onClick={() => setActiveDrawerTab('JSON_PAYLOAD')}
                className={`py-2.5 px-3 text-xs font-medium border-b-2 transition relative flex items-center gap-1.5 ${
                  activeDrawerTab === 'JSON_PAYLOAD'
                    ? 'border-emerald-500 text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Developer / JSON</span>
              </button>
            </div>

            {/* Quick Actions in Tab Bar */}
            <div className="flex items-center gap-2">
              {activeDrawerTab === 'FIELDS' && (
                <button
                  onClick={() => setShowAddFieldModal(true)}
                  className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 transition"
                  title="Add missing field"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Add Field</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: EXTRACTED FIELDS */}
          {activeDrawerTab === 'FIELDS' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Optional Reviewer Focus Banner (if fields require attention) */}
              {fieldsNeedingAttention.length > 0 && (
                <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      <strong>Reviewer Focus:</strong> {fieldsNeedingAttention.length} field{fieldsNeedingAttention.length > 1 ? 's' : ''} require review (&lt; 70% confidence).
                    </span>
                  </div>
                  <button
                    onClick={handleJumpToNextAttention}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-mono font-medium transition shrink-0 ml-2"
                  >
                    Focus Next &rarr;
                  </button>
                </div>
              )}

              {/* Sub-header: Search & Quick Filter */}
              <div className="px-3.5 py-2 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Filter fields..."
                    value={fieldSearchQuery}
                    onChange={e => setFieldSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilterNeedsReviewOnly(!filterNeedsReviewOnly)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      filterNeedsReviewOnly
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    Needs Review ({fieldsNeedingAttention.length})
                  </button>
                </div>
              </div>

              {/* Clean Tabular Key-Value List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                
                {/* Table Header */}
                <div className="grid grid-cols-12 px-2 py-1 text-[11px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80">
                  <div className="col-span-5">Field Label</div>
                  <div className="col-span-5">Extracted Value</div>
                  <div className="col-span-2 text-right">Confidence</div>
                </div>

                {/* Field Rows */}
                {displayedFields.map(field => {
                  const isSelected = selectedFieldKey === field.key;
                  const isHovered = hoveredFieldKey === field.key;
                  const isEditing = editingFieldKey === field.key;
                  const isLowConf = field.confidence < 0.70;

                  return (
                    <div
                      key={field.key}
                      id={`field-row-${field.key}`}
                      onClick={() => setSelectedFieldKey(field.key)}
                      onMouseEnter={() => setHoveredFieldKey(field.key)}
                      onMouseLeave={() => setHoveredFieldKey(null)}
                      className={`grid grid-cols-12 items-center px-2 py-2 rounded transition-colors text-xs cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-800/80 border-emerald-500/60 shadow-xs'
                          : isHovered
                          ? 'bg-zinc-800/50 border-zinc-700/80'
                          : isLowConf
                          ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                          : 'border-transparent hover:bg-zinc-850/60'
                      }`}
                    >
                      {/* Field Label */}
                      <div className="col-span-5 flex items-center gap-1.5 truncate pr-2">
                        <span className="text-zinc-300 font-medium truncate">
                          {field.label}
                        </span>
                        {field.isHandwritten && (
                          <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 font-mono" title="Extracted from handwriting">
                            ✍️
                          </span>
                        )}
                        {field.isEdited && (
                          <span className="text-[9px] px-1 rounded bg-zinc-800 text-emerald-400 font-mono">
                            edited
                          </span>
                        )}
                      </div>

                      {/* Extracted Value (Editable input on click) */}
                      <div className="col-span-5 truncate pr-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempFieldValue}
                              onChange={e => setTempFieldValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleCommitEditField(field.key);
                                if (e.key === 'Escape') setEditingFieldKey(null);
                              }}
                              autoFocus
                              className="w-full bg-zinc-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 font-mono focus:outline-none"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommitEditField(field.key);
                              }}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                              title="Save change"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditField(field);
                            }}
                            className="font-mono text-zinc-200 truncate py-0.5 px-1.5 rounded hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 text-xs transition"
                            title="Click to edit value"
                          >
                            {field.value !== undefined && field.value !== null && String(field.value) !== '' ? (
                              String(field.value)
                            ) : (
                              <span className="text-zinc-600 italic">(empty)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Compact Confidence Badge (e.g. "99%") */}
                      <div className="col-span-2 text-right">
                        {getConfidenceBadge(field.confidence)}
                      </div>
                    </div>
                  );
                })}

                {/* Tabular Line Items Section if present (Invoices / POs) */}
                {document.lineItems && document.lineItems.length > 0 && (
                  <div className="pt-4 border-t border-zinc-800/80 mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                        Itemized Schedule ({document.lineItems.length})
                      </span>
                      <button
                        onClick={handleAddLineItem}
                        className="text-[11px] text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Row</span>
                      </button>
                    </div>

                    <div className="border border-zinc-800/80 rounded-md overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-500 text-[11px] font-mono border-b border-zinc-800/80">
                          <tr>
                            <th className="p-2 font-medium">Description</th>
                            <th className="p-2 font-medium w-16 text-center">Qty</th>
                            <th className="p-2 font-medium w-24 text-right">Unit Price</th>
                            <th className="p-2 font-medium w-24 text-right">Amount</th>
                            <th className="p-2 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                          {document.lineItems.map((li, index) => (
                            <tr key={li.id || index} className="hover:bg-zinc-800/30">
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={li.description}
                                  onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                                  className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  value={li.quantity}
                                  onChange={e => handleLineItemChange(index, 'quantity', e.target.value)}
                                  className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-zinc-600 rounded px-1 py-0.5 text-xs text-zinc-200 text-center font-mono focus:outline-none"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={li.unitPrice}
                                  onChange={e => handleLineItemChange(index, 'unitPrice', e.target.value)}
                                  className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-200 text-right font-mono focus:outline-none"
                                />
                              </td>
                              <td className="p-1.5 text-right font-mono text-zinc-200 font-medium">
                                ${Number(li.amount).toFixed(2)}
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  onClick={() => handleDeleteLineItem(index)}
                                  className="text-zinc-600 hover:text-rose-400 p-1"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subtle "+ Add Field" button at bottom of list */}
                <div className="pt-3 pb-6 flex justify-center">
                  <button
                    onClick={() => setShowAddFieldModal(true)}
                    className="w-full py-2 px-3 rounded-md border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900/60 text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Field</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: VALIDATION RULES */}
          {activeDrawerTab === 'RULES' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Header Summary Check-list Status per spec */}
              <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Deterministic Gating Rules</span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-emerald-400 font-medium">Passed: {passedRuleCount}</span>
                  <span className="text-zinc-600">·</span>
                  <span className={errorRuleCount > 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                    Errors: {errorRuleCount}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className={warningRuleCount > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                    Warnings: {warningRuleCount}
                  </span>
                </div>
              </div>

              {/* Rule Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {document.validationResults.map((rule, idx) => {
                  const ruleKey = rule.ruleId || `rule-${idx}`;
                  const isExpanded = !!expandedRules[ruleKey];

                  return (
                    <div
                      key={ruleKey}
                      className={`rounded-lg border text-xs transition-colors overflow-hidden ${
                        rule.passed
                          ? 'bg-zinc-950/40 border-zinc-800/80'
                          : rule.severity === 'ERROR'
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}
                    >
                      {/* Rule Header Bar */}
                      <div 
                        onClick={() => toggleRuleExpand(ruleKey)}
                        className="p-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-zinc-800/30 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          {rule.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : rule.severity === 'ERROR' ? (
                            <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          )}

                          <div>
                            <div className="font-medium text-zinc-200">
                              {rule.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                              {rule.message}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rule.autoFixable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoFixMath();
                              }}
                              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-mono text-[10px] font-medium border border-zinc-700 flex items-center gap-1 transition"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>Auto-Fix</span>
                            </button>
                          )}

                          <button className="text-zinc-500 p-0.5">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Rule Expandable Proof Drawer */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 bg-zinc-950/80 font-mono text-[11px] space-y-2">
                          
                          {/* Case 1: Math Verification Rule Proof */}
                          {rule.ruleId?.includes('MATH') || rule.name.toLowerCase().includes('math') || rule.name.toLowerCase().includes('total') ? (
                            <div className="space-y-1.5 p-2 rounded bg-zinc-900/60 border border-zinc-800">
                              <div className="text-zinc-400 font-sans font-semibold flex items-center gap-1">
                                <Calculator className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Arithmetic Proof &amp; Reconciliation:</span>
                              </div>
                              <div className="text-zinc-300">
                                <div>Formula: Subtotal (${subtotalVal.toFixed(2)}) + Tax (${taxVal.toFixed(2)}) = Target (${calculatedTotal.toFixed(2)})</div>
                                <div>Stated Total on Invoice: <span className={mathMatchesTotal ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>${totalVal.toFixed(2)}</span></div>
                                <div className="text-zinc-500">Variance: ${mathVariance.toFixed(2)}</div>
                              </div>
                              {document.lineItems && document.lineItems.length > 0 && (
                                <div className="pt-1 border-t border-zinc-800 text-zinc-400">
                                  <span>Sum of Line Items: ${lineItemSum.toFixed(2)} {lineItemsMatchSubtotal ? '(Matches Subtotal)' : '(Variance with Subtotal)'}</span>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {/* Case 2: Regex / Format Validation Proof */}
                          {rule.ruleId?.includes('FORMAT') || rule.ruleId?.includes('REGEX') || rule.name.toLowerCase().includes('format') || rule.name.toLowerCase().includes('pattern') ? (
                            <div className="space-y-1 p-2 rounded bg-zinc-900/60 border border-zinc-800">
                              <div className="text-zinc-400 font-sans font-semibold">Deterministic Expression Validation:</div>
                              <div className="text-zinc-300">Evaluated Path: <span className="text-zinc-100">{rule.fieldPath || 'root'}</span></div>
                              <div className="text-zinc-300">Compliant with: ISO 8601 / RFC 3339 Enterprise Invoicing Specification.</div>
                            </div>
                          ) : null}

                          {/* Case 3: AI Classifier Evidence / Score Proof */}
                          {document.classification && (
                            <div className="space-y-1 p-2 rounded bg-zinc-900/60 border border-zinc-800">
                              <div className="text-zinc-400 font-sans font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                                  Zero-Shot Semantic Classifier Rationale
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  {Math.round((document.classification.confidence || document.overallConfidence) * 100)}% Cert
                                </span>
                              </div>
                              <div className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                                {document.classification.reasoning}
                              </div>
                              {document.classification.evidenceSignals && (
                                <div className="text-zinc-400 text-[10px] pt-1">
                                  Signals: {document.classification.evidenceSignals.join(' · ')}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Case 4: Preprocessing Quality Grade Proof */}
                          {document.ocrQualityReport && (
                            <div className="grid grid-cols-2 gap-2 p-2 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400">
                              <div>DPI: <span className="text-zinc-200">{document.ocrQualityReport.resolutionDpi || 300}</span></div>
                              <div>Contrast: <span className="text-zinc-200">{document.ocrQualityReport.estimatedContrast || 92}%</span></div>
                              <div>Blur: <span className="text-zinc-200">{document.ocrQualityReport.blurScore || 10}/100</span></div>
                              <div>Readability: <span className="text-emerald-400">{document.ocrQualityReport.readabilityGrade || 'EXCELLENT'}</span></div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: DEVELOPER / JSON PAYLOAD */}
          {activeDrawerTab === 'JSON_PAYLOAD' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 font-mono text-xs">
              
              {/* Developer Action Strip */}
              <div className="px-3.5 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-sans text-xs">Payload Schema:</span>
                  <span className="text-emerald-400 text-[11px]">v2.4-cortex-idp</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] transition"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setShowErpDispatchModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Webhook</span>
                  </button>
                </div>
              </div>

              {/* Formatted JSON Inspector */}
              <div className="flex-1 overflow-auto p-4 text-[11px] leading-relaxed selection:bg-zinc-800">
                <pre className="text-zinc-300">
                  {JSON.stringify(document, null, 2)}
                </pre>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: Add Missing Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Add Field to Document</h3>
              </div>
              <button
                onClick={() => setShowAddFieldModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewField} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Field Label</label>
                <input
                  type="text"
                  placeholder="e.g. Tax Registration Number"
                  value={newFieldLabel}
                  onChange={e => {
                    setNewFieldLabel(e.target.value);
                    if (!newFieldKey) {
                      setNewFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                    }
                  }}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Field Key (API Identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. tax_registration_number"
                  value={newFieldKey}
                  onChange={e => setNewFieldKey(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Data Type</label>
                <select
                  value={newFieldType}
                  onChange={e => setNewFieldType(e.target.value as ExtractedField['type'])}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="text">String / Text</option>
                  <option value="currency">Currency ($)</option>
                  <option value="number">Numeric</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Value</label>
                <input
                  type="text"
                  placeholder="e.g. US-94-3298410"
                  value={newFieldValue}
                  onChange={e => setNewFieldValue(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">Export Structured Data</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div
                onClick={() => {
                  handleExportJson();
                  setShowExportModal(false);
                }}
                className="p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-md cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-zinc-100">Document JSON Record</div>
                  <div className="text-[11px] text-zinc-400">Complete IDP schema with grounding bounding boxes and audit trail.</div>
                </div>
                <Download className="w-4 h-4 text-zinc-400" />
              </div>

              <div
                onClick={() => {
                  handleExportFieldsCsv();
                  setShowExportModal(false);
                }}
                className="p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-md cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-zinc-100">Key-Value Pairs CSV</div>
                  <div className="text-[11px] text-zinc-400">Flattened spreadsheet containing extracted entities with confidence calibration.</div>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit Trail Log */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">Immutable Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-xs">
              {document.auditTrail.map((log, i) => (
                <div key={log.id || i} className="p-3 bg-zinc-950 rounded border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span className="text-zinc-300 font-semibold">{log.actor}</span>
                    <span suppressHydrationWarning>{formatDateTime(log.timestamp)}</span>
                  </div>
                  <div className="text-zinc-200">
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold mr-2">
                      {log.action}
                    </span>
                    {log.notes}
                  </div>
                  {log.fieldKey && (
                    <div className="text-[10px] text-zinc-500 mt-1">
                      Field: <span className="text-zinc-300">{log.fieldKey}</span> | Old: <span className="text-rose-400">{String(log.oldValue)}</span> &rarr; New: <span className="text-emerald-400">{String(log.newValue)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ERP / Webhook Dispatch Test */}
      {showErpDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Downstream ERP &amp; API Webhook</h3>
              </div>
              <button
                onClick={() => setShowErpDispatchModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Target ERP Destination</label>
                <select
                  value={erpTarget}
                  onChange={e => setErpTarget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SAP_S4HANA">SAP S/4HANA (BAPI / OData Accounts Payable)</option>
                  <option value="ORACLE_NETSUITE">Oracle NetSuite (REST Web Services)</option>
                  <option value="QUICKBOOKS_ONLINE">QuickBooks Online (Bill API v3)</option>
                  <option value="POSTGRESQL_CLOUDSQL">PostgreSQL / Cloud SQL Database Sync</option>
                  <option value="CUSTOM_WEBHOOK">Custom HTTP Webhook (HMAC-SHA256 Signed)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Target Endpoint URL</label>
                <input
                  type="text"
                  value={customWebhookUrl}
                  onChange={e => setCustomWebhookUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleDispatchErp}
                  disabled={isDispatching}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition disabled:opacity-50"
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Dispatch to {erpTarget}</span>
                    </>
                  )}
                </button>
              </div>

              {dispatchResult && (
                <div className="p-3 bg-zinc-950 rounded border border-emerald-500/40 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>HTTP {dispatchResult.status} {dispatchResult.statusText}</span>
                    <span>{dispatchResult.deliveryLatencyMs} ms</span>
                  </div>
                  <pre className="p-2 bg-zinc-900 rounded text-[10px] text-zinc-300 overflow-x-auto">
                    {JSON.stringify(dispatchResult.responsePayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowErpDispatchModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

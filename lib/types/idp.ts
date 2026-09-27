export type DocumentType =
  | 'INVOICE'
  | 'PURCHASE_ORDER'
  | 'LEGAL_CONTRACT'
  | 'TAX_FORM_W2'
  | 'MEDICAL_INTAKE'
  | 'IDENTITY_DOCUMENT'
  | 'CUSTOM_FORM';

export type PipelineStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'AUTO_APPROVED'
  | 'NEEDS_REVIEW'
  | 'EXCEPTION_FLAGGED'
  | 'MANUALLY_APPROVED'
  | 'REJECTED'
  | 'OCR_QUALITY_FAILED';

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BoundingBox {
  ymin: number; // 0 to 1000
  xmin: number; // 0 to 1000
  ymax: number; // 0 to 1000
  xmax: number; // 0 to 1000
}

export interface ExtractedField<T = string | number | boolean> {
  key: string;
  label: string;
  value: T;
  confidence: number; // 0.00 to 1.00
  rawSnippet?: string;
  boundingBox?: BoundingBox;
  isEdited?: boolean;
  isHandwritten?: boolean;
  originalValue?: T;
  validationError?: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'enum';
  options?: string[]; // For enum
  required?: boolean;
}

export interface OcrQualityReport {
  passed: boolean;
  overallScore: number; // 0 to 100
  readabilityGrade: 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'UNREADABLE';
  resolutionDpi: number;
  estimatedContrast: number; // 0 to 100
  blurScore: number; // 0 to 100 (lower is sharper)
  skewAngleDegrees: number;
  hasTextContent: boolean;
  reasons: string[];
  discardSuggested: boolean;
  discardReason?: string;
}

export interface ClassificationResult {
  predictedType: DocumentType;
  confidence: number; // 0.00 to 1.00
  modelUsed: string;
  reasoning: string;
  evidenceSignals: string[];
  alternativeMatches?: Array<{ type: DocumentType; confidence: number }>;
}

export interface LineItem {
  id: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  amount: number;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface ValidationRuleResult {
  ruleId: string;
  name: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  passed: boolean;
  fieldPath?: string;
  actualValue?: unknown;
  expectedValue?: unknown;
  message: string;
  autoFixable?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: 'PROCESSED' | 'FIELD_EDITED' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN' | 'REVALIDATED';
  fieldKey?: string;
  oldValue?: unknown;
  newValue?: unknown;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  documentType: DocumentType;
  uploadedAt: string;
  processedAt?: string;
  status: PipelineStatus;
  overallConfidence: number; // 0.00 to 1.00
  
  // Visual preview data
  previewUrl?: string;
  rawText?: string;
  
  // OCR Quality Preprocessing Diagnostic
  ocrQualityReport?: OcrQualityReport;

  // Intelligent Classification
  classification?: ClassificationResult;

  // Structured Extracted Data
  fields: Record<string, ExtractedField>;
  lineItems?: LineItem[];
  
  // Validation Diagnostics
  validationResults: ValidationRuleResult[];
  validationSummary: {
    passedCount: number;
    warningCount: number;
    errorCount: number;
  };
  
  // Performance & Cost Telemetry
  telemetry?: {
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    modelUsed: string;
    ocrEngine: string;
    cached?: boolean;
  };
  
  // Audit and HITL Review history
  auditTrail: AuditLogEntry[];
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Downstream Export / Webhook Delivery Status
  webhookStatus?: 'NOT_SENT' | 'PENDING' | 'DELIVERED' | 'FAILED';
  webhookDestination?: string;
}

export interface ProcessingPipelineOptions {
  confidenceThresholdAutoApprove: number; // default 0.90
  confidenceThresholdReview: number; // default 0.70
  enableDeterministicValidation: boolean;
  enableGroundingCoordinates: boolean;
  documentTypeHint?: DocumentType;
  customSystemPrompt?: string;
}

export interface BatchProcessingStats {
  totalProcessed: number;
  autoApprovedCount: number;
  needsReviewCount: number;
  exceptionCount: number;
  rejectedCount: number;
  averageLatencyMs: number;
  averageConfidence: number;
  stpRate: number; // Straight-Through Processing %
  totalCostUsd: number;
}

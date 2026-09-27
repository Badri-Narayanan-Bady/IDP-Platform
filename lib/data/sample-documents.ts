import { DocumentRecord } from '@/lib/types/idp';
import { runDocumentValidation } from '@/lib/engine/validator';

export const SAMPLE_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-inv-001',
    fileName: 'Acronis_Cloud_Invoice_INV-8920.pdf',
    fileSize: 148200,
    mimeType: 'application/pdf',
    documentType: 'INVOICE',
    uploadedAt: '2026-09-24T14:22:10Z',
    processedAt: '2026-09-24T14:22:13Z',
    status: 'AUTO_APPROVED',
    overallConfidence: 0.98,
    rawText: `ACRONIS CLOUD SYSTEMS INC.
100 Silicon Blvd, Suite 400, San Jose, CA 95134
Tax ID: US-94-3298410 | accounts@acroniscloud.io

INVOICE
Invoice Number: INV-2025-0892
Issue Date: 2025-08-14
Due Date: 2025-09-14
Payment Terms: Net 30
Currency: USD
PO Reference: PO-98421

BILL TO:
Apex Enterprises LLC
742 Evergreen Terrace, Floor 12
New York, NY 10001
Attn: Accounts Payable

LINE ITEMS:
1. Enterprise Cloud Compute Cluster (c6i.32xlarge) - Qty: 4 @ $2,500.00 = $10,000.00
2. Managed Kubernetes Control Plane SLA (Dedicated) - Qty: 1 @ $3,000.00 = $3,000.00
3. Premium 24/7 Enterprise Technical Support - Qty: 1 @ $1,500.00 = $1,500.00

SUMMARY:
Subtotal: $14,500.00
Sales Tax (8.0%): $1,160.00
Shipping & Freight: $0.00
TOTAL DUE: $15,660.00

REMITTANCE / WIRE DETAILS:
Bank: Silicon Valley Commercial Bank
Routing (ABA): 121000358
Account Number: 9840-2109-4412
Swift/IBAN: US89-ACH-021000021-98765432`,
    fields: {
      invoiceNumber: {
        key: 'invoiceNumber',
        label: 'Invoice Number',
        value: 'INV-2025-0892',
        confidence: 0.99,
        rawSnippet: 'Invoice Number: INV-2025-0892',
        boundingBox: { ymin: 120, xmin: 550, ymax: 150, xmax: 880 },
        type: 'text',
        required: true
      },
      vendorName: {
        key: 'vendorName',
        label: 'Vendor / Issuer Name',
        value: 'Acronis Cloud Systems Inc.',
        confidence: 0.99,
        rawSnippet: 'ACRONIS CLOUD SYSTEMS INC.',
        boundingBox: { ymin: 40, xmin: 50, ymax: 80, xmax: 420 },
        type: 'text',
        required: true
      },
      vendorTaxId: {
        key: 'vendorTaxId',
        label: 'Vendor Tax / VAT ID',
        value: 'US-94-3298410',
        confidence: 0.97,
        rawSnippet: 'Tax ID: US-94-3298410',
        boundingBox: { ymin: 82, xmin: 50, ymax: 105, xmax: 280 },
        type: 'text',
        required: false
      },
      customerName: {
        key: 'customerName',
        label: 'Customer / Bill To',
        value: 'Apex Enterprises LLC',
        confidence: 0.98,
        rawSnippet: 'BILL TO:\nApex Enterprises LLC',
        boundingBox: { ymin: 220, xmin: 50, ymax: 270, xmax: 380 },
        type: 'text',
        required: true
      },
      issueDate: {
        key: 'issueDate',
        label: 'Invoice Date',
        value: '2025-08-14',
        confidence: 0.98,
        rawSnippet: 'Issue Date: 2025-08-14',
        boundingBox: { ymin: 155, xmin: 550, ymax: 180, xmax: 780 },
        type: 'date',
        required: true
      },
      dueDate: {
        key: 'dueDate',
        label: 'Payment Due Date',
        value: '2025-09-14',
        confidence: 0.98,
        rawSnippet: 'Due Date: 2025-09-14',
        boundingBox: { ymin: 185, xmin: 550, ymax: 210, xmax: 780 },
        type: 'date',
        required: true
      },
      currency: {
        key: 'currency',
        label: 'Currency',
        value: 'USD',
        confidence: 0.99,
        rawSnippet: 'Currency: USD',
        boundingBox: { ymin: 215, xmin: 550, ymax: 240, xmax: 700 },
        type: 'enum',
        required: true
      },
      subtotal: {
        key: 'subtotal',
        label: 'Subtotal Amount',
        value: 14500.00,
        confidence: 0.99,
        rawSnippet: 'Subtotal: $14,500.00',
        boundingBox: { ymin: 680, xmin: 600, ymax: 710, xmax: 920 },
        type: 'currency',
        required: true
      },
      taxAmount: {
        key: 'taxAmount',
        label: 'Tax Amount',
        value: 1160.00,
        confidence: 0.96,
        rawSnippet: 'Sales Tax (8.0%): $1,160.00',
        boundingBox: { ymin: 715, xmin: 600, ymax: 740, xmax: 920 },
        type: 'currency',
        required: false
      },
      shippingAmount: {
        key: 'shippingAmount',
        label: 'Shipping / Handling',
        value: 0.00,
        confidence: 0.98,
        rawSnippet: 'Shipping & Freight: $0.00',
        boundingBox: { ymin: 745, xmin: 600, ymax: 770, xmax: 920 },
        type: 'currency',
        required: false
      },
      totalAmount: {
        key: 'totalAmount',
        label: 'Total Payable Amount',
        value: 15660.00,
        confidence: 0.99,
        rawSnippet: 'TOTAL DUE: $15,660.00',
        boundingBox: { ymin: 780, xmin: 600, ymax: 820, xmax: 950 },
        type: 'currency',
        required: true
      },
      paymentTerms: {
        key: 'paymentTerms',
        label: 'Payment Terms',
        value: 'Net 30',
        confidence: 0.97,
        rawSnippet: 'Payment Terms: Net 30',
        boundingBox: { ymin: 245, xmin: 550, ymax: 270, xmax: 750 },
        type: 'text',
        required: false
      },
      ibanOrBank: {
        key: 'ibanOrBank',
        label: 'Bank Account / IBAN',
        value: 'US89-ACH-021000021-98765432',
        confidence: 0.96,
        rawSnippet: 'Swift/IBAN: US89-ACH-021000021-98765432',
        boundingBox: { ymin: 910, xmin: 50, ymax: 940, xmax: 450 },
        type: 'text',
        required: false
      },
      purchaseOrderRef: {
        key: 'purchaseOrderRef',
        label: 'PO Reference',
        value: 'PO-98421',
        confidence: 0.98,
        rawSnippet: 'PO Reference: PO-98421',
        boundingBox: { ymin: 275, xmin: 550, ymax: 300, xmax: 750 },
        type: 'text',
        required: false
      }
    },
    lineItems: [
      {
        id: 'li-1',
        itemCode: 'COMP-C6I-32XL',
        description: 'Enterprise Cloud Compute Cluster (c6i.32xlarge)',
        quantity: 4,
        unitPrice: 2500.00,
        taxRate: 8.0,
        amount: 10000.00,
        confidence: 0.99,
        boundingBox: { ymin: 440, xmin: 50, ymax: 480, xmax: 950 }
      },
      {
        id: 'li-2',
        itemCode: 'K8S-DEDICATED',
        description: 'Managed Kubernetes Control Plane SLA (Dedicated)',
        quantity: 1,
        unitPrice: 3000.00,
        taxRate: 8.0,
        amount: 3000.00,
        confidence: 0.98,
        boundingBox: { ymin: 485, xmin: 50, ymax: 525, xmax: 950 }
      },
      {
        id: 'li-3',
        itemCode: 'SUPPORT-ENT-247',
        description: 'Premium 24/7 Enterprise Technical Support',
        quantity: 1,
        unitPrice: 1500.00,
        taxRate: 8.0,
        amount: 1500.00,
        confidence: 0.99,
        boundingBox: { ymin: 530, xmin: 50, ymax: 570, xmax: 950 }
      }
    ],
    validationResults: [],
    validationSummary: { passedCount: 5, warningCount: 0, errorCount: 0 },
    telemetry: {
      latencyMs: 1420,
      promptTokens: 890,
      completionTokens: 310,
      totalTokens: 1200,
      estimatedCostUsd: 0.00038,
      modelUsed: 'gemini-3.8-flash',
      ocrEngine: 'Gemini Multi-Modal Vision'
    },
    auditTrail: [
      {
        id: 'aud-1',
        timestamp: '2026-09-24T14:22:13Z',
        actor: 'DocuFlow Auto-Classifier & Extractor',
        action: 'PROCESSED',
        notes: 'Extracted all 13 fields + 3 line items. STP score 98% passed thresholds.'
      }
    ],
    webhookStatus: 'DELIVERED',
    webhookDestination: 'SAP S/4HANA (AP-Automate-v2)'
  },

  {
    id: 'doc-inv-002-flawed',
    fileName: 'Scan_Vendor_Invoice_Mismatch_X881.pdf',
    fileSize: 310400,
    mimeType: 'application/pdf',
    documentType: 'INVOICE',
    uploadedAt: '2026-09-24T15:04:12Z',
    processedAt: '2026-09-24T15:04:16Z',
    status: 'EXCEPTION_FLAGGED',
    overallConfidence: 0.74,
    rawText: `VERTEX HEAVY HARDWARE SUPPLIES
44 Industrial Parkway, Detroit, MI 48201
INVOICE # VTX-2025-9912
Date: 2025-08-01 | Due: 2025-08-31

Customer: Global Construction Dynamics Corp.
Ship To: Site 4, Job #882, Chicago IL

ITEMS:
- High-Tensile Steel Fasteners M12 (Box of 500) | Qty: 10 @ $120.00 = $1,200.00
- Hydraulic Pressure Valves HV-90 | Qty: 2 @ $625.00 = $1,250.00

Subtotal: $2,450.00
Sales Tax (6.0%): $147.00
Shipping: $85.00
TOTAL PAYABLE: $2,892.00  [Note: Hand-annotated surcharge stamped over print]`,
    fields: {
      invoiceNumber: {
        key: 'invoiceNumber',
        label: 'Invoice Number',
        value: 'VTX-2025-9912',
        confidence: 0.95,
        rawSnippet: 'INVOICE # VTX-2025-9912',
        boundingBox: { ymin: 100, xmin: 500, ymax: 130, xmax: 800 },
        type: 'text',
        required: true
      },
      vendorName: {
        key: 'vendorName',
        label: 'Vendor / Issuer Name',
        value: 'VERTEX HEAVY HARDWARE SUPPLIES',
        confidence: 0.96,
        rawSnippet: 'VERTEX HEAVY HARDWARE SUPPLIES',
        boundingBox: { ymin: 40, xmin: 40, ymax: 75, xmax: 480 },
        type: 'text',
        required: true
      },
      customerName: {
        key: 'customerName',
        label: 'Customer / Bill To',
        value: 'Global Construction Dynamics Corp.',
        confidence: 0.92,
        rawSnippet: 'Customer: Global Construction Dynamics Corp.',
        boundingBox: { ymin: 180, xmin: 40, ymax: 215, xmax: 450 },
        type: 'text',
        required: true
      },
      issueDate: {
        key: 'issueDate',
        label: 'Invoice Date',
        value: '2025-08-01',
        confidence: 0.91,
        rawSnippet: 'Date: 2025-08-01',
        boundingBox: { ymin: 135, xmin: 500, ymax: 160, xmax: 680 },
        type: 'date',
        required: true
      },
      dueDate: {
        key: 'dueDate',
        label: 'Payment Due Date',
        value: '2025-08-31',
        confidence: 0.90,
        rawSnippet: 'Due: 2025-08-31',
        boundingBox: { ymin: 135, xmin: 700, ymax: 160, xmax: 880 },
        type: 'date',
        required: true
      },
      currency: {
        key: 'currency',
        label: 'Currency',
        value: 'USD',
        confidence: 0.95,
        rawSnippet: '$',
        boundingBox: { ymin: 650, xmin: 550, ymax: 680, xmax: 580 },
        type: 'enum',
        required: true
      },
      subtotal: {
        key: 'subtotal',
        label: 'Subtotal Amount',
        value: 2450.00,
        confidence: 0.88,
        rawSnippet: 'Subtotal: $2,450.00',
        boundingBox: { ymin: 620, xmin: 550, ymax: 650, xmax: 850 },
        type: 'currency',
        required: true
      },
      taxAmount: {
        key: 'taxAmount',
        label: 'Tax Amount',
        value: 147.00,
        confidence: 0.85,
        rawSnippet: 'Sales Tax (6.0%): $147.00',
        boundingBox: { ymin: 655, xmin: 550, ymax: 680, xmax: 850 },
        type: 'currency',
        required: false
      },
      shippingAmount: {
        key: 'shippingAmount',
        label: 'Shipping / Handling',
        value: 85.00,
        confidence: 0.82,
        rawSnippet: 'Shipping: $85.00',
        boundingBox: { ymin: 685, xmin: 550, ymax: 710, xmax: 850 },
        type: 'currency',
        required: false
      },
      totalAmount: {
        key: 'totalAmount',
        label: 'Total Payable Amount',
        value: 2892.00,
        confidence: 0.58, // Low confidence due to smudge
        rawSnippet: 'TOTAL PAYABLE: $2,892.00 [surcharge overlay]',
        boundingBox: { ymin: 720, xmin: 550, ymax: 760, xmax: 900 },
        type: 'currency',
        required: true
      },
      paymentTerms: {
        key: 'paymentTerms',
        label: 'Payment Terms',
        value: 'Net 30',
        confidence: 0.86,
        type: 'text',
        required: false
      }
    },
    lineItems: [
      {
        id: 'li-v1',
        itemCode: 'FAST-M12-500',
        description: 'High-Tensile Steel Fasteners M12 (Box of 500)',
        quantity: 10,
        unitPrice: 120.00,
        amount: 1200.00,
        confidence: 0.94,
        boundingBox: { ymin: 400, xmin: 40, ymax: 440, xmax: 900 }
      },
      {
        id: 'li-v2',
        itemCode: 'VALVE-HV-90',
        description: 'Hydraulic Pressure Valves HV-90',
        quantity: 2,
        unitPrice: 625.00,
        amount: 1250.00,
        confidence: 0.92,
        boundingBox: { ymin: 445, xmin: 40, ymax: 485, xmax: 900 }
      }
    ],
    validationResults: [],
    validationSummary: { passedCount: 4, warningCount: 1, errorCount: 2 },
    telemetry: {
      latencyMs: 1680,
      promptTokens: 920,
      completionTokens: 290,
      totalTokens: 1210,
      estimatedCostUsd: 0.00041,
      modelUsed: 'gemini-3.8-flash',
      ocrEngine: 'Gemini Multi-Modal Vision'
    },
    auditTrail: [
      {
        id: 'aud-flaw-1',
        timestamp: '2026-09-24T15:04:16Z',
        actor: 'Cortex Rule Engine',
        action: 'PROCESSED',
        notes: 'Rule MATH_TOTAL_SUM tripped: Subtotal ($2,450.00) + Tax ($147.00) + Shipping ($85.00) = $2,682.00, but printed total is $2,892.00 (Difference: $210.00). Flagged for HITL Review.'
      }
    ],
    webhookStatus: 'PENDING'
  },

  {
    id: 'doc-contract-003',
    fileName: 'Apex_Vanguard_Master_Services_Agreement_2025.pdf',
    fileSize: 485000,
    mimeType: 'application/pdf',
    documentType: 'LEGAL_CONTRACT',
    uploadedAt: '2026-09-24T11:15:00Z',
    processedAt: '2026-09-24T11:15:06Z',
    status: 'NEEDS_REVIEW',
    overallConfidence: 0.91,
    rawText: `MASTER SOFTWARE AS A SERVICE AGREEMENT
This Master Services Agreement ("Agreement") is made and entered into as of June 1, 2025 ("Effective Date"), by and between:
PROVIDER: Vanguard Cloud Solutions Ltd., a Delaware corporation with offices at 500 Market St, Wilmington, DE
CLIENT: Omni Retail Group Corp., a New York corporation with offices at 100 Madison Ave, New York, NY

1. TERM & TERMINATION:
The initial term shall commence on the Effective Date and continue until May 31, 2028 ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive 12-month periods unless either party delivers written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.

2. GOVERNING LAW & JURISDICTION:
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of laws principles.

3. LIMITATION OF LIABILITY:
EXCEPT FOR WILLFUL MISCONDUCT OR BREACH OF CONFIDENTIALITY UNDER SECTION 5, NEITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL EXCEED TWO MILLION DOLLARS ($2,000,000.00 USD) OR THE TOTAL FEES PAID IN THE PRECEDING TWELVE MONTHS.

4. CONFIDENTIALITY:
The recipient shall protect discloser's Confidential Information for a period of five (5) years following termination.

5. INDEMNIFICATION & RISK:
Provider shall defend and indemnify Client against any third-party claims alleging that the SaaS Platform infringes valid US patents or copyrights.`,
    fields: {
      agreementTitle: {
        key: 'agreementTitle',
        label: 'Agreement Title',
        value: 'Master Software as a Service Agreement',
        confidence: 0.99,
        rawSnippet: 'MASTER SOFTWARE AS A SERVICE AGREEMENT',
        boundingBox: { ymin: 30, xmin: 100, ymax: 70, xmax: 900 },
        type: 'text',
        required: true
      },
      partyA: {
        key: 'partyA',
        label: 'First Party (Discloser / Provider)',
        value: 'Vanguard Cloud Solutions Ltd.',
        confidence: 0.98,
        rawSnippet: 'PROVIDER: Vanguard Cloud Solutions Ltd.',
        boundingBox: { ymin: 110, xmin: 50, ymax: 140, xmax: 550 },
        type: 'text',
        required: true
      },
      partyB: {
        key: 'partyB',
        label: 'Second Party (Recipient / Client)',
        value: 'Omni Retail Group Corp.',
        confidence: 0.98,
        rawSnippet: 'CLIENT: Omni Retail Group Corp.',
        boundingBox: { ymin: 145, xmin: 50, ymax: 175, xmax: 550 },
        type: 'text',
        required: true
      },
      effectiveDate: {
        key: 'effectiveDate',
        label: 'Effective Date',
        value: '2025-06-01',
        confidence: 0.97,
        rawSnippet: 'as of June 1, 2025 ("Effective Date")',
        boundingBox: { ymin: 80, xmin: 500, ymax: 105, xmax: 780 },
        type: 'date',
        required: true
      },
      expirationDate: {
        key: 'expirationDate',
        label: 'Expiration / Term End Date',
        value: '2028-05-31',
        confidence: 0.95,
        rawSnippet: 'continue until May 31, 2028',
        boundingBox: { ymin: 240, xmin: 350, ymax: 270, xmax: 600 },
        type: 'date',
        required: false
      },
      governingLaw: {
        key: 'governingLaw',
        label: 'Governing Law / Jurisdiction',
        value: 'State of Delaware, USA',
        confidence: 0.96,
        rawSnippet: 'laws of the State of Delaware',
        boundingBox: { ymin: 340, xmin: 50, ymax: 380, xmax: 750 },
        type: 'text',
        required: true
      },
      liabilityCap: {
        key: 'liabilityCap',
        label: 'Liability Cap / Limitation',
        value: '$2,000,000 USD (or 12x preceding 12 months fees)',
        confidence: 0.94,
        rawSnippet: 'TWO MILLION DOLLARS ($2,000,000.00 USD) OR TOTAL FEES PAID IN PRECEDING TWELVE MONTHS',
        boundingBox: { ymin: 440, xmin: 50, ymax: 500, xmax: 950 },
        type: 'text',
        required: true
      },
      autoRenewal: {
        key: 'autoRenewal',
        label: 'Auto-Renewal Clause',
        value: true,
        confidence: 0.95,
        rawSnippet: 'automatically renew for successive 12-month periods',
        boundingBox: { ymin: 270, xmin: 50, ymax: 300, xmax: 750 },
        type: 'boolean',
        required: true
      },
      noticePeriodDays: {
        key: 'noticePeriodDays',
        label: 'Termination Notice (Days)',
        value: 60,
        confidence: 0.96,
        rawSnippet: 'at least sixty (60) days prior',
        boundingBox: { ymin: 300, xmin: 500, ymax: 325, xmax: 800 },
        type: 'number',
        required: false
      },
      confidentialityTermYears: {
        key: 'confidentialityTermYears',
        label: 'Confidentiality Term (Years)',
        value: 5,
        confidence: 0.93,
        rawSnippet: 'period of five (5) years following termination',
        boundingBox: { ymin: 580, xmin: 50, ymax: 610, xmax: 700 },
        type: 'number',
        required: false
      },
      riskLevel: {
        key: 'riskLevel',
        label: 'Contract Risk Classification',
        value: 'MODERATE',
        confidence: 0.89,
        options: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
        type: 'enum',
        required: true
      },
      keyRiskSummary: {
        key: 'keyRiskSummary',
        label: 'Key Risk Summary / Red Flags',
        value: 'Uncapped liability for breach of confidentiality and willful misconduct. Standard 60-day auto-renewal notification deadline requires calendar alert.',
        confidence: 0.88,
        type: 'text',
        required: false
      }
    },
    validationResults: [],
    validationSummary: { passedCount: 6, warningCount: 0, errorCount: 0 },
    telemetry: {
      latencyMs: 1840,
      promptTokens: 1140,
      completionTokens: 420,
      totalTokens: 1560,
      estimatedCostUsd: 0.00052,
      modelUsed: 'gemini-3.8-flash',
      ocrEngine: 'Gemini Multi-Modal Vision'
    },
    auditTrail: [
      {
        id: 'aud-c3',
        timestamp: '2026-09-24T11:15:06Z',
        actor: 'Cortex Contract Analyzer',
        action: 'PROCESSED',
        notes: 'Extracted legal parameters and liability covenants. Flagged for paralegal validation.'
      }
    ],
    webhookStatus: 'NOT_SENT'
  },

  {
    id: 'doc-w2-004',
    fileName: 'IRS_Form_W2_Wage_Tax_Statement_2024.pdf',
    fileSize: 220000,
    mimeType: 'application/pdf',
    documentType: 'TAX_FORM_W2',
    uploadedAt: '2026-09-24T09:40:00Z',
    processedAt: '2026-09-24T09:40:03Z',
    status: 'AUTO_APPROVED',
    overallConfidence: 0.97,
    rawText: `Form W-2 Wage and Tax Statement 2024
Department of the Treasury - Internal Revenue Service

a Employee's social security number: XXX-XX-8492
b Employer identification number (EIN): 12-3456789
c Employer's name, address, and ZIP code:
Starlight Tech Industries Inc., 100 Technology Plaza, San Francisco, CA 94105
d Control number: CTL-991823-A
e Employee's first name and initial, Last name: Elena Ramirez
f Employee's address and ZIP code: 420 Mission Blvd, San Francisco, CA 94103

Box 1 Wages, tips, other comp.: $142,500.00
Box 2 Federal income tax withheld: $28,940.00
Box 3 Social security wages: $142,500.00
Box 4 Social security tax withheld: $8,835.00
Box 5 Medicare wages and tips: $142,500.00
Box 6 Medicare tax withheld: $2,066.25
Box 15 State: CA  Employer's state ID: 891-2394-1
Box 16 State wages, tips, etc.: $142,500.00
Box 17 State income tax: $10,450.00`,
    fields: {
      taxYear: { key: 'taxYear', label: 'Tax Year', value: 2024, confidence: 0.99, type: 'number', required: true },
      employeeSsnMasked: { key: 'employeeSsnMasked', label: 'Employee SSN (Masked)', value: 'XXX-XX-8492', confidence: 0.99, type: 'text', required: true },
      employerEin: { key: 'employerEin', label: 'Employer Identification No. (EIN)', value: '12-3456789', confidence: 0.98, type: 'text', required: true },
      employerName: { key: 'employerName', label: 'Employer Legal Name', value: 'Starlight Tech Industries Inc.', confidence: 0.98, type: 'text', required: true },
      employeeName: { key: 'employeeName', label: 'Employee Full Name', value: 'Elena Ramirez', confidence: 0.99, type: 'text', required: true },
      box1Wages: { key: 'box1Wages', label: 'Box 1: Wages, Tips, Other Comp', value: 142500.00, confidence: 0.99, type: 'currency', required: true },
      box2FedTaxWithheld: { key: 'box2FedTaxWithheld', label: 'Box 2: Fed Income Tax Withheld', value: 28940.00, confidence: 0.98, type: 'currency', required: true },
      box3SocSecWages: { key: 'box3SocSecWages', label: 'Box 3: Social Security Wages', value: 142500.00, confidence: 0.98, type: 'currency', required: true },
      box4SocSecTax: { key: 'box4SocSecTax', label: 'Box 4: Social Security Tax Withheld', value: 8835.00, confidence: 0.98, type: 'currency', required: true },
      box5MedicareWages: { key: 'box5MedicareWages', label: 'Box 5: Medicare Wages & Tips', value: 142500.00, confidence: 0.98, type: 'currency', required: true },
      box6MedicareTax: { key: 'box6MedicareTax', label: 'Box 6: Medicare Tax Withheld', value: 2066.25, confidence: 0.98, type: 'currency', required: true },
      box15State: { key: 'box15State', label: 'Box 15: State', value: 'CA', confidence: 0.99, type: 'text', required: false },
      box16StateWages: { key: 'box16StateWages', label: 'Box 16: State Wages', value: 142500.00, confidence: 0.97, type: 'currency', required: false },
      box17StateTax: { key: 'box17StateTax', label: 'Box 17: State Income Tax', value: 10450.00, confidence: 0.97, type: 'currency', required: false }
    },
    validationResults: [],
    validationSummary: { passedCount: 5, warningCount: 0, errorCount: 0 },
    telemetry: {
      latencyMs: 1310,
      promptTokens: 810,
      completionTokens: 260,
      totalTokens: 1070,
      estimatedCostUsd: 0.00034,
      modelUsed: 'gemini-3.8-flash',
      ocrEngine: 'Gemini Multi-Modal Vision'
    },
    auditTrail: [
      {
        id: 'aud-w2',
        timestamp: '2026-09-24T09:40:03Z',
        actor: 'Cortex Tax Parser',
        action: 'PROCESSED',
        notes: 'Verified FICA 6.2% and 1.45% withholding rates. Masked SSN compliance verified.'
      }
    ],
    webhookStatus: 'DELIVERED',
    webhookDestination: 'Workday HR Payroll System'
  },

  {
    id: 'doc-med-005',
    fileName: 'Patient_Intake_HIPAA_Jonathan_Sterling.pdf',
    fileSize: 195000,
    mimeType: 'application/pdf',
    documentType: 'MEDICAL_INTAKE',
    uploadedAt: '2026-09-24T08:12:00Z',
    processedAt: '2026-09-24T08:12:04Z',
    status: 'AUTO_APPROVED',
    overallConfidence: 0.96,
    rawText: `CASCADE REGIONAL MEDICAL CENTER
PATIENT REGISTRATION & CLINICAL INTAKE

Patient Full Name: Jonathan Sterling
Date of Birth: 1988-11-23 | Gender: Male | Contact Phone: (555) 234-8901
Address: 812 Pine Street, Apt 4B, Seattle, WA 98101

INSURANCE INFORMATION:
Carrier: Blue Cross Blue Shield Gold PPO
Member Policy ID: BCBS-90418420-01
Group Number: GRP-88319
Primary Care Physician: Dr. Sarah Chen, MD

CLINICAL HISTORY:
Known Allergies: Penicillin (Severe Anaphylaxis), Shellfish (Mild hives)
Current Medications: Lisinopril 10mg daily, Multivitamin
Emergency Contact: Claire Sterling (Spouse) - (555) 234-8902

CONSENT & AUTHORIZATION:
[X] I authorize treatment and disclosure of health records in accordance with HIPAA standards.
Signature: Jonathan Sterling (Electronically signed 2025-08-10)`,
    fields: {
      patientName: { key: 'patientName', label: 'Patient Full Name', value: 'Jonathan Sterling', confidence: 0.99, type: 'text', required: true },
      dob: { key: 'dob', label: 'Date of Birth', value: '1988-11-23', confidence: 0.98, type: 'date', required: true },
      gender: { key: 'gender', label: 'Gender / Pronouns', value: 'Male', confidence: 0.98, type: 'enum', required: false },
      phone: { key: 'phone', label: 'Phone Number', value: '(555) 234-8901', confidence: 0.97, type: 'text', required: true },
      insuranceProvider: { key: 'insuranceProvider', label: 'Insurance Provider', value: 'Blue Cross Blue Shield Gold PPO', confidence: 0.98, type: 'text', required: true },
      policyNumber: { key: 'policyNumber', label: 'Member / Policy ID', value: 'BCBS-90418420-01', confidence: 0.99, type: 'text', required: true },
      groupNumber: { key: 'groupNumber', label: 'Group Number', value: 'GRP-88319', confidence: 0.96, type: 'text', required: false },
      primaryPhysician: { key: 'primaryPhysician', label: 'Primary Care Physician', value: 'Dr. Sarah Chen, MD', confidence: 0.97, type: 'text', required: false },
      knownAllergies: { key: 'knownAllergies', label: 'Known Allergies', value: 'Penicillin (Severe Anaphylaxis), Shellfish (Mild hives)', confidence: 0.95, type: 'text', required: true },
      currentMedications: { key: 'currentMedications', label: 'Current Medications', value: 'Lisinopril 10mg daily, Multivitamin', confidence: 0.95, type: 'text', required: false },
      emergencyContact: { key: 'emergencyContact', label: 'Emergency Contact Name & Phone', value: 'Claire Sterling (Spouse) - (555) 234-8902', confidence: 0.96, type: 'text', required: true },
      consentSigned: { key: 'consentSigned', label: 'Treatment & HIPAA Consent Signed', value: true, confidence: 0.99, type: 'boolean', required: true }
    },
    validationResults: [],
    validationSummary: { passedCount: 4, warningCount: 0, errorCount: 0 },
    telemetry: {
      latencyMs: 1250,
      promptTokens: 750,
      completionTokens: 240,
      totalTokens: 990,
      estimatedCostUsd: 0.00031,
      modelUsed: 'gemini-3.8-flash',
      ocrEngine: 'Gemini Multi-Modal Vision'
    },
    auditTrail: [
      {
        id: 'aud-med',
        timestamp: '2026-09-24T08:12:04Z',
        actor: 'Cortex EHR Ingestion',
        action: 'PROCESSED',
        notes: 'Severe Penicillin allergy highlighted. Electronic consent validated.'
      }
    ],
    webhookStatus: 'DELIVERED',
    webhookDestination: 'Epic Systems EHR (HL7/FHIR Gateway)'
  },

  {
    id: 'doc-id-006',
    fileName: 'US_Passport_KYC_Alexander_Vance.pdf',
    fileSize: 310000,
    mimeType: 'application/pdf',
    documentType: 'IDENTITY_DOCUMENT',
    uploadedAt: '2026-09-24T07:45:00Z',
    processedAt: '2026-09-24T07:45:04Z',
    status: 'AUTO_APPROVED',
    overallConfidence: 0.99,
    classification: {
      predictedType: 'IDENTITY_DOCUMENT',
      confidence: 0.99,
      modelUsed: 'gemini-3.8-flash (Multi-Modal Vision)',
      reasoning: 'Zero-shot classification: Detected official passport header, MRZ (Machine Readable Zone) checksums, biometric photograph location, and Department of State seal.',
      evidenceSignals: ['MRZ 2-line machine readable zone detected', 'Issuing state: United States of America', 'Document number format conforms to ICAO Doc 9303']
    },
    ocrQualityReport: {
      passed: true,
      overallScore: 98,
      readabilityGrade: 'EXCELLENT',
      resolutionDpi: 300,
      estimatedContrast: 92,
      blurScore: 8,
      skewAngleDegrees: 0.1,
      hasTextContent: true,
      reasons: ['High-contrast KYC scan', 'Valid MRZ character segmentation', 'Facial and biometric bounds verified'],
      discardSuggested: false
    },
    rawText: `UNITED STATES OF AMERICA
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

P<USAVANCE<<ALEXANDER<MICHAEL<<<<<<<<<<<<<<<
P984210985USA9005148M3005142<<<<<<<<<<<<<<04`,
    fields: {
      documentCategory: { key: 'documentCategory', label: 'Document Category', value: 'Passport', confidence: 0.99, type: 'enum', required: true },
      idNumber: { key: 'idNumber', label: 'ID / Document Number', value: 'P98421098', confidence: 0.99, rawSnippet: 'Passport No: P98421098', boundingBox: { ymin: 140, xmin: 680, ymax: 175, xmax: 920 }, type: 'text', required: true },
      fullName: { key: 'fullName', label: 'Full Legal Name', value: 'ALEXANDER MICHAEL VANCE', confidence: 0.99, rawSnippet: 'Surname: VANCE\nGiven Names: ALEXANDER MICHAEL', boundingBox: { ymin: 210, xmin: 290, ymax: 270, xmax: 820 }, type: 'text', required: true },
      dateOfBirth: { key: 'dateOfBirth', label: 'Date of Birth', value: '1990-05-14', confidence: 0.98, rawSnippet: 'Date of Birth: 14 MAY 1990', boundingBox: { ymin: 310, xmin: 290, ymax: 340, xmax: 560 }, type: 'date', required: true },
      expirationDate: { key: 'expirationDate', label: 'Expiration Date', value: '2030-05-14', confidence: 0.99, rawSnippet: 'Date of Expiration: 14 MAY 2030', boundingBox: { ymin: 410, xmin: 290, ymax: 440, xmax: 560 }, type: 'date', required: true },
      issueDate: { key: 'issueDate', label: 'Issue Date', value: '2020-05-15', confidence: 0.97, rawSnippet: 'Date of Issue: 15 MAY 2020', boundingBox: { ymin: 380, xmin: 290, ymax: 410, xmax: 560 }, type: 'date', required: false },
      issuingCountry: { key: 'issuingCountry', label: 'Issuing Country / Authority', value: 'United States of America', confidence: 0.99, rawSnippet: 'UNITED STATES OF AMERICA', boundingBox: { ymin: 30, xmin: 250, ymax: 65, xmax: 750 }, type: 'text', required: true },
      nationality: { key: 'nationality', label: 'Nationality / Citizenship', value: 'USA', confidence: 0.98, rawSnippet: 'Nationality: UNITED STATES OF AMERICA', boundingBox: { ymin: 280, xmin: 290, ymax: 305, xmax: 560 }, type: 'text', required: false },
      residentialAddress: { key: 'residentialAddress', label: 'Residential Address', value: '104 Beacon Hill Lane, Boston, MA 02108', confidence: 0.94, isHandwritten: true, rawSnippet: '[Bearer handwritten endorsement in passport emergency block]: 104 Beacon Hill Lane, Boston, MA', boundingBox: { ymin: 520, xmin: 150, ymax: 570, xmax: 850 }, type: 'text', required: false },
      mrzCode: { key: 'mrzCode', label: 'MRZ / Barcode Data', value: 'P<USAVANCE<<ALEXANDER<MICHAEL<<<<<<<<<<<<<<<\nP984210985USA9005148M3005142<<<<<<<<<<<<<<04', confidence: 0.99, rawSnippet: 'P<USAVANCE<<ALEXANDER<MICHAEL<<<<<<<<<<<<<<<\nP984210985USA9005148M3005142<<<<<<<<<<<<<<04', boundingBox: { ymin: 800, xmin: 40, ymax: 950, xmax: 960 }, type: 'text', required: false }
    },
    validationResults: [],
    validationSummary: { passedCount: 4, warningCount: 0, errorCount: 0 },
    telemetry: {
      latencyMs: 1120,
      promptTokens: 710,
      completionTokens: 290,
      totalTokens: 1000,
      estimatedCostUsd: 0.00031,
      modelUsed: 'gemini-3.8-flash',
      ocrEngine: 'Gemini Multi-Modal Vision'
    },
    auditTrail: [
      {
        id: 'aud-kyc-1',
        timestamp: '2026-09-24T07:45:04Z',
        actor: 'Cortex KYC Engine (gemini-3.8-flash)',
        action: 'PROCESSED',
        notes: 'Handwritten address annotation detected on passport endorsement page. MRZ checksum passed.'
      }
    ],
    webhookStatus: 'DELIVERED',
    webhookDestination: 'Jumio / Stripe Identity KYC Gateway'
  },

  {
    id: 'doc-blur-007',
    fileName: 'Unreadable_Smudged_Scan_Discharge.jpg',
    fileSize: 3200,
    mimeType: 'image/jpeg',
    documentType: 'CUSTOM_FORM',
    uploadedAt: '2026-09-24T06:30:00Z',
    processedAt: '2026-09-24T06:30:01Z',
    status: 'OCR_QUALITY_FAILED',
    overallConfidence: 0.22,
    classification: {
      predictedType: 'CUSTOM_FORM',
      confidence: 0.24,
      modelUsed: 'Preprocessing OCR Gating',
      reasoning: 'Early Gating Alert: File discarded prior to model inference due to extreme blur and sub-threshold resolution.',
      evidenceSignals: ['Resolution < 100 DPI', 'Severe gaussian blur detected', 'Zero legible semantic tokens']
    },
    ocrQualityReport: {
      passed: false,
      overallScore: 28,
      readabilityGrade: 'UNREADABLE',
      resolutionDpi: 72,
      estimatedContrast: 22,
      blurScore: 89,
      skewAngleDegrees: 14.8,
      hasTextContent: false,
      reasons: [
        'Image resolution is 72 DPI (minimum 150 DPI required for character segmentation)',
        'Severe optical blur (blur score 89/100) renders glyphs indistinct',
        'Payload size < 4 KB indicating corrupted or blank scan'
      ],
      discardSuggested: true,
      discardReason: 'CRITICAL_DISCARD: Scanned image resolution is 72 DPI with severe blur. Ingestion halted early before expensive model execution.'
    },
    rawText: `[UNREADABLE ARTIFACTS DETECTED - OCR QUALITY GATE HALTED EXECUTION]`,
    fields: {
      documentTitle: { key: 'documentTitle', label: 'Document Title', value: 'Unreadable Scanned File', confidence: 0.20, type: 'text', required: true },
      referenceNumber: { key: 'referenceNumber', label: 'Reference / Serial ID', value: '', confidence: 0.0, type: 'text', required: true },
      entityName: { key: 'entityName', label: 'Primary Entity / Organization', value: '', confidence: 0.0, type: 'text', required: true },
      documentDate: { key: 'documentDate', label: 'Document Date', value: '', confidence: 0.0, type: 'date', required: true }
    },
    validationResults: [],
    validationSummary: { passedCount: 0, warningCount: 1, errorCount: 3 },
    telemetry: {
      latencyMs: 85,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0.00000,
      modelUsed: 'OCR Quality Guard (Early Discard)',
      ocrEngine: 'Deterministic Pre-screener'
    },
    auditTrail: [
      {
        id: 'aud-blur-1',
        timestamp: '2026-09-24T06:30:01Z',
        actor: 'Cortex Preprocessing Gating',
        action: 'REJECTED',
        notes: 'File discarded early. Failed automatic OCR quality checks (Score: 28/100, Grade: UNREADABLE).'
      }
    ],
    webhookStatus: 'NOT_SENT'
  }
];

import { assessOcrQuality } from '@/lib/engine/ocr-quality';

// Initialize sample documents with validation rules, default classification & OCR quality
SAMPLE_DOCUMENTS.forEach(doc => {
  const v = runDocumentValidation(doc.documentType, doc.fields, doc.lineItems);
  doc.validationResults = v.results;
  doc.validationSummary = v.summary;

  if (!doc.ocrQualityReport) {
    doc.ocrQualityReport = assessOcrQuality({
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      text: doc.rawText,
      fileSizeBytes: doc.fileSize,
    });
  }

  if (!doc.classification) {
    doc.classification = {
      predictedType: doc.documentType,
      confidence: doc.overallConfidence,
      modelUsed: doc.telemetry?.modelUsed || 'gemini-3.8-flash',
      reasoning: `Zero-shot intelligent classification categorized as ${doc.documentType} based on document ontology and semantic text extraction.`,
      evidenceSignals: [`Semantic tokens match ${doc.documentType} domain`, 'Header and structure align with industry schema'],
    };
  }
});

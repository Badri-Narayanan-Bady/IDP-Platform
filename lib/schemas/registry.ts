import { DocumentType } from '@/lib/types/idp';

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'enum';
  description: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
  exampleValue?: string | number | boolean;
  pattern?: string; // Regex string for validation
}

export interface DocumentSchemaConfig {
  type: DocumentType;
  displayName: string;
  description: string;
  category: string;
  supportsLineItems: boolean;
  fields: FieldDefinition[];
  defaultValidationRules: string[];
}

export const DOCUMENT_SCHEMAS: Record<DocumentType, DocumentSchemaConfig> = {
  INVOICE: {
    type: 'INVOICE',
    displayName: 'Commercial Invoice & Bill',
    description: 'B2B/B2C accounts payable invoices with vendor details, line items, tax breakdown, and remittance terms.',
    category: 'Finance & Accounts Payable',
    supportsLineItems: true,
    fields: [
      { key: 'invoiceNumber', label: 'Invoice Number', type: 'text', description: 'Unique identifier for the invoice', required: true, exampleValue: 'INV-2025-0892' },
      { key: 'vendorName', label: 'Vendor / Issuer Name', type: 'text', description: 'Legal company name issuing the invoice', required: true, exampleValue: 'Acronis Cloud Systems Inc.' },
      { key: 'vendorTaxId', label: 'Vendor Tax / VAT ID', type: 'text', description: 'Tax registration number or EIN', required: false, exampleValue: 'US-94-3298410' },
      { key: 'customerName', label: 'Customer / Bill To', type: 'text', description: 'Client or recipient organization name', required: true, exampleValue: 'Apex Enterprises LLC' },
      { key: 'issueDate', label: 'Invoice Date', type: 'date', description: 'Date the invoice was officially generated (YYYY-MM-DD)', required: true, exampleValue: '2025-08-14' },
      { key: 'dueDate', label: 'Payment Due Date', type: 'date', description: 'Settlement deadline (YYYY-MM-DD)', required: true, exampleValue: '2025-09-14' },
      { key: 'currency', label: 'Currency', type: 'enum', description: '3-letter ISO currency code', required: true, options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD'], exampleValue: 'USD' },
      { key: 'subtotal', label: 'Subtotal Amount', type: 'currency', description: 'Pre-tax line item total sum', required: true, exampleValue: 14500.00 },
      { key: 'taxAmount', label: 'Tax Amount', type: 'currency', description: 'Applicable sales tax, VAT, or GST', required: false, exampleValue: 1160.00 },
      { key: 'shippingAmount', label: 'Shipping / Handling', type: 'currency', description: 'Freight or handling fees', required: false, exampleValue: 0.00 },
      { key: 'totalAmount', label: 'Total Payable Amount', type: 'currency', description: 'Final balance due including tax and freight', required: true, exampleValue: 15660.00 },
      { key: 'paymentTerms', label: 'Payment Terms', type: 'text', description: 'Credit terms (e.g. Net 30, Due on Receipt)', required: false, exampleValue: 'Net 30' },
      { key: 'ibanOrBank', label: 'Bank Account / IBAN', type: 'text', description: 'Direct wire or ACH routing details', required: false, exampleValue: 'US89-ACH-021000021-98765432' },
      { key: 'purchaseOrderRef', label: 'PO Reference', type: 'text', description: 'Associated customer purchase order number', required: false, exampleValue: 'PO-98421' }
    ],
    defaultValidationRules: ['MATH_SUM_CHECK', 'DATE_ORDER_CHECK', 'REQUIRED_FIELDS', 'CURRENCY_CONSISTENCY']
  },

  PURCHASE_ORDER: {
    type: 'PURCHASE_ORDER',
    displayName: 'Purchase Order (PO)',
    description: 'Procurement requisition authorizing purchase with shipping addresses, terms, and itemized catalog lines.',
    category: 'Procurement & Supply Chain',
    supportsLineItems: true,
    fields: [
      { key: 'poNumber', label: 'PO Number', type: 'text', description: 'Official purchase order tracking ID', required: true, exampleValue: 'PO-2025-4491' },
      { key: 'buyerName', label: 'Buyer Organization', type: 'text', description: 'Purchasing entity legal name', required: true, exampleValue: 'Nexus BioPharma Global' },
      { key: 'vendorName', label: 'Vendor / Supplier', type: 'text', description: 'Target supplier name', required: true, exampleValue: 'Precision Optics Lab Equipment' },
      { key: 'orderDate', label: 'Order Date', type: 'date', description: 'Date the order was placed (YYYY-MM-DD)', required: true, exampleValue: '2025-07-20' },
      { key: 'deliveryDate', label: 'Expected Delivery Date', type: 'date', description: 'Promised delivery schedule (YYYY-MM-DD)', required: false, exampleValue: '2025-08-05' },
      { key: 'shippingAddress', label: 'Shipping Address', type: 'text', description: 'Destination dock / facility location', required: true, exampleValue: '450 Innovation Way, Suite 300, Boston, MA 02110' },
      { key: 'billingAddress', label: 'Billing Address', type: 'text', description: 'Invoice recipient address', required: false, exampleValue: 'PO Box 9801, Accounts Payable, Boston, MA 02110' },
      { key: 'currency', label: 'Currency', type: 'enum', description: 'ISO currency code', required: true, options: ['USD', 'EUR', 'GBP', 'CAD', 'JPY'], exampleValue: 'USD' },
      { key: 'subtotal', label: 'Subtotal Amount', type: 'currency', description: 'Gross order sum', required: true, exampleValue: 28400.00 },
      { key: 'taxAmount', label: 'Tax Amount', type: 'currency', description: 'Estimated tax', required: false, exampleValue: 1704.00 },
      { key: 'totalAmount', label: 'Total PO Value', type: 'currency', description: 'Authorized PO cap amount', required: true, exampleValue: 30104.00 },
      { key: 'requisitioner', label: 'Requisitioner / Authorizer', type: 'text', description: 'Staff member authoring request', required: false, exampleValue: 'Dr. Marcus Vance (Head of R&D)' }
    ],
    defaultValidationRules: ['MATH_SUM_CHECK', 'DATE_ORDER_CHECK', 'REQUIRED_FIELDS']
  },

  LEGAL_CONTRACT: {
    type: 'LEGAL_CONTRACT',
    displayName: 'Legal Contract & MSA',
    description: 'Master Services Agreements, Non-Disclosure Agreements, and SLA contracts with clause & liability risk analysis.',
    category: 'Legal & Compliance',
    supportsLineItems: false,
    fields: [
      { key: 'agreementTitle', label: 'Agreement Title', type: 'text', description: 'Formal name of the contract', required: true, exampleValue: 'Master Software as a Service Agreement' },
      { key: 'partyA', label: 'First Party (Discloser / Provider)', type: 'text', description: 'Primary contracting organization', required: true, exampleValue: 'Vanguard Cloud Solutions Ltd.' },
      { key: 'partyB', label: 'Second Party (Recipient / Client)', type: 'text', description: 'Secondary contracting entity', required: true, exampleValue: 'Omni Retail Group Corp.' },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', description: 'Date contract becomes binding (YYYY-MM-DD)', required: true, exampleValue: '2025-06-01' },
      { key: 'expirationDate', label: 'Expiration / Term End Date', type: 'date', description: 'Termination or initial term end date (YYYY-MM-DD)', required: false, exampleValue: '2028-05-31' },
      { key: 'governingLaw', label: 'Governing Law / Jurisdiction', type: 'text', description: 'State, country, or arbitration venue', required: true, exampleValue: 'State of Delaware, USA' },
      { key: 'liabilityCap', label: 'Liability Cap / Limitation', type: 'text', description: 'Maximum damage ceiling / liability multiple', required: true, exampleValue: '$2,000,000 USD (or 12x monthly fees)' },
      { key: 'autoRenewal', label: 'Auto-Renewal Clause', type: 'boolean', description: 'Does agreement auto-renew unless notice given?', required: true, exampleValue: true },
      { key: 'noticePeriodDays', label: 'Termination Notice (Days)', type: 'number', description: 'Required cancellation notice window in days', required: false, exampleValue: 60 },
      { key: 'confidentialityTermYears', label: 'Confidentiality Term (Years)', type: 'number', description: 'Duration NDA obligations survive post-termination', required: false, exampleValue: 5 },
      { key: 'riskLevel', label: 'Contract Risk Classification', type: 'enum', description: 'Assessed compliance & indemnity risk posture', required: true, options: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], exampleValue: 'MODERATE' },
      { key: 'keyRiskSummary', label: 'Key Risk Summary / Red Flags', type: 'text', description: 'Highlighted uncapped liabilities, non-solicits, or IP assignment flags', required: false, exampleValue: 'Broad indemnification clause for third-party IP claims; uncapped liability for data breach willful misconduct.' }
    ],
    defaultValidationRules: ['DATE_ORDER_CHECK', 'REQUIRED_FIELDS']
  },

  TAX_FORM_W2: {
    type: 'TAX_FORM_W2',
    displayName: 'IRS Form W-2 (Wage & Tax)',
    description: 'United States Internal Revenue Service employee annual wage and withheld tax statement.',
    category: 'HR & Payroll Tax',
    supportsLineItems: false,
    fields: [
      { key: 'taxYear', label: 'Tax Year', type: 'number', description: 'Reporting calendar year', required: true, exampleValue: 2024 },
      { key: 'employeeSsnMasked', label: 'Employee SSN (Masked)', type: 'text', description: 'Social security number (masked format: XXX-XX-1234)', required: true, exampleValue: 'XXX-XX-8492' },
      { key: 'employerEin', label: 'Employer Identification No. (EIN)', type: 'text', description: 'Federal EIN (format: XX-XXXXXXX)', required: true, exampleValue: '12-3456789' },
      { key: 'employerName', label: 'Employer Legal Name', type: 'text', description: 'Company name and address', required: true, exampleValue: 'Starlight Tech Industries Inc.' },
      { key: 'employeeName', label: 'Employee Full Name', type: 'text', description: 'First, Middle, Last name of employee', required: true, exampleValue: 'Elena Ramirez' },
      { key: 'box1Wages', label: 'Box 1: Wages, Tips, Other Comp', type: 'currency', description: 'Federal taxable wage total', required: true, exampleValue: 142500.00 },
      { key: 'box2FedTaxWithheld', label: 'Box 2: Fed Income Tax Withheld', type: 'currency', description: 'Federal income tax deducted', required: true, exampleValue: 28940.00 },
      { key: 'box3SocSecWages', label: 'Box 3: Social Security Wages', type: 'currency', description: 'Social security wage base', required: true, exampleValue: 142500.00 },
      { key: 'box4SocSecTax', label: 'Box 4: Social Security Tax Withheld', type: 'currency', description: '6.2% SS tax withheld', required: true, exampleValue: 8835.00 },
      { key: 'box5MedicareWages', label: 'Box 5: Medicare Wages & Tips', type: 'currency', description: 'Medicare wage base', required: true, exampleValue: 142500.00 },
      { key: 'box6MedicareTax', label: 'Box 6: Medicare Tax Withheld', type: 'currency', description: '1.45% Medicare tax withheld', required: true, exampleValue: 2066.25 },
      { key: 'box15State', label: 'Box 15: State', type: 'text', description: '2-letter state code', required: false, exampleValue: 'CA' },
      { key: 'box16StateWages', label: 'Box 16: State Wages', type: 'currency', description: 'State taxable wages', required: false, exampleValue: 142500.00 },
      { key: 'box17StateTax', label: 'Box 17: State Income Tax', type: 'currency', description: 'State tax withheld', required: false, exampleValue: 10450.00 }
    ],
    defaultValidationRules: ['TAX_W2_MATH_CHECK', 'REQUIRED_FIELDS', 'EIN_FORMAT_CHECK']
  },

  MEDICAL_INTAKE: {
    type: 'MEDICAL_INTAKE',
    displayName: 'Medical Intake & HIPAA Form',
    description: 'Patient demographic, emergency contact, insurance policy, and clinical allergy intake sheet.',
    category: 'Healthcare & Clinical',
    supportsLineItems: false,
    fields: [
      { key: 'patientName', label: 'Patient Full Name', type: 'text', description: 'Legal name of patient', required: true, exampleValue: 'Jonathan Sterling' },
      { key: 'dob', label: 'Date of Birth', type: 'date', description: 'Patient birthdate (YYYY-MM-DD)', required: true, exampleValue: '1988-11-23' },
      { key: 'gender', label: 'Gender / Pronouns', type: 'enum', description: 'Gender identity', required: false, options: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer Not to Say'], exampleValue: 'Male' },
      { key: 'phone', label: 'Phone Number', type: 'text', description: 'Primary contact phone', required: true, exampleValue: '(555) 234-8901' },
      { key: 'insuranceProvider', label: 'Insurance Provider', type: 'text', description: 'Health plan carrier name', required: true, exampleValue: 'Blue Cross Blue Shield Gold PPO' },
      { key: 'policyNumber', label: 'Member / Policy ID', type: 'text', description: 'Insurance subscriber member ID', required: true, exampleValue: 'BCBS-90418420-01' },
      { key: 'groupNumber', label: 'Group Number', type: 'text', description: 'Insurance employer group ID', required: false, exampleValue: 'GRP-88319' },
      { key: 'primaryPhysician', label: 'Primary Care Physician', type: 'text', description: 'Referring or primary doctor', required: false, exampleValue: 'Dr. Sarah Chen, MD' },
      { key: 'knownAllergies', label: 'Known Allergies', type: 'text', description: 'Drug, food, or environmental allergies', required: true, exampleValue: 'Penicillin (Anaphylaxis), Shellfish (Mild hives)' },
      { key: 'currentMedications', label: 'Current Medications', type: 'text', description: 'Prescription and OTC medicines', required: false, exampleValue: 'Lisinopril 10mg daily, Multivitamin' },
      { key: 'emergencyContact', label: 'Emergency Contact Name & Phone', type: 'text', description: 'Next of kin or guardian contact', required: true, exampleValue: 'Claire Sterling (Spouse) - (555) 234-8902' },
      { key: 'consentSigned', label: 'Treatment & HIPAA Consent Signed', type: 'boolean', description: 'Did patient sign the authorization block?', required: true, exampleValue: true }
    ],
    defaultValidationRules: ['REQUIRED_FIELDS', 'HIPAA_CONSENT_CHECK']
  },

  IDENTITY_DOCUMENT: {
    type: 'IDENTITY_DOCUMENT',
    displayName: 'Identity Document / ID / Passport',
    description: 'Driver licenses, national IDs, and passports with OCR, MRZ zone validation, and date verification.',
    category: 'Identity & KYC Verification',
    supportsLineItems: false,
    fields: [
      { key: 'documentCategory', label: 'Document Category', type: 'enum', description: 'Type of ID document', required: true, options: ['Passport', 'Driver License', 'National ID Card', 'State ID'], exampleValue: 'Passport' },
      { key: 'idNumber', label: 'ID / Document Number', type: 'text', description: 'Unique document or passport number', required: true, exampleValue: 'P98421098' },
      { key: 'fullName', label: 'Full Legal Name', type: 'text', description: 'Bearer full legal name', required: true, exampleValue: 'Alexander Michael Vance' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', description: 'Birthdate (YYYY-MM-DD)', required: true, exampleValue: '1990-05-14' },
      { key: 'expirationDate', label: 'Expiration Date', type: 'date', description: 'Document validity expiration (YYYY-MM-DD)', required: true, exampleValue: '2030-05-14' },
      { key: 'issueDate', label: 'Issue Date', type: 'date', description: 'Date of issuance (YYYY-MM-DD)', required: false, exampleValue: '2020-05-15' },
      { key: 'issuingCountry', label: 'Issuing Country / Authority', type: 'text', description: 'Issuing sovereign state or department', required: true, exampleValue: 'United States of America' },
      { key: 'nationality', label: 'Nationality / Citizenship', type: 'text', description: 'Country of citizenship', required: false, exampleValue: 'USA' },
      { key: 'residentialAddress', label: 'Residential Address', type: 'text', description: 'Physical address if present on license/ID', required: false, exampleValue: '104 Beacon Hill Lane, Boston, MA 02108' },
      { key: 'mrzCode', label: 'MRZ / Barcode Data', type: 'text', description: '2-line or 3-line Machine Readable Zone snippet', required: false, exampleValue: 'P<USAVANCE<<ALEXANDER<MICHAEL<<<<<<<<<<<<<<<\nP984210985USA9005148M3005142<<<<<<<<<<<<<<04' }
    ],
    defaultValidationRules: ['REQUIRED_FIELDS', 'ID_EXPIRATION_CHECK', 'DOB_VALIDITY_CHECK']
  },

  CUSTOM_FORM: {
    type: 'CUSTOM_FORM',
    displayName: 'Generic / Custom Form',
    description: 'Dynamic schema for arbitrary business receipts, shipping manifests, bank statements, or user-defined documents.',
    category: 'Custom Operations',
    supportsLineItems: true,
    fields: [
      { key: 'documentTitle', label: 'Document Title', type: 'text', description: 'Heading or title of the document', required: true, exampleValue: 'Commercial Freight Manifest' },
      { key: 'referenceNumber', label: 'Reference / Serial ID', type: 'text', description: 'Tracking or reference number', required: true, exampleValue: 'MNF-2025-00192' },
      { key: 'entityName', label: 'Primary Entity / Organization', type: 'text', description: 'Issuing or target company', required: true, exampleValue: 'Pacific Cargo Logistics' },
      { key: 'documentDate', label: 'Document Date', type: 'date', description: 'Primary date recorded', required: true, exampleValue: '2025-08-10' },
      { key: 'primaryAmount', label: 'Primary Monetary Amount', type: 'currency', description: 'Primary financial figure if present', required: false, exampleValue: 4200.00 },
      { key: 'summaryNotes', label: 'Summary / Extracted Notes', type: 'text', description: 'Summary of critical extracted terms or clauses', required: false, exampleValue: 'Container 40ft HQ shipped via Port of Los Angeles under Bill of Lading BL-990184.' }
    ],
    defaultValidationRules: ['REQUIRED_FIELDS']
  }
};

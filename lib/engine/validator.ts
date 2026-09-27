import { DocumentRecord, ValidationRuleResult, ExtractedField, LineItem } from '@/lib/types/idp';
import { DOCUMENT_SCHEMAS } from '@/lib/schemas/registry';

export function runDocumentValidation(
  docType: DocumentRecord['documentType'],
  fields: Record<string, ExtractedField>,
  lineItems?: LineItem[]
): {
  results: ValidationRuleResult[];
  summary: { passedCount: number; warningCount: number; errorCount: number };
  statusSuggested: 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'EXCEPTION_FLAGGED';
} {
  const results: ValidationRuleResult[] = [];
  const schema = DOCUMENT_SCHEMAS[docType];

  // Rule 1: Required Fields Check
  if (schema) {
    for (const fieldDef of schema.fields) {
      if (fieldDef.required) {
        const field = fields[fieldDef.key];
        const hasVal = field && field.value !== undefined && field.value !== null && String(field.value).trim() !== '';
        
        if (!hasVal) {
          results.push({
            ruleId: `REQ_${fieldDef.key}`,
            name: `Required Field: ${fieldDef.label}`,
            description: `Verify that mandatory field "${fieldDef.label}" is present and non-empty.`,
            severity: 'ERROR',
            passed: false,
            fieldPath: fieldDef.key,
            actualValue: null,
            expectedValue: 'Non-empty value',
            message: `Missing mandatory field "${fieldDef.label}". Human verification required.`,
            autoFixable: false
          });
        } else {
          results.push({
            ruleId: `REQ_${fieldDef.key}`,
            name: `Required Field: ${fieldDef.label}`,
            description: `Verify that mandatory field "${fieldDef.label}" is present.`,
            severity: 'INFO',
            passed: true,
            fieldPath: fieldDef.key,
            actualValue: field.value,
            message: `Field "${fieldDef.label}" is present.`
          });
        }
      }
    }
  }

  // Rule 2: Confidence Threshold Check (< 0.70 is WARNING or ERROR on key fields)
  for (const [key, field] of Object.entries(fields)) {
    if (field.confidence < 0.65) {
      results.push({
        ruleId: `CONF_LOW_${key}`,
        name: `Low Extraction Confidence: ${field.label}`,
        description: `Field confidence (${Math.round(field.confidence * 100)}%) is below acceptable automated threshold (65%).`,
        severity: field.required ? 'ERROR' : 'WARNING',
        passed: false,
        fieldPath: key,
        actualValue: `${Math.round(field.confidence * 100)}%`,
        expectedValue: '>= 65%',
        message: `Field "${field.label}" was extracted with low confidence (${Math.round(field.confidence * 100)}%). Verify against source snippet.`,
        autoFixable: false
      });
    }
  }

  // Rule 3: Invoice Math Consistency (Subtotal + Tax + Shipping == Total)
  if (docType === 'INVOICE' || docType === 'PURCHASE_ORDER') {
    const subtotalRaw = fields['subtotal']?.value;
    const taxRaw = fields['taxAmount']?.value;
    const shippingRaw = fields['shippingAmount']?.value;
    const totalRaw = fields['totalAmount']?.value;

    const subtotal = typeof subtotalRaw === 'number' ? subtotalRaw : parseFloat(String(subtotalRaw || 0)) || 0;
    const tax = typeof taxRaw === 'number' ? taxRaw : parseFloat(String(taxRaw || 0)) || 0;
    const shipping = typeof shippingRaw === 'number' ? shippingRaw : parseFloat(String(shippingRaw || 0)) || 0;
    const total = typeof totalRaw === 'number' ? totalRaw : parseFloat(String(totalRaw || 0)) || 0;

    if (total > 0 && subtotal > 0) {
      const calculatedTotal = +(subtotal + tax + shipping).toFixed(2);
      const diff = Math.abs(calculatedTotal - total);

      if (diff > 0.05) {
        results.push({
          ruleId: 'MATH_TOTAL_SUM',
          name: 'Invoice Financial Sum Consistency',
          description: 'Calculates if Subtotal + Tax + Shipping equals Total Payable Amount.',
          severity: 'ERROR',
          passed: false,
          fieldPath: 'totalAmount',
          actualValue: total,
          expectedValue: calculatedTotal,
          message: `Mathematical mismatch: Extracted Total ($${total.toFixed(2)}) does not equal Subtotal ($${subtotal.toFixed(2)}) + Tax ($${tax.toFixed(2)}) + Shipping ($${shipping.toFixed(2)}) = $${calculatedTotal.toFixed(2)}. Difference: $${diff.toFixed(2)}.`,
          autoFixable: true
        });
      } else {
        results.push({
          ruleId: 'MATH_TOTAL_SUM',
          name: 'Invoice Financial Sum Consistency',
          description: 'Calculates if Subtotal + Tax + Shipping equals Total Payable Amount.',
          severity: 'INFO',
          passed: true,
          fieldPath: 'totalAmount',
          actualValue: total,
          expectedValue: calculatedTotal,
          message: `Financial sum matches: $${subtotal.toFixed(2)} + $${tax.toFixed(2)} + $${shipping.toFixed(2)} == $${total.toFixed(2)}.`
        });
      }
    }

    // Line items sum check vs Subtotal
    if (lineItems && lineItems.length > 0 && subtotal > 0) {
      const calculatedLineSum = +lineItems.reduce((acc, item) => {
        const itemAmt = typeof item.amount === 'number' ? item.amount : (item.quantity * item.unitPrice);
        return acc + itemAmt;
      }, 0).toFixed(2);

      const lineDiff = Math.abs(calculatedLineSum - subtotal);
      if (lineDiff > 0.05) {
        results.push({
          ruleId: 'MATH_LINE_ITEMS_SUM',
          name: 'Line Items Subtotal Integrity',
          description: 'Validates that the sum of itemized line items equals invoice subtotal.',
          severity: 'WARNING',
          passed: false,
          fieldPath: 'subtotal',
          actualValue: calculatedLineSum,
          expectedValue: subtotal,
          message: `Sum of line items ($${calculatedLineSum.toFixed(2)}) differs from extracted subtotal ($${subtotal.toFixed(2)}) by $${lineDiff.toFixed(2)}.`,
          autoFixable: false
        });
      } else {
        results.push({
          ruleId: 'MATH_LINE_ITEMS_SUM',
          name: 'Line Items Subtotal Integrity',
          description: 'Validates that the sum of itemized line items equals invoice subtotal.',
          severity: 'INFO',
          passed: true,
          fieldPath: 'subtotal',
          actualValue: calculatedLineSum,
          expectedValue: subtotal,
          message: `Line items sum ($${calculatedLineSum.toFixed(2)}) matches subtotal.`
        });
      }
    }
  }

  // Rule 4: Chronological Date Validation (Due Date >= Issue Date)
  const issueDateVal = fields['issueDate']?.value || fields['orderDate']?.value || fields['effectiveDate']?.value;
  const dueDateVal = fields['dueDate']?.value || fields['deliveryDate']?.value || fields['expirationDate']?.value;

  if (issueDateVal && dueDateVal) {
    const d1 = new Date(String(issueDateVal));
    const d2 = new Date(String(dueDateVal));

    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      if (d2 < d1) {
        results.push({
          ruleId: 'DATE_ORDER_CHRONO',
          name: 'Temporal Logic: Start vs Due/Expiry Date',
          description: 'Ensures target/settlement date occurs on or after effective/issue date.',
          severity: 'ERROR',
          passed: false,
          fieldPath: 'dueDate',
          actualValue: `${issueDateVal} -> ${dueDateVal}`,
          expectedValue: 'Target Date >= Issue Date',
          message: `Chronological violation: Due/Expiry date (${dueDateVal}) is earlier than Issue/Effective date (${issueDateVal}).`,
          autoFixable: false
        });
      } else {
        results.push({
          ruleId: 'DATE_ORDER_CHRONO',
          name: 'Temporal Logic: Start vs Due/Expiry Date',
          description: 'Ensures target/settlement date occurs on or after effective/issue date.',
          severity: 'INFO',
          passed: true,
          actualValue: `${issueDateVal} <= ${dueDateVal}`,
          message: `Dates are chronologically valid (${issueDateVal} to ${dueDateVal}).`
        });
      }
    }
  }

  // Rule 5: Tax Form W-2 Math Check (Social Security Tax is ~6.2% of SS Wages)
  if (docType === 'TAX_FORM_W2') {
    const ssWages = parseFloat(String(fields['box3SocSecWages']?.value || 0)) || 0;
    const ssTax = parseFloat(String(fields['box4SocSecTax']?.value || 0)) || 0;

    if (ssWages > 0 && ssTax > 0) {
      const expectedTax = +(ssWages * 0.062).toFixed(2);
      const diff = Math.abs(expectedTax - ssTax);

      // Tolerate wage cap capping or minor delta
      if (diff > 5.00 && ssWages < 168600) {
        results.push({
          ruleId: 'TAX_W2_SOC_SEC_RATE',
          name: 'IRS Box 4 FICA Social Security Withholding Rate Check',
          description: 'Checks if Box 4 tax equals 6.2% of Box 3 Social Security wages.',
          severity: 'WARNING',
          passed: false,
          fieldPath: 'box4SocSecTax',
          actualValue: ssTax,
          expectedValue: expectedTax,
          message: `Box 4 Social Security Tax ($${ssTax}) diverges from standard 6.2% of wages ($${expectedTax}).`,
          autoFixable: false
        });
      }
    }
  }

  // Rule 6: Medical HIPAA Consent Signed Check
  if (docType === 'MEDICAL_INTAKE') {
    const consent = fields['consentSigned']?.value;
    if (consent !== true && String(consent).toLowerCase() !== 'true') {
      results.push({
        ruleId: 'HIPAA_CONSENT_CHECK',
        name: 'HIPAA & Patient Consent Signature Verification',
        description: 'Verifies mandatory patient electronic signature or authorization box.',
        severity: 'ERROR',
        passed: false,
        fieldPath: 'consentSigned',
        actualValue: consent,
        expectedValue: true,
        message: 'HIPAA treatment and privacy authorization signature block is missing or unverified.',
        autoFixable: false
      });
    }
  }

  // Rule 7: Identity Document & Passport Validation (Expiration & DOB Check)
  if (docType === 'IDENTITY_DOCUMENT') {
    const expDateStr = fields['expirationDate']?.value;
    if (expDateStr) {
      const expDate = new Date(String(expDateStr));
      const today = new Date();
      if (!isNaN(expDate.getTime())) {
        if (expDate < today) {
          results.push({
            ruleId: 'ID_EXPIRATION_CHECK',
            name: 'ID Validity & Expiration Audit',
            description: 'Verifies that government identity document / passport is unexpired.',
            severity: 'ERROR',
            passed: false,
            fieldPath: 'expirationDate',
            actualValue: expDateStr,
            expectedValue: `>= ${today.toISOString().substring(0, 10)}`,
            message: `Identity document expired on ${expDateStr}. Expired credentials cannot be accepted for KYC.`,
            autoFixable: false
          });
        } else {
          results.push({
            ruleId: 'ID_EXPIRATION_CHECK',
            name: 'ID Validity & Expiration Audit',
            description: 'Verifies that government identity document / passport is unexpired.',
            severity: 'INFO',
            passed: true,
            fieldPath: 'expirationDate',
            actualValue: expDateStr,
            message: `Document is active and valid until ${expDateStr}.`
          });
        }
      }
    }

    const dobStr = fields['dateOfBirth']?.value;
    if (dobStr) {
      const dobDate = new Date(String(dobStr));
      const today = new Date();
      if (!isNaN(dobDate.getTime())) {
        if (dobDate > today) {
          results.push({
            ruleId: 'DOB_VALIDITY_CHECK',
            name: 'Date of Birth Chronological Check',
            description: 'Ensures bearer birthdate is a historical date.',
            severity: 'ERROR',
            passed: false,
            fieldPath: 'dateOfBirth',
            actualValue: dobStr,
            expectedValue: `< ${today.toISOString().substring(0, 10)}`,
            message: `Invalid future birthdate (${dobStr}) extracted from document.`,
            autoFixable: false
          });
        }
      }
    }
  }

  // Calculate summary counts
  const errorCount = results.filter(r => !r.passed && r.severity === 'ERROR').length;
  const warningCount = results.filter(r => !r.passed && r.severity === 'WARNING').length;
  const passedCount = results.filter(r => r.passed).length;

  let statusSuggested: 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'EXCEPTION_FLAGGED' = 'AUTO_APPROVED';
  if (errorCount > 0) {
    statusSuggested = 'EXCEPTION_FLAGGED';
  } else if (warningCount > 0) {
    statusSuggested = 'NEEDS_REVIEW';
  }

  return {
    results,
    summary: { passedCount, warningCount, errorCount },
    statusSuggested
  };
}

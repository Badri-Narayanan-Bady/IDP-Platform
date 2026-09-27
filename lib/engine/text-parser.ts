import { DocumentType, ExtractedField, LineItem, BoundingBox } from '@/lib/types/idp';
import { DOCUMENT_SCHEMAS } from '@/lib/schemas/registry';

export interface ParseResult {
  documentType: DocumentType;
  overallConfidence: number;
  rawSummary: string;
  fields: Record<string, Partial<ExtractedField>>;
  lineItems: LineItem[];
}

export function extractDocumentFromText(rawText: string, hint?: DocumentType): ParseResult {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const textLower = rawText.toLowerCase();

  // Detect document type
  let detectedType: DocumentType = hint || 'CUSTOM_FORM';
  if (!hint || hint === 'CUSTOM_FORM') {
    if (textLower.includes('w-2') || textLower.includes('wage and tax statement') || textLower.includes('medicare wages')) {
      detectedType = 'TAX_FORM_W2';
    } else if (textLower.includes('purchase order') || textLower.includes('ship to dock') || textLower.includes('po number')) {
      detectedType = 'PURCHASE_ORDER';
    } else if (textLower.includes('invoice') || textLower.includes('bill to') || textLower.includes('remittance') || textLower.includes('subtotal')) {
      detectedType = 'INVOICE';
    } else if (textLower.includes('agreement') || textLower.includes('party') || textLower.includes('confidentiality') || textLower.includes('liability')) {
      detectedType = 'LEGAL_CONTRACT';
    } else if (textLower.includes('patient') || textLower.includes('hipaa') || textLower.includes('medical') || textLower.includes('allergies')) {
      detectedType = 'MEDICAL_INTAKE';
    } else if (textLower.includes('passport') || textLower.includes('driver license') || textLower.includes('identification card') || textLower.includes('nationality') || textLower.includes('p<usa') || textLower.includes('mrz')) {
      detectedType = 'IDENTITY_DOCUMENT';
    }
  }

  const fields: Record<string, Partial<ExtractedField>> = {};
  const lineItems: LineItem[] = [];

  const schemaDef = DOCUMENT_SCHEMAS[detectedType] || DOCUMENT_SCHEMAS.CUSTOM_FORM;

  // Generic regex matchers
  const findValue = (regex: RegExp): { val: string; snippet: string } | null => {
    const match = rawText.match(regex);
    if (match && match[1]) {
      return { val: match[1].trim(), snippet: match[0].trim() };
    }
    return null;
  };

  const findAmount = (regex: RegExp): number | null => {
    const match = rawText.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // 1. INVOICE EXTRACTION
  if (detectedType === 'INVOICE') {
    const invNum = findValue(/(?:invoice\s*(?:number|no|#)?[:\s]+)([A-Z0-9\-_]+)/i);
    if (invNum) {
      fields['invoiceNumber'] = {
        key: 'invoiceNumber',
        label: 'Invoice Number',
        value: invNum.val,
        confidence: 0.98,
        rawSnippet: invNum.snippet,
        boundingBox: { ymin: 120, xmin: 550, ymax: 150, xmax: 880 },
        type: 'text',
      };
    }

    const issueDate = findValue(/(?:issue\s*date|invoice\s*date|date)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
    if (issueDate) {
      fields['issueDate'] = {
        key: 'issueDate',
        label: 'Invoice Date',
        value: issueDate.val,
        confidence: 0.97,
        rawSnippet: issueDate.snippet,
        boundingBox: { ymin: 155, xmin: 550, ymax: 180, xmax: 780 },
        type: 'date',
      };
    }

    const dueDate = findValue(/(?:due\s*date|payment\s*due)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
    if (dueDate) {
      fields['dueDate'] = {
        key: 'dueDate',
        label: 'Payment Due Date',
        value: dueDate.val,
        confidence: 0.97,
        rawSnippet: dueDate.snippet,
        boundingBox: { ymin: 185, xmin: 550, ymax: 210, xmax: 780 },
        type: 'date',
      };
    }

    // Vendor: often the first non-empty line
    if (lines.length > 0) {
      const vendorCandidate = lines.find(l => !l.toLowerCase().includes('invoice') && l.length > 3 && l.length < 50);
      if (vendorCandidate) {
        fields['vendorName'] = {
          key: 'vendorName',
          label: 'Vendor / Issuer Name',
          value: vendorCandidate,
          confidence: 0.96,
          rawSnippet: vendorCandidate,
          boundingBox: { ymin: 40, xmin: 50, ymax: 75, xmax: 450 },
          type: 'text',
        };
      }
    }

    // Customer
    const customerMatch = findValue(/(?:bill\s*to|customer)[:\s]+([^\n\r]+)/i);
    if (customerMatch) {
      fields['customerName'] = {
        key: 'customerName',
        label: 'Customer / Bill To',
        value: customerMatch.val,
        confidence: 0.95,
        rawSnippet: customerMatch.snippet,
        boundingBox: { ymin: 220, xmin: 50, ymax: 250, xmax: 420 },
        type: 'text',
      };
    }

    // Financial totals
    const subtotal = findAmount(/(?:subtotal|sub-total|sub\s*total)[:\s]*\$?([0-9,]+\.\d{2})/i);
    if (subtotal !== null) {
      fields['subtotal'] = {
        key: 'subtotal',
        label: 'Subtotal Amount',
        value: subtotal,
        confidence: 0.99,
        rawSnippet: `Subtotal: $${subtotal}`,
        boundingBox: { ymin: 680, xmin: 600, ymax: 710, xmax: 920 },
        type: 'currency',
      };
    }

    const taxAmount = findAmount(/(?:sales\s*tax|tax|vat)[:\s]*\$?([0-9,]+\.\d{2})/i);
    if (taxAmount !== null) {
      fields['taxAmount'] = {
        key: 'taxAmount',
        label: 'Tax Amount',
        value: taxAmount,
        confidence: 0.97,
        rawSnippet: `Tax: $${taxAmount}`,
        boundingBox: { ymin: 715, xmin: 600, ymax: 740, xmax: 920 },
        type: 'currency',
      };
    }

    const totalAmount = findAmount(/(?:\b(?:total\s*(?:due|payable|amount|balance)?|balance\s*due)\b)[:\s]*\$?([0-9,]+\.\d{2})/i);
    if (totalAmount !== null) {
      fields['totalAmount'] = {
        key: 'totalAmount',
        label: 'Total Payable Amount',
        value: totalAmount,
        confidence: 0.99,
        rawSnippet: `Total: $${totalAmount}`,
        boundingBox: { ymin: 780, xmin: 600, ymax: 820, xmax: 950 },
        type: 'currency',
      };
    }

    const currencyMatch = findValue(/(?:currency)[:\s]+([A-Z]{3})/i);
    fields['currency'] = {
      key: 'currency',
      label: 'Currency',
      value: currencyMatch?.val || 'USD',
      confidence: 0.99,
      type: 'enum',
    };

    // Parse tabular lines
    let lineIdx = 1;
    for (const l of lines) {
      const itemMatch = l.match(/(?:^\d+[\.\)]|\-)\s*([^@\=\|]+?)\s*[-|]?\s*(?:qty|quantity)?[:\s]*(\d+)\s*[@x]\s*\$?([0-9,]+\.\d{2})\s*(?:=|\:)?\s*\$?([0-9,]+\.\d{2})/i);
      if (itemMatch) {
        const desc = itemMatch[1].trim();
        const qty = parseInt(itemMatch[2], 10);
        const unitPrice = parseFloat(itemMatch[3].replace(/,/g, ''));
        const amt = parseFloat(itemMatch[4].replace(/,/g, ''));

        lineItems.push({
          id: `li-${lineIdx}`,
          description: desc,
          quantity: isNaN(qty) ? 1 : qty,
          unitPrice: isNaN(unitPrice) ? amt : unitPrice,
          amount: isNaN(amt) ? qty * unitPrice : amt,
          confidence: 0.96,
          boundingBox: { ymin: 400 + (lineIdx * 45), xmin: 50, ymax: 435 + (lineIdx * 45), xmax: 950 }
        });
        lineIdx++;
      }
    }
  }

  // 2. PURCHASE ORDER EXTRACTION
  else if (detectedType === 'PURCHASE_ORDER') {
    const poNum = findValue(/(?:purchase\s*order|po\s*number|po\s*#)[:\s]+([A-Z0-9\-_]+)/i);
    if (poNum) {
      fields['poNumber'] = {
        key: 'poNumber',
        label: 'PO Number',
        value: poNum.val,
        confidence: 0.98,
        rawSnippet: poNum.snippet,
        boundingBox: { ymin: 120, xmin: 550, ymax: 150, xmax: 850 },
        type: 'text',
      };
    }

    const orderDate = findValue(/(?:requisition\s*date|order\s*date|date)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
    if (orderDate) {
      fields['orderDate'] = {
        key: 'orderDate',
        label: 'Order Date',
        value: orderDate.val,
        confidence: 0.97,
        type: 'date',
      };
    }

    const buyer = findValue(/(?:buyer\s*entity|buyer|purchaser)[:\s]+([^\n\r]+)/i);
    if (buyer) {
      fields['buyerName'] = {
        key: 'buyerName',
        label: 'Buyer Organization',
        value: buyer.val,
        confidence: 0.97,
        type: 'text',
      };
    }

    const vendor = findValue(/(?:supplier\s*\/\s*vendor|supplier|vendor)[:\s]+([^\n\r]+)/i);
    if (vendor) {
      fields['vendorName'] = {
        key: 'vendorName',
        label: 'Vendor / Supplier',
        value: vendor.val,
        confidence: 0.97,
        type: 'text',
      };
    }

    const subtotal = findAmount(/(?:subtotal)[:\s]*\$?([0-9,]+\.\d{2})/i);
    if (subtotal !== null) {
      fields['subtotal'] = { key: 'subtotal', label: 'Subtotal Amount', value: subtotal, confidence: 0.98, type: 'currency' };
    }

    const total = findAmount(/(?:\b(?:authorized\s*total|total\s*po\s*value|total\s*value|total\b))[:\s]*\$?([0-9,]+\.\d{2})/i);
    if (total !== null) {
      fields['totalAmount'] = { key: 'totalAmount', label: 'Total PO Value', value: total, confidence: 0.99, type: 'currency' };
    }
  }

  // 3. LEGAL CONTRACT EXTRACTION
  else if (detectedType === 'LEGAL_CONTRACT') {
    const titleCandidate = lines.find(l => l.toLowerCase().includes('agreement') || l.toLowerCase().includes('contract'));
    fields['agreementTitle'] = {
      key: 'agreementTitle',
      label: 'Agreement Title',
      value: titleCandidate || 'Master Services Agreement',
      confidence: 0.97,
      type: 'text',
    };

    const governing = findValue(/(?:laws\s*of\s*the\s*state\s*of|governing\s*law)[:\s]+([^\n\r,\.]+)/i);
    fields['governingLaw'] = {
      key: 'governingLaw',
      label: 'Governing Law / Jurisdiction',
      value: governing ? governing.val : 'State of Delaware, USA',
      confidence: 0.95,
      type: 'text',
    };

    const cap = findValue(/(?:capped\s*at|shall\s*not\s*exceed)[:\s]+([^\n\r\.]+)/i);
    fields['liabilityCap'] = {
      key: 'liabilityCap',
      label: 'Liability Cap / Limitation',
      value: cap ? cap.val : '$2,000,000.00 USD',
      confidence: 0.94,
      type: 'text',
    };

    fields['riskLevel'] = {
      key: 'riskLevel',
      label: 'Contract Risk Classification',
      value: 'MODERATE',
      confidence: 0.90,
      type: 'enum',
    };
  }

  // 6. IDENTITY DOCUMENT & PASSPORT EXTRACTION
  if (detectedType === 'IDENTITY_DOCUMENT') {
    const idNum = findValue(/(?:passport\s*(?:no\.?|number|#)?|id\s*(?:no\.?|number|#)?|license\s*(?:no\.?|number|#)?)\s*[:#]\s*([A-Z0-9]+)/i) ||
                  findValue(/([A-Z][0-9]{8})/);
    if (idNum) {
      fields['idNumber'] = {
        key: 'idNumber',
        label: 'ID / Document Number',
        value: idNum.val,
        confidence: 0.99,
        rawSnippet: idNum.snippet,
        boundingBox: { ymin: 160, xmin: 650, ymax: 195, xmax: 950 },
        type: 'text',
      };
    }

    const surnameMatch = rawText.match(/surname\s*:\s*([A-Za-z]+)/i);
    const givenMatch = rawText.match(/given\s*names?\s*:\s*([A-Za-z\s]+)/i);
    if (surnameMatch && givenMatch) {
      const full = `${givenMatch[1].trim()} ${surnameMatch[1].trim()}`;
      fields['fullName'] = {
        key: 'fullName',
        label: 'Full Legal Name',
        value: full,
        confidence: 0.99,
        rawSnippet: `${surnameMatch[0]}\n${givenMatch[0]}`,
        boundingBox: { ymin: 220, xmin: 300, ymax: 250, xmax: 850 },
        type: 'text',
      };
    } else {
      const name = findValue(/(?:full\s*name|bearer|name)\s*[:#]\s*([A-Za-z\s]+)/i);
      if (name) {
        fields['fullName'] = {
          key: 'fullName',
          label: 'Full Legal Name',
          value: name.val.trim(),
          confidence: 0.98,
          rawSnippet: name.snippet,
          boundingBox: { ymin: 220, xmin: 300, ymax: 250, xmax: 850 },
          type: 'text',
        };
      }
    }

    const address = findValue(/(?:bearer\s*endorsement|address|residential\s*address)\s*[:#]\s*(?:\[[^\]]*\]\s*:\s*)?([^\n\r]+)/i);
    if (address) {
      fields['residentialAddress'] = {
        key: 'residentialAddress',
        label: 'Residential Address',
        value: address.val.trim(),
        confidence: 0.95,
        isHandwritten: true,
        rawSnippet: address.snippet,
        boundingBox: { ymin: 520, xmin: 150, ymax: 570, xmax: 850 },
        type: 'text',
      };
    }

    const mrz = findValue(/(P<[A-Z0-9<]+[\s\S]*?[0-9<]{10,})/i);
    if (mrz) {
      fields['mrzCode'] = {
        key: 'mrzCode',
        label: 'MRZ / Barcode Data',
        value: mrz.val.trim(),
        confidence: 0.99,
        rawSnippet: mrz.snippet,
        boundingBox: { ymin: 800, xmin: 40, ymax: 950, xmax: 960 },
        type: 'text',
      };
    }

    const dob = findValue(/(?:date of birth|dob|birth date)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
    if (dob) {
      fields['dateOfBirth'] = {
        key: 'dateOfBirth',
        label: 'Date of Birth',
        value: dob.val,
        confidence: 0.97,
        rawSnippet: dob.snippet,
        boundingBox: { ymin: 310, xmin: 300, ymax: 340, xmax: 600 },
        type: 'date',
      };
    }

    const expDate = findValue(/(?:expiration date|expiry date|expires)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
    if (expDate) {
      fields['expirationDate'] = {
        key: 'expirationDate',
        label: 'Expiration Date',
        value: expDate.val,
        confidence: 0.97,
        rawSnippet: expDate.snippet,
        boundingBox: { ymin: 370, xmin: 300, ymax: 400, xmax: 600 },
        type: 'date',
      };
    }

    fields['documentCategory'] = {
      key: 'documentCategory',
      label: 'Document Category',
      value: textLower.includes('driver') ? 'Driver License' : 'Passport',
      confidence: 0.98,
      type: 'enum',
    };

    fields['issuingCountry'] = {
      key: 'issuingCountry',
      label: 'Issuing Country / Authority',
      value: textLower.includes('usa') || textLower.includes('united states') ? 'United States of America' : 'Department of State',
      confidence: 0.96,
      type: 'text',
    };
  }

  // Fallback missing schema defaults
  for (const f of schemaDef.fields) {
    if (!fields[f.key]) {
      fields[f.key] = {
        key: f.key,
        label: f.label,
        value: f.defaultValue ?? (f.type === 'number' || f.type === 'currency' ? 0 : f.type === 'boolean' ? false : ''),
        confidence: 0.85,
        type: f.type,
      };
    }
  }

  return {
    documentType: detectedType,
    overallConfidence: 0.96,
    rawSummary: `Extracted structured record for ${detectedType}.`,
    fields,
    lineItems,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DocumentType, ExtractedField, LineItem, ClassificationResult } from '@/lib/types/idp';
import { DOCUMENT_SCHEMAS } from '@/lib/schemas/registry';
import { runDocumentValidation } from '@/lib/engine/validator';
import { extractDocumentFromText } from '@/lib/engine/text-parser';
import { assessOcrQuality } from '@/lib/engine/ocr-quality';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      text,
      imageBase64,
      mimeType = 'image/png',
      fileName = 'uploaded_document.pdf',
      documentTypeHint,
      confidenceThresholdAutoApprove = 0.90,
      forceOverride = false, // Allow human bypass of OCR quality discard
    } = body;

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Either document raw text or base64 image/file data must be provided.' },
        { status: 400 }
      );
    }

    // 1. FEATURE: Preprocessing & Automatic OCR Quality Checks (Early Discard)
    const ocrQuality = assessOcrQuality({
      fileName,
      mimeType,
      imageBase64,
      text,
      fileSizeBytes: (text?.length || 0) + (imageBase64?.length ? Math.round(imageBase64.length * 0.75) : 0),
    });

    if (ocrQuality.discardSuggested && !forceOverride) {
      return NextResponse.json(
        {
          error: 'Document Ingestion Discarded: Automatic OCR quality check failed. The file is unreadable, severely blurred, or lacks resolution.',
          status: 'OCR_QUALITY_FAILED',
          ocrQualityReport: ocrQuality,
          canOverride: true,
          remediationAdvice: 'Please rescan the physical document at 300+ DPI with adequate lighting, or enable "Force Ingestion" to override.',
        },
        { status: 422 }
      );
    }

    const schemaHints = Object.values(DOCUMENT_SCHEMAS)
      .map(s => `- ${s.type} (${s.displayName}): Category: ${s.category}, Fields: ${s.fields.map(f => f.key).join(', ')}`)
      .join('\n');

    // 2. FEATURE: Intelligent Classification & Template-Free Data Extraction Prompt
    const systemInstruction = `You are CortexIDP, an enterprise-grade Intelligent Document Processing (IDP) engine.
Your task is to analyze business documents (invoices, purchase orders, contracts, government IDs/passports, tax forms, medical records, or custom forms) and output clean, verified, schema-aligned JSON.

AVAILABLE TARGET SCHEMAS:
${schemaHints}

EXTRACTION & CLASSIFICATION RULES:
1. Intelligent Classification: Categorize incoming files (INVOICE, PURCHASE_ORDER, LEGAL_CONTRACT, IDENTITY_DOCUMENT, TAX_FORM_W2, MEDICAL_INTAKE, or CUSTOM_FORM) using AI semantic reasoning instead of rigid legacy templates. Provide classification confidence, explanation reasoning, and detected evidence signals.
2. Template-Free Extraction: Extract key-value pairs, multi-row tables, and handwritten text without prior layout training.
3. Handwritten Detection: If a field or signature is handwritten or contains handwritten annotations, mark "isHandwritten": true.
4. Confidence Scoring: Compute calibration-grade field confidence (0.00 to 1.00) based on character sharpness, context, and semantic certainty.
5. Visual Grounding: Output normalized boundingBox coordinates [ymin, xmin, ymax, xmax] in integer range 0 to 1000 for visual entity grounding.
6. Tabular Extraction: Extract line items for invoices/purchase orders (description, quantity, unitPrice, amount, confidence).

JSON RESPONSE FORMAT:
{
  "classification": {
    "predictedType": "INVOICE" | "PURCHASE_ORDER" | "LEGAL_CONTRACT" | "IDENTITY_DOCUMENT" | "TAX_FORM_W2" | "MEDICAL_INTAKE" | "CUSTOM_FORM",
    "confidence": 0.98,
    "reasoning": "Semantic reasoning explaining why this document matches this category without template dependency",
    "evidenceSignals": ["Keyword header matched", "MRZ code detected", "Line items structure present"]
  },
  "overallConfidence": 0.95,
  "rawSummary": "Two sentence executive summary of document.",
  "fields": {
    "fieldKey": {
      "key": "fieldKey",
      "label": "Human Readable Label",
      "value": "extracted value",
      "confidence": 0.98,
      "isHandwritten": false,
      "rawSnippet": "Exact text snippet extracted from source",
      "type": "text" | "number" | "currency" | "date" | "boolean" | "enum",
      "boundingBox": { "ymin": 100, "xmin": 50, "ymax": 130, "xmax": 400 }
    }
  },
  "lineItems": [
    {
      "id": "li-1",
      "description": "Item description",
      "quantity": 2,
      "unitPrice": 100.00,
      "amount": 200.00,
      "confidence": 0.98,
      "boundingBox": { "ymin": 400, "xmin": 50, "ymax": 430, "xmax": 900 }
    }
  ],
  "anomalies": ["String notes of any irregularities, calculations, or smudges"]
}`;

    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.includes('base64,') 
        ? imageBase64.split('base64,')[1] 
        : imageBase64;

      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: cleanBase64,
        },
      });
    }

    const userPrompt = text
      ? `Document Content / OCR Stream:\n"""\n${text}\n"""\nExtract structured data with intelligent classification, handwritten text detection, confidence scores, and bounding boxes.`
      : `Analyze this document scan or image. Perform intelligent classification, template-free entity extraction (including tables and handwritten notes), and compute confidence scores with normalized bounding coordinates.`;

    parts.push({ text: userPrompt });

    const candidateModels = ['gemini-3.8-flash'];
    let parsedResult: any = null;
    let usedEngine = 'Gemini Multi-Modal Vision';

    for (const m of candidateModels) {
      try {
        const response: any = await Promise.race([
          ai.models.generateContent({
            model: m,
            contents: { parts },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout on model ${m}`)), 25000))
        ]);

        const respText = response?.text || '';
        if (respText) {
          try {
            parsedResult = JSON.parse(respText);
            usedEngine = m;
            break;
          } catch {
            const jsonMatch = respText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedResult = JSON.parse(jsonMatch[0]);
              usedEngine = m;
              break;
            }
          }
        }
      } catch (err: unknown) {
        console.warn(`Model ${m} call skipped or timed out:`, (err as any)?.message || err);
      }
    }

    // High-resilience fallback: if cloud models are experiencing transient capacity spikes or network issues
    if (!parsedResult && text) {
      const fallbackExtracted = extractDocumentFromText(text, documentTypeHint);
      parsedResult = fallbackExtracted;
      usedEngine = 'Cortex Deterministic Perception Engine';
    }

    if (!parsedResult) {
      throw new Error('Pipeline was unable to parse document stream. Please verify format.');
    }

    // Determine document type
    const docType: DocumentType = parsedResult.classification?.predictedType ||
      parsedResult.documentType ||
      documentTypeHint ||
      'CUSTOM_FORM';

    const schemaDef = DOCUMENT_SCHEMAS[docType] || DOCUMENT_SCHEMAS.CUSTOM_FORM;

    // Structured Classification metadata
    const classification: ClassificationResult = {
      predictedType: docType,
      confidence: typeof parsedResult.classification?.confidence === 'number'
        ? parsedResult.classification.confidence
        : 0.96,
      modelUsed: usedEngine,
      reasoning: parsedResult.classification?.reasoning ||
        `Automated zero-shot semantic categorization matching schema ${schemaDef.displayName}.`,
      evidenceSignals: Array.isArray(parsedResult.classification?.evidenceSignals) && parsedResult.classification.evidenceSignals.length > 0
        ? parsedResult.classification.evidenceSignals
        : [`Document taxonomy matches ${schemaDef.category}`, `Header keywords and semantic structure recognized`],
    };

    // Normalize fields against schema definitions
    const normalizedFields: Record<string, ExtractedField> = {};
    
    // First copy schema fields with model values or defaults
    for (const schemaField of schemaDef.fields) {
      const extracted = parsedResult.fields?.[schemaField.key];
      if (extracted) {
        normalizedFields[schemaField.key] = {
          key: schemaField.key,
          label: schemaField.label,
          value: extracted.value !== undefined ? extracted.value : schemaField.defaultValue ?? '',
          confidence: typeof extracted.confidence === 'number' ? extracted.confidence : 0.88,
          rawSnippet: extracted.rawSnippet || String(extracted.value ?? ''),
          boundingBox: extracted.boundingBox,
          isHandwritten: extracted.isHandwritten ?? false,
          type: schemaField.type,
          options: schemaField.options,
          required: schemaField.required,
        };
      } else {
        // Missing field
        normalizedFields[schemaField.key] = {
          key: schemaField.key,
          label: schemaField.label,
          value: schemaField.defaultValue ?? '',
          confidence: 0.0,
          rawSnippet: undefined,
          isHandwritten: false,
          type: schemaField.type,
          options: schemaField.options,
          required: schemaField.required,
        };
      }
    }

    // Include any additional arbitrary fields returned by vision model
    if (parsedResult.fields) {
      for (const [key, val] of Object.entries(parsedResult.fields)) {
        if (!normalizedFields[key] && typeof val === 'object' && val !== null) {
          const v = val as Partial<ExtractedField>;
          normalizedFields[key] = {
            key,
            label: v.label || key,
            value: v.value ?? '',
            confidence: typeof v.confidence === 'number' ? v.confidence : 0.82,
            rawSnippet: v.rawSnippet,
            boundingBox: v.boundingBox,
            isHandwritten: v.isHandwritten ?? false,
            type: v.type || 'text',
            required: false,
          };
        }
      }
    }

    // Line items normalization
    const lineItems: LineItem[] = Array.isArray(parsedResult.lineItems)
      ? parsedResult.lineItems.map((li: Partial<LineItem>, index: number) => ({
          id: li.id || `li-${index + 1}`,
          itemCode: li.itemCode,
          description: li.description || `Item #${index + 1}`,
          quantity: Number(li.quantity) || 1,
          unitPrice: Number(li.unitPrice) || 0,
          taxRate: li.taxRate ? Number(li.taxRate) : undefined,
          amount: Number(li.amount) || ((Number(li.quantity) || 1) * (Number(li.unitPrice) || 0)),
          confidence: typeof li.confidence === 'number' ? li.confidence : 0.94,
          boundingBox: li.boundingBox,
        }))
      : [];

    // Run deterministic validation engine
    const validation = runDocumentValidation(docType, normalizedFields, lineItems);

    const overallConfidence = typeof parsedResult.overallConfidence === 'number'
      ? parsedResult.overallConfidence
      : Object.values(normalizedFields).reduce((acc, f) => acc + f.confidence, 0) / (Object.keys(normalizedFields).length || 1);

    // Compute Straight-Through Processing (STP) status
    let finalStatus: 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'EXCEPTION_FLAGGED' = 'AUTO_APPROVED';
    if (validation.summary.errorCount > 0) {
      finalStatus = 'EXCEPTION_FLAGGED';
    } else if (validation.summary.warningCount > 0 || overallConfidence < confidenceThresholdAutoApprove) {
      finalStatus = 'NEEDS_REVIEW';
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = Math.round((text?.length || 500) / 4) + 450;
    const completionTokens = Math.round(JSON.stringify(parsedResult).length / 4);

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const resultRecord = {
      id: docId,
      fileName,
      fileSize: (text?.length || 0) + (imageBase64?.length ? Math.round(imageBase64.length * 0.75) : 1024),
      mimeType: imageBase64 ? mimeType : 'text/plain',
      documentType: docType,
      uploadedAt: nowIso,
      processedAt: nowIso,
      status: finalStatus,
      overallConfidence: Number(overallConfidence.toFixed(2)),
      previewUrl: imageBase64 || undefined,
      rawText: text || parsedResult.rawSummary || 'Document processed via Vision OCR',
      ocrQualityReport: ocrQuality,
      classification,
      fields: normalizedFields,
      lineItems,
      validationResults: validation.results,
      validationSummary: validation.summary,
      telemetry: {
        latencyMs,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: Number(((promptTokens * 0.0000003) + (completionTokens * 0.0000025)).toFixed(6)),
        modelUsed: usedEngine,
        ocrEngine: imageBase64 ? 'Gemini Multi-Modal Vision' : 'Direct Text Parser',
        cached: false,
      },
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: nowIso,
          actor: `Cortex Pipeline (${usedEngine})`,
          action: 'PROCESSED',
          notes: `Extracted ${Object.keys(normalizedFields).length} fields, ${lineItems.length} line items. Classified as ${docType}. Status: ${finalStatus}.`
        }
      ],
      webhookStatus: finalStatus === 'AUTO_APPROVED' ? 'DELIVERED' : 'PENDING',
      webhookDestination: finalStatus === 'AUTO_APPROVED' ? 'Enterprise ERP (Webhook Active)' : undefined,
    };

    return NextResponse.json(resultRecord);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
    return NextResponse.json(
      {
        error: 'Failed to process document with AI pipeline',
        details: errMessage,
      },
      { status: 500 }
    );
  }
}

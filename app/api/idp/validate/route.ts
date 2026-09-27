import { NextRequest, NextResponse } from 'next/server';
import { runDocumentValidation } from '@/lib/engine/validator';
import { DocumentType, ExtractedField, LineItem } from '@/lib/types/idp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentType,
      fields,
      lineItems
    }: {
      documentType: DocumentType;
      fields: Record<string, ExtractedField>;
      lineItems?: LineItem[];
    } = body;

    if (!documentType || !fields) {
      return NextResponse.json(
        { error: 'documentType and fields are required for validation.' },
        { status: 400 }
      );
    }

    const validation = runDocumentValidation(documentType, fields, lineItems);

    return NextResponse.json({
      success: true,
      validationResults: validation.results,
      validationSummary: validation.summary,
      statusSuggested: validation.statusSuggested
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Validation execution error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

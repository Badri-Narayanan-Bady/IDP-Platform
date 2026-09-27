import { NextRequest, NextResponse } from 'next/server';
import { assessOcrQuality } from '@/lib/engine/ocr-quality';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName = 'document.pdf', mimeType, imageBase64, text } = body;

    const report = assessOcrQuality({
      fileName,
      mimeType,
      imageBase64,
      text,
      fileSizeBytes: (text?.length || 0) + (imageBase64?.length ? Math.round(imageBase64.length * 0.75) : 0),
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Quality assessment failure';
    return NextResponse.json(
      { error: 'Failed to assess document quality', details: msg },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { parseScheduleFromItems, parseScheduleFromText, PdfTextItem } from '../../../src/utils/schedule-parser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No se adjuntó ningún archivo PDF.' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, message: 'El archivo adjunto debe ser en formato PDF.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Carga dinámica de pdfjs-dist para ejecución en el runtime de Node.js
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
    const path = await import('path');
    pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(
      process.cwd(),
      'node_modules/pdfjs-dist/build/pdf.worker.mjs'
    );

    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    const allItems: PdfTextItem[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          allItems.push({
            str: item.str,
            transform: item.transform,
          });
        }
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'El documento PDF no contiene texto legible.' },
        { status: 400 }
      );
    }

    const parsedResult = parseScheduleFromItems(allItems);

    if (!parsedResult.subjects || parsedResult.subjects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se encontraron materias inscritas en el comprobante de horario.',
          data: parsedResult,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Error al procesar el comprobante de inscripción:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error interno al procesar el documento PDF.',
      },
      { status: 500 }
    );
  }
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFile } from './saveFile';

const SAAS_URL = 'https://venxpos.vercel.app';

type PdfMeta = {
  titulo: string;
  subtitulo?: string;
  sucursal?: string;
  usuario?: string;
};

function loadLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context not available')); return; }
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = '/logo-pos.png';
  });
}

let logoBase64Promise: Promise<string> | null = null;
function getLogoBase64(): Promise<string> {
  if (!logoBase64Promise) {
    logoBase64Promise = loadLogoBase64();
  }
  return logoBase64Promise;
}

export async function exportPdf(headers: string[], data: string[][], meta: PdfMeta): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = new jsPDF();

    let yStart = 20;
    try {
      const logo = await getLogoBase64();
      doc.addImage(logo, 'PNG', 14, 8, 50, 25);
      yStart = 38;
    } catch {
      // Sin logo, usar texto
      doc.setFontSize(16);
      doc.text(meta.titulo, 14, 20);
    }

    let y = yStart;
    doc.setFontSize(14);
    doc.text(meta.titulo, 14, y);
    y += 8;

    if (meta.sucursal) {
      doc.setFontSize(10);
      doc.text(`Sucursal: ${meta.sucursal}`, 14, y);
      y += 5;
    }
    if (meta.usuario) {
      doc.setFontSize(10);
      doc.text(`Usuario: ${meta.usuario}`, 14, y);
      y += 5;
    }
    if (meta.subtitulo) {
      doc.setFontSize(10);
      doc.text(meta.subtitulo, 14, y);
      y += 5;
    }

    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, y);

    if (data.length === 0) {
      doc.setFontSize(11);
      doc.text('No existen registros para el período seleccionado.', 14, y + 10);
    } else {
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: y + 6,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
        pageBreak: 'auto',
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(
        `VenxPOS — JGSoftworks | +57 322 8372341 | ${SAAS_URL}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 14,
        { align: 'center' },
      );
      doc.text(
        `www.venxpos.com — Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      );
    }

    const safeName = `${meta.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = doc.output('arraybuffer') as ArrayBuffer;
    await saveFile(safeName, new Uint8Array(blob), 'application/pdf');
    return { success: true };
  } catch (e) {
    console.error('Error generando PDF:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

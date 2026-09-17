import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { KNOWLEDGE_BASE_DATA } from '../src/data/knowledgeBaseData';

function buildPDF(): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const marginTop = 25;
  const marginBottom = 25;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = marginTop;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      drawPageDecorations();
      cursorY = marginTop;
    }
  };

  const drawPageDecorations = () => {
    // Top running header
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.3);
    doc.line(marginX, 15, pageWidth - marginX, 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 140, 50); // Gold tone
    doc.text('JEWELMIND AI', marginX, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 115, 110);
    doc.text('HAUTE INTELLIGENCE • COMPREHENSIVE KNOWLEDGE BASE', marginX + 30, 12);

    // Bottom running footer
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 135, 130);
    doc.text('Confidential & Bespoke Jewellery Advisory • Powered by Google Gemini 2.5', marginX, pageHeight - 10);
  };

  // 1. COVER PAGE
  doc.setFillColor(26, 23, 21); // #1A1715
  doc.rect(0, 0, pageWidth, 110, 'F');

  doc.setFillColor(217, 119, 6); // Amber gold
  doc.rect(0, 108, pageWidth, 3, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('JEWELMIND AI', marginX, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(245, 215, 130);
  doc.text('HAUTE INTELLIGENCE KNOWLEDGE BASE', marginX, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 195, 190);
  doc.text('The Definitive Guide to Luxury Jewellery Advisory, 4Cs Gemology,', marginX, 70);
  doc.text('Metallurgy, Dual-Engine Gemini 2.5 Architecture & Virtual Try-On Studio', marginX, 76);

  cursorY = 135;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 23, 21);
  doc.text('DOCUMENT SPECIFICATIONS', marginX, cursorY);
  cursorY += 4;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.line(marginX, cursorY, marginX + 45, cursorY);
  cursorY += 10;

  const metadata = [
    ['Document Version', 'Release 2.4 (Enterprise Edition)'],
    ['Architecture', 'Google Gemini 2.5 Pro / Flash & Firebase Cloud Firestore'],
    ['Security Standard', 'Row Level Security (RLS) & ISO-27001 Cryptographic Vault'],
    ['Domain Focus', 'High Jewellery, 4Cs Diamond Grading, Metallurgy & AR Try-On'],
    ['Generated Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Target Audience', 'Luxury Connoisseurs, Gemologists, Designers & Haute Horlogerie Advisory']
  ];

  metadata.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 95, 90);
    doc.text(label + ':', marginX, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(26, 23, 21);
    doc.text(value, marginX + 40, cursorY);
    cursorY += 7;
  });

  cursorY += 15;

  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(230, 225, 215);
  doc.roundedRect(marginX, cursorY, contentWidth, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 120, 20);
  doc.text('EXECUTIVE OVERVIEW', marginX + 6, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 55, 50);
  const execSummary = 'JewelMind AI synthesizes centuries of high jewellery artisan tradition with next-generation multi-modal artificial intelligence. This document serves as the official Knowledge Base and technical handbook, outlining gemological standards, precious metal alloys, virtual try-on mechanics, and client privacy guarantees.';
  const splitExec = doc.splitTextToSize(execSummary, contentWidth - 12);
  doc.text(splitExec, marginX + 6, cursorY + 16);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 135, 130);
  doc.text('JewelMind.AI • Haute Intelligence System • All Rights Reserved', marginX, pageHeight - 15);

  // 2. CONTENT PAGES
  doc.addPage();
  drawPageDecorations();
  cursorY = marginTop;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(26, 23, 21);
  doc.text('TABLE OF CONTENTS & CHAPTER OVERVIEW', marginX, cursorY);
  cursorY += 3;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(marginX, cursorY, marginX + 60, cursorY);
  cursorY += 10;

  KNOWLEDGE_BASE_DATA.forEach((category, cIdx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 120, 20);
    doc.text(`MODULE ${cIdx + 1}: ${category.name.toUpperCase()}`, marginX, cursorY);
    cursorY += 5;

    category.articles.forEach((art) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 35, 30);
      doc.text(`•  ${art.title}`, marginX + 4, cursorY);
      cursorY += 5;
    });
    cursorY += 3;
  });

  cursorY += 6;
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.3);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 12;

  KNOWLEDGE_BASE_DATA.forEach((category, catIdx) => {
    checkPageBreak(30);

    doc.setFillColor(245, 240, 230);
    doc.roundedRect(marginX, cursorY, contentWidth, 12, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(160, 100, 15);
    doc.text(`MODULE ${catIdx + 1} — ${category.name.toUpperCase()}`, marginX + 4, cursorY + 8);
    cursorY += 18;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 95, 90);
    doc.text(category.description, marginX, cursorY);
    cursorY += 8;

    category.articles.forEach((article) => {
      checkPageBreak(35);

      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(26, 23, 21);
      doc.text(article.title, marginX, cursorY);
      cursorY += 5;

      const summaryLines = doc.splitTextToSize(`Executive Summary: ${article.summary}`, contentWidth - 8);
      const summaryBoxHeight = summaryLines.length * 4.5 + 4;

      doc.setFillColor(252, 250, 247);
      doc.setDrawColor(230, 225, 215);
      doc.roundedRect(marginX, cursorY, contentWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 75, 70);
      doc.text(summaryLines, marginX + 4, cursorY + 5);
      cursorY += summaryBoxHeight + 6;

      article.content.forEach((para) => {
        checkPageBreak(18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 35, 30);
        const paraLines = doc.splitTextToSize(para, contentWidth);
        doc.text(paraLines, marginX, cursorY);
        cursorY += paraLines.length * 4.4 + 4;
      });

      if (article.keyTakeaways && article.keyTakeaways.length > 0) {
        checkPageBreak(article.keyTakeaways.length * 5 + 10);
        cursorY += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(180, 120, 20);
        doc.text('Key Takeaways & Best Practices:', marginX, cursorY);
        cursorY += 5;

        article.keyTakeaways.forEach((point) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(40, 35, 30);
          const pointLines = doc.splitTextToSize(`◆  ${point}`, contentWidth - 4);
          doc.text(pointLines, marginX + 2, cursorY);
          cursorY += pointLines.length * 4.2 + 2;
        });
        cursorY += 4;
      }

      if (article.tableData) {
        const { headers, rows } = article.tableData;
        const colWidth = contentWidth / headers.length;
        const rowHeight = 7;
        const totalTableHeight = (rows.length + 1) * rowHeight + 8;

        checkPageBreak(totalTableHeight);

        doc.setFillColor(26, 23, 21);
        doc.rect(marginX, cursorY, contentWidth, rowHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(245, 215, 130);

        headers.forEach((hdr, i) => {
          doc.text(hdr, marginX + i * colWidth + 3, cursorY + 4.8);
        });
        cursorY += rowHeight;

        rows.forEach((row, rIdx) => {
          doc.setFillColor(rIdx % 2 === 0 ? 255 : 248, rIdx % 2 === 0 ? 255 : 246, rIdx % 2 === 0 ? 255 : 244);
          doc.rect(marginX, cursorY, contentWidth, rowHeight, 'F');
          doc.setDrawColor(230, 225, 215);
          doc.setLineWidth(0.2);
          doc.rect(marginX, cursorY, contentWidth, rowHeight, 'S');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 25, 20);

          row.forEach((cell, cIdx) => {
            const truncatedCell = cell.length > 30 ? cell.substring(0, 28) + '...' : cell;
            doc.text(truncatedCell, marginX + cIdx * colWidth + 3, cursorY + 4.8);
          });
          cursorY += rowHeight;
        });
        cursorY += 8;
      }

      cursorY += 6;
      doc.setDrawColor(235, 230, 220);
      doc.setLineWidth(0.3);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 10;
    });
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(140, 135, 130);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX - 20, pageHeight - 10);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

const outputPath = path.join(process.cwd(), 'public', 'JewelMind_AI_Knowledge_Base.pdf');
const pdfBuffer = buildPDF();
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`Knowledge Base PDF successfully generated at: ${outputPath} (${pdfBuffer.length} bytes)`);

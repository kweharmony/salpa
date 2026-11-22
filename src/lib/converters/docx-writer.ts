import { Document, Packer, Paragraph } from 'docx';

export function writeDocx(pages: string[][]): Promise<Blob> {
  const paragraphs = pages.flatMap((lines, pageIndex) =>
    (lines.length ? lines : ['']).map((text, lineIndex) => new Paragraph({
      text,
      pageBreakBefore: pageIndex > 0 && lineIndex === 0,
    })),
  );
  return Packer.toBlob(new Document({ sections: [{ children: paragraphs }] }));
}

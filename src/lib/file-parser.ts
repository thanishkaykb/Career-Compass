import * as mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return extractTextFromPDF(file);
  } else if (extension === "docx") {
    return extractTextFromDOCX(file);
  } else if (extension === "doc") {
    // Legacy DOC files are hard to parse in browser without a server-side helper or a very large library.
    // For now, we'll notify that only DOCX is supported if it fails, or try mammoth which sometimes handles them if they are actually DOCX.
    return extractTextFromDOCX(file);
  } else if (extension === "txt") {
    return file.text();
  } else {
    throw new Error("Unsupported file format. Please upload PDF, DOCX, or TXT.");
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

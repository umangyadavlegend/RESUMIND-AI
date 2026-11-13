import os
import io
import re
from typing import Tuple
from pypdf import PdfReader
import docx

class DocumentExtractionError(Exception):
    pass

class DocumentExtractor:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract clean text from PDF bytes using pypdf."""
        if not file_bytes or len(file_bytes) == 0:
            raise DocumentExtractionError("PDF file is empty.")
        
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            if len(reader.pages) == 0:
                raise DocumentExtractionError("PDF document has 0 pages.")
            
            extracted_pages = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text.strip())
            
            full_text = "\n\n".join(extracted_pages)
            if not full_text.strip():
                raise DocumentExtractionError("PDF appears to be a scanned image or contains no selectable text.")
            
            return DocumentExtractor._clean_text(full_text)
        except DocumentExtractionError:
            raise
        except Exception as e:
            raise DocumentExtractionError(f"Failed to parse PDF document: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        """Extract clean text from DOCX bytes using python-docx."""
        if not file_bytes or len(file_bytes) == 0:
            raise DocumentExtractionError("DOCX file is empty.")
        
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            
            # Also extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        paragraphs.append(" | ".join(row_cells))
            
            full_text = "\n\n".join(paragraphs)
            if not full_text.strip():
                raise DocumentExtractionError("DOCX file contains no text.")
            
            return DocumentExtractor._clean_text(full_text)
        except DocumentExtractionError:
            raise
        except Exception as e:
            raise DocumentExtractionError(f"Failed to parse DOCX document: {str(e)}")

    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        """Route to appropriate extractor based on extension."""
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return DocumentExtractor.extract_text_from_pdf(file_bytes)
        elif ext in [".docx", ".doc"]:
            return DocumentExtractor.extract_text_from_docx(file_bytes)
        elif ext in [".txt", ".md"]:
            try:
                return DocumentExtractor._clean_text(file_bytes.decode("utf-8"))
            except UnicodeDecodeError:
                return DocumentExtractor._clean_text(file_bytes.decode("latin-1"))
        else:
            raise DocumentExtractionError(f"Unsupported file format: {ext}. Please upload .pdf or .docx resumes.")

    @staticmethod
    def _clean_text(text: str) -> str:
        """Normalize line breaks, tabs, and excess whitespace."""
        # Replace non-breaking spaces and unusual whitespace
        text = text.replace('\xa0', ' ').replace('\r\n', '\n').replace('\r', '\n')
        # Collapse multiple spaces into one
        text = re.sub(r'[ \t]+', ' ', text)
        # Collapse 3 or more consecutive newlines into 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

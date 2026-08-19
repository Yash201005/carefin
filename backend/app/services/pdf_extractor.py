import io
from typing import Any

from pypdf import PdfReader


class PDFExtractionError(ValueError):
    """Custom exception raised during PDF parsing or validation errors."""

class PDFExtractor:
    @staticmethod
    def validate_and_extract(file_bytes: bytes, file_name: str) -> list[dict[str, Any]]:
        """
        Validates that the file is a valid PDF via magic number check, enforces size limits,
        and extracts page-by-page text content with page boundaries preserved.
        """
        # 1. Enforce size limits (10MB = 10 * 1024 * 1024 bytes)
        max_size = 10 * 1024 * 1024
        if len(file_bytes) > max_size:
            raise PDFExtractionError("File size exceeds the maximum limit of 10 MB.")

        # 2. Enforce magic number checks (%PDF- signature is b'\x25\x50\x44\x46\x2d')
        if not file_bytes.startswith(b"%PDF-"):
            raise PDFExtractionError("Invalid file type. Only PDF documents are supported.")

        # 3. Read pages and extract text while checking for malformations
        pages_content = []
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            
            # Check if document has pages
            num_pages = len(reader.pages)
            if num_pages == 0:
                raise PDFExtractionError("PDF file contains no pages.")

            for i in range(num_pages):
                page = reader.pages[i]
                page_text = page.extract_text() or ""
                pages_content.append({
                    "document_id": file_name,
                    "page_number": i + 1,
                    "text": page_text
                })
                
        except Exception as e:
            # Catch decryption errors or malformed parsing failures
            if isinstance(e, PDFExtractionError):
                raise
            raise PDFExtractionError(f"Malformed or encrypted PDF document: {e!s}")

        return pages_content

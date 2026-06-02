import io
from pypdf import PdfReader

def extract_text_from_pdf(pdf_file) -> str:
    """
    Extracts all text from an uploaded PDF file in-memory.
    """
    try:
        reader = PdfReader(pdf_file)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts).strip()
    except Exception as e:
        raise ValueError(f"Gagal memproses file PDF: {str(e)}")

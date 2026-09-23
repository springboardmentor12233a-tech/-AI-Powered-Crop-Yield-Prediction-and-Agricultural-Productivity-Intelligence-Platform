import re
import xml.sax.saxutils

def sanitize_for_reportlab(text: str) -> str:
    """
    Converts raw text or markdown into clean, valid XML for ReportLab Paragraphs:
    1. First transforms markdown **bold** into a temporary placeholder.
    2. Escapes all special characters (&, <, >).
    3. Restores balanced <b> and </b> tags.
    4. Strips any dangling or malformed unmatched tags.
    """
    if not text:
        return ""
        
    # Replace **bold** with temporary markers
    placeholders = []
    def _save_bold(match):
        inner = match.group(1)
        placeholders.append(inner)
        return f"__BOLD_TAG_{len(placeholders)-1}__"
        
    temp_text = re.sub(r'\*\*(.+?)\*\*', _save_bold, text)
    
    # Escape XML (<, >, &)
    escaped = xml.sax.saxutils.escape(temp_text)
    
    # Re-insert balanced <b></b> tags
    for i, orig in enumerate(placeholders):
        escaped_inner = xml.sax.saxutils.escape(orig)
        escaped = escaped.replace(f"__BOLD_TAG_{i}__", f"<b>{escaped_inner}</b>")
        
    # Clean up any leftover single asterisks
    escaped = escaped.replace("*", "")
    return escaped

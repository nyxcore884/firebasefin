import re
import logging

logger = logging.getLogger(__name__)

# Sensitive Patterns
PATTERNS = {
    "IBAN": r'[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}',
    "EMAIL": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    "PHONE": r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
    "SSN": r'\b\d{3}-\d{2}-\d{4}\b',
    "CREDIT_CARD": r'\b(?:\d[ -]*?){13,16}\b'
}

def mask_text(text):
    """
    Masks PII in raw text strings.
    """
    if not text or not isinstance(text, str):
        return text
    
    masked_text = text
    for label, pattern in PATTERNS.items():
        masked_text = re.sub(pattern, f"[MASKED_{label}]", masked_text)
    
    return masked_text

def scrub_transaction(transaction):
    """
    Scrubs a single transaction dictionary of sensitive data.
    """
    # Sensitive fields to check
    sensitive_fields = ['counterparty', 'description', 'reference', 'memo']
    
    scrubbed = transaction.copy()
    for field in sensitive_fields:
        if field in scrubbed and scrubbed[field]:
            val = str(scrubbed[field])
            # Check for names (Simple name detection: Title Case sequences)
            # This is a heuristic; real DLP uses LLM or specialized NER
            scrubbed[field] = mask_text(val)
            
    return scrubbed

def scrub_dataset(transactions):
    """
    Scrubs an entire dataset before sending to AI Brain.
    """
    return [scrub_transaction(t) for t in transactions]

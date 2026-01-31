import pandas as pd
import re

def mask_sensitive_data(df: pd.DataFrame, sensitive_columns=['Extra_dimension1_Dr', 'Counterparty_ENG', 'Recorder']) -> pd.DataFrame:
    """
    Redacts specific names and PII from the financial dataframe 
    before it is sent to the LLM for summarization.
    """
    masked_df = df.copy()

    # Logic: If it looks like a name or contains specific PII patterns, replace it.
    for col in sensitive_columns:
        if col in masked_df.columns:
            masked_df[col] = masked_df[col].apply(lambda x: "[REDACTED_ENTITY]" if x and len(str(x)) > 3 else x)

    # Optional: Remove specific account numbers or IDs using Regex
    # Mask any number sequence longer than 4 digits not part of standard date/amount
    # Using specific regex for IDs to avoid masking amounts
    mask_account_regex = r'(?<!\d)\d{5,}(?!\d)' 
    
    # Apply regex mask on string columns only to avoid messing up floats
    object_cols = masked_df.select_dtypes(include=['object']).columns
    for col in object_cols:
         masked_df[col] = masked_df[col].astype(str).str.replace(mask_account_regex, "[ID_HIDDEN]", regex=True)

    return masked_df

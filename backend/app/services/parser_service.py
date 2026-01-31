import pandas as pd
import io
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class AdaptiveParserService:
    """
    Parses ANY Excel file by intelligently detecting headers and mapping columns.
    Follows the "Intelligent Parser" logic from the SGP Verification Guide.
    """

    # Keywords to identify the Header Row
    HEADER_CANDIDATES = [
        # English
        "date", "amount", "revenue", "product", "description", "category", "cogs", "quantity", "price", "net", "account", "code",
        # Georgian
        "თარიღი", "თანხა", "შემოსავალი", "პროდუქტი", "აღწერა", "კატეგორია", "რაოდენობა", "ფასი", "ანგარიში"
    ]

    # Column Mapping (Flexible Input -> Standard Output)
    COLUMN_MAP = {
        "amount": ["amount", "value", "cost", "total", "თანხა", "ღირებულება", "ჯამი", "net"],
        "date": ["date", "period", "time", "თარიღი", "პერიოდი", "month"],
        "product": ["product", "item", "article", "პროდუქტი", "საქონელი", "დასახელება"],
        "description": ["description", "comment", "details", "აღწერა", "კომენტარი"],
        "entity": ["entity", "department", "branch", "ობიექტი", "დეპარტამენტი"],
        "cogs": ["cogs", "თვითღირებულება", "6", "7310", "8230"],
        "quantity": ["quantity", "qty", "vol", "რაოდენობა"]
    }

    def parse_excel(self, file_content: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Main entry point. Reads Excel, finds header, normalizes data.
        """
        try:
            # 1. Read Excel file (try to read normally first to check structure)
            # We don't assume row 0 is header yet.
            df_raw = pd.read_excel(io.BytesIO(file_content), header=None)
            
            # 2. Find the Header Row
            header_row_idx = self._find_header_row(df_raw)
            
            if header_row_idx is None:
                logger.warning(f"Could not automatically detect header row in {filename}. Assuming row 0.")
                header_row_idx = 0

            # 3. Reload dataframe with correct header
            df = pd.read_excel(io.BytesIO(file_content), header=header_row_idx)
            
            # 4. Standardize Columns
            df = self._normalize_columns(df)
            
            # 5. Clean Data
            df = self._clean_data(df)

            # 6. Convert to Records
            records = df.to_dict(orient="records")
            
            # Add metadata
            for record in records:
                record["source_file"] = filename
                
            logger.info(f"Successfully parsed {len(records)} rows from {filename}")
            return records

        except Exception as e:
            logger.error(f"Failed to parse Excel file {filename}: {str(e)}")
            raise

    def _find_header_row(self, df: pd.DataFrame) -> Optional[int]:
        """
        Scans top 10 rows. Returns index of row with most matches to HEADER_CANDIDATES.
        """
        best_score = 0
        best_row_idx = None

        for idx, row in df.head(10).iterrows():
            # Convert row values to string and lower case for matching
            row_values = [str(val).lower() for val in row.values if pd.notna(val)]
            score = 0
            for val in row_values:
                for keyword in self.HEADER_CANDIDATES:
                    if keyword in val: # Fuzzy match (substring)
                        score += 1
                        break
            
            if score > best_score:
                best_score = score
                best_row_idx = idx

        # Heuristic: need at least 2 matches to be confident, else default to 0
        return best_row_idx if best_score >= 2 else 0

    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Renames columns to standard internal names (amount, date, etc.)
        """
        new_columns = {}
        for col in df.columns:
            col_str = str(col).lower().strip()
            mapped = False
            
            for standard_name, aliases in self.COLUMN_MAP.items():
                for alias in aliases:
                    if alias in col_str:
                        new_columns[col] = standard_name
                        mapped = True
                        break
                if mapped: break
            
            if not mapped:
                # Keep original name but snake_case it as fallback
                new_columns[col] = col_str.replace(" ", "_")
        
        return df.rename(columns=new_columns)

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Basic data cleaning: drop empty rows, fix dates, numbers.
        """
        # Drop rows where all elements are NaN
        df = df.dropna(how='all')
        
        # Ensure 'amount' is numeric if exists
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
            
        # Ensure 'date' is standard format if exists
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce').dt.date

        return df

parser_service = AdaptiveParserService()

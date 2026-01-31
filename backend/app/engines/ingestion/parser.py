import pandas as pd
import io
from fuzzywuzzy import process
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class IntelligentParser:
    """
    Parses files by MEANING, not position. 
    Handles Georgian, Russian, and English headers.
    """
    
    # Dictionary mapping standard internal keys to possible CSV/Excel headers
    SEMANTIC_MAP = {
        "revenue": ["revenue", "net revenue", "შემოსავალი", "выручка", "amount", "sales", "total revenue"],
        "cogs": ["cogs", "cost of goods", "თვითღირებულება", "себестоимость", "expense", "purchases"],
        "account_6": ["6", "account 6", "ანგარიში 6"],
        "account_7310": ["7310", "account 7310"],
        "account_8230": ["8230", "account 8230"],
        "entity": ["entity", "region", "branch", "რეგიონი", "ფილიალი", "division", "subsidiary"],
        "product": ["product", "item", "sku", "პროდუქტი", "товар", "description", "service", "Суბკონტო"],
        "period": ["period", "date", "month", "პერიოდი", "дата", "year"]
    }

    # SGP Specific Product Classifications (as provided by user)
    SGP_PRODUCT_MAPPING = {
        "wholesale": {
            "petrol": ["ევრო რეგულარი (იმპორტი), კგ", "პრემიუმი (რეექსპორტი), კგ", "სუპერი (რეექსპორტი), კგ"],
            "diesel": ["დიზელი (საბითუმო), ლ", "ევროდიზელი  (ექსპორტი), კგ"],
            "bitumen": ["ბიტუმი (საბითუმო), კგ"]
        },
        "retail": {
            "petrol": ["ევრო რეგულარი, ლ", "პრემიუმი , ლ", "სუპერი , ლ"],
            "diesel": ["დიზელი, ლ", "ევრო დიზელი, ლ"],
            "cng": ["ბუნებრივი აირი, მ3", "ბუნებრივი აირი (საბითუმო), მ3"],
            "lpg": ["თხევადი აირი (მხოლოდ SGP !!!), ლ"]
        }
    }

    def parse(self, file_content: bytes, filename: str) -> list[dict]:
        # 1. Load Data
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_content))
            else:
                df = pd.read_excel(io.BytesIO(file_content))
        except Exception as e:
            logger.error(f"Failed to load file {filename}: {str(e)}")
            return []

        # 2. Semantic Mapping
        column_map = self._map_headers(df.columns)
        df.rename(columns=column_map, inplace=True)

        # 3. Standardization
        records = []
        for _, row in df.iterrows():
            # Logic: Determine if this row is Revenue or Cost based on columns present
            account_type = "General"
            amount = Decimal(0)
            product_name = str(row.get('product', 'Unknown'))
            
            # SGP Specific Account Splitting for COGS (6 + 7310 + 8230)
            cogs_6 = self._to_decimal(row.get('account_6', 0))
            cogs_7310 = self._to_decimal(row.get('account_7310', 0))
            cogs_8230 = self._to_decimal(row.get('account_8230', 0))
            
            if cogs_6 > 0 or cogs_7310 > 0 or cogs_8230 > 0:
                account_type = "COGS"
                amount = cogs_6 + cogs_7310 + cogs_8230
            elif 'revenue' in df.columns and pd.notna(row.get('revenue')):
                account_type = "Revenue"
                amount = self._to_decimal(row['revenue'])
            elif 'amount' in df.columns:
                amount = self._to_decimal(row['amount'])

            # SGP Product Category Enrichment
            sgp_category = "other"
            for cat_type, subcats in self.SGP_PRODUCT_MAPPING.items():
                for subcat, names in subcats.items():
                    if any(name.lower() in product_name.lower() for name in names):
                        sgp_category = f"{cat_type}_{subcat}"
                        break

            records.append({
                "entity": str(row.get('entity', 'Unknown')),
                "account_name": account_type,
                "account_code": str(row.get('account_code', '')), # Pass through for G&A logic
                "product_name": product_name,
                "sgp_category": sgp_category,
                "period": str(row.get('period', 'N/A')),
                "amount": float(amount),
                "cogs_breakdown": {
                    "6": float(cogs_6),
                    "7310": float(cogs_7310),
                    "8230": float(cogs_8230)
                }
            })
            
        return records

    def _to_decimal(self, val) -> Decimal:
        try:
            if pd.isna(val): return Decimal(0)
            return Decimal(str(val).replace(',', ''))
        except (ValueError, TypeError):
            return Decimal(0)

    def _map_headers(self, headers: list) -> dict:
        mapping = {}
        for header in headers:
            # Check against all semantic categories
            best_match = None
            highest_score = 0
            
            for standard_key, variations in self.SEMANTIC_MAP.items():
                match, score = process.extractOne(str(header).lower(), variations)
                if score > highest_score:
                    highest_score = score
                    best_match = standard_key
            
            if highest_score >= 85:  # High confidence threshold
                mapping[header] = best_match
                
        return mapping

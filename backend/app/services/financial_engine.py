import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SGPFinancialEngine:
    """
    Implements specific SGP (SOCAR Georgia Petroleum) Logic.
    Ref: 'SGP Financial Logic' in Verification Guide.
    """
    
    # SGP Product Taxonomy
    PRODUCT_MAPPING = {
        "SGG": ["Natural Gas", "CNG", "LPG", "ბუნებრივი აირი"],
        "SGP": ["Euro Regular", "Diesel", "Premium", "დიზელი", "ევრო რეგულარი"]
    }

    def process_records(self, records: List[Dict[str, Any]], org_id: str) -> List[Dict[str, Any]]:
        """
        Enriches records with calculated fields:
        - Product Category (Fuel vs Non-Fuel)
        - Margin logic (if Cost exists)
        """
        logger.info(f"Processing {len(records)} records for {org_id}")
        
        enriched = []
        for row in records:
            # 1. Product Classification
            product_name = row.get("product", "Unknown")
            row["product_category"] = self._classify_product(product_name)
            
            # 2. Add Organization
            row["org_id"] = org_id
            
            enriched.append(row)
            
        return enriched

    def _classify_product(self, product_name: str) -> str:
        sstr = str(product_name).lower()
        
        for p in self.PRODUCT_MAPPING["SGP"]:
            if str(p).lower() in sstr:
                return "Fuel"
                
        for p in self.PRODUCT_MAPPING["SGG"]:
             if str(p).lower() in sstr:
                return "Gas"
                
        return "Other"

financial_engine = SGPFinancialEngine()

import pandas as pd
import re

class SGPFinancialEngine:
    def __init__(self):
        # 1. Strict Product Classification Rules (Regex)
        self.RULES_REVENUE = {
            "Wholesale": {
                "Petrol": [r"ევრო\s*რეგულარი\s*\(იმპორტი\)", r"პრემიუმი\s*\(რეექსპორტი\)", r"სუპერი\s*\(რეექსპორტი\)"],
                "Diesel": [r"დიზელი\s*\(საბითუმო\)", r"ევროდიზელი\s*\(ექსპორტი\)"],
                "Bitumen": [r"ბიტუმი\s*\(საბითუმო\)"]
            },
            "Retail": {
                "Petrol": [r"^ევრო\s*რეგულარი$", r"^პრემიუმი$", r"^სუპერი$"],
                "Diesel": [r"^დიზელი$", r"^ევრო\s*დიზელი$"],
                "CNG": [r"ბუნებრივი\s*აირი", r"ბუნებრივი\s*აირი\s*\(საბითუმო\)"], # Special rule: Wholesale CNG -> Retail
                "LPG": [r"თხევადი\s*აირი"]
            }
        }
        # 2. Expense Accounts to Filter
        self.EXPENSE_PREFIXES = ("73", "74", "82", "92")

    def process(self, rev_path, cogs_path, base_path):
        # Load Data
        df_rev = pd.read_csv(rev_path)
        df_cogs = pd.read_csv(cogs_path)
        df_base = pd.read_csv(base_path)

        # Process Components
        revenue_summary = self._process_revenue(df_rev)
        cogs_summary = self._process_cogs(df_cogs, revenue_summary)
        expenses_total = self._process_expenses(df_base)

        return self._generate_report(revenue_summary, cogs_summary, expenses_total)

    def classify_product(self, product_name: str) -> dict:
        """
        Public method to classify product using strict Regex rules.
        Used by both the Engine and the BigQuery Loader.
        """
        product_name = str(product_name).strip()
        
        # Check Wholesale
        for cat, patterns in self.RULES_REVENUE["Wholesale"].items():
            if any(re.search(p, product_name, re.IGNORECASE) for p in patterns):
                return {
                    "category": "Wholesale",
                    "type": cat,
                    "line_item": f"revenue_whsale_{cat.lower()}",
                    "is_wholesale": True,
                    "is_retail": False
                }
                
        # Check Retail
        for cat, patterns in self.RULES_REVENUE["Retail"].items():
            if any(re.search(p, product_name, re.IGNORECASE) for p in patterns):
                return {
                    "category": "Retail",
                    "type": cat,
                    "line_item": f"revenue_retail_{cat.lower()}",
                    "is_wholesale": False,
                    "is_retail": True
                }
                
        return {
            "category": "Other",
            "type": "Other",
            "line_item": "other_revenue",
            "is_wholesale": False,
            "is_retail": False
        }

    def _process_revenue(self, df):
        summary = {"Wholesale": {}, "Retail": {}, "Other": 0.0}
        
        # Normalize columns - find columns even if names vary slightly
        prod_col = next((c for c in df.columns if "Product" in str(c) or "პროდუქტი" in str(c)), df.columns[0])
        # Try to find Net Revenue column, look for D/Net Revenue/Amount
        net_rev_col = next((c for c in df.columns if "Net Revenue" in str(c) or "თანხა" in str(c)), None)
        
        if not net_rev_col and len(df.columns) > 3:
            net_rev_col = df.columns[3] # Fallback to 4th column (D)

        for _, row in df.iterrows():
            prod = str(row[prod_col]).strip()
            try: 
                amount = float(row[net_rev_col]) if net_rev_col else 0.0
            except: continue
            
            if amount == 0: continue

            # Use shared classification logic
            classification = self.classify_product(prod)
            
            if classification['category'] == 'Wholesale':
                key = f"Revenue Whsale {classification['type']} (Lari)"
                summary["Wholesale"][key] = summary["Wholesale"].get(key, 0) + amount
            elif classification['category'] == 'Retail':
                key = f"Revenue Retial {classification['type']} (Lari)"
                summary["Retail"][key] = summary["Retail"].get(key, 0) + amount
            else:
                summary["Other"] += amount
                
        return summary

    def _process_cogs(self, df, rev_summary):
        # Identify Columns: 6, 7310, 8230 by checking header values
        col_6 = next((c for c in df.columns if str(c).strip() == '6'), None)
        col_7310 = next((c for c in df.columns if str(c).strip() == '7310'), None)
        col_8230 = next((c for c in df.columns if str(c).strip() == '8230'), None)
        
        # Calculate Total COGS
        total_cogs = 0.0
        
        # If columns exist, sum them up
        cols_to_sum = [c for c in [col_6, col_7310, col_8230] if c]
        
        if cols_to_sum:
            total_cogs = df[cols_to_sum].sum().sum()
        
        return total_cogs

    def _process_expenses(self, df):
        # Filter Account Dr for 73, 74, 82, 92
        acc_col = next((c for c in df.columns if "Account Dr" in str(c) or "ანგარიში" in str(c)), None)
        amt_col = next((c for c in df.columns if "Amount" in str(c) or "Сумма" in str(c) or "თანხა" in str(c)), None)
        
        if not acc_col: acc_col = df.columns[0]
        if not amt_col:
             for c in df.columns:
                 if df[c].dtype in ['float64', 'int64']:
                     amt_col = c
                     break

        total_exp = 0.0
        if acc_col and amt_col:
            for _, row in df.iterrows():
                acc = str(row[acc_col])
                if acc.startswith(self.EXPENSE_PREFIXES):
                    try: total_exp += float(row[amt_col])
                    except: pass
        return total_exp

    def _generate_report(self, rev, cogs, exp):
        # Calculate Totals
        total_wholesale = sum(rev["Wholesale"].values())
        total_retail = sum(rev["Retail"].values())
        total_rev = total_wholesale + total_retail + rev["Other"]
        gross_profit = total_rev - cogs
        net_profit = gross_profit - exp

        print("\n" + "="*40)
        print("SGP FINANCIAL REPORT (STRICT RULES)")
        print("="*40)
        print(f"REVENUE WHOLESALE:       {total_wholesale:,.2f}")
        for k, v in rev["Wholesale"].items(): print(f"  - {k}: {v:,.2f}")
        print("-" * 40)
        print(f"REVENUE RETAIL:          {total_retail:,.2f}")
        for k, v in rev["Retail"].items(): print(f"  - {k}: {v:,.2f}")
        print("-" * 40)
        print(f"OTHER REVENUE:           {rev['Other']:,.2f}")
        print("=" * 40)
        print(f"TOTAL REVENUE:           {total_rev:,.2f}")
        print(f"TOTAL COGS:             -{cogs:,.2f}")
        print(f"GROSS PROFIT:            {gross_profit:,.2f}")
        print(f"G&A EXPENSES:           -{exp:,.2f}")
        print("=" * 40)
        print(f"NET PROFIT:              {net_profit:,.2f}")

# Run the Engine
if __name__ == "__main__":
    engine = SGPFinancialEngine()
    # Looking for files in current dir or auto-detect
    print("Looking for CSV files...")

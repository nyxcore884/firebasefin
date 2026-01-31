import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin (Assumes local credentials or default environment)
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

def seed_sgp_logic():
    # 1. Product Classifications
    products = [
        # Wholesale Petrol
        {"id": "sgp_prod_001", "name_ka": "ევრო რეგულარი (იმპორტი), კგ", "category": "wholesale", "type": "petrol"},
        {"id": "sgp_prod_002", "name_ka": "პრემიუმი (რეექსპორტი), კგ", "category": "wholesale", "type": "petrol"},
        {"id": "sgp_prod_003", "name_ka": "სუპერი (რეექსპორტი), კგ", "category": "wholesale", "type": "petrol"},
        # Wholesale Diesel
        {"id": "sgp_prod_004", "name_ka": "დიზელი (საბითუმო), ლ", "category": "wholesale", "type": "diesel"},
        {"id": "sgp_prod_005", "name_ka": "ევროდიზელი  (ექსპორტი), კგ", "category": "wholesale", "type": "diesel"},
        # Wholesale Bitumen
        {"id": "sgp_prod_006", "name_ka": "ბიტუმი (საბითუმო), კგ", "category": "wholesale", "type": "bitumen"},
        # Retail Petrol
        {"id": "sgp_prod_007", "name_ka": "ევრო რეგულარი, ლ", "category": "retail", "type": "petrol"},
        {"id": "sgp_prod_008", "name_ka": "პრემიუმი , ლ", "category": "retail", "type": "petrol"},
        {"id": "sgp_prod_009", "name_ka": "სუპერი , ლ", "category": "retail", "type": "petrol"},
        # Retail Diesel
        {"id": "sgp_prod_010", "name_ka": "დიზელი, ლ", "category": "retail", "type": "diesel"},
        {"id": "sgp_prod_011", "name_ka": "ევრო დიზელი, ლ", "category": "retail", "type": "diesel"},
        # Retail CNG
        {"id": "sgp_prod_012", "name_ka": "ბუნებრივი აირი, მ3", "category": "retail", "type": "cng"},
        {"id": "sgp_prod_013", "name_ka": "ბუნებრივი აირი (საბითუმო), მ3", "category": "retail", "type": "cng"},
        # Retail LPG (SGP ONLY)
        {"id": "sgp_prod_014", "name_ka": "თხევადი აირი (მხოლოდ SGP !!!), ლ", "category": "retail", "type": "lpg"}
    ]

    print("Seeding SGP products...")
    for p in products:
        db.collection("product_classifications").document(p["id"]).set(p)

    # 2. Account Classifications (G&A Expenses)
    accounts = [
        {"code": "7310.02.1", "name_ka": "წარმომადგენლობითი ხარჯები", "type": "expense", "group": "G&A"},
        {"code": "7410", "name_ka": "ადმინისტრაციული ხარჯები", "type": "expense", "group": "G&A"},
        {"code": "7410.01", "name_ka": "ადმინისტრაციული ხარჯები", "type": "expense", "group": "G&A"},
        {"code": "8220.01.1", "name_ka": "სხვა ხარჯები", "type": "expense", "group": "G&A"},
        {"code": "9210", "name_ka": "საერთო ხარჯები", "type": "expense", "group": "G&A"}
    ]

    print("Seeding account classifications...")
    for a in accounts:
        db.collection("account_classifications").document(a["code"]).set(a)

    print("Seeding complete.")

if __name__ == "__main__":
    seed_sgp_logic()

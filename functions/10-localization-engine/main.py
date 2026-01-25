import logging
import json
import hashlib
from firebase_functions import https_fn, options
from firebase_admin import firestore, initialize_app
import firebase_admin
import vertexai
from vertexai.generative_models import GenerativeModel

# Init
if not firebase_admin._apps:
    initialize_app()
    
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global lazy initialization
_db = None

def get_db():
    global _db
    if _db is None:
        _db = firestore.client()
    return _db

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_512,
)
def translate_ui_batch(req: https_fn.Request) -> https_fn.Response:
    """
    Batch translates UI strings using Semantic Caching + Gemini.
    """
    try:
        db = get_db()
        data = req.get_json(silent=True) or {}
        texts = data.get("texts", [])
        target_lang = data.get("target", "ka")
        context_desc = data.get("context", "Professional Financial Dashboard")
        
        if not texts:
            return https_fn.Response(json.dumps({}), status=200)

        # 1. Check Cache (Firestore)
        # Key format: localization/{lang}/strings/{hash}
        # To optimize, we could fetch all at once or simple iteration.
        # Batch get is better.
        
        results = {}
        missing = []
        missing_map = {} # map hash -> text
        
        refs = []
        hashes = []
        
        for t in texts:
            h = hashlib.md5(f"{t.strip()}|{context_desc}".encode()).hexdigest()
            hashes.append(h)
            refs.append(db.doc(f"localization/{target_lang}/strings/{h}"))
            
        snapshots = db.get_all(refs)
        
        for i, snap in enumerate(snapshots):
            original_text = texts[i]
            if snap.exists:
                results[original_text] = snap.get("translated")
            else:
                missing.append(original_text)
                missing_map[hashes[i]] = original_text

        if not missing:
            return https_fn.Response(json.dumps(results), status=200)

        # 2. Ask Gemini (for missing only)
        # Batch prompt
        vertexai.init(location="us-central1")
        model = GenerativeModel("gemini-1.5-flash") # Flash is fast & good enough for translation
        
        prompt = f"""
        Translate the following UI strings to language code: {target_lang}.
        Context: {context_desc}.
        Return ONLY valid JSON: {{ "original_string": "translated_string" }}
        
        Strings to translate:
        {json.dumps(missing)}
        """
        
        ai_resp = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        try:
            translations = json.loads(ai_resp.text)
        except:
             # Fallback parsing
             translations = {} 
             logger.error("Failed to parse AI Translation JSON")

        # 3. Update Cache & Merge
        batch = db.batch()
        
        for original, translated in translations.items():
            # Find hash
            h = hashlib.md5(f"{original.strip()}|{context_desc}".encode()).hexdigest()
            doc_ref = db.doc(f"localization/{target_lang}/strings/{h}")
            batch.set(doc_ref, {
                "original": original,
                "translated": translated,
                "context": context_desc
            })
            results[original] = translated
            
        batch.commit()
        
        # Fill any holes (if AI missed some)
        for m in missing:
            if m not in results:
                results[m] = m # Fallback to original
                
        return https_fn.Response(json.dumps(results), status=200, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.error(f"Translation Error: {e}")
        # Fail gracefully: return original strings mapped to themselves
        fallback = {t: t for t in texts}
        return https_fn.Response(json.dumps(fallback), status=200)

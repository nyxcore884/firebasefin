import logging
import datetime
from google.cloud import firestore

# Initialize Logging
logger = logging.getLogger(__name__)

# Lazy Firestore
db = None

def get_db():
    global db
    if db is None:
        db = firestore.Client()
    return db

def save_message(user_id: str, role: str, content: str):
    """
    Saves a single message to the user's conversation history in Firestore.
    Structure: ai_memory/{user_id}/messages/{timestamp}
    """
    try:
        if not user_id:
            user_id = "anonymous_user"
            
        timestamp = datetime.datetime.now(datetime.timezone.utc)
        
        doc_ref = get_db().collection("ai_memory").document(user_id).collection("messages").document()
        doc_ref.set({
            "role": role,
            "content": content,
            "timestamp": timestamp
        })
        logger.info(f"Saved message for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to save message: {e}")

def learn_fact(fact_text: str, source: str = "user_correction"):
    """
    Saves a learned fact to the global knowledge base.
    Structure: ai_knowledge_base/{auto_id}
    """
    try:
        timestamp = datetime.datetime.now(datetime.timezone.utc)
        get_db().collection("ai_knowledge_base").add({
            "fact": fact_text,
            "source": source,
            "timestamp": timestamp,
            "confidence": 1.0  # User corrections are high confidence
        })
        logger.info(f"Learned new fact: {fact_text}")
    except Exception as e:
        logger.error(f"Failed to learn fact: {e}")

def get_recent_context(user_id: str, limit: int = 5) -> list:
    """
    Retrieves the last N messages to provide conversational context.
    """
    try:
        if not user_id:
            return []

        docs = (
            get_db()
            .collection("ai_memory")
            .document(user_id)
            .collection("messages")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        
        messages = []
        for doc in docs:
            data = doc.to_dict()
            # Convert back to simple dict for prompt
            messages.append({"role": data["role"], "content": data["content"]})
            
        return list(reversed(messages)) # Return in chronological order
    except Exception as e:
        logger.error(f"Failed to retrieve context: {e}")
        return []

def get_learned_facts(limit: int = 3) -> str:
    """
    Retrieves the most recent learned facts to augment the system prompt.
    """
    try:
        docs = (
            get_db()
            .collection("ai_knowledge_base")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        
        facts = [doc.to_dict().get("fact") for doc in docs]
        if not facts:
            return ""
            
        return "Recall these recent learnings:\n" + "\n".join([f"- {f}" for f in facts])
    except Exception as e:
        return ""

def semantic_context_lookup(query: str, limit: int = 3) -> str:
    """
    Simulates Neural Long-term Memory by finding relevant historical facts.
    In production, this uses Vertex AI Vector Search.
    """
    try:
        # 1. Extract keywords from query for simple semantic filtering
        keywords = [w for w in query.lower().split() if len(w) > 4]
        
        # 2. Query knowledge base for facts containing keywords
        # Note: Firestore doesn't support full-text search directly, but we can filter by 'tags' or 'keywords'
        # For simulation, we'll fetch recent and then filter
        docs = get_db().collection("ai_knowledge_base").limit(20).stream()
        
        relevant_facts = []
        for doc in docs:
            data = doc.to_dict()
            fact = data.get("fact", "").lower()
            # Heuristic match
            if any(k in fact for k in keywords):
                relevant_facts.append(data.get("fact"))
                
        if not relevant_facts:
            return ""
            
        return "\n**Institutional Knowledge Memo:**\n" + "\n".join([f"- {f}" for f in relevant_facts[:limit]])
    except Exception as e:
        logger.error(f"Semantic lookup failed: {e}")
        return ""

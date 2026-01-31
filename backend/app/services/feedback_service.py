"""
Feedback Service
Handles user feedback export for Vertex AI model tuning
"""

from google.cloud import firestore, bigquery, storage
from app.core.config import settings
import json
import logging
from datetime import datetime
from typing import List, Dict

logger = logging.getLogger(__name__)

class FeedbackService:
    def __init__(self):
        self.db = firestore.Client(project=settings.PROJECT_ID)
        self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
        self.storage_client = storage.Client(project=settings.PROJECT_ID)
        self.feedback_table = f"{settings.PROJECT_ID}.ai_training.feedback_logs"
        
    def export_training_data(self, min_rating: int = 4) -> str:
        """
        Export high-quality feedback to JSONL for Vertex AI tuning
        
        Args:
            min_rating: Minimum rating to include (default 4+ stars)
            
        Returns:
            GCS path to exported JSONL file
        """
        try:
            # Query high-quality interactions
            feedback_ref = self.db.collection("ai_feedback")
            query = feedback_ref.where("rating", ">=", min_rating)
            
            training_examples = []
            
            for doc in query.stream():
                data = doc.to_dict()
                
                # Format for Vertex AI tuning (instruction-following format)
                example = {
                    "messages": [
                        {
                            "role": "user",
                            "content": data.get("query", "")
                        },
                        {
                            "role": "assistant",
                            "content": data.get("response", "")
                        }
                    ]
                }
                
                training_examples.append(example)
            
            # Convert to JSONL
            jsonl_content = "\n".join([json.dumps(ex) for ex in training_examples])
            
            # Upload to GCS
            bucket_name = f"{settings.PROJECT_ID}-ai-training"
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            blob_path = f"training/feedback_{timestamp}.jsonl"
            
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            blob.upload_from_string(jsonl_content, content_type="application/jsonl")
            
            gcs_path = f"gs://{bucket_name}/{blob_path}"
            logger.info(f"Exported {len(training_examples)} training examples to {gcs_path}")
            
            return gcs_path
            
        except Exception as e:
            logger.error(f"Training data export failed: {str(e)}")
            raise
    
    def log_to_bigquery(self, feedback_data: Dict):
        """
        Log feedback to BigQuery for analytics
        
        Args:
            feedback_data: Feedback details including query, response, rating
        """
        try:
            # Prepare row
            row = {
                "timestamp": datetime.utcnow().isoformat(),
                "query_id": feedback_data.get("query_id"),
                "query": feedback_data.get("query"),
                "response": feedback_data.get("response"),
                "rating": feedback_data.get("rating"),
                "correction": feedback_data.get("correction"),
                "org_id": feedback_data.get("org_id"),
                "page": feedback_data.get("page")
            }
            
            # Insert to BigQuery
            errors = self.bq_client.insert_rows_json(self.feedback_table, [row])
            
            if errors:
                logger.error(f"BigQuery insert errors: {errors}")
            else:
                logger.info(f"Feedback logged to BigQuery: {feedback_data.get('query_id')}")
                
        except Exception as e:
            logger.error(f"BigQuery logging failed: {str(e)}")
            # Non-critical, don't raise
    
    def get_feedback_stats(self, days: int = 30) -> Dict:
        """
        Get feedback statistics for monitoring
        
        Args:
            days: Number of days to look back
            
        Returns:
            Statistics dictionary
        """
        query = f"""
            SELECT 
                AVG(rating) as avg_rating,
                COUNT(*) as total_feedback,
                SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_feedback,
                SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_feedback
            FROM `{self.feedback_table}`
            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days} DAY)
        """
        
        try:
            result = self.bq_client.query(query).result()
            row = next(result)
            
            return {
                "avg_rating": float(row.avg_rating) if row.avg_rating else 0,
                "total_feedback": row.total_feedback,
                "positive_feedback": row.positive_feedback,
                "negative_feedback": row.negative_feedback,
                "positive_rate": (row.positive_feedback / row.total_feedback * 100) if row.total_feedback else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get feedback stats: {str(e)}")
            return {}

# Singleton instance
feedback_service = FeedbackService()

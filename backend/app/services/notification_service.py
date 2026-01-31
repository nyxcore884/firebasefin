import requests
import json
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Proactive Alerting Bridge.
    Pushes PDF Intelligence Reports to Slack/Teams on critical anomalies.
    """
    def __init__(self, webhook_url: str = None):
        self.webhook_url = webhook_url

    def alert_critical_anomaly(self, run_id: str, product: str, report_url: str):
        if not self.webhook_url:
            logger.info("Notification Service: No webhook configured. Intelligence logged internally.")
            return

        payload = {
            "text": "🚨 *CRITICAL FORENSIC ANOMALY DETECTED*",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"FinSight Brain 1 has flagged a critical outlier in *{product}*.\n*Analysis ID:* {run_id}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "Download PDF Report"},
                            "url": report_url,
                            "style": "primary"
                        }
                    ]
                }
            ]
        }
        try:
            response = requests.post(self.webhook_url, json=payload)
            response.raise_for_status()
            logger.info(f"Alert sent successfully for {run_id}")
        except Exception as e:
            logger.error(f"Failed to push notification: {e}")

# Singleton instance
notification_service = NotificationService()

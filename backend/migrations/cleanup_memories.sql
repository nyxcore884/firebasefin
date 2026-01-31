-- CLEANUP: Purge leaked system scans from institutional memory
DELETE FROM `studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop`
WHERE user_query LIKE 'SYSTEM_SCAN%' OR was_corrected = FALSE OR org_id IS NULL;

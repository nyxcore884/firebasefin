import React, { useState } from 'react';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { IconButton, TextField, Button, Collapse, Alert } from '@mui/material';

interface FeedbackProps {
    requestId: string;
    originalQuery: string;
    generatedSql: string;
}

export const NaturalLanguageFeedback: React.FC<FeedbackProps> = ({ requestId, originalQuery, generatedSql }) => {
    const [score, setScore] = useState<number | null>(null); // 1 for 👍, -1 for 👎
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        const feedbackData = {
            request_id: requestId,
            user_query: originalQuery,
            generated_sql: generatedSql,
            feedback_score: score,
            user_comment: comment,
        };

        try {
            const response = await fetch('http://localhost:8000/api/v1/financial-ai/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData),
            });

            if (response.ok) setSubmitted(true);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
    };

    if (submitted) {
        return <Alert severity="success" sx={{ mt: 2 }}>Thank you! Your feedback helps train our financial engine.</Alert>;
    }

    return (
        <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Was this insight helpful?</h4>

            <div className="flex gap-4 mb-4">
                <IconButton
                    color={score === 1 ? "success" : "default"}
                    onClick={() => setScore(1)}
                >
                    <ThumbUpIcon />
                </IconButton>
                <IconButton
                    color={score === -1 ? "error" : "default"}
                    onClick={() => setScore(-1)}
                >
                    <ThumbDownIcon />
                </IconButton>
            </div>

            <Collapse in={score !== null}>
                <div className="animate-fade-in">
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Help us improve. What was wrong? (e.g., 'This missed the FX impact on account 8220')"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        sx={{ mb: 2, bgcolor: 'white' }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        size="small"
                    >
                        Submit Feedback
                    </Button>
                </div>
            </Collapse>
        </div>
    );
};

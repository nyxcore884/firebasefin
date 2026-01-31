# Financial AI Platform - Part 2
## Generative AI Integration & Knowledge Base System

---

## 6. GENERATIVE AI INTEGRATION

The Generative AI layer provides natural language understanding, intelligent insights, and user-friendly explanations while maintaining accuracy through the deterministic engine.

### 6.1 AI Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER QUERY                              │
│  "What drove the 15% revenue increase in Imereti?"          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              QUERY UNDERSTANDING LAYER                       │
│  • Intent Classification                                     │
│  • Entity Extraction (Imereti, Revenue, 15%)                │
│  • Context Resolution                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           RETRIEVAL-AUGMENTED GENERATION (RAG)               │
│  • Query Firestore for relevant financial records           │
│  • Retrieve historical context                              │
│  • Get related workflows and validations                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              CONTEXT ASSEMBLY                                │
│  • Financial data (actual numbers from DB)                  │
│  • Calculations (from deterministic engine)                 │
│  • Business rules                                           │
│  • User preferences                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM GENERATION                                  │
│  (OpenAI GPT-4 / Anthropic Claude)                          │
│  • Generate human-readable explanation                       │
│  • Create visualizations                                    │
│  • Suggest next actions                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              RESPONSE VALIDATION                             │
│  • Verify numerical accuracy                                │
│  • Check against deterministic calculations                 │
│  • Ensure policy compliance                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              USER RESPONSE                                   │
│  "Revenue in Imereti increased 15% primarily due to:        │
│   1. Higher commercial gas sales (+23%)                     │
│   2. New customer acquisitions (1,245 new connections)      │
│   3. Price adjustment in Q2 (+5%)"                          │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 RAG Implementation

```python
class RAGEngine:
    """
    Retrieval-Augmented Generation for Financial AI
    """
    
    def __init__(self):
        self.firestore = firestore.client()
        self.embeddings_model = OpenAIEmbeddings()
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.1)
        self.vector_store = FirestoreVectorStore()
    
    async def answer_question(
        self,
        question: str,
        org_id: str,
        user_id: str,
        context: Dict[str, Any] = None
    ) -> AIResponse:
        """
        Answer user question using RAG
        """
        # 1. Understand the question
        intent = await self.classify_intent(question)
        entities = await self.extract_entities(question, org_id)
        
        # 2. Retrieve relevant data
        relevant_data = await self.retrieve_relevant_data(
            question=question,
            entities=entities,
            org_id=org_id,
            intent=intent
        )
        
        # 3. Get deterministic calculations
        calculations = await self.get_relevant_calculations(
            entities=entities,
            org_id=org_id
        )
        
        # 4. Assemble context
        full_context = self.assemble_context(
            question=question,
            relevant_data=relevant_data,
            calculations=calculations,
            user_context=context
        )
        
        # 5. Generate response
        response = await self.generate_response(
            question=question,
            context=full_context,
            intent=intent
        )
        
        # 6. Validate response
        validated_response = await self.validate_response(
            response=response,
            calculations=calculations
        )
        
        # 7. Store conversation
        await self.store_conversation(
            user_id=user_id,
            org_id=org_id,
            question=question,
            response=validated_response,
            context=full_context
        )
        
        return validated_response
    
    async def retrieve_relevant_data(
        self,
        question: str,
        entities: Dict[str, Any],
        org_id: str,
        intent: str
    ) -> List[FinancialRecord]:
        """
        Retrieve relevant financial records
        """
        # Generate embedding for question
        question_embedding = await self.embeddings_model.embed_query(question)
        
        # Semantic search in vector store
        similar_records = await self.vector_store.similarity_search(
            embedding=question_embedding,
            org_id=org_id,
            k=20  # Top 20 most relevant records
        )
        
        # Also do structured query based on extracted entities
        structured_results = []
        
        if 'entity' in entities:
            structured_results.extend(
                await self.query_by_entity(entities['entity'], org_id)
            )
        
        if 'account' in entities:
            structured_results.extend(
                await self.query_by_account(entities['account'], org_id)
            )
        
        if 'period' in entities:
            structured_results.extend(
                await self.query_by_period(entities['period'], org_id)
            )
        
        # Combine and deduplicate
        all_results = similar_records + structured_results
        unique_results = self.deduplicate_records(all_results)
        
        # Rank by relevance
        ranked_results = self.rank_by_relevance(
            unique_results,
            question,
            entities,
            intent
        )
        
        return ranked_results[:50]  # Top 50 most relevant
    
    async def generate_response(
        self,
        question: str,
        context: str,
        intent: str
    ) -> str:
        """
        Generate AI response using LLM
        """
        # Build prompt
        system_prompt = self.build_system_prompt(intent)
        user_prompt = self.build_user_prompt(question, context)
        
        # Call LLM
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.llm.agenerate([messages])
        
        return response.generations[0][0].text
    
    def build_system_prompt(self, intent: str) -> str:
        """
        Build system prompt based on intent
        """
        base_prompt = """You are a financial AI assistant with deep expertise in 
corporate finance, accounting, and financial analysis. You have access to precise 
financial data and calculations from a deterministic calculation engine.

CRITICAL RULES:
1. Always cite specific numbers from the provided data
2. Never make up or estimate financial figures
3. If data is not available, clearly state "Data not available"
4. Maintain professional, clear communication
5. When explaining variance, always provide:
   - Absolute change (e.g., +$1.2M)
   - Percentage change (e.g., +15.3%)
   - Primary drivers (ranked by impact)
6. Use tables or bullet points for clarity
7. Suggest relevant follow-up questions when appropriate
"""
        
        intent_specific = {
            'variance_analysis': """
Focus on explaining why numbers changed. Structure your response:
1. High-level summary (1-2 sentences)
2. Detailed breakdown of drivers
3. Context (seasonality, one-time events, trends)
4. Recommendations or concerns
""",
            'forecasting': """
Focus on forward-looking analysis. Structure your response:
1. Historical trend analysis
2. Key assumptions
3. Forecast with confidence intervals
4. Risks and sensitivities
""",
            'benchmark': """
Focus on comparative analysis. Structure your response:
1. Performance vs benchmark
2. Strengths and weaknesses
3. Peer comparison (if available)
4. Improvement opportunities
""",
            'drill_down': """
Focus on breaking down the numbers. Structure your response:
1. Top-level figure
2. Components (ordered by size)
3. Sub-components of largest items
4. Anomalies or interesting observations
"""
        }
        
        return base_prompt + intent_specific.get(intent, "")
    
    async def validate_response(
        self,
        response: str,
        calculations: Dict[str, Any]
    ) -> AIResponse:
        """
        Validate AI response for numerical accuracy
        """
        # Extract all numbers from response
        numbers_in_response = self.extract_numbers(response)
        
        # Verify each number against calculations
        validation_results = []
        
        for number_context in numbers_in_response:
            number = number_context['value']
            context = number_context['context']
            
            # Find corresponding calculation
            calc = self.find_matching_calculation(number, context, calculations)
            
            if calc:
                # Check if matches (with tolerance)
                matches = self.numbers_match(number, calc.value, tolerance=0.01)
                
                validation_results.append({
                    'number': number,
                    'matches': matches,
                    'actual_value': calc.value,
                    'source': calc.source
                })
                
                if not matches:
                    # Replace with correct number
                    response = response.replace(
                        str(number),
                        f"{calc.value} (corrected)"
                    )
        
        return AIResponse(
            text=response,
            validation_results=validation_results,
            confidence_score=self.calculate_confidence(validation_results)
        )
```

### 6.3 Financial Insights Generation

```python
class InsightGenerator:
    """
    Generate automated financial insights
    """
    
    def __init__(self):
        self.anomaly_detector = AnomalyDetector()
        self.trend_analyzer = TrendAnalyzer()
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
    
    async def generate_insights(
        self,
        dataset_id: str,
        org_id: str,
        focus_areas: List[str] = None
    ) -> List[Insight]:
        """
        Generate insights for a dataset
        """
        insights = []
        
        # 1. Detect anomalies
        anomalies = await self.anomaly_detector.detect(dataset_id, org_id)
        for anomaly in anomalies:
            insight = await self.explain_anomaly(anomaly)
            insights.append(insight)
        
        # 2. Identify trends
        trends = await self.trend_analyzer.analyze(dataset_id, org_id)
        for trend in trends:
            insight = await self.explain_trend(trend)
            insights.append(insight)
        
        # 3. Compare to budget
        variances = await self.calculate_variances(dataset_id, org_id)
        for variance in variances:
            if abs(variance.percentage) > 10:  # Material variances
                insight = await self.explain_variance(variance)
                insights.append(insight)
        
        # 4. YoY comparison
        yoy_changes = await self.calculate_yoy(dataset_id, org_id)
        for change in yoy_changes:
            if abs(change.percentage) > 15:  # Significant YoY changes
                insight = await self.explain_yoy_change(change)
                insights.append(insight)
        
        # 5. Performance indicators
        kpis = await self.calculate_kpis(dataset_id, org_id)
        for kpi in kpis:
            if kpi.status in ['warning', 'critical']:
                insight = await self.explain_kpi_status(kpi)
                insights.append(insight)
        
        # Rank insights by importance
        ranked_insights = self.rank_insights(insights)
        
        # Store insights
        await self.store_insights(ranked_insights, dataset_id, org_id)
        
        return ranked_insights
    
    async def explain_anomaly(self, anomaly: Anomaly) -> Insight:
        """
        Generate explanation for anomaly
        """
        # Get context
        context = await self.get_anomaly_context(anomaly)
        
        # Generate explanation using LLM
        prompt = f"""
You are analyzing a financial anomaly.

Account: {anomaly.account_name}
Entity: {anomaly.entity_name}
Period: {anomaly.period}
Value: {anomaly.value:,.2f}
Expected Range: {anomaly.expected_min:,.2f} - {anomaly.expected_max:,.2f}
Z-Score: {anomaly.z_score:.2f}

Context:
{json.dumps(context, indent=2)}

Provide a clear, concise explanation of why this is anomalous and what might have caused it.
Structure: 1) What's unusual 2) Possible causes 3) Recommended action
"""
        
        explanation = await self.llm.agenerate([{"role": "user", "content": prompt}])
        
        return Insight(
            type='anomaly',
            severity=self.calculate_severity(anomaly),
            title=f"Unusual {anomaly.account_name} in {anomaly.entity_name}",
            description=explanation.generations[0][0].text,
            data=anomaly.to_dict(),
            recommended_action=self.suggest_action(anomaly)
        )
```

### 6.4 Natural Language to SQL

```python
class NLToSQLEngine:
    """
    Convert natural language queries to SQL
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
        self.schema = self.load_schema()
    
    async def query(
        self,
        natural_language_query: str,
        org_id: str
    ) -> QueryResult:
        """
        Convert NL query to SQL and execute
        """
        # Generate SQL
        sql_query = await self.generate_sql(natural_language_query, org_id)
        
        # Validate SQL
        is_valid, error = self.validate_sql(sql_query)
        if not is_valid:
            raise SQLValidationError(error)
        
        # Execute query
        results = await self.execute_sql(sql_query, org_id)
        
        # Format results
        formatted_results = self.format_results(results)
        
        # Generate natural language explanation
        explanation = await self.explain_results(
            natural_language_query,
            sql_query,
            formatted_results
        )
        
        return QueryResult(
            query=natural_language_query,
            sql=sql_query,
            results=formatted_results,
            explanation=explanation
        )
    
    async def generate_sql(
        self,
        query: str,
        org_id: str
    ) -> str:
        """
        Generate SQL from natural language
        """
        prompt = f"""
You are a SQL expert. Convert this natural language query to PostgreSQL.

Database Schema:
{self.schema}

Organization ID: {org_id}

Natural Language Query: {query}

Generate ONLY the SQL query. No explanation. Include org_id filter in WHERE clause.

Rules:
1. Always filter by org_id = '{org_id}'
2. Use appropriate JOINs
3. Format numbers with 2 decimal places
4. Use meaningful column aliases
5. Optimize for performance
6. Use LIMIT to prevent excessive results
"""
        
        response = await self.llm.agenerate([{"role": "user", "content": prompt}])
        sql = response.generations[0][0].text.strip()
        
        # Clean SQL (remove markdown formatting if present)
        sql = sql.replace('```sql', '').replace('```', '').strip()
        
        return sql
```

---

## 7. KNOWLEDGE & LEARNING SYSTEM

### 7.1 User-Teachable System Architecture

```python
class KnowledgeBaseSystem:
    """
    Learn from user corrections and feedback
    """
    
    def __init__(self):
        self.firestore = firestore.client()
        self.pattern_extractor = PatternExtractor()
        self.rule_generator = RuleGenerator()
    
    async def learn_from_correction(
        self,
        correction: UserCorrection,
        org_id: str,
        user_id: str
    ) -> LearnedRule:
        """
        Learn a new rule from user correction
        """
        # 1. Record the correction
        correction_id = await self.store_correction(correction, org_id, user_id)
        
        # 2. Extract pattern
        pattern = await self.pattern_extractor.extract(correction)
        
        # 3. Check if pattern is generalizable
        if not pattern.is_generalizable:
            # Just apply this specific correction
            await self.apply_correction(correction)
            return None
        
        # 4. Generate rule
        rule = await self.rule_generator.generate(pattern, correction)
        
        # 5. Validate rule
        validation_result = await self.validate_rule(rule, org_id)
        
        if not validation_result.is_safe:
            # Ask user to review
            await self.request_rule_review(rule, user_id, validation_result)
            return None
        
        # 6. Store rule
        rule_id = await self.store_rule(rule, org_id, correction_id)
        
        # 7. Apply rule to similar cases
        affected_records = await self.apply_rule_retroactively(rule, org_id)
        
        # 8. Notify user
        await self.notify_user(
            user_id,
            f"New rule learned and applied to {len(affected_records)} records"
        )
        
        return rule
    
    async def apply_rule_retroactively(
        self,
        rule: LearnedRule,
        org_id: str
    ) -> List[str]:
        """
        Apply newly learned rule to existing data
        """
        # Find all records matching rule condition
        matching_records = await self.find_matching_records(
            rule.condition_json,
            org_id
        )
        
        affected_record_ids = []
        
        for record in matching_records:
            # Check if rule should apply
            if self.should_apply_rule(rule, record):
                # Apply transformation
                updated_record = self.apply_transformation(
                    record,
                    rule.action_json
                )
                
                # Save updated record
                await self.update_record(updated_record)
                
                # Mark as affected by this rule
                await self.mark_rule_application(
                    record.record_id,
                    rule.rule_id
                )
                
                affected_record_ids.append(record.record_id)
        
        # Update rule statistics
        await self.update_rule_stats(
            rule.rule_id,
            times_applied=len(affected_record_ids)
        )
        
        return affected_record_ids
```

### 7.2 Pattern Recognition

```python
class PatternExtractor:
    """
    Extract patterns from user corrections
    """
    
    def extract(self, correction: UserCorrection) -> Pattern:
        """
        Extract generalizable pattern from correction
        """
        pattern = Pattern()
        
        # Analyze what changed
        changes = self.analyze_changes(
            correction.original_value,
            correction.corrected_value
        )
        
        # Identify pattern type
        if changes.type == 'mapping':
            # User remapped account or entity
            pattern = self.extract_mapping_pattern(correction, changes)
        
        elif changes.type == 'value':
            # User corrected a value
            pattern = self.extract_value_pattern(correction, changes)
        
        elif changes.type == 'classification':
            # User reclassified data
            pattern = self.extract_classification_pattern(correction, changes)
        
        # Check if generalizable
        pattern.is_generalizable = self.check_generalizability(pattern)
        
        return pattern
    
    def extract_mapping_pattern(
        self,
        correction: UserCorrection,
        changes: Changes
    ) -> MappingPattern:
        """
        Extract mapping pattern
        
        Example: User corrected "გაზის გაყიდვა" → "Gas Sales"
        Pattern: Georgian text "გაზის გაყიდვა" should map to account "1.2"
        """
        pattern = MappingPattern()
        
        # Extract source and target
        pattern.source_text = correction.original_value.get('text')
        pattern.target_account = correction.corrected_value.get('account_id')
        
        # Detect language
        pattern.language = self.detect_language(pattern.source_text)
        
        # Extract keywords
        pattern.keywords = self.extract_keywords(pattern.source_text)
        
        # Find similar texts in dataset
        similar_texts = self.find_similar_texts(
            pattern.source_text,
            correction.org_id
        )
        
        # If multiple similar texts exist, pattern is generalizable
        if len(similar_texts) > 1:
            pattern.is_generalizable = True
            pattern.applies_to_texts = similar_texts
        
        return pattern
    
    def check_generalizability(self, pattern: Pattern) -> bool:
        """
        Determine if pattern can be generalized
        """
        # Check if pattern applies to multiple records
        if pattern.applies_to_count < 2:
            return False
        
        # Check if pattern is consistent
        if pattern.consistency_score < 0.8:
            return False
        
        # Check if pattern is safe to apply
        if pattern.risk_score > 0.5:
            return False
        
        return True
```

### 7.3 Template Library

```python
class TemplateLibrary:
    """
    Manage file structure templates learned from uploads
    """
    
    def __init__(self):
        self.firestore = firestore.client()
    
    async def learn_template(
        self,
        file_structure: FileStructure,
        mapping: DataMapping,
        org_id: str,
        user_id: str
    ) -> Template:
        """
        Learn new template from successfully parsed file
        """
        # Create template
        template = Template(
            template_name=self.generate_template_name(file_structure),
            file_format=file_structure.format,
            structure_signature=self.calculate_signature(file_structure),
            
            # Store structure details
            header_rows=file_structure.header_rows,
            data_start_row=file_structure.data_start_row,
            entity_column=file_structure.entity_column,
            account_column=file_structure.account_column,
            period_columns=file_structure.period_columns,
            
            # Store mapping
            entity_mapping=mapping.entity_mapping,
            account_mapping=mapping.account_mapping,
            period_mapping=mapping.period_mapping,
            
            # Metadata
            created_by=user_id,
            created_from_file=file_structure.filename,
            confidence_score=mapping.confidence_score
        )
        
        # Store template
        template_id = await self.store_template(template, org_id)
        
        return template
    
    async def match_template(
        self,
        file_structure: FileStructure,
        org_id: str
    ) -> Optional[Template]:
        """
        Find matching template for file structure
        """
        # Calculate signature
        signature = self.calculate_signature(file_structure)
        
        # Find templates with similar signatures
        templates = await self.get_templates(org_id)
        
        best_match = None
        best_score = 0
        
        for template in templates:
            # Calculate similarity
            similarity = self.calculate_similarity(
                signature,
                template.structure_signature
            )
            
            if similarity > best_score and similarity > 0.8:
                best_match = template
                best_score = similarity
        
        return best_match
    
    def calculate_signature(self, structure: FileStructure) -> str:
        """
        Calculate unique signature for file structure
        """
        # Hash based on structure characteristics
        characteristics = [
            str(structure.num_sheets),
            str(structure.header_rows),
            str(structure.num_entities),
            str(structure.num_accounts),
            str(structure.num_periods),
            structure.hierarchy_type,
            structure.dimension_order  # e.g., "entity-period-account"
        ]
        
        signature = hashlib.sha256(
            json.dumps(characteristics).encode()
        ).hexdigest()
        
        return signature
```

### 7.4 Feedback Loop System

```python
class FeedbackSystem:
    """
    Collect and learn from user feedback
    """
    
    def __init__(self):
        self.firestore = firestore.client()
        self.knowledge_base = KnowledgeBaseSystem()
    
    async def collect_feedback(
        self,
        feedback: Feedback,
        org_id: str,
        user_id: str
    ) -> None:
        """
        Collect user feedback on AI responses, insights, or calculations
        """
        # Store feedback
        feedback_id = await self.store_feedback(feedback, org_id, user_id)
        
        # If negative feedback, analyze what went wrong
        if feedback.rating < 3:  # 1-5 scale
            await self.analyze_failure(feedback, feedback_id)
        
        # If feedback includes correction, learn from it
        if feedback.correction:
            await self.knowledge_base.learn_from_correction(
                feedback.correction,
                org_id,
                user_id
            )
        
        # Update AI models
        await self.update_models(feedback)
    
    async def analyze_failure(
        self,
        feedback: Feedback,
        feedback_id: str
    ) -> None:
        """
        Analyze why AI response was inadequate
        """
        failure_analysis = FailureAnalysis()
        
        # Categorize failure type
        if feedback.feedback_type == 'incorrect_calculation':
            failure_analysis.category = 'calculation_error'
            failure_analysis.details = await self.analyze_calculation_error(
                feedback
            )
        
        elif feedback.feedback_type == 'poor_explanation':
            failure_analysis.category = 'explanation_quality'
            failure_analysis.details = await self.analyze_explanation_quality(
                feedback
            )
        
        elif feedback.feedback_type == 'missing_context':
            failure_analysis.category = 'context_retrieval'
            failure_analysis.details = await self.analyze_context_retrieval(
                feedback
            )
        
        # Store analysis
        await self.store_failure_analysis(failure_analysis, feedback_id)
        
        # Flag for human review if critical
        if failure_analysis.severity == 'critical':
            await self.flag_for_review(feedback_id, failure_analysis)
```

### 7.5 Confidence Scoring

```python
class ConfidenceScorer:
    """
    Calculate confidence scores for AI outputs
    """
    
    def score_data_mapping(
        self,
        mapping: DataMapping,
        template_match: Optional[Template]
    ) -> float:
        """
        Score confidence in data mapping
        """
        score = 1.0
        
        # Template matching
        if template_match:
            score *= 0.95 * template_match.confidence_score
        else:
            score *= 0.7  # No template match reduces confidence
        
        # Account mapping confidence
        account_confidence = sum(
            m.confidence for m in mapping.account_mappings
        ) / len(mapping.account_mappings)
        score *= account_confidence
        
        # Entity mapping confidence
        entity_confidence = sum(
            m.confidence for m in mapping.entity_mappings
        ) / len(mapping.entity_mappings)
        score *= entity_confidence
        
        # Data completeness
        completeness = mapping.records_parsed / mapping.total_records
        score *= completeness
        
        return round(score, 3)
    
    def score_ai_response(
        self,
        response: AIResponse,
        validation_results: List[Dict]
    ) -> float:
        """
        Score confidence in AI response
        """
        score = 1.0
        
        # Numerical accuracy
        if validation_results:
            accurate_numbers = sum(
                1 for v in validation_results if v['matches']
            )
            accuracy_rate = accurate_numbers / len(validation_results)
            score *= accuracy_rate
        
        # Context relevance (from RAG)
        if hasattr(response, 'context_relevance_score'):
            score *= response.context_relevance_score
        
        # LLM certainty
        if hasattr(response, 'llm_certainty'):
            score *= response.llm_certainty
        
        # Reduce confidence if response is longer (more room for error)
        length_penalty = 1.0 - (len(response.text) / 10000) * 0.1
        score *= max(length_penalty, 0.9)
        
        return round(score, 3)
```

---

**[Continue to Part 3: Backend Architecture, Frontend Architecture, and GCP/Firebase Infrastructure...]**

Would you like me to continue with:
- Part 3: Backend Architecture (FastAPI, Cloud Functions, APIs)
- Part 4: Frontend Architecture (React, Material-UI, Real-time Updates)
- Part 5: GCP/Firebase Infrastructure (Deployment, Scaling, Security)
- Part 6: Implementation Roadmap (Timeline, Team, Budget)

Each part maintains the same level of detail with production-ready code examples and architectural diagrams.

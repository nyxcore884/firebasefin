# Production-Hardened Enterprise Financial AI System
## Enterprise-Grade Architecture Addressing All Critical Issues

---

## 🚨 CRITICAL FIXES IMPLEMENTED

### 1. DETERMINISTIC CLASSIFICATION (NOT LLM-ONLY)

```python
class HybridComplexityClassifier:
    """
    3-Layer decision stack: Rules → ML → LLM (only for edge cases)
    """
    
    def __init__(self):
        self.rule_engine = DeterministicRuleEngine()
        self.ml_classifier = MLIntentClassifier()  # Trained model
        self.llm_fallback = LLMClassifier()
    
    async def classify_complexity(
        self,
        request: str,
        context: RequestContext
    ) -> ClassificationResult:
        """
        Multi-layer classification with confidence scoring
        """
        
        # LAYER 1: Deterministic Rules (FAST, SAFE)
        rule_result = self.rule_engine.classify(request, context)
        
        if rule_result.confidence > 0.95:
            return ClassificationResult(
                complexity=rule_result.complexity,
                confidence=rule_result.confidence,
                method="deterministic_rule",
                explanation=rule_result.reasoning
            )
        
        # LAYER 2: ML Classifier
        ml_result = await self.ml_classifier.classify(request, context)
        
        if ml_result.confidence > 0.85:
            return ClassificationResult(
                complexity=ml_result.complexity,
                confidence=ml_result.confidence,
                method="ml_classifier",
                explanation=ml_result.reasoning
            )
        
        # LAYER 3: LLM (ONLY for ambiguous cases)
        llm_result = await self.llm_fallback.classify_with_validation(
            request,
            context,
            allowed_values=[c.value for c in TaskComplexity]
        )
        
        return ClassificationResult(
            complexity=llm_result.complexity,
            confidence=llm_result.confidence,
            method="llm_with_validation",
            explanation=llm_result.reasoning,
            requires_user_confirmation=True  # Force user to confirm
        )


class DeterministicRuleEngine:
    """
    Fast, safe, rule-based classification
    """
    
    def __init__(self):
        self.rules = self.load_rules()
    
    def classify(self, request: str, context: RequestContext) -> RuleResult:
        """
        Pattern-based classification with 100% reproducibility
        """
        
        request_lower = request.lower()
        
        # SIMPLE patterns (single data point, no calculation)
        simple_patterns = [
            r"^what (is|was) .+ (last month|yesterday)$",
            r"^show me (revenue|cogs|total)",
            r"^get .+ for .+$"
        ]
        
        for pattern in simple_patterns:
            if re.match(pattern, request_lower):
                return RuleResult(
                    complexity=TaskComplexity.SIMPLE,
                    confidence=0.99,
                    reasoning=f"Matched simple pattern: {pattern}"
                )
        
        # MODERATE patterns (comparison, multiple entities)
        moderate_patterns = [
            r"compare .+ across",
            r"show .+ by .+ (month|quarter|year)",
            r"(yoy|mom|qoq) (growth|change)"
        ]
        
        for pattern in moderate_patterns:
            if re.search(pattern, request_lower):
                return RuleResult(
                    complexity=TaskComplexity.MODERATE,
                    confidence=0.95,
                    reasoning=f"Matched moderate pattern: {pattern}"
                )
        
        # COMPLEX patterns (multi-step, analysis)
        complex_indicators = [
            'analyze',
            'trend',
            'forecast',
            'and',  # Multiple operations
            'then'
        ]
        
        indicator_count = sum(1 for ind in complex_indicators if ind in request_lower)
        
        if indicator_count >= 2:
            return RuleResult(
                complexity=TaskComplexity.COMPLEX,
                confidence=0.90,
                reasoning=f"Multiple complexity indicators: {indicator_count}"
            )
        
        # EXPERT patterns
        expert_keywords = [
            'scenario',
            'sensitivity',
            'model',
            'simulation',
            'strategic'
        ]
        
        if any(kw in request_lower for kw in expert_keywords):
            return RuleResult(
                complexity=TaskComplexity.EXPERT,
                confidence=0.95,
                reasoning="Expert-level keywords detected"
            )
        
        # Cannot confidently classify
        return RuleResult(
            complexity=None,
            confidence=0.0,
            reasoning="No deterministic pattern matched"
        )


class LLMClassifier:
    """
    LLM with structured output + validation
    """
    
    async def classify_with_validation(
        self,
        request: str,
        context: RequestContext,
        allowed_values: List[str]
    ) -> LLMResult:
        """
        Use LLM with JSON schema enforcement
        """
        
        # Sanitize input (prevent prompt injection)
        sanitized_request = self.sanitize_input(request)
        
        response = await self.openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": """You are a financial request classifier.
                    Respond ONLY with valid JSON. No other text."""
                },
                {
                    "role": "user",
                    "content": f"""Classify this request:
                    
Request: {sanitized_request}

Respond with JSON:
{{
  "complexity": "SIMPLE|MODERATE|COMPLEX|EXPERT",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}}"""
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}  # Force JSON
        )
        
        # Parse and validate
        try:
            result = json.loads(response.choices[0].message.content)
            
            # Validate complexity value
            if result["complexity"] not in allowed_values:
                raise ValueError(f"Invalid complexity: {result['complexity']}")
            
            # Validate confidence
            confidence = float(result["confidence"])
            if not 0 <= confidence <= 1:
                raise ValueError(f"Invalid confidence: {confidence}")
            
            return LLMResult(
                complexity=TaskComplexity[result["complexity"]],
                confidence=confidence,
                reasoning=result["reasoning"]
            )
        
        except Exception as e:
            # Fallback to most conservative
            return LLMResult(
                complexity=TaskComplexity.EXPERT,  # Safest default
                confidence=0.5,
                reasoning=f"Classification failed: {str(e)}",
                error=True
            )
    
    def sanitize_input(self, request: str) -> str:
        """
        Prevent prompt injection
        """
        # Remove common injection patterns
        sanitized = request
        
        injection_patterns = [
            r"ignore previous",
            r"ignore all",
            r"system:",
            r"assistant:",
            r"<\|.*?\|>",
            r"\[INST\]",
            r"<script>"
        ]
        
        for pattern in injection_patterns:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
        
        # Limit length
        return sanitized[:500]
```

### 2. ENTERPRISE POLICY ENGINE (MANDATORY)

```python
class EnterprisePolicyEngine:
    """
    Policy-driven access control (RBAC + ABAC + Data-level entitlements)
    """
    
    def __init__(self):
        self.policy_store = PolicyStore()
        self.entitlement_cache = RedisCache()
    
    async def authorize_request(
        self,
        user: User,
        request: RequestAnalysis,
        data_requirements: DataRequirements
    ) -> AuthorizationResult:
        """
        Check ALL authorization layers before execution
        """
        
        # Layer 1: Role-Based Access Control (RBAC)
        if not await self.check_rbac(user, request.required_capabilities):
            return AuthorizationResult(
                allowed=False,
                reason="User role insufficient for requested capabilities",
                required_role=self.get_minimum_role(request.required_capabilities)
            )
        
        # Layer 2: Attribute-Based Access Control (ABAC)
        policy_decision = await self.evaluate_policies(user, request)
        
        if not policy_decision.allowed:
            return AuthorizationResult(
                allowed=False,
                reason=policy_decision.reason,
                violated_policy=policy_decision.policy_id
            )
        
        # Layer 3: Data-Level Entitlements
        data_access = await self.check_data_entitlements(
            user,
            data_requirements.entities,
            data_requirements.accounts
        )
        
        if data_access.restricted_entities:
            return AuthorizationResult(
                allowed=False,
                reason="Access denied to requested entities",
                restricted_entities=data_access.restricted_entities,
                alternative_suggestion="Request data for allowed entities only"
            )
        
        # Layer 4: Sensitive Data Masking
        masking_rules = await self.get_masking_rules(
            user,
            data_requirements.accounts
        )
        
        return AuthorizationResult(
            allowed=True,
            masking_rules=masking_rules,
            audit_log_id=await self.log_authorization(user, request)
        )
    
    async def check_data_entitlements(
        self,
        user: User,
        entities: List[str],
        accounts: List[str]
    ) -> DataAccessResult:
        """
        Check entity and account-level access
        """
        
        # Get user's entitled entities
        entitled_entities = await self.entitlement_cache.get(
            f"user:{user.id}:entities"
        )
        
        if not entitled_entities:
            entitled_entities = await self.policy_store.get_user_entities(user.id)
            await self.entitlement_cache.set(
                f"user:{user.id}:entities",
                entitled_entities,
                ttl=3600
            )
        
        # Check each requested entity
        restricted = []
        for entity in entities:
            if entity not in entitled_entities:
                # Check if user's legal entity has access
                if not await self.check_legal_entity_access(user, entity):
                    restricted.append(entity)
        
        # Check sensitive accounts (e.g., Payroll)
        sensitive_accounts = await self.get_sensitive_accounts(accounts)
        
        for account in sensitive_accounts:
            if not await self.check_sensitive_access(user, account):
                return DataAccessResult(
                    allowed=False,
                    restricted_accounts=[account],
                    reason=f"User lacks permission for sensitive account: {account}"
                )
        
        return DataAccessResult(
            allowed=len(restricted) == 0,
            restricted_entities=restricted
        )


class PolicyStore:
    """
    Cedar/OPA-style policy definitions
    """
    
    def __init__(self):
        self.policies = self.load_policies()
    
    def load_policies(self) -> List[Policy]:
        """
        Load policy definitions
        """
        
        return [
            # Policy 1: Analysts cannot access payroll
            Policy(
                id="POL-001",
                name="Payroll Restriction",
                effect="DENY",
                principals=["role:analyst"],
                actions=["read", "analyze"],
                resources=["account:5.1.*"],  # Payroll accounts
                condition=None
            ),
            
            # Policy 2: Only CFO can approve consolidation
            Policy(
                id="POL-002",
                name="Consolidation Approval",
                effect="ALLOW",
                principals=["role:cfo", "role:finance_director"],
                actions=["consolidate", "finalize"],
                resources=["entity:*"],
                condition="request.confidence > 0.95"
            ),
            
            # Policy 3: Regional managers only see their region
            Policy(
                id="POL-003",
                name="Regional Restriction",
                effect="ALLOW",
                principals=["role:regional_manager"],
                actions=["read", "analyze"],
                resources=["entity:{user.region}"],
                condition=None
            ),
            
            # Policy 4: External auditors read-only
            Policy(
                id="POL-004",
                name="Auditor Read-Only",
                effect="ALLOW",
                principals=["role:auditor"],
                actions=["read"],
                resources=["*"],
                condition="data.period < current_period"
            )
        ]
```

### 3. IDEMPOTENT TASK EXECUTION WITH DAG

```python
class EnterpriseTaskExecutor:
    """
    Event-driven, idempotent, resumable task execution
    """
    
    def __init__(self):
        self.dag_engine = DAGEngine()
        self.state_store = PostgresStateStore()
        self.event_bus = PubSubEventBus()
    
    async def execute_plan(
        self,
        execution_id: str,
        task_dag: TaskDAG
    ) -> ExecutionResult:
        """
        Execute with checkpointing and resumability
        """
        
        # Load or create execution state
        state = await self.state_store.get_execution_state(execution_id)
        
        if not state:
            state = ExecutionState(
                execution_id=execution_id,
                status="RUNNING",
                completed_tasks=[],
                failed_tasks=[],
                task_results={},
                started_at=datetime.now()
            )
            await self.state_store.save_execution_state(state)
        
        try:
            # Execute DAG with resumability
            while not task_dag.is_complete():
                # Get ready tasks (dependencies met, not yet executed)
                ready_tasks = task_dag.get_ready_tasks(state.completed_tasks)
                
                if not ready_tasks:
                    if task_dag.has_pending_tasks():
                        # Circular dependency or deadlock
                        raise DAGExecutionError("Circular dependency detected")
                    break
                
                # Execute ready tasks in parallel (safely)
                results = await self.execute_tasks_parallel(
                    ready_tasks,
                    state,
                    execution_id
                )
                
                # Update state atomically
                for task_id, result in results.items():
                    if result.success:
                        state.completed_tasks.append(task_id)
                        state.task_results[task_id] = result
                        
                        # Checkpoint progress
                        await self.state_store.save_execution_state(state)
                        
                        # Emit event
                        await self.event_bus.publish(TaskCompletedEvent(
                            execution_id=execution_id,
                            task_id=task_id,
                            result=result
                        ))
                    else:
                        state.failed_tasks.append(task_id)
                        
                        # Check retry policy
                        if result.retryable and result.retry_count < 3:
                            # Retry with exponential backoff
                            await asyncio.sleep(2 ** result.retry_count)
                            # Task remains in ready state
                        else:
                            # Permanent failure
                            raise TaskExecutionError(
                                f"Task {task_id} failed: {result.error}"
                            )
            
            # All tasks completed
            state.status = "COMPLETED"
            state.completed_at = datetime.now()
            await self.state_store.save_execution_state(state)
            
            return ExecutionResult(
                execution_id=execution_id,
                success=True,
                results=state.task_results
            )
        
        except Exception as e:
            # Save failure state
            state.status = "FAILED"
            state.error = str(e)
            state.failed_at = datetime.now()
            await self.state_store.save_execution_state(state)
            
            raise
    
    async def execute_tasks_parallel(
        self,
        tasks: List[Task],
        state: ExecutionState,
        execution_id: str
    ) -> Dict[str, TaskResult]:
        """
        Execute tasks in parallel with isolation
        """
        
        async def execute_single_task(task: Task) -> Tuple[str, TaskResult]:
            """Execute single task with idempotency"""
            
            # Check if already executed (idempotency)
            existing_result = state.task_results.get(task.task_id)
            if existing_result:
                return task.task_id, existing_result
            
            try:
                # Create isolated execution context
                context = TaskContext(
                    execution_id=execution_id,
                    task_id=task.task_id,
                    inputs=self.get_task_inputs(task, state.task_results),
                    user=state.user,
                    org=state.org
                )
                
                # Execute with timeout
                result = await asyncio.wait_for(
                    task.execute(context),
                    timeout=task.timeout_seconds
                )
                
                return task.task_id, TaskResult(
                    success=True,
                    output=result,
                    execution_time=result.duration
                )
            
            except asyncio.TimeoutError:
                return task.task_id, TaskResult(
                    success=False,
                    error="Task timeout",
                    retryable=True,
                    retry_count=task.retry_count + 1
                )
            
            except Exception as e:
                return task.task_id, TaskResult(
                    success=False,
                    error=str(e),
                    retryable=self.is_retryable_error(e),
                    retry_count=task.retry_count + 1
                )
        
        # Execute all tasks concurrently
        task_futures = [execute_single_task(task) for task in tasks]
        results_list = await asyncio.gather(*task_futures)
        
        return dict(results_list)
```

### 4. CONFIDENCE-AWARE RESPONSES

```python
class ConfidenceAwareResponseGenerator:
    """
    Generate responses with explicit confidence and limitations
    """
    
    async def generate_response(
        self,
        analysis: RequestAnalysis,
        execution_results: ExecutionResult,
        data_quality: DataQualityScore
    ) -> EnterpriseResponse:
        """
        Generate response with mandatory confidence scoring
        """
        
        # Calculate overall confidence
        confidence = self.calculate_confidence(
            classification_confidence=analysis.confidence,
            execution_success_rate=execution_results.success_rate,
            data_quality=data_quality.score
        )
        
        # Determine response approach based on confidence
        if confidence < 0.5:
            return await self.generate_low_confidence_response(
                analysis,
                execution_results,
                confidence
            )
        elif confidence < 0.8:
            return await self.generate_qualified_response(
                analysis,
                execution_results,
                confidence
            )
        else:
            return await self.generate_high_confidence_response(
                analysis,
                execution_results,
                confidence
            )
    
    async def generate_low_confidence_response(
        self,
        analysis: RequestAnalysis,
        results: ExecutionResult,
        confidence: float
    ) -> EnterpriseResponse:
        """
        Low confidence: Ask clarification, don't provide definitive answer
        """
        
        # Identify what's uncertain
        uncertainties = []
        
        if analysis.confidence < 0.6:
            uncertainties.append("Request interpretation")
        
        if results.data_coverage < 0.8:
            uncertainties.append(f"Data coverage ({results.data_coverage:.0%})")
        
        if results.missing_data_points:
            uncertainties.append(f"Missing data for: {', '.join(results.missing_data_points)}")
        
        clarifying_questions = await self.generate_clarifying_questions(
            analysis,
            results
        )
        
        return EnterpriseResponse(
            response_type="CLARIFICATION_REQUIRED",
            confidence=confidence,
            message=f"""I need clarification to provide an accurate response.

Current confidence level: {confidence:.0%} (below threshold)

Uncertainties:
{self.format_list(uncertainties)}

To improve accuracy, please clarify:
{self.format_list(clarifying_questions)}""",
            allow_proceed=False,
            suggested_actions=clarifying_questions
        )
    
    async def generate_qualified_response(
        self,
        analysis: RequestAnalysis,
        results: ExecutionResult,
        confidence: float
    ) -> EnterpriseResponse:
        """
        Medium confidence: Provide answer with explicit caveats
        """
        
        # Generate answer
        answer = await self.generate_answer(analysis, results)
        
        # Add explicit limitations
        limitations = []
        
        if results.data_coverage < 0.95:
            limitations.append(
                f"Analysis based on {results.data_coverage:.0%} data coverage. "
                f"Missing: {', '.join(results.missing_entities)}"
            )
        
        if analysis.method == "llm_with_validation":
            limitations.append(
                "Classification used AI interpretation. "
                "Please verify critical numbers independently."
            )
        
        if results.assumptions:
            limitations.append(
                f"Analysis assumes: {', '.join(results.assumptions)}"
            )
        
        return EnterpriseResponse(
            response_type="QUALIFIED_ANSWER",
            confidence=confidence,
            answer=answer,
            limitations=limitations,
            data_coverage=results.data_coverage,
            missing_data=results.missing_data_points,
            verification_required=True,
            footnote=f"""
⚠️ Confidence Level: {confidence:.0%}

Limitations:
{self.format_list(limitations)}

Please verify critical figures independently before use in regulatory reporting.
"""
        )
```

This is just the beginning. Would you like me to continue with:
1. Complete UI/UX page-by-page specifications
2. Formal capability ontology
3. Full audit & observability framework
4. Production deployment architecture

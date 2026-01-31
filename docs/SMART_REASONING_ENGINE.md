# Smart Reasoning Engine & Intelligent Task Routing
## Advanced AI Decision-Making System

---

## OVERVIEW

The Smart Reasoning Engine determines the complexity of user requests and routes them to appropriate processing pipelines, ensuring optimal response quality and resource utilization.

---

## 1. INTELLIGENT REQUEST ANALYZER

### 1.1 Request Complexity Classification

```python
# services/request_analyzer.py
from typing import Dict, List, Tuple
from enum import Enum
import anthropic
from openai import AsyncOpenAI

class TaskComplexity(Enum):
    SIMPLE = "simple"              # Direct query, single calculation
    MODERATE = "moderate"          # Multi-step analysis, basic reasoning
    COMPLEX = "complex"            # Multiple data sources, advanced analysis
    EXPERT = "expert"              # Strategic planning, multi-dimensional

class SmartRequestAnalyzer:
    """
    Analyze user requests and determine optimal processing strategy
    """
    
    def __init__(self):
        self.openai = AsyncOpenAI()
        self.anthropic = anthropic.AsyncAnthropic()
        self.complexity_classifier = ComplexityClassifier()
        self.capability_matcher = CapabilityMatcher()
    
    async def analyze_request(
        self,
        user_request: str,
        user_context: Dict,
        org_context: Dict
    ) -> RequestAnalysis:
        """
        Deeply analyze user request to determine processing strategy
        """
        
        # Step 1: Parse intent
        intent = await self.parse_intent(user_request)
        
        # Step 2: Extract entities and requirements
        entities = await self.extract_entities(user_request, org_context)
        
        # Step 3: Classify complexity
        complexity = await self.classify_complexity(
            user_request,
            intent,
            entities
        )
        
        # Step 4: Determine required capabilities
        required_capabilities = await self.identify_capabilities(
            user_request,
            complexity
        )
        
        # Step 5: Check if system can handle
        can_handle, limitations = await self.assess_capability(
            required_capabilities,
            org_context
        )
        
        # Step 6: Generate processing plan
        processing_plan = await self.generate_processing_plan(
            user_request,
            complexity,
            required_capabilities,
            can_handle
        )
        
        return RequestAnalysis(
            original_request=user_request,
            intent=intent,
            entities=entities,
            complexity=complexity,
            required_capabilities=required_capabilities,
            can_handle=can_handle,
            limitations=limitations,
            processing_plan=processing_plan,
            estimated_time=self.estimate_processing_time(complexity),
            confidence_score=self.calculate_confidence(can_handle, limitations)
        )
    
    async def classify_complexity(
        self,
        request: str,
        intent: Intent,
        entities: List[Entity]
    ) -> TaskComplexity:
        """
        Classify request complexity using AI
        """
        
        prompt = f"""Analyze this financial request and classify its complexity:

Request: {request}
Intent: {intent.type}
Entities: {[e.name for e in entities]}

Classify as one of:
1. SIMPLE - Single data point, basic calculation, one entity
   Examples: "What was revenue last month?", "Show me total COGS"
   
2. MODERATE - Multiple data points, comparison, 2-3 entities
   Examples: "Compare revenue across all regions", "Show YoY growth"
   
3. COMPLEX - Multi-step analysis, calculations, multiple entities/periods
   Examples: "Analyze profitability trends and forecast next quarter"
   
4. EXPERT - Strategic analysis, scenario modeling, comprehensive reports
   Examples: "Create 3-year financial model with sensitivity analysis"

Classification: """

        response = await self.openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        classification = response.choices[0].message.content.strip().upper()
        
        return TaskComplexity[classification]
    
    async def identify_capabilities(
        self,
        request: str,
        complexity: TaskComplexity
    ) -> List[Capability]:
        """
        Identify required system capabilities
        """
        
        capabilities = []
        
        # Data retrieval
        if any(word in request.lower() for word in ['show', 'get', 'what', 'find']):
            capabilities.append(Capability.DATA_RETRIEVAL)
        
        # Calculations
        if any(word in request.lower() for word in ['calculate', 'compute', 'total', 'sum']):
            capabilities.append(Capability.CALCULATIONS)
        
        # Analysis
        if any(word in request.lower() for word in ['analyze', 'compare', 'trend']):
            capabilities.append(Capability.ANALYSIS)
        
        # Forecasting
        if any(word in request.lower() for word in ['forecast', 'predict', 'project']):
            capabilities.append(Capability.FORECASTING)
        
        # Reporting
        if any(word in request.lower() for word in ['report', 'document', 'create']):
            capabilities.append(Capability.REPORTING)
        
        # Visualization
        if any(word in request.lower() for word in ['chart', 'graph', 'visualize']):
            capabilities.append(Capability.VISUALIZATION)
        
        # Consolidation
        if any(word in request.lower() for word in ['consolidate', 'combine', 'merge']):
            capabilities.append(Capability.CONSOLIDATION)
        
        # Advanced: Scenario modeling
        if any(word in request.lower() for word in ['scenario', 'sensitivity', 'what-if']):
            capabilities.append(Capability.SCENARIO_MODELING)
        
        # Advanced: Strategic planning
        if complexity == TaskComplexity.EXPERT:
            capabilities.append(Capability.STRATEGIC_PLANNING)
        
        return capabilities
    
    async def assess_capability(
        self,
        required_capabilities: List[Capability],
        org_context: Dict
    ) -> Tuple[bool, List[str]]:
        """
        Assess if system can handle all required capabilities
        """
        
        # Available capabilities based on org setup
        available = self.get_available_capabilities(org_context)
        
        # Check each required capability
        missing = []
        for capability in required_capabilities:
            if capability not in available:
                missing.append(capability.value)
        
        can_handle = len(missing) == 0
        
        limitations = []
        if missing:
            limitations.append(f"Missing capabilities: {', '.join(missing)}")
        
        # Check data availability
        if Capability.DATA_RETRIEVAL in required_capabilities:
            if not org_context.get('has_data'):
                limitations.append("No financial data uploaded yet")
                can_handle = False
        
        # Check budget data for comparisons
        if Capability.ANALYSIS in required_capabilities:
            if 'budget' in required_capabilities and not org_context.get('has_budget_data'):
                limitations.append("Budget data not available for comparison")
        
        return can_handle, limitations
    
    async def generate_processing_plan(
        self,
        request: str,
        complexity: TaskComplexity,
        capabilities: List[Capability],
        can_handle: bool
    ) -> ProcessingPlan:
        """
        Generate step-by-step processing plan
        """
        
        if not can_handle:
            return ProcessingPlan(
                steps=[],
                cannot_complete=True,
                reason="Missing required capabilities or data"
            )
        
        steps = []
        
        # Step 1: Data retrieval (always first if needed)
        if Capability.DATA_RETRIEVAL in capabilities:
            steps.append(ProcessingStep(
                step_number=len(steps) + 1,
                step_type="data_retrieval",
                description="Retrieve relevant financial data from database",
                estimated_time=2,
                handler="data_retrieval_service"
            ))
        
        # Step 2: Calculations
        if Capability.CALCULATIONS in capabilities:
            steps.append(ProcessingStep(
                step_number=len(steps) + 1,
                step_type="calculations",
                description="Perform financial calculations and aggregations",
                estimated_time=5,
                handler="calculation_engine"
            ))
        
        # Step 3: Analysis
        if Capability.ANALYSIS in capabilities:
            steps.append(ProcessingStep(
                step_number=len(steps) + 1,
                step_type="analysis",
                description="Analyze data and identify insights",
                estimated_time=10,
                handler="analysis_engine"
            ))
        
        # Step 4: Forecasting
        if Capability.FORECASTING in capabilities:
            steps.append(ProcessingStep(
                step_number=len(steps) + 1,
                step_type="forecasting",
                description="Generate forecast using ML models",
                estimated_time=15,
                handler="forecasting_engine"
            ))
        
        # Step 5: Visualization
        if Capability.VISUALIZATION in capabilities:
            steps.append(ProcessingStep(
                step_number=len(steps) + 1,
                step_type="visualization",
                description="Create charts and visualizations",
                estimated_time=5,
                handler="visualization_service"
            ))
        
        # Step 6: Reporting
        if Capability.REPORTING in capabilities:
            steps.append(ProcessingStep(
                step_number=len(steps) + 1,
                step_type="reporting",
                description="Generate formatted report",
                estimated_time=10,
                handler="report_generator"
            ))
        
        # Step 7: AI narration (always last)
        steps.append(ProcessingStep(
            step_number=len(steps) + 1,
            step_type="ai_narration",
            description="Generate natural language explanation",
            estimated_time=5,
            handler="rag_engine"
        ))
        
        return ProcessingPlan(
            steps=steps,
            total_estimated_time=sum(s.estimated_time for s in steps),
            parallel_execution_possible=self.can_parallelize(steps)
        )
```

### 1.2 Intelligent Response Generation

```python
class SmartResponseGenerator:
    """
    Generate intelligent responses based on complexity
    """
    
    async def generate_response(
        self,
        analysis: RequestAnalysis,
        execution_results: Dict
    ) -> SmartResponse:
        """
        Generate appropriate response based on complexity
        """
        
        if analysis.complexity == TaskComplexity.SIMPLE:
            return await self.generate_simple_response(
                analysis,
                execution_results
            )
        
        elif analysis.complexity == TaskComplexity.MODERATE:
            return await self.generate_moderate_response(
                analysis,
                execution_results
            )
        
        elif analysis.complexity == TaskComplexity.COMPLEX:
            return await self.generate_complex_response(
                analysis,
                execution_results
            )
        
        else:  # EXPERT
            return await self.generate_expert_response(
                analysis,
                execution_results
            )
    
    async def generate_simple_response(
        self,
        analysis: RequestAnalysis,
        results: Dict
    ) -> SmartResponse:
        """
        Direct answer for simple queries
        """
        
        # Extract key data
        key_value = results.get('value')
        
        # Generate concise answer
        answer = f"The {analysis.entities[0].name} is {format_currency(key_value)}."
        
        # Add context if variance detected
        if 'variance' in results:
            variance = results['variance']
            answer += f" This is {format_percentage(variance)} {'above' if variance > 0 else 'below'} budget."
        
        return SmartResponse(
            answer=answer,
            data=results,
            visualizations=[],
            confidence=0.95,
            response_type="direct_answer"
        )
    
    async def generate_complex_response(
        self,
        analysis: RequestAnalysis,
        results: Dict
    ) -> SmartResponse:
        """
        Comprehensive response for complex queries
        """
        
        # Use AI to generate structured analysis
        prompt = f"""Generate a comprehensive financial analysis response.

Request: {analysis.original_request}
Data: {json.dumps(results, indent=2)}

Structure your response as:
1. Executive Summary (2-3 sentences)
2. Key Findings (3-5 bullet points)
3. Detailed Analysis (2-3 paragraphs)
4. Recommendations (if applicable)
5. Next Steps

Be specific with numbers and cite data sources."""

        ai_response = await self.openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        # Generate visualizations
        visualizations = await self.generate_visualizations(results)
        
        # Create downloadable report
        report = await self.create_report(analysis, results, ai_response)
        
        return SmartResponse(
            answer=ai_response.choices[0].message.content,
            data=results,
            visualizations=visualizations,
            report_url=report.url,
            confidence=0.85,
            response_type="comprehensive_analysis"
        )
```

---

## 2. SMART TASK DECOMPOSITION

### 2.1 Breaking Down Complex Requests

```python
class TaskDecomposer:
    """
    Break down complex requests into manageable subtasks
    """
    
    async def decompose_task(
        self,
        request: str,
        analysis: RequestAnalysis
    ) -> List[SubTask]:
        """
        Decompose complex task into subtasks
        """
        
        if analysis.complexity in [TaskComplexity.SIMPLE, TaskComplexity.MODERATE]:
            # No decomposition needed
            return [SubTask(
                task_id="main",
                description=request,
                dependencies=[]
            )]
        
        # Use AI to decompose
        prompt = f"""Break down this complex financial request into specific subtasks:

Request: {request}

Provide subtasks as a numbered list. Each subtask should be:
1. Specific and actionable
2. Have clear inputs/outputs
3. Be executable independently (when possible)

Example format:
1. Retrieve revenue data for all entities (Jan-Dec 2025)
2. Calculate YoY growth rates
3. Identify top 3 growth drivers
4. Generate forecast for Q1 2026
5. Create visualization
6. Write executive summary"""

        response = await self.openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        # Parse subtasks
        subtasks_text = response.choices[0].message.content
        subtasks = self.parse_subtasks(subtasks_text)
        
        # Build dependency graph
        subtasks_with_deps = self.identify_dependencies(subtasks)
        
        return subtasks_with_deps
    
    def identify_dependencies(
        self,
        subtasks: List[SubTask]
    ) -> List[SubTask]:
        """
        Identify which subtasks depend on others
        """
        
        for i, subtask in enumerate(subtasks):
            # Check if this subtask uses output from previous ones
            if any(keyword in subtask.description.lower() 
                   for keyword in ['using', 'based on', 'from previous']):
                # Depends on previous task
                subtask.dependencies = [subtasks[i-1].task_id]
            
            # Data retrieval always comes first
            if 'retrieve' in subtask.description.lower():
                subtask.priority = 1
            
            # Visualization/reporting always comes last
            elif any(word in subtask.description.lower() 
                    for word in ['visualize', 'create chart', 'report']):
                subtask.priority = 999
        
        return subtasks
```

### 2.2 Parallel Execution Engine

```python
class ParallelExecutionEngine:
    """
    Execute independent subtasks in parallel
    """
    
    async def execute_plan(
        self,
        subtasks: List[SubTask]
    ) -> Dict[str, Any]:
        """
        Execute subtasks with maximum parallelization
        """
        
        results = {}
        executed = set()
        
        while len(executed) < len(subtasks):
            # Find tasks ready to execute (dependencies met)
            ready_tasks = [
                task for task in subtasks
                if task.task_id not in executed
                and all(dep in executed for dep in task.dependencies)
            ]
            
            if not ready_tasks:
                raise Exception("Circular dependency detected")
            
            # Execute ready tasks in parallel
            tasks_to_run = [
                self.execute_subtask(task, results)
                for task in ready_tasks
            ]
            
            # Wait for all parallel tasks to complete
            task_results = await asyncio.gather(*tasks_to_run)
            
            # Store results
            for task, result in zip(ready_tasks, task_results):
                results[task.task_id] = result
                executed.add(task.task_id)
        
        return results
    
    async def execute_subtask(
        self,
        subtask: SubTask,
        previous_results: Dict
    ) -> Any:
        """
        Execute a single subtask
        """
        
        # Route to appropriate handler
        if 'retrieve' in subtask.description.lower():
            return await self.data_retrieval_handler(subtask, previous_results)
        
        elif 'calculate' in subtask.description.lower():
            return await self.calculation_handler(subtask, previous_results)
        
        elif 'analyze' in subtask.description.lower():
            return await self.analysis_handler(subtask, previous_results)
        
        elif 'forecast' in subtask.description.lower():
            return await self.forecasting_handler(subtask, previous_results)
        
        elif 'visualize' in subtask.description.lower():
            return await self.visualization_handler(subtask, previous_results)
        
        else:
            # Use AI to figure out what to do
            return await self.ai_execution_handler(subtask, previous_results)
```

---

## 3. ERROR HANDLING & RECOVERY

```python
class SmartErrorHandler:
    """
    Intelligently handle errors and suggest alternatives
    """
    
    async def handle_error(
        self,
        error: Exception,
        context: RequestContext
    ) -> ErrorResponse:
        """
        Analyze error and provide helpful response
        """
        
        # Classify error type
        error_type = self.classify_error(error)
        
        if error_type == ErrorType.DATA_NOT_AVAILABLE:
            return await self.handle_data_not_available(error, context)
        
        elif error_type == ErrorType.INSUFFICIENT_PERMISSIONS:
            return await self.handle_permissions_error(error, context)
        
        elif error_type == ErrorType.CAPABILITY_NOT_SUPPORTED:
            return await self.handle_capability_error(error, context)
        
        elif error_type == ErrorType.AMBIGUOUS_REQUEST:
            return await self.handle_ambiguous_request(error, context)
        
        else:
            return await self.handle_unknown_error(error, context)
    
    async def handle_ambiguous_request(
        self,
        error: Exception,
        context: RequestContext
    ) -> ErrorResponse:
        """
        Help user clarify ambiguous request
        """
        
        # Use AI to generate clarifying questions
        prompt = f"""The user request is ambiguous:

Request: {context.original_request}
Issue: {str(error)}

Generate 3-4 clarifying questions to help the user be more specific.

Example:
"I'd be happy to help analyze revenue. To provide the most relevant information, could you clarify:
1. Which time period? (e.g., last month, Q3 2025, YTD)
2. Which entities? (e.g., all regions, specific company)
3. What comparison? (e.g., vs budget, vs last year, trends)
4. What format? (e.g., summary, detailed breakdown, chart)"
"""

        response = await self.openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        
        return ErrorResponse(
            error_type="ambiguous_request",
            user_message=response.choices[0].message.content,
            suggested_actions=[
                "Provide more specific time period",
                "Specify entities/regions",
                "Clarify comparison type"
            ],
            can_retry=True
        )
```

---

## 4. EXAMPLES OF SMART REASONING

### Example 1: Simple Query

**User:** "What was revenue last month?"

**System Reasoning:**
```
1. Complexity: SIMPLE
2. Capabilities needed: DATA_RETRIEVAL
3. Processing plan:
   - Retrieve revenue for last month
   - Format response
4. Estimated time: 2 seconds
5. Can handle: YES
6. Response: "Revenue for December 2025 was ₾106.5M."
```

### Example 2: Complex Analysis

**User:** "Analyze profitability trends across all regions for the past 6 months and forecast next quarter"

**System Reasoning:**
```
1. Complexity: COMPLEX
2. Capabilities needed: DATA_RETRIEVAL, CALCULATIONS, ANALYSIS, FORECASTING, VISUALIZATION
3. Task decomposition:
   Step 1: Retrieve financial data (all regions, last 6 months) [2s]
   Step 2: Calculate profit margins by region [3s]
   Step 3: Perform trend analysis [5s]
   Step 4: Generate Q1 2026 forecast [10s]
   Step 5: Create visualization (charts) [5s]
   Step 6: Write comprehensive analysis [5s]
4. Estimated time: 30 seconds
5. Can handle: YES
6. Parallel execution: Steps 1-2 can run in parallel
```

### Example 3: Cannot Handle

**User:** "Create a Monte Carlo simulation for our M&A scenario with 10,000 iterations"

**System Reasoning:**
```
1. Complexity: EXPERT
2. Capabilities needed: SCENARIO_MODELING (Monte Carlo), STRATEGIC_PLANNING
3. Can handle: NO
4. Limitations:
   - Monte Carlo simulation not yet implemented
   - M&A modeling requires specialized module
5. Response:
   "I can see you're looking for advanced scenario modeling. While I can't perform Monte Carlo simulations yet, I can:
   - Create basic what-if scenarios
   - Perform sensitivity analysis on key assumptions
   - Generate deterministic forecasts
   
   Would you like me to start with a sensitivity analysis?"
```

---

## 5. CONTINUOUS LEARNING

```python
class IntelligenceFeedbackLoop:
    """
    Learn from user interactions to improve reasoning
    """
    
    async def learn_from_interaction(
        self,
        request: str,
        analysis: RequestAnalysis,
        execution_results: Dict,
        user_feedback: UserFeedback
    ):
        """
        Learn from how well the system handled the request
        """
        
        if user_feedback.rating >= 4:  # Positive feedback
            # Store successful pattern
            await self.store_successful_pattern(
                request_pattern=self.extract_pattern(request),
                processing_approach=analysis.processing_plan,
                complexity_classification=analysis.complexity
            )
        
        else:  # Negative feedback
            # Analyze what went wrong
            issues = await self.analyze_failure(
                request,
                analysis,
                execution_results,
                user_feedback
            )
            
            # Update reasoning models
            await self.update_reasoning_models(issues)
```

This Smart Reasoning Engine ensures the system can handle ANY request intelligently!


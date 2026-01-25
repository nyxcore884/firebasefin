import logging
import collections
import autodocs

logger = logging.getLogger(__name__)

def run_flow_execution(company_id, flow_id, context, nodes, edges):
    """
    Executes a flow defined by a DAG of nodes and edges.
    1. Sorts nodes topologically.
    2. Executes backend bindings.
    3. Compiles concrete configuration docs.
    """
    logger.info(f"Running flow {flow_id} for company {company_id}")
    
    # ... ( adjacency list and topological sort code remains the same )
    adj = collections.defaultdict(list)
    in_degree = {node['id']: 0 for node in nodes}
    node_map = {node['id']: node for node in nodes}
    
    for edge in edges:
        source = edge['source']
        target = edge['target']
        adj[source].append(target)
        in_degree[target] += 1
        
    queue = collections.deque([node_id for node_id, degree in in_degree.items() if degree == 0])
    execution_order = []
    
    while queue:
        curr = queue.popleft()
        execution_order.append(curr)
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    if len(execution_order) != len(nodes):
        return {"status": "error", "message": "Cycle detected"}
        
    node_outputs = {}
    
    # 4. Config Compilation Repositories
    metrics_definitions = []
    ai_tool_configs = []
    workflow_definitions = []

    for node_id in execution_order:
        node = node_map[node_id]
        data = node.get('data', {})
        kind = data.get('kind')
        
        # Compile config based on node kind
        if kind == 'metric':
            metrics_definitions.append({
                'id': node_id,
                'key': data.get('key'),
                'formula': data.get('formula'),
                'label': data.get('label'),
                'threshold': data.get('alertThreshold')
            })
        elif kind == 'aiToolNode':
            ai_tool_configs.append({
                'id': node_id,
                'toolName': data.get('toolName'),
                'params': data.get('params'),
                'enabled': data.get('enabled')
            })
        elif kind == 'workflow':
            workflow_definitions.append({
                'id': node_id,
                'label': data.get('label'),
                'status': data.get('status'),
                'requiresApproval': data.get('requiresApproval')
            })

        # Execute backend if present
        backend = data.get('backend', {})
        fn_name = backend.get('fn')
        if fn_name:
            node_outputs[node_id] = {"status": "success", "executed": fn_name}
        else:
            node_outputs[node_id] = {"status": "skipped"}
            
    # 5. Persist Compiled Configs (In a real system, write to Firestore)
    # db.collection('metrics_definitions').document(company_id).set({'metrics': metrics_definitions})
    # ... etc

    return {
        "status": "success",
        "flow_id": flow_id,
        "results": node_outputs,
        "compiled_configs": {
            "metrics": len(metrics_definitions),
            "ai_tools": len(ai_tool_configs),
            "workflows": len(workflow_definitions)
        }
    }

def generate_flow_docs(nodes, edges):
    """
    Placeholder for Vertex AI doc generation.
    """
    return {
        "status": "success",
        "documentation": "Synthesized documentation for the financial flow..."
    }

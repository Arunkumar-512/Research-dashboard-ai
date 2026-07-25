from typing import Annotated, TypedDict, List, Optional
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # This list will accumulate messages from all agents.
    # The 'operator.add' tells LangGraph to append new messages instead of overwriting.
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Store final research results (single string, not accumulated)
    research_results: Optional[str]
    
    # Store final report
    final_report: Optional[str]
    
    # If you need to accumulate research snippets, use this:
    # research_snippets: Annotated[List[str], operator.add]
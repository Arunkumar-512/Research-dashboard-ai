from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import SystemMessage, AIMessage
from app.state import AgentState
from app.agents.writer import writer_agent
import os

# Check for API keys
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY environment variable not set")
if not os.getenv("TAVILY_API_KEY"):
    raise ValueError("TAVILY_API_KEY environment variable not set")

# Initialize the model - USING CORRECT MODEL NAME
# Available models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash-001
llm = ChatGoogleGenerativeAI(
     model="gemini-2.5-flash-lite", # ✅ This model exists in v1beta
    temperature=0.7,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# Initialize search tool
search_tool = TavilySearchResults(
    max_results=3,
    api_key=os.getenv("TAVILY_API_KEY")
)

# Create the base ReAct agent
base_agent = create_react_agent(llm, [search_tool])

# Wrapper function to add system instructions
def research_agent_with_instructions(state):
    """Add system instructions to the research agent"""
    messages = state.get("messages", [])
    
    # Add system instruction if not already present
    if not messages or not any(isinstance(m, SystemMessage) for m in messages):
        system_msg = SystemMessage(
            content="You are a research assistant. Use the search tool to find accurate, up-to-date information. "
                    "Be thorough and provide comprehensive research findings with sources."
        )
        messages = [system_msg] + messages
        state["messages"] = messages
    
    # Call the base agent
    return base_agent.invoke(state)

# Define the Workflow Blueprint
workflow = StateGraph(AgentState)
workflow.add_node("researcher", research_agent_with_instructions)
workflow.add_node("writer", writer_agent)

workflow.set_entry_point("researcher")
workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", END)
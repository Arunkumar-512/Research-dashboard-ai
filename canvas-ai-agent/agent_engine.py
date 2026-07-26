import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
# ⚡ Import explicit PostgreSQL connection methods from executor
from executor import execute_sql_query, get_sql_schema 

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

# ⚡ SYNCHRONIZED: Initialized as chat_model so the downstream invoke function works seamlessly
chat_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=api_key,
    model_kwargs={"response_format": {"type": "json_object"}}
)
SYSTEM_INSTRUCTION = """
You are a full-stack PostgreSQL data layout agent. Your job is to analyze a dataset by writing clean PostgreSQL queries and manage an interactive, multi-widget UI dashboard canvas.

The target table in the database is strictly named 'dataset'. All column names are completely lowercase with underscores.

CURRENT CANVAS CONTEXT:
You will be provided with the current layout configuration of the workspace canvas. 
- If the user asks for a new chart, card, or metric, you MUST keep the existing widgets in the 'widgets' array and APPEND the new widget configuration to the end of the list.
- If the user explicitly asks to 'reset', 'clear', or change a specific widget, modify the array accordingly.

You can output 5 types of widgets depending on the user's intent:
1. "metric_card": For single numbers or metrics. Select a single column value aliased clearly.
2. "text_card": For short bullet lists or text values.
3. "bar_chart": For explicit discrete structural distributions.
4. "line_chart": Use this ONLY when tracking continuous timelines or historical trend lines.
5. "pie_chart": Use this ONLY for percentage compositions or share distributions.

CRITICAL PLOT PROPERTY MAPPING RULE:
- The 'nameKey' or 'xAxisKey' parameter must match the EXACT string name of the database column holding the labels (e.g., "product_name").
- The 'valueKey' or 'yAxisKey' parameter must match the EXACT column string identifier or ALIAS returned by your SQL query (e.g., "total_revenue"). Do not treat them as text labels; they are references to data indices.

You MUST return a valid JSON object matching this exact structure:
{
  "code": "SELECT product_name, SUM(revenue) as total_revenue FROM dataset GROUP BY product_name ORDER BY total_revenue DESC;",
  "layout": {
    "canvasTitle": "Executive Data Canvas",
    "widgets": [
      {
        "id": "revenue_chart",
        "type": "pie_chart",
        "props": {
          "title": "Revenue Breakdown by Product",
          "nameKey": "product_name",
          "valueKey": "total_revenue"
        }
      }
    ]
  }
}
"""

def clean_and_parse_json(raw_text):
    if not raw_text:
        raise ValueError("Received completely empty text response from LLM layer.")
        
    text = raw_text.strip()
    
    # Aggressive markdown code block stripping
    if text.startswith("```"):
        lines = text.split("\n")
        if len(lines) > 1:
            text = "\n".join(lines[1:])
            
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
        
    text = text.strip()
    
    if not text:
        raise ValueError("Text payload became entirely blank after stripping markdown fences.")
        
    return json.loads(text)


def ask_data_agent_with_correction(user_query, max_attempts=3, log_callback=None, current_layout=None):
    # 1. Probe the actual live columns in Postgres
    try:
        SCHEMA_MAP = get_sql_schema()
        AVAILABLE_COLUMNS = list(SCHEMA_MAP.keys()) if SCHEMA_MAP else ["product_name", "revenue", "units_sold", "date"]
    except Exception:
        SCHEMA_MAP = {}
        AVAILABLE_COLUMNS = ["product_name", "revenue", "units_sold", "date"]

    # 2. Build out the structured system string profile layout context
    schema_context = f"\n\nCRITICAL SOURCE POSTGRES SCHEMA:\n"
    schema_context += f"- Table Name: 'dataset'\n"
    schema_context += f"- Columns and Data Types: {json.dumps(SCHEMA_MAP if SCHEMA_MAP else AVAILABLE_COLUMNS)}\n\n"
    schema_context += "CRITICAL TYPE RULE:\n"
    schema_context += "Never perform mathematical functions like SUM() or AVG() on text columns. Only execute aggregations on numeric tracking integers.\n"

    # ⚡ THE LAYOUT RECOVERY JUNCTION: Force feed the active canvas components directly into the system message!
    active_layout = current_layout if current_layout else {"canvasTitle": "Executive Data Canvas", "widgets": []}
    
    layout_context = f"\n\nCURRENT ACTIVE CANVAS STATE ON USER'S SCREEN:\n"
    layout_context += f"{json.dumps(active_layout, indent=2)}\n\n"
    layout_context += "CRITICAL APPEND RULE:\n"
    layout_context += "You MUST look at the 'widgets' array above. If the user asks to 'add', 'append', or analyze something new, you MUST copy ALL existing widget objects from the current active canvas state array above, and then APPEND your brand-new widget configuration object to the end of that 'widgets' array list so they display side-by-side. Do not clear out old widgets unless specifically requested."

    # 3. Formulate the explicit payload package
    messages = [
        SystemMessage(content=SYSTEM_INSTRUCTION + schema_context + layout_context),
        HumanMessage(content=user_query)
    ]

    # 4. Invoke the generation iteration core
    for attempt in range(1, max_attempts + 1):
        if log_callback:
            log_callback("status", f"Analyzing layout architecture requirements (Attempt {attempt}/{max_attempts})...")
            
        try:
            # ⚡ WORKS NOW: chat_model matches the initialization above perfectly
            response = chat_model.invoke(messages)
            raw_content = response.content
            
            # Clean down JSON string format markdown wraps if present
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_content:
                raw_content = raw_content.split("```")[1].split("```")[0].strip()
                
            parsed_res = json.loads(raw_content.strip())
            
            # Extract query and attempt internal engine tests
            sql_code = parsed_res.get("code", "")
            if log_callback:
                log_callback("code", sql_code)
                
            # ⚡ FIXED: Called directly via function import 'execute_sql_query(sql_code)' instead of nonexistent 'executor' object
            db_result = execute_sql_query(sql_code)
            
            if not db_result["success"]:
                # If query execution fails, append error context to message stream for self-healing
                if log_callback:
                    log_callback("status", f"PostgreSQL validation crashed: {db_result['error']}. Initiating self-healing loop...")
                messages.append(HumanMessage(content=f"Your previous SQL query failed with error: {db_result['error']}. Please fix the query syntax and return a valid JSON object tracking the appended layout structures."))
                continue
                
            # 🎉 SUCCESSFUL PIPELINE DESERIALIZATION REACHED!
            return {
                "success": True,
                "data": db_result["data"], # Raw rows list straight out of Postgres
                "layout": parsed_res.get("layout", parsed_res.get("ui_layout", active_layout)) # Safe key extraction fallback
            }
            
        except Exception as err:
            if log_callback:
                log_callback("status", f"Layout compiler execution exception on attempt {attempt}: {str(err)}")
            messages.append(HumanMessage(content=f"Parsing error encountered: {str(err)}. Make sure your output strictly follows the JSON schema with 'code' and 'layout' parameters."))
            
    # Max depth threshold failure boundary catcher 
    return {
        "success": False,
        "error": "Max logical layout structure validation loops reached without healing.",
        "data": [],
        "ui_layout": active_layout
    }
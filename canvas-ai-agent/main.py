import json
import asyncio
import queue
import io
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pandas as pd
from decimal import Decimal
from typing import Optional, Dict, Any
import datetime


# ⚡ CHANGED: Imports from your newly optimized PostgreSQL layers
from agent_engine import ask_data_agent_with_correction
import executor 

app = FastAPI()

# Enable clean CORS communication between Next.js and FastAPI ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ⚡ UPDATE: Expand your incoming data layout validation framework
class PromptRequest(BaseModel):
    prompt: str
    currentLayout: Any = None  # ⬅️ Add this optional context node

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    
    if not (filename.endswith('.csv') or filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are supported.")
    
    try:
        contents = await file.read()
        
        if filename.endswith('.xlsx'):
            new_df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
        else:
            new_df = pd.read_csv(io.BytesIO(contents))
            
        # 1. Stream to PostgreSQL (Logs pass successfully here)
        executor.init_db_from_dataframe(new_df)
        
        schema_map = executor.get_sql_schema()
        
        if isinstance(schema_map, dict):
            sanitized_columns = list(schema_map.keys())
        elif isinstance(schema_map, list):
            sanitized_columns = schema_map
        else:
            sanitized_columns = list(new_df.columns)
        # 3. Pull top 5 preview records from Postgres
        preview_query = executor.execute_sql_query("SELECT * FROM dataset LIMIT 5;")
        raw_preview_data = preview_query["data"] if preview_query["success"] else []
        
        # ⚡ SAFETY FILL PATCH: Sanitize data formats explicitly to protect FastAPI's JSON encoder
        clean_preview_data = []
        for row in raw_preview_data:
            clean_row = {}
            for key, val in row.items():
                if isinstance(val, Decimal):
                    clean_row[key] = float(val)
                elif isinstance(val, (datetime.date, datetime.datetime)):
                    clean_row[key] = val.isoformat()
                elif pd.isna(val):  # Catches remaining NaN, NaT or None values
                    clean_row[key] = ""
                else:
                    clean_row[key] = val
            clean_preview_data.append(clean_row)
        
        # 4. Return clean, serialized data structure
        return {
            "success": True, 
            "filename": file.filename, 
            "rows": len(new_df),
            "columns": sanitized_columns,
            "preview": clean_preview_data  # ⬅️ Safe clean array
        }
    except Exception as e:
        import traceback
        print("💥 CRITICAL FAULT IN UPLOAD ROUTE:")
        traceback.print_exc()  # This prints the exact line that crashed to your terminal
        raise HTTPException(status_code=500, detail=f"PostgreSQL Ingestion Fault: {str(e)}")

@app.post("/api/analyze")
async def analyze_endpoint(request: PromptRequest, req_raw: Request):
    # 🔍 DEBUGGING HOOK: Print exactly what JSON structure arrived from Next.js
    try:
        raw_body = await req_raw.json()
        print("📥 RAW INCOMING PAYLOAD FROM FRONTEND:", json.dumps(raw_body, indent=2))
    except Exception:
        print("📥 Could not parse raw incoming JSON body.")

    # Extract parameters safely
    user_prompt = request.prompt
    
    # Clean up layout variables to ensure it passes down cleanly
    layout_context = None
    if request.currentLayout:
        # If it arrived as a stringified JSON, parse it safely
        if isinstance(request.currentLayout, str):
            try:
                layout_context = json.loads(request.currentLayout)
            except Exception:
                layout_context = None
        elif isinstance(request.currentLayout, dict):
            layout_context = request.currentLayout

    log_queue = queue.Queue()

    def frontend_log(message_type: str, text: str):
        payload = json.dumps({"type": message_type, "content": text})
        log_queue.put(f"data: {payload}\n\n")

    async def event_generator():
        frontend_log("status", "Initializing Gemini 2.5 Flash Analytical Core...")
        frontend_log("status", f"Processing query through PostgreSQL pipeline: '{user_prompt}'")

        loop = asyncio.get_running_loop()
        agent_task = loop.run_in_executor(
            None, 
            ask_data_agent_with_correction, 
            user_prompt, 
            3,               # max_attempts
            frontend_log,    # dynamic real-time logging hook
            layout_context   # Clean context dict passed to your Gemini agent loop
        )

        while not agent_task.done():
            while not log_queue.empty():
                yield log_queue.get()
            await asyncio.sleep(0.1)

        result = await agent_task

        while not log_queue.empty():
            yield log_queue.get()
            await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'type': 'final_result', 'payload': result})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
import json
import aiosqlite

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session
from sqlalchemy import text

from pydantic import BaseModel

from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from app.agents.researcher import workflow
from app.agents.database import (
    SessionLocal,
    ResearchThread,
    init_db,
)

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Research API Running"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()

    conn = await aiosqlite.connect("checkpoints.db")

    memory = AsyncSqliteSaver(conn)

    app.state.graph = workflow.compile(
        checkpointer=memory
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health-check")
def db_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.get("/threads")
def get_threads(db: Session = Depends(get_db)):
    return (
        db.query(ResearchThread)
        .order_by(ResearchThread.created_at.desc())
        .all()
    )


@app.get("/thread/{thread_id}")
def get_thread(thread_id: int, db: Session = Depends(get_db)):
    thread = (
        db.query(ResearchThread)
        .filter(ResearchThread.id == thread_id)
        .first()
    )

    if not thread:
        raise HTTPException(
            status_code=404,
            detail="Thread not found",
        )

    return thread


@app.delete("/thread/{thread_id}")
def delete_thread(thread_id: int, db: Session = Depends(get_db)):
    thread = (
        db.query(ResearchThread)
        .filter(ResearchThread.id == thread_id)
        .first()
    )

    if not thread:
        raise HTTPException(
            status_code=404,
            detail="Thread not found",
        )

    db.delete(thread)
    db.commit()

    return {
        "status": "deleted",
        "id": thread_id,
    }


@app.delete("/threads")
def clear_threads(db: Session = Depends(get_db)):
    db.query(ResearchThread).delete()
    db.commit()

    return {
        "status": "all threads deleted",
    }


class ReportData(BaseModel):
    query: str
    content: str


@app.post("/save-report")
def save_report(
    data: ReportData,
    db: Session = Depends(get_db),
):
    thread = ResearchThread(
        query=data.query,
        report_content=data.content,
    )

    db.add(thread)
    db.commit()
    db.refresh(thread)

    return {
        "status": "saved",
        "id": thread.id,
    }


@app.get("/stream-research")
async def stream_research(
    query: str,
    thread_id: str,
):
    async def event_generator():
        config = {
            "configurable": {
                "thread_id": thread_id
            }
        }

        try:
            async for event in app.state.graph.astream(
                {
                    "messages": [
                        HumanMessage(content=query)
                    ]
                },
                config=config,
                stream_mode="updates",
            ):
                for node_name, output in event.items():

                    if (
                        isinstance(output, dict)
                        and "messages" in output
                    ):
                        msgs = output["messages"]

                        if msgs:
                            content = str(msgs[-1].content)
                        else:
                            content = ""

                    elif hasattr(output, "content"):
                        content = str(output.content)

                    else:
                        content = str(output)

                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "node": node_name,
                                "output": content,
                            }
                        )
                        + "\n\n"
                    )

        except Exception as e:
            yield (
                "data: "
                + json.dumps(
                    {
                        "error": str(e)
                    }
                )
                + "\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
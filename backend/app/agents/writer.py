import os
import re
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    ToolMessage,
    SystemMessage,
)

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  
    temperature=0.5,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)


def clean_content(text: str) -> str:
    """Remove JSON artifacts and clean response formatting."""

    if not text:
        return ""

    text = str(text)

    # Remove JSON-like wrappers
    text = text.replace('[{"type":"text","text":"', "")
    text = text.replace('"}]', "")
    text = text.replace('{"type":"text","text":"', "")
    text = text.replace('"}', "")

    # Unescape characters
    text = text.replace("\\n", "\n")
    text = text.replace("\\t", "    ")
    text = text.replace('\\"', '"')
    text = text.replace("\\'", "'")
    text = text.replace("\\\\", "\\")

    # Remove malformed JSON blocks
    text = re.sub(r"\[\{.*?\}\]", "", text, flags=re.DOTALL)
    text = re.sub(
        r'\{"type":".*?","text":".*?"\}',
        "",
        text,
        flags=re.DOTALL,
    )

    # Fix code blocks
    text = text.replace("````mermaid", "```mermaid")
    text = text.replace("````", "```")

    # Remove empty mermaid blocks
    text = re.sub(
        r"```mermaid\s*```",
        "",
        text,
        flags=re.DOTALL,
    )

    # Remove excessive blank lines
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    return text.strip()

def validate_mermaid(content: str) -> str:
    if not content:
        return ""

    content = content.replace("````mermaid", "```mermaid")
    content = content.replace("````", "```")

    # Remove empty Mermaid blocks
    content = re.sub(
        r"```mermaid\s*```",
        "",
        content,
        flags=re.DOTALL,
    )

    # Fix invalid xychart y-axis
    content = re.sub(
        r'y-axis\s+"([^"]+)"\s+\[[^\]]+\]',
        r'y-axis "\1" 0 --> 100',
        content,
    )

    return content.strip()

def writer_agent(state: dict):
    """
    Transform research findings into a professional markdown report.
    """

    messages = state.get("messages", [])

    if not messages:
        return {
            "messages": [
                AIMessage(content="No research data provided.")
            ],
            "final_report": "No research data provided.",
        }

    all_content = []

    for msg in messages:
        if isinstance(msg, (HumanMessage, AIMessage)):
            if msg.content:
                all_content.append(str(msg.content))

        elif isinstance(msg, ToolMessage):
            all_content.append(
                f"Search Result:\n{msg.content}"
            )

    research_data = "\n\n".join(all_content)

    # Prevent context overflow
    if len(research_data) > 30000:
        research_data = (
            research_data[:15000]
            + "\n\n...[Content Truncated]..."
        )

    system_prompt = """
You are an expert business analyst, technical researcher,
and professional report writer.

Transform the provided research findings into a detailed,
professional markdown report suitable for business stakeholders,
technical teams, and decision-makers.

# Report Structure

# Title

## Executive Summary

Provide a concise overview of the findings.

## Key Findings

Summarize the most important insights using bullet points.

## Data Analysis

Provide detailed analysis supported by the research.
# Visual Insights

Generate Mermaid diagrams ONLY when they help explain the research.

Maximum: 2 diagrams.

Allowed Mermaid types ONLY:

1. Flowchart

```mermaid
flowchart TD
A[Research] --> B[Analysis]
B --> C[Insights]
C --> D[Recommendations]
```

Use for:
- Processes
- Workflows
- Pipelines

2. Pie Chart

```mermaid
pie showData
title Market Share

"Company A" : 45
"Company B" : 35
"Company C" : 20
```

Use for:
- Distribution
- Percentages
- Market Share

3. Mindmap

```mermaid
mindmap
  root((Research))
    Finding 1
    Finding 2
    Finding 3
```

Use for:
- Categories
- Hierarchies
- Concept maps

4. Sequence Diagram

```mermaid
sequenceDiagram
User->>System: Request
System-->>User: Response
```

Use for:
- User interactions
- APIs
- Process flows

Never generate xychart-beta unless the research contains real time-series data.

Never output Mermaid outside:

```mermaid
...
```

Never invent Mermaid syntax.
"""

    try:
        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=f"""
Research Findings:

{research_data}

Generate a professional Markdown report.

Requirements:

- Follow the report structure.
- Include Mermaid diagrams only if appropriate.
- Use Markdown tables for numerical data.
- Never invent statistics or facts.
- Return only Markdown.
"""
                ),
            ]
        )

        report = response.content

        report = clean_content(report)
        report = validate_mermaid(report)

        return {
            "messages": [AIMessage(content=report)],
            "final_report": report,
        }

    except Exception as e:
        error_message = f"Writer Agent Error: {str(e)}"

        return {
            "messages": [
                AIMessage(content=error_message)
            ],
            "final_report": error_message,
        }
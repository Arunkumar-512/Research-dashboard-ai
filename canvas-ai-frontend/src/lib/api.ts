export interface Widget {
  id: string;
  type: 'metric_card' | 'text_card' | 'bar_chart';
  props: {
    title: string;
    value?: string | number;
    currency?: boolean;
    content?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    data?: any[];
  };
}

export interface ApiResponse {
  data: any;
  ui_layout: {
    canvasTitle: string;
    widgets: Widget[];
  };
  error?: string;
}

export async function sendPromptToAgent(prompt: string): Promise<ApiResponse> {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    return {
      data: null,
      ui_layout: { canvasTitle: "Error Loading Canvas", widgets: [] },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

interface Props {
  chart: string;
}

export default function MermaidDiagram({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!ref.current) return;

      try {
        const id = `mermaid-${crypto.randomUUID()}`;

        const { svg } = await mermaid.render(id, chart);

        ref.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);

        ref.current.innerHTML = `
          <div class="text-red-400 text-sm">
            Failed to render diagram
          </div>
        `;
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div
      ref={ref}
      className="my-6 overflow-auto rounded-lg bg-slate-900 p-4"
    />
  );
}
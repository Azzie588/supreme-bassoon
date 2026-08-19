import { useEffect, useRef } from "preact/hooks";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export interface LineSeries {
  label: string;
  data: number[];
  color: string;
}

export function LineChart(props: { labels: string[]; series: LineSeries[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: props.labels,
        datasets: props.series.map((s) => ({
          label: s.label,
          data: s.data,
          borderColor: s.color,
          backgroundColor: s.color,
          tension: 0.25,
          pointRadius: 3,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(128,128,128,0.15)" } },
        },
        plugins: {
          legend: { display: props.series.length > 1 },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [props.labels, props.series]);

  return (
    <div style={{ height: props.height ?? 260 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

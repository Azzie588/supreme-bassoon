import { useEffect, useRef } from "preact/hooks";
import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from "chart.js";

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

export interface BarSeries {
  label: string;
  data: number[];
  color: string;
}

export function BarChart(props: { labels: string[]; series: BarSeries[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: props.labels,
        datasets: props.series.map((s) => ({
          label: s.label,
          data: s.data,
          backgroundColor: s.color,
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

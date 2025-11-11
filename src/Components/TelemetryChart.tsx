import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchLiveTelemetry } from "../utils/api";
import type { TelemetryData } from "../utils/api";

interface ChartData {
  timestamp: string;
  temperature_c: number;
  humidity_pct: number;
  battery_level: number;
}

function TelemetryChart() {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const telemetry = await fetchLiveTelemetry();
        const chartData = telemetry
          .filter((t: TelemetryData) => t.temperature_c !== undefined || t.humidity_pct !== undefined || t.battery_level !== undefined)
          .map((t: TelemetryData) => ({
            timestamp: new Date(t.timestamp).toLocaleTimeString(),
            temperature_c: t.temperature_c ?? 0,
            humidity_pct: t.humidity_pct ?? 0,
            battery_level: t.battery_level ?? 0,
          }))
          .reverse()
          .slice(0, 20);
        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Telemetry Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature_c"
            stroke="#3b82f6"
            name="Temperature (°C)"
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="humidity_pct"
            stroke="#06b6d4"
            name="Humidity (%)"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="battery_level"
            stroke="#eab308"
            name="Battery (%)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TelemetryChart;


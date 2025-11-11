import { useEffect, useState } from "react";
import { fetchLiveTelemetry } from "../utils/api";

interface Stats {
  totalNodes: number;
  totalTelemetry: number;
  activeNodes: number;
  avgTemperature: number;
  avgHumidity: number;
  avgBattery: number;
}

function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalNodes: 0,
    totalTelemetry: 0,
    activeNodes: 0,
    avgTemperature: 0,
    avgHumidity: 0,
    avgBattery: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const telemetry = await fetchLiveTelemetry();
        const uniqueNodes = new Set(telemetry.map(t => t.node_id));
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const recentTelemetry = telemetry.filter(t => {
          const ts = new Date(t.timestamp).getTime();
          return ts > oneHourAgo;
        });
        const activeNodes = new Set(recentTelemetry.map(t => t.node_id));

        const temps = telemetry.filter(t => t.temperature_c !== undefined).map(t => t.temperature_c!);
        const humidities = telemetry.filter(t => t.humidity_pct !== undefined).map(t => t.humidity_pct!);
        const batteries = telemetry.filter(t => t.battery_level !== undefined).map(t => t.battery_level!);

        setStats({
          totalNodes: uniqueNodes.size,
          totalTelemetry: telemetry.length,
          activeNodes: activeNodes.size,
          avgTemperature: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
          avgHumidity: humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : 0,
          avgBattery: batteries.length > 0 ? batteries.reduce((a, b) => a + b, 0) / batteries.length : 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nodes</div>
        <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalNodes}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Nodes</div>
        <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeNodes}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Readings</div>
        <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTelemetry.toLocaleString()}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Temperature</div>
        <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.avgTemperature.toFixed(1)}°C</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Humidity</div>
        <div className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.avgHumidity.toFixed(1)}%</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Battery</div>
        <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.avgBattery.toFixed(0)}%</div>
      </div>
    </div>
  );
}

export default StatsCards;


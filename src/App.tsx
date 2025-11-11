import { useState } from "react";
import Map from "./Components/Map/Map";
import StatsCards from "./Components/StatsCards";
import TelemetryTable from "./Components/TelemetryTable";
import TelemetryChart from "./Components/TelemetryChart";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<"map" | "data">("map");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LoRa Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("map")}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === "map"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === "data"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards />

        {activeTab === "map" ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4" style={{ height: "600px" }}>
            <Map />
          </div>
        ) : (
          <div className="space-y-6">
            <TelemetryChart />
            <TelemetryTable />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

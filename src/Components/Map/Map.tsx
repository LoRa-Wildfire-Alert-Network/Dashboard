import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchLiveTelemetry } from "../../utils/api";
import type { TelemetryData } from "../../utils/api";

function Map() {
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);

  useEffect(() => {
    if (!map.current) {
      map.current = L.map("mapId", {
        preferCanvas: true,
      }).setView([44.5646, -123.262], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.current);
    }
  }, []);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const data = await fetchLiveTelemetry();
        const latestByNode: Record<string, TelemetryData> = {};
        data.forEach((t: TelemetryData) => {
          if (t.latitude !== undefined && t.longitude !== undefined) {
            const existing = latestByNode[t.node_id];
            if (!existing || new Date(t.timestamp) > new Date(existing.timestamp)) {
              latestByNode[t.node_id] = t;
            }
          }
        });
        setTelemetry(Object.values(latestByNode));
      } catch (error) {
        console.error("Failed to fetch telemetry for map:", error);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((marker) => {
      map.current?.removeLayer(marker);
    });
    markersRef.current = [];

    telemetry.forEach((t) => {
      if (t.latitude !== undefined && t.longitude !== undefined) {
        const batteryLevel = t.battery_level ?? 0;
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${batteryLevel > 50 ? "#22c55e" : batteryLevel > 20 ? "#eab308" : "#ef4444"}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([t.latitude, t.longitude], { icon }).addTo(map.current!);
        const popupContent = `
          <div style="min-width: 200px;">
            <strong>${t.node_name || t.node_id}</strong><br/>
            ${t.temperature_c !== undefined ? `Temp: ${t.temperature_c.toFixed(1)}°C<br/>` : ""}
            ${t.humidity_pct !== undefined ? `Humidity: ${t.humidity_pct.toFixed(1)}%<br/>` : ""}
            ${t.battery_level !== undefined ? `Battery: ${t.battery_level}%<br/>` : ""}
            <small>${new Date(t.timestamp).toLocaleString()}</small>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      }
    });

    if (telemetry.length > 0 && map.current) {
      const validPoints = telemetry
        .filter((t) => t.latitude !== undefined && t.longitude !== undefined)
        .map((t) => [t.latitude!, t.longitude!] as [number, number]);
      
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          map.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [telemetry]);

  return <div id="mapId" className="w-full h-full rounded-lg"></div>;
}

export default Map;

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

function Map() {
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!map.current) {
      map.current = L.map("mapId", {
        preferCanvas: true,
      }).setView([44.5646, -123.262], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.current);
    }
  });

  return <div id="mapId" style={{ height: "100vh", width: "100vw" }}></div>;
}

export default Map;

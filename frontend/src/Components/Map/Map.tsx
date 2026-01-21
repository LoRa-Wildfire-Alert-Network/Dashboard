import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { NodeData } from "../../types/nodeTypes";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

interface MapProps {
  alertNodes: NodeData[];
  normalNodes: NodeData[];
}

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function Map({ alertNodes, normalNodes }: MapProps) {
  return (
    <MapContainer
      center={[44.5646, -123.262]}
      zoom={12}
      scrollWheelZoom={true}
      className="shadow-lg rounded-md p-4 flex-1"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {alertNodes.map((node: NodeData, i) => (
        <Marker key={i} position={[node.latitude, node.longitude]}>
          <Popup>
            Node ID: {node.node_id} <br />
            Temp: {node.temperature_c} °C <br />
            Humidity: {node.humidity_pct} % <br />
            Smoke Detected?: {node.smoke_detected ? "Yes" : "No"}
          </Popup>
        </Marker>
      ))}
      {normalNodes.map((node: NodeData, i) => (
        <Marker key={i} position={[node.latitude, node.longitude]}>
          <Popup>
            Node ID: {node.node_id} <br />
            Temp: {node.temperature_c} °C <br />
            Humidity: {node.humidity_pct} % <br />
            Smoke Detected?: {node.smoke_detected ? "Yes" : "No"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default Map;

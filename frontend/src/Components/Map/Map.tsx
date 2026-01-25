import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { NodeData } from "../../types/nodeTypes";

interface MapProps {
  nodeData: NodeData[];
  expandedNodeIds: string[];
  onClick: (nodeId: string) => void;
}

// Source: https://github.com/pointhi/leaflet-color-markers /////////////

var greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

var redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

var orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/////////////////////////////////////////////////////////////////////////

L.Marker.prototype.options.icon = redIcon;

function selectIcon(
  smoke_detected: boolean,
  battery_level: number,
  expandedNodeIds: string[],
  nodeId: string,
) {
  const baseIcon = selectIconColor(smoke_detected, battery_level);
  if (expandedNodeIds.includes(nodeId)) {
    baseIcon.options.iconSize = [35, 55];
    baseIcon.options.iconAnchor = [17, 55];
    baseIcon.options.popupAnchor = [1, -44];
  } else {
    baseIcon.options.iconSize = [25, 41];
    baseIcon.options.iconAnchor = [12, 41];
    baseIcon.options.popupAnchor = [1, -34];
  }
  return baseIcon;
}

function selectIconColor(smoke_detected: boolean, battery_level: number) {
  if (smoke_detected) {
    return redIcon;
  } else if (battery_level < 20) {
    return orangeIcon;
  } else {
    return greenIcon;
  }
}

function Map({ nodeData, expandedNodeIds, onClick }: MapProps) {
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
      {nodeData.map((node: NodeData) => (
        <Marker
          key={node.node_id}
          position={[node.latitude, node.longitude]}
          icon={selectIcon(
            node.smoke_detected,
            node.battery_level,
            expandedNodeIds,
            node.node_id,
          )}
          eventHandlers={{
            click: () => onClick(node.node_id),
          }}
        >
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

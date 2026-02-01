import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import type { NodeData } from "../../types/nodeTypes";

interface MapProps {
  nodeData: NodeData[];
  mostRecentExpandedNodeId: string | null;
  onClick: (nodeId: string) => void;
}

// Source: https://github.com/pointhi/leaflet-color-markers /////////////

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const expandedGreenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -44],
  shadowSize: [41, 41],
});

const expandedRedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -44],
  shadowSize: [41, 41],
});

const expandedOrangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -44],
  shadowSize: [41, 41],
});

// End of cited code ////////////////////////////////////////////////////

L.Marker.prototype.options.icon = redIcon;

function selectIcon(
  smoke_detected: boolean,
  battery_level: number,
  nodeId: string,
  mostRecentExpandedNodeId: string | null,
) {
  const iconColor = selectIconColor(smoke_detected, battery_level);

  if (iconColor === "redIcon") {
    return nodeId === mostRecentExpandedNodeId ? expandedRedIcon : redIcon;
  } else if (iconColor === "orangeIcon") {
    return nodeId === mostRecentExpandedNodeId
      ? expandedOrangeIcon
      : orangeIcon;
  } else {
    return nodeId === mostRecentExpandedNodeId ? expandedGreenIcon : greenIcon;
  }
}

function selectIconColor(smoke_detected: boolean, battery_level: number) {
  if (smoke_detected) {
    return "redIcon";
  } else if (battery_level < 20) {
    return "orangeIcon";
  } else {
    return "greenIcon";
  }
}

function Map({ nodeData, mostRecentExpandedNodeId, onClick }: MapProps) {
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
            node.node_id,
            mostRecentExpandedNodeId,
          )}
          eventHandlers={{
            click: () => onClick(node.node_id),
          }}
        ></Marker>
      ))}
    </MapContainer>
  );
}

export default Map;

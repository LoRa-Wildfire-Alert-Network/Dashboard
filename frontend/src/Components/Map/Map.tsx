import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { ShortNodeData } from "../../types/nodeTypes";
import { useEffect, useState } from "react";

interface MapProps {
  nodeData: ShortNodeData[];
  mostRecentExpandedNodeId: string | null;
  onMarkerClick: (nodeId: string) => void;
  setMapBounds: (bounds: L.LatLngBounds) => void;
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

const yellowIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
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

const expandedYellowIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
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
  humidity_pct: number,
  mostRecentExpandedNodeId: string | null,
) {
  const iconColor = selectIconColor(
    smoke_detected,
    battery_level,
    humidity_pct,
  );

  if (iconColor === "redIcon") {
    return nodeId === mostRecentExpandedNodeId ? expandedRedIcon : redIcon;
  } else if (iconColor === "orangeIcon") {
    return nodeId === mostRecentExpandedNodeId
      ? expandedOrangeIcon
      : orangeIcon;
  } else if (iconColor === "yellowIcon") {
    return nodeId === mostRecentExpandedNodeId
      ? expandedYellowIcon
      : yellowIcon;
  } else {
    return nodeId === mostRecentExpandedNodeId ? expandedGreenIcon : greenIcon;
  }
}

function selectIconColor(
  smoke_detected: boolean,
  battery_level: number,
  humidity_pct: number,
) {
  if (smoke_detected) {
    return "redIcon";
  } else if (battery_level < 20) {
    return "orangeIcon";
  } else if (humidity_pct < 15) {
    return "yellowIcon";
  } else {
    return "greenIcon";
  }
}

function Recenter({ lat, long }: { lat: number; long: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 || long !== 0) {
      map.setView([lat, long], map.getZoom());
    }
  }, [lat, long, map]);
  return null;
}

function MapUpdater({
  setMapBounds,
}: {
  setMapBounds: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMap();

  useEffect(() => {
    setMapBounds(map.getBounds());
    map.on("moveend", () => {
      setMapBounds(map.getBounds());
      console.log("Map bounds updated:", map.getBounds());
    });
    map.on("zoomend", () => {
      setMapBounds(map.getBounds());
      console.log("Map bounds updated:", map.getBounds());
    });

    return () => {
      map.off("moveend");
      map.off("zoomend");
    };
  }, [map, setMapBounds]);

  return null;
}

function Map({
  nodeData,
  mostRecentExpandedNodeId,
  onMarkerClick,
  setMapBounds,
}: MapProps) {
  const [location, setLocation] = useState<{ lat: number; long: number }>({
    lat: 44.5646,
    long: -123.262,
  });

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              long: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Error getting user location:", error);
          },
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };
    getUserLocation();
  }, []);

  return (
    <MapContainer
      center={[location.lat, location.long]}
      zoom={12}
      scrollWheelZoom={true}
      className="shadow-lg rounded-md p-4 flex-1"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={location.lat} long={location.long} />
      <MapUpdater setMapBounds={setMapBounds} />
      {nodeData.map((node: ShortNodeData) => (
        <Marker
          key={node.node_id}
          position={[node.latitude, node.longitude]}
          icon={selectIcon(
            node.smoke_detected,
            node.battery_level,
            node.node_id,
            node.humidity_pct,
            mostRecentExpandedNodeId,
          )}
          eventHandlers={{
            click: () => onMarkerClick(node.node_id),
          }}
        ></Marker>
      ))}
    </MapContainer>
  );
}

export default Map;

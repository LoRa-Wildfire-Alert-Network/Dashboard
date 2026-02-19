import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { NodeData } from "../../types/nodeTypes";
import { useEffect, useRef, useState, useMemo } from "react";

export interface MapProps {
  nodeData: NodeData[];
  mostRecentExpandedDeviceEui: string | null;
  expandedNodeIds: string[];
  onMarkerClick: (deviceEui: string) => void;
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
  deviceEui: string,
  humidity_pct: number,
  mostRecentExpandedDeviceEui: string | null,
) {
  const iconColor = selectIconColor(
    smoke_detected,
    battery_level,
    humidity_pct,
  );

  if (iconColor === "redIcon") {
    return deviceEui === mostRecentExpandedDeviceEui ? expandedRedIcon : redIcon;
  } else if (iconColor === "orangeIcon") {
    return deviceEui === mostRecentExpandedDeviceEui
      ? expandedOrangeIcon
      : orangeIcon;
  } else if (iconColor === "yellowIcon") {
    return deviceEui === mostRecentExpandedDeviceEui
      ? expandedYellowIcon
      : yellowIcon;
  } else {
    return deviceEui === mostRecentExpandedDeviceEui ? expandedGreenIcon : greenIcon;
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
    });
    map.on("zoomend", () => {
      setMapBounds(map.getBounds());
    });

    return () => {
      map.off("moveend");
      map.off("zoomend");
    };
  }, [map, setMapBounds]);

  return null;
}



function WildfireMap({ nodeData, mostRecentExpandedDeviceEui, expandedNodeIds, onMarkerClick, setMapBounds }: MapProps) {
  // Default center: selected node if available, else first valid node, else Corvallis
  const validNodes = nodeData.filter(n => n.latitude != null && n.longitude != null);
  const defaultCenter = useMemo(() => {
    const selectedNode = validNodes.find(n => n.device_eui === mostRecentExpandedDeviceEui);
    if (selectedNode && selectedNode.latitude != null && selectedNode.longitude != null) {
      return [selectedNode.latitude, selectedNode.longitude] as [number, number];
    } else if (validNodes.length > 0) {
      return [validNodes[0].latitude, validNodes[0].longitude] as [number, number];
    }
    return [44.5646, -123.262] as [number, number];
  }, [validNodes, mostRecentExpandedDeviceEui]);

  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  function MapRefSetter() {
    const map = useMap();
    useEffect(() => {
      if (!mapRef.current) {
        mapRef.current = map;
        setMapReady(true);
      }
    }, [map]);
    return null;
  }

  const prevExpandedNodeIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (JSON.stringify(prevExpandedNodeIdsRef.current) === JSON.stringify(expandedNodeIds)) return;
    prevExpandedNodeIdsRef.current = [...expandedNodeIds];
    const selectedNodes = validNodes.filter(n => expandedNodeIds.includes(n.device_eui));
    if (selectedNodes.length === 1) {
      const node = selectedNodes[0];
      mapRef.current.setView([node.latitude, node.longitude], 10, { animate: true });
    } else if (selectedNodes.length > 1) {
      const latLngs = selectedNodes.map(n => [n.latitude, n.longitude]) as [number, number][];
      const bounds = L.latLngBounds(latLngs);
      mapRef.current.fitBounds(bounds, { animate: true, padding: [50, 50] });
    }
  }, [expandedNodeIds, validNodes, mapReady]);

  const [initialCenterSet, setInitialCenterSet] = useState(false);
  useEffect(() => {
    if (!mapReady || !mapRef.current || initialCenterSet) return;
    mapRef.current.setView(defaultCenter, 10);
    setInitialCenterSet(true);
  }, [mapReady, defaultCenter, initialCenterSet]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      scrollWheelZoom={true}
      className="shadow-lg rounded-md p-4 flex-1"
    >
      <MapRefSetter />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater setMapBounds={setMapBounds} />
      {validNodes.map((node: NodeData, idx: number) => {
        const markerKey = `${node.device_eui}_${idx}`;
        return (
          <Marker
            key={markerKey}
            position={[node.latitude, node.longitude]}
            icon={selectIcon(
              node.smoke_detected,
              node.battery_level,
              node.device_eui,
              node.humidity_pct,
              mostRecentExpandedDeviceEui,
            )}
            eventHandlers={{
              click: () => onMarkerClick(node.device_eui),
            }}
          ></Marker>
        );
      })}
    </MapContainer>
  );
}

export default WildfireMap;

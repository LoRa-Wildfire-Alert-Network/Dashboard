import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function Map() {
  return (
    <MapContainer
      center={[44.5646, -123.262]}
      zoom={12}
      scrollWheelZoom={true}
      className="w-screen h-fill shadow-lg rounded-md p-4"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[44.48, -123.41]}>
        <Popup>
          Node Position: [44.48, -123.41] <br />
          Health: Good <br />
          Temp: 72°F <br />
          Humidity: 45% <br />
          AQI: 38 (Good)
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default Map;

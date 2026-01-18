import Map from "./Components/Map/Map";
import Navbar from "./Components/Navbar/Navbar";
import NodeCard from "./Components/NodeButton/NodeCard";
import "./App.css";

const testData = [
  {
    id: "a1f9b8c2-3d4e-4f1a-9b7e-0c2d5f6a7b8c",
    latitude: 44.5646,
    longitude: -123.262,
    temperature: 18.3,
    airquality: 42,
    humidity: 62,
  },
  {
    id: "b2e7d9a1-6c3f-4b2a-8e9d-1a3c4f5b6e7d",
    latitude: 44.572,
    longitude: -123.2505,
    temperature: 22.1,
    airquality: 58,
    humidity: 48,
  },
  {
    id: "c3d6e1f4-8b2a-4c6d-9f0e-2b4a6c7d8e9f",
    latitude: 44.5582,
    longitude: -123.2701,
    temperature: 12.7,
    airquality: 35,
    humidity: 55,
  },
  {
    id: "d4e5f2a3-9c1b-4d7e-8a0f-3c5b7d8e9f0a",
    latitude: 44.5669,
    longitude: -123.2793,
    temperature: 9.4,
    airquality: 30,
    humidity: 71,
  },
  {
    id: "e5f3a4b6-0d2c-4e8f-9b1a-4d6c8e9f0a1b",
    latitude: 44.5708,
    longitude: -123.2558,
    temperature: 14.8,
    airquality: 48,
    humidity: 59,
  },
];

function App() {
  return (
    <>
      <Navbar />
      <div className="bg-slate-300 h-[calc(100vh-4rem)]">
        <div className="flex space-x-4 w-full h-full p-4">
          <div className="flex-none lg:w-80 md:w-48 bg-slate-200 rounded-md p-4">
            <h2 className="text-xl font-semibold mb-2">Column 1</h2>
            <p>First Column</p>
          </div>
          <Map nodeData={testData} />
          <div className="flex-none lg:w-100 md:w-60 bg-slate-400 rounded-md p-4">
            {testData.map((nodeData, i) => (
              <NodeCard key={i} nodeData={nodeData} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

import Map from "./Components/Map/Map";
import Navbar from "./Components/Navbar/Navbar";
import NodeCard from "./Components/NodeCard/NodeCard";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <div className="bg-slate-300 h-[calc(100vh-4rem)]">
        <div className="flex space-x-4 w-full h-full p-4">
          <div className="flex-none lg:w-80 md:w-48 bg-slate-200 rounded-md p-4">
          </div>
          <Map nodeData={testData} />
          <div className="flex-none overflow-y-auto lg:w-100 md:w-60 bg-slate-400 rounded-md py-2 px-4">
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

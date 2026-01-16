import Map from "./Components/Map/Map";
import "./App.css";

function App() {
  return (
    <>
      <div className="flex flex-start w-full h-screen flex-col md:flex-row gap-4 p-4">
        <div className="w-full md:w-48 bg-gray-200 rounded-md p-4">
          <h2 className="text-xl font-semibold mb-2">Column 1</h2>
          <p>First Column</p>
        </div>
        <Map />
        <div className="w-5xl md:w-48 bg-gray-400 rounded-md p-4">
          <h2 className="text-xl font-semibold mb-2">Column 3</h2>
          <p>Last Column</p>
        </div>
      </div>
    </>
  );
}

export default App;

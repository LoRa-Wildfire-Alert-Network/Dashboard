import Map from "./Components/Map/Map";
import Navbar from "./Components/Navbar/Navbar";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <div className="bg-slate-300 h-[calc(100vh-4rem)]">
        <div className="flex w-full h-full p-4">
          <div className="flex-none lg:w-80 md:w-48 bg-slate-200 rounded-md p-4">
            <h2 className="text-xl font-semibold mb-2">Column 1</h2>
            <p>First Column</p>
          </div>
          <Map />
          <div className="flex-none lg:w-100 md:w-60 bg-slate-400 rounded-md p-4">
            <h2 className="text-xl font-semibold mb-2">Column 3</h2>
            <p>Last Column</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

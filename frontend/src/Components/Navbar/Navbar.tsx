const Navbar = () => {
  return (
    <div className="flex justify-between items-center w-full h-16 bg-slate-600">
      <p className="text-white text-lg font-semibold p-6">
        LoRa Wildfire Dashboard
      </p>
      <button className="text-white text-lg font-semibold p-6">Login</button>
    </div>
  );
};

export default Navbar;

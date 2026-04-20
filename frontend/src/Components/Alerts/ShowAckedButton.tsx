function ShowAckedButton({
  showAcked,
  setShowAcked,
}: {
  showAcked: boolean;
  setShowAcked: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => setShowAcked(!showAcked)}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold border transition-all duration-200 ${
        showAcked
          ? "bg-slate-600 text-white border-slate-600 shadow-inner"
          : "bg-white text-slate-500 border-slate-300 hover:border-slate-500 hover:text-slate-700"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          showAcked ? "bg-green-400" : "bg-slate-300"
        }`}
      />
      {showAcked ? "Showing Acknowledged" : "Show Acknowledged"}
    </button>
  );
}

export default ShowAckedButton;

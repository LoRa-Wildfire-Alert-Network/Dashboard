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
          ? "bg-amber-600 text-white border-amber-600"
          : "bg-gray-700 text-gray-400 border-gray-600 hover:border-amber-500 hover:text-amber-400"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          showAcked ? "bg-white" : "bg-gray-500"
        }`}
      />
      {showAcked ? "Showing Acknowledged" : "Show Acknowledged"}
    </button>
  );
}

export default ShowAckedButton;

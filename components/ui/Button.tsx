import React from "react";

type Props = {
  zoomIn: () => void;
  zoomOut: () => void;
};

const ZoomControls = ({ zoomIn, zoomOut }: Props) => {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-50 mb-8">
      <button
        onClick={zoomOut}
        className="bg-purple-500 hover:bg-purple-800 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-200"
      >
        Zoom In +
      </button>
      <button
        onClick={zoomIn}
        className="bg-red-500 hover:bg-red-800 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-200"
      >
        Zoom Out -
      </button>

    </div>
  );
};

export default ZoomControls;
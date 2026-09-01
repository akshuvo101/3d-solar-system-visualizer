import { ZoomIn, ZoomOut } from "lucide-react";

type Props = {
zoomIn: () => void;
zoomOut: () => void;
};

const ZoomControls = ({ zoomIn, zoomOut }: Props) => {
return (
<>
{/* Desktop Zoom Controls */} <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden md:flex gap-3 z-50 mb-8"> <button
       onClick={zoomIn}
       className="bg-purple-500 hover:bg-purple-800 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-200"
     >
Zoom Out - </button>

    <button
      onClick={zoomOut}
      className="bg-red-500 hover:bg-red-800 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-200"
    >
      Zoom In +
    </button>
  </div>

  {/* Mobile Zoom Controls */}
  <div className="fixed top-16 right-4 z-50 flex md:hidden flex-col gap-2">
    <button
      onClick={zoomOut}
      aria-label="Zoom Out"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-purple-500/30"
    >
      <ZoomIn size={20} />
    </button>

    <button
      onClick={zoomIn}
      aria-label="Zoom In"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-purple-500/30"
    >
      <ZoomOut size={20} />
    </button>
  </div>
</>


);
};

export default ZoomControls;

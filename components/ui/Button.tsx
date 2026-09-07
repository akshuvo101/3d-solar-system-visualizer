import { ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  zoomIn: () => void;
  zoomOut: () => void;
};

const ZoomControls = ({ zoomIn, zoomOut }: Props) => {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
      {/* Zoom Out */}
      <button
        onClick={zoomIn}
        aria-label="Zoom In"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/50 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white"
      >
        <ZoomOut size={20} strokeWidth={1.8} />
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomOut}
        aria-label="Zoom Out"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/50 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white"
      >
        <ZoomIn size={20} strokeWidth={1.8} />
      </button>
    </div>
  );
};

export default ZoomControls;
import { useState } from 'react';
import { GridIcon } from '../icons';

const EditorFooter = ({ showGrid, setShowGrid, gridSize, setGridSize, zoom, setZoom }) => {
  const [isGridOpen, setIsGridOpen] = useState(false);

  return (
    <footer className="bg-white p-2 flex items-center justify-center gap-8 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 z-10 relative">
      
      {/* Grid Control */}
      <div className="relative">
        {isGridOpen && (
            <>
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsGridOpen(false)} 
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-4 w-64 z-50 border border-gray-100 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-[8px] before:border-transparent before:border-t-white">
                    
                    {/* Toggle Row */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-700 font-medium">הצג גריד</span>
                        
                        {/* Custom Toggle Switch */}
                        <button 
                            onClick={() => setShowGrid(!showGrid)}
                            className={`w-12 h-7 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${showGrid ? 'bg-red-500' : 'bg-gray-200'}`}
                        >
                            <span 
                                className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${showGrid ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    {/* Slider Row */}
                    <div className="flex items-center gap-3">
                         <span className="text-gray-700 font-mono w-6 text-center">{gridSize}</span>
                         <input 
                            type="range" 
                            min="2" 
                            max="20" 
                            step="1"
                            value={gridSize}
                            onChange={(e) => setGridSize(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600 hover:accent-red-500"
                        />
                        <GridIcon className="w-5 h-5 text-gray-500" />
                    </div>
                </div>
            </>
        )}
        
        <button 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isGridOpen ? 'bg-gray-100 text-red-500' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setIsGridOpen(!isGridOpen)}
        >
            <GridIcon className="w-5 h-5" />
            <span className="font-medium">גריד</span>
            {showGrid && <div className="w-2 h-2 bg-red-500 rounded-full ml-1"></div>}
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200"></div>

      {/* Zoom Control */}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs">ZOOM</span>
        <input 
            type="range" 
            min="10" 
            max="200" 
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            aria-label="מחוון זום"
        />
        <span className="text-sm text-gray-700 font-mono w-12 text-center">{zoom}%</span>
      </div>

    </footer>
  );
};

export default EditorFooter;
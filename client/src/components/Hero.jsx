import { useEffect, useRef, useState } from 'react';
import { optimizeImageUrl, screenWidthImageSize } from '../utils/imageUrl';

const Hero = ({
  onStartEditor,
  onFilesSelected,
  backgroundImage,
  title,
  subtitle,
  btnText,
  isUploading = false,
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const canDrop = Boolean(onFilesSelected) && !isUploading;

  // A file dropped just outside the drop area would make the browser open it and leave the page
  useEffect(() => {
    if (!onFilesSelected) return undefined;
    const keepPage = (event) => {
      if (Array.from(event.dataTransfer?.types || []).includes('Files')) event.preventDefault();
    };
    window.addEventListener('dragover', keepPage);
    window.addEventListener('drop', keepPage);
    return () => {
      window.removeEventListener('dragover', keepPage);
      window.removeEventListener('drop', keepPage);
    };
  }, [onFilesSelected]);
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (onFilesSelected) {
        await onFilesSelected(files);
      } else {
        onStartEditor();
      }
    }
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    if (!canDrop || !Array.from(event.dataTransfer?.types || []).includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    // Leaving into a child element of the drop area still counts as inside
    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragOver(false);
  };

  /** Dropped files go through the same upload as the file picker; anything that isn't an image is ignored */
  const handleDrop = async (event) => {
    if (!canDrop) return;
    event.preventDefault();
    setIsDragOver(false);
    const images = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
    if (images.length > 0) await onFilesSelected(images);
  };

  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-8 md:py-15"
      style={{ backgroundImage: `url("${optimizeImageUrl(backgroundImage, { width: screenWidthImageSize() })}")` }}
    >
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative container mx-auto px-6 text-center z-10">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed backdrop-blur-md p-10 md:p-20 max-w-4xl mx-auto rounded-[30px] shadow-lg flex flex-col items-center justify-center min-h-[300px] transition-colors ${
            isDragOver ? 'border-[#f2665e] bg-[#fff5f4]/95' : 'border-[#f2665e]/60 bg-white/80'
          }`}
        >

          <h1 className="text-3xl md:text-4xl font-bold text-[#f2665e] mb-2 drop-shadow-sm">
            {title}
          </h1>

          {subtitle && <p className="text-gray-600 mb-6 font-medium">{subtitle}</p>}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleButtonClick}
              disabled={isUploading}
              className="bg-[#f2665e] text-white font-bold py-3 px-10 rounded-full hover:bg-[#d95248] transition-all transform hover:scale-105 shadow-md text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isUploading ? 'מעלה תמונות...' : btnText}
            </button>
          </div>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
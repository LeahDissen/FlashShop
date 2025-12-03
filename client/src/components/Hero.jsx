import React, { useRef } from 'react';

const Hero = ({
  onStartEditor,
  onFilesSelected,
  backgroundImage,
  title,
  subtitle,
  btnText
}) => {
  const fileInputRef = useRef(null);
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      if (onFilesSelected) {
        onFilesSelected(event.target.files);
      } else {
        onStartEditor();
      }
    }
  };

  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-8 md:py-15"
      style={{ backgroundImage: `url("${backgroundImage}")` }}
    >
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative container mx-auto px-6 text-center z-10">
        <div className="border-2 border-dashed border-[#f2665e]/60 bg-white/80 backdrop-blur-md p-10 md:p-20 max-w-4xl mx-auto rounded-[30px] shadow-lg flex flex-col items-center justify-center min-h-[300px]">

          <h1 className="text-3xl md:text-4xl font-bold text-[#f2665e] mb-2 drop-shadow-sm">
            {title}
          </h1>

          {subtitle && <p className="text-gray-600 mb-6 font-medium">{subtitle}</p>}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleButtonClick}
              className="bg-[#f2665e] text-white font-bold py-3 px-10 rounded-full hover:bg-[#d95248] transition-all transform hover:scale-105 shadow-md text-lg"
            >
              {btnText}
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
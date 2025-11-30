import React, { useRef } from 'react';

const Hero = ({ 
    onStartEditor, 
    onFilesSelected,
    backgroundImage = "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=1920",
    title = "גרור את התמונות שלך לכאן",
    subtitle = "צור מתנות מרגשות עם התמונות שאתה אוהב",
    primaryButtonText = "בחר קבצים",
    secondaryButtonText = "פתח עורך"
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
                console.log('Files selected:', event.target.files);
                // In a full implementation, we would pass these files to the editor
                onStartEditor();
            }
        }
    };

  return (
    <section 
      className="relative bg-cover bg-center py-32 md:py-48" 
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="absolute inset-0 bg-white bg-opacity-40"></div>
      <div className="relative container mx-auto px-6 text-center">
        <div className="border-2 border-dashed border-red-400 bg-white/80 backdrop-blur-sm p-8 md:p-16 max-w-3xl mx-auto rounded-xl shadow-xl">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-8 text-lg font-medium">{subtitle}</p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button 
                onClick={handleButtonClick}
                className="bg-red-500 text-white font-bold py-3 px-10 rounded-full hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg text-xl"
            >
                {primaryButtonText}
            </button>
             {secondaryButtonText && (
                <button 
                    onClick={onStartEditor}
                    className="bg-white text-red-500 font-bold py-3 px-10 rounded-full border-2 border-red-500 hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg text-xl"
                >
                    {secondaryButtonText}
                </button>
             )}
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
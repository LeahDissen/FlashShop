import React, { useState } from 'react';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';


const PhotoDevelopmentPage = ({ onNavigate, onNavigateToEditor }) => {
    const [images, setImages] = useState([]);

    const handleFilesSelected = (files) => {
        const newImages = Array.from(files).map((file) => ({
            id: Date.now() + Math.random(),
            src: URL.createObjectURL(file),
            alt: file.name,
            quantity: 1
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const handleQuantityChange = (id, delta) => {
        setImages(prev => prev.map(img => 
            img.id === id ? { ...img, quantity: Math.max(0, img.quantity + delta) } : img
        ));
    };

    const handleRemove = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    return (
        <div className="min-h-screen bg-white">
            <Hero 
                onStartEditor={onNavigateToEditor}
                onFilesSelected={handleFilesSelected}
                backgroundImage="https://images.unsplash.com/photo-1519331379826-fda8feb021d5?auto=format&fit=crop&q=80&w=1920"
                title="העלה את התמונות שלך"
                subtitle="הדפסת תמונות איכותית שתשמור על הרגעים היפים שלך"
                primaryButtonText="העלה תמונות"
                secondaryButtonText={null}
            />
            <Gallery 
                images={images}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
            />
        </div>
    );
};

export default PhotoDevelopmentPage;
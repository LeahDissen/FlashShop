import { useState } from 'react';
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
                backgroundImage="https://res.cloudinary.com/dwqywo11u/image/upload/v1764668010/a3b33323-3745-44b6-a4c0-a6749513d957.png"
                title="גרירת תמונות לכאן"
                subtitle="צור מתנות מרגשות עם התמונות שאתה אוהב" 
                primaryButtonText="בחירת קבצים"
                secondaryButtonText=""
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
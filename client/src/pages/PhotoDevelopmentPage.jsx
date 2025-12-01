import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import { useCartStore } from '../store/cartStore';

const PhotoDevelopmentPage = ({ onNavigate, onNavigateToEditor }) => {
    const [images, setImages] = useState([]);
    const addToCart = useCartStore((state) => state.addToCart);
    const navigate = useNavigate();

    // Helper to determine price based on size
    const getPriceBySize = (size) => {
        switch (size) {
            case '13x18': return 1.50;
            case '20x30': return 2.50;
            case '10x15': 
            default: return 1.20;
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        // Replace with your actual upload preset
        formData.append("upload_preset", "b971ec9f-f309-48bc-a579-055b6ca37274"); 

        try {
            const response = await fetch(
                "https://api.cloudinary.com/v1_1/dwqywo11u/image/upload",
                { method: "POST", body: formData }
            );
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    };

    const handleFilesSelected = async (files) => {
        const newImagesPromises = Array.from(files).map(async (file) => {
            const secureUrl = await uploadImage(file);
            if (secureUrl) {
                return {
                    id: Date.now() + Math.random(),
                    src: secureUrl,
                    alt: file.name,
                    quantity: 1,
                    size: '10x15' // Default size
                };
            }
            return null;
        });

        const newImages = (await Promise.all(newImagesPromises)).filter(img => img !== null);
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

    // New handler for size changes
    const handleSizeChange = (id, newSize) => {
        setImages(prev => prev.map(img => 
            img.id === id ? { ...img, size: newSize } : img
        ));
    };

   const handleSendOrder = () => {
        const cartItems = images.map(img => ({
            id: img.id,
            // Save the size here so it travels with the item
            size: img.size || '10x15', 
            name: `פיתוח תמונה (${img.alt})`, 
            price: getPriceBySize(img.size),
            quantity: img.quantity,
            image: img.src // This is your Cloudinary URL
        }));

        addToCart(cartItems);
        navigate('/cart');
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
                onSizeChange={handleSizeChange}
                onSendOrder={handleSendOrder}
            />
        </div>
    );
};

export default PhotoDevelopmentPage;
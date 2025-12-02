import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import { useCartStore } from '../store/cartStore';
import axios from 'axios';

const PhotoDevelopmentPage = ({ onNavigate, onNavigateToEditor }) => {
    const [images, setImages] = useState([]);
    const [priceList, setPriceList] = useState([]); // Store prices from DB
    const addToCart = useCartStore((state) => state.addToCart);
    const navigate = useNavigate();

    // 1. Fetch prices from the Server on load
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Ensure this URL matches your server port (5000 or 4000)
                const { data } = await axios.get('http://localhost:5000/photo-prices');

                setPriceList(data);
            } catch (err) {
                console.error("Failed to load prices from DB:", err);
                // Fallback to empty list (component will use default logic)
                setPriceList([]);
            }
        };
        fetchPrices();
    }, []);

    // 2. Helper to get price based on size
    const getPriceBySize = (size) => {
        if (priceList.length > 0) {
            const found = priceList.find(p => p.size === size);
            return found ? found.price : 1.20; // DB Price or Fallback
        }
        // Hardcoded fallback if DB fails
        switch (size) {
            case '13x18': return 1.50;
            case '20x30': return 2.50;
            case '10x15': default: return 1.20;
        }
    };

    // 3. Upload Logic
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append("file", file);


        formData.append("upload_preset", "ml_default");

        try {
            const response = await fetch(
                "https://api.cloudinary.com/v1_1/dwqywo11u/image/upload",
                { method: "POST", body: formData }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Cloudinary Error:", errorData);
                return null;
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    };

    const handleFilesSelected = async (files) => {
        // Determine default size from DB or hardcode
        const defaultSize = priceList.length > 0 ? priceList[0].size : '10x15';

        const newImagesPromises = Array.from(files).map(async (file) => {
            const secureUrl = await uploadImage(file);
            if (secureUrl) {
                return {
                    id: Date.now() + Math.random(),
                    src: secureUrl,
                    alt: file.name,
                    quantity: 1,
                    size: defaultSize
                };
            }
            return null;
        });

        const newImages = (await Promise.all(newImagesPromises)).filter(img => img !== null);
        setImages(prev => [...prev, ...newImages]);
    };

    // 4. State Management Handlers
    const handleQuantityChange = (id, delta) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, quantity: Math.max(0, img.quantity + delta) } : img
        ));
    };

    const handleRemove = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleSizeChange = (id, newSize) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, size: newSize } : img
        ));
    };

    // 5. Checkout Logic
    const handleSendOrder = () => {
        const defaultSize = priceList.length > 0 ? priceList[0].size : '10x15';

        const cartItems = images.map(img => {
            const size = img.size || defaultSize;
            return {
                id: img.id,
                size: size,
                // Include size in name for clarity in simple cart views
                name: `פיתוח תמונה ${size} (${img.alt})`,
                price: getPriceBySize(size),
                quantity: img.quantity,
                image: img.src
            };
        });

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
                availableSizes={priceList} // Pass DB sizes to Gallery -> ImageCard
            />
        </div>
    );
};

export default PhotoDevelopmentPage;
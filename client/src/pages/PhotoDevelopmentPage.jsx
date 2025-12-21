import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getPhotoPrices } from '../api/photo';
import AdminControls from '../components/AdminControls';
import Gallery from '../components/Gallery';
import Hero from '../components/Hero';
import { useAdminControl } from '../hooks/useAdminControl';
import { useCartStore } from '../store/cartStore';

const PhotoDevelopmentPage = ({ onNavigateToEditor }) => {
    const [images, setImages] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const addToCart = useCartStore((state) => state.addToCart);
    const navigate = useNavigate();

    const adminControls = useAdminControl({
        img: "",
        title: "",
        subtitle: "",
        btnText: "",
    }, "photos");
    const { draft, updateDraft, editMode } = adminControls;

    useEffect(() => {
        getPage("photos").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        }).catch(error => console.error("Error fetching main photos page data:", error));
        const fetchPrices = async () => {
            try {
                const data = await getPhotoPrices();
                setPriceList(data);
            } catch (err) {
                console.error("Failed to load prices from DB:", err);
                setPriceList([]);
            }
        };
        fetchPrices();
    }, []);

    const getPriceBySize = (size) => {
        if (priceList.length > 0) {
            const found = priceList.find(p => p.size === size);
            return found ? found.price : 1.20;
        }
        switch (size) {
            case '13x18': return 1.50;
            case '20x30': return 2.50;
            case '10x15': default: return 1.20;
        }
    };

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

    const handleSendOrder = () => {
        const defaultSize = priceList.length > 0 ? priceList[0].size : '10x15';

        const cartItems = images.map(img => {
            const size = img.size || defaultSize;
            return {
                id: img.id,
                size: size,
                name: `פיתוח תמונה ${size} (${img.alt})`,
                price: getPriceBySize(size),
                quantity: img.quantity,
                image: img.src
            };
        });

        addToCart(cartItems);
        navigate('/cart');
    };

    const EditContent = (
        <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
            <h3 className="font-bold text-lg border-b pb-2">עריכת עמוד פיתוח תמונות</h3>

            <div>
                <label className="block text-sm font-bold text-gray-700">תמונת רקע עליונה (URL):</label>
                <input
                    type="text"
                    value={draft.img}
                    onChange={(e) => updateDraft({ img: e.target.value })}
                    className="w-full border p-2 rounded ltr"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת ראשית:</label>
                <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    className="w-full border p-2 rounded"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת משנית:</label>
                <textarea
                    value={draft.subtitle}
                    onChange={(e) => updateDraft({ subtitle: e.target.value })}
                    className="w-full border p-2 rounded h-20"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">טקסט כפתור ראשי:</label>
                    <input
                        type="text"
                        value={draft.btnText}
                        onChange={(e) => updateDraft({ btnText: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>
            </div>
        </div>
    );

    const ViewContent = (
        <div className="min-h-screen bg-white">
            <Hero
                onStartEditor={onNavigateToEditor}
                onFilesSelected={handleFilesSelected}
                backgroundImage={draft.img}
                title={draft.title}
                subtitle={draft.subtitle}
                btnText={draft.btnText}
            />
            <Gallery
                images={images}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
                onSizeChange={handleSizeChange}
                onSendOrder={handleSendOrder}
                availableSizes={priceList}
            />
        </div>
    );

    return (
        <AdminControls
            editMode={editMode}
            previewContent={EditContent}
            adminControls={adminControls}
        >
            {ViewContent}
        </AdminControls>
    );
};

export default PhotoDevelopmentPage;
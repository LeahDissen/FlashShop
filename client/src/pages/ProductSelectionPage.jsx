import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPage } from '../api/pages';
import { getProductById } from '../api/products';
import PrintOptionsEditor from '../components/PrintOptionsEditor';
import DesignerRequestForm from '../components/productSelection/DesignerRequestForm';
import DesignOptions from '../components/productSelection/DesignOptions';
import MagnetOptions from '../components/productSelection/MagnetOptions';
import ProductHeroBanner from '../components/productSelection/ProductHeroBanner';
import ProductPriceBox from '../components/productSelection/ProductPriceBox';
import UploadedDesignPreview from '../components/productSelection/UploadedDesignPreview';
import { DESIGNER_SERVICE_FEE, EMPTY_DESIGNER_REQUEST, buildProductCartItem } from '../components/productSelection/productCartItem';
import { checkPrintFit, loadImageSize } from '../components/productSelection/printFit';
import { useProductQuantity } from '../components/productSelection/useProductQuantity';
import { getPrintOption } from '../constants/printOptions';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { parseMagnetSize, withMagnetPrintDimensions } from '../utils/magnetSize';
import { getReturnPathAfterAdd } from '../utils/photoOrderDraft';
import { isMagnetProduct, isSimpleProduct } from '../utils/productDisplay';
import { getProductOrderPricing, hasTieredPricing } from '../utils/productQuantityPricing';

/**
 * A product's page: its price and quantity, and how to order it – straight to the cart (a simple
 * product), a magnet from a photo, or a designed product (editor, the shop's designer, a ready design).
 */
const ProductSelectionPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCartStore();
    const setSelectedProduct = useProductStore((state) => state.setSelectedProduct);
    const setOrderQuantity = useProductStore((state) => state.setOrderQuantity);
    const isAdmin = useAuthStore((state) => state.isAdmin());

    const [product, setProduct] = useState(location.state?.product ?? null);
    const [loadingProduct, setLoadingProduct] = useState(!location.state?.product);
    // Content of the "products" CMS page: the banner image and the option button texts
    const [productsPageContent, setProductsPageContent] = useState({});
    const [uploadedImage, setUploadedImage] = useState(null);
    /** Whether the uploaded ready design matches the print area (null until its size is known) */
    const [uploadFit, setUploadFit] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showDesignerForm, setShowDesignerForm] = useState(false);
    const [designerRequest, setDesignerRequest] = useState(EMPTY_DESIGNER_REQUEST);
    const fileInputRef = useRef(null);
    const designerFormRef = useRef(null);

    const quantity = useProductQuantity({ productId, stock: product?.stock });

    useEffect(() => {
        if (product) {
            setSelectedProduct(product);
            return;
        }
        if (!productId) return;
        setLoadingProduct(true);
        getProductById(productId)
            .then((data) => {
                setProduct(data);
                setSelectedProduct(data);
            })
            .catch(() => navigate('/products'))
            .finally(() => setLoadingProduct(false));
    }, [product, productId, setSelectedProduct, navigate]);

    useEffect(() => {
        getPage('products').then(setProductsPageContent);
    }, []);

    useEffect(() => {
        if (!showDesignerForm) return undefined;
        const timer = window.setTimeout(() => {
            designerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
        return () => window.clearTimeout(timer);
    }, [showDesignerForm]);

    const pricing = useMemo(() => {
        if (!product || isMagnetProduct(product)) return null;
        return getProductOrderPricing(product, quantity.currentQuantity);
    }, [product, quantity.currentQuantity]);

    if (loadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]" dir="rtl">
                <p className="text-gray-500">טוען מוצר...</p>
            </div>
        );
    }
    if (!product) return null;

    const simpleProduct = isSimpleProduct(product);
    const magnetProduct = isMagnetProduct(product);
    const showTieredPricing = hasTieredPricing(product) && !magnetProduct;
    const options = {
        selfDesign: getPrintOption(productsPageContent, 'optionSelfDesign'),
        designer: getPrintOption(productsPageContent, 'optionDesigner'),
        upload: getPrintOption(productsPageContent, 'optionUpload'),
        captions: getPrintOption(productsPageContent, 'optionCaptions'),
        perCopy: getPrintOption(productsPageContent, 'optionPerCopy'),
    };
    const unitPrice = () => (pricing?.unitPrice ?? Number(product.price)) || 0;
    const cartItem = (overrides, extra = {}) => buildProductCartItem({
        product,
        quantity: quantity.getQuantity(),
        unitPrice: unitPrice(),
        isMagnet: magnetProduct,
        overrides,
        ...extra,
    });

    // After adding to the cart, back to the products page so the customer can keep shopping
    const addToCartAndNavigate = async (items, { successMessage } = {}) => {
        try {
            await addToCart(items, { successMessage });
            navigate(getReturnPathAfterAdd(product, '/products'));
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('לא ניתן להוסיף לסל כרגע. נסו שוב.');
        }
    };

    /**
     * perCopy: a separate design for each copy (quantity > 1) instead of one design for all;
     * photo: a photo uploaded here to place on the canvas (default: the uploaded ready design)
     */
    const openEditor = (perCopy = false, photo = uploadedImage) => {
        const orderQuantity = quantity.applyQuantity(quantity.getQuantity());
        const productForEditor = withMagnetPrintDimensions(product);
        setSelectedProduct(productForEditor);
        setOrderQuantity(orderQuantity);
        // A photo already uploaded here comes along, so it is not uploaded again in the editor
        navigate(`/editor/${productId}`, {
            state: { product: productForEditor, quantity: orderQuantity, initialImage: photo || undefined, perCopy: perCopy && orderQuantity > 1 },
        });
    };

    const addMagnetToCart = async (image) => {
        if (!image) {
            alert('יש להעלות תמונה למגנט');
            return;
        }
        const parsedSize = parseMagnetSize(product.size);
        await addToCartAndNavigate([cartItem({
            id: `${product._id}-magnet-${Date.now()}`,
            price: Number(product.price) || 0,
            image,
            size: product.size || undefined,
            customization: {
                type: 'magnet',
                printSize: product.size || undefined,
                width: parsedSize?.width ?? product.printWidth,
                height: parsedSize?.height ?? product.printHeight,
            },
        })]);
    };

    // A ready design printed as is
    const uploadReadyDesign = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const imageUrl = await uploadImageToCloudinary(file);
            const size = await loadImageSize(imageUrl);
            setUploadFit(checkPrintFit(size?.width, size?.height, product));
            setUploadedImage(imageUrl);
            setShowDesignerForm(false);
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert(error?.message || 'הייתה שגיאה בהעלאת התמונה.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeReadyDesign = () => {
        setUploadedImage(null);
        setUploadFit(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submitDesignerRequest = (request) => addToCartAndNavigate([
        cartItem({
            id: `${product._id}-designer-${Date.now()}`,
            price: unitPrice() + DESIGNER_SERVICE_FEE,
            customization: {
                type: 'designer-service',
                ...request,
                // The first photo also as referenceImage, for orders/screens that read a single image
                referenceImage: request.referenceImages[0] || null,
            },
        }, { priceAddon: DESIGNER_SERVICE_FEE }),
    ], { successMessage: 'הבקשה לעיצוב נקלטה והמוצר נוסף לסל בהצלחה!' });

    const isDesignProduct = !simpleProduct && !magnetProduct;

    return (
        <div className="min-h-screen bg-[#faf8f6] pb-20" dir="rtl">
            <ProductHeroBanner title={product.name} imageUrl={productsPageContent.img} />

            <div className="relative py-6 sm:py-8 px-4">
                <div className="max-w-4xl mx-auto relative">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="absolute -top-8 right-0 flex items-center gap-2 text-gray-500 hover:text-[#f2665e] transition-colors font-medium text-sm sm:text-base cursor-pointer"
                    >
                        <ArrowLeft size={18} className="rotate-180" /> חזרה למוצרים
                    </button>

                    <div className="space-y-6 mt-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-[#f2665e]/15 p-6 sm:p-8">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                                <div className="shrink-0 flex justify-center md:justify-start self-start">
                                    <div className="p-1 rounded-lg bg-[#fff5f4] border border-[#f2665e]/20 w-fit">
                                        <img src={product.image} alt={product.name} className="w-28 h-28 object-cover rounded-md bg-white" />
                                    </div>
                                </div>

                                <div className="flex-1 text-right w-full flex flex-col gap-6">
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-[#f2665e]">{product.name}</h2>
                                        {product.description && (
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                                        )}
                                        <ProductPriceBox
                                            product={product}
                                            quantity={quantity}
                                            pricing={pricing}
                                            showTieredPricing={showTieredPricing}
                                            isMagnet={magnetProduct}
                                            isSimple={simpleProduct}
                                        />
                                    </div>

                                    {simpleProduct && (
                                        <button
                                            onClick={() => addToCartAndNavigate([cartItem({ id: `${product._id}-simple-${Date.now()}` })])}
                                            className="self-start px-6 py-2.5 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-xl text-sm font-semibold border-2 border-[#f2665e] transition-colors cursor-pointer shadow-sm"
                                        >
                                            הוסף לסל
                                        </button>
                                    )}

                                    {magnetProduct && (
                                        <MagnetOptions
                                            selfDesignLabel={options.selfDesign.label}
                                            uploadLabel={options.upload.label}
                                            printProduct={withMagnetPrintDimensions(product)}
                                            onDesign={(photo) => openEditor(false, photo)}
                                            onAddToCart={addMagnetToCart}
                                        />
                                    )}

                                    {isDesignProduct && (
                                        <>
                                            <DesignOptions
                                                options={options}
                                                quantity={quantity.currentQuantity}
                                                designerFormOpen={showDesignerForm}
                                                isUploading={isUploading}
                                                onDesign={openEditor}
                                                onToggleDesigner={() => {
                                                    setShowDesignerForm(!showDesignerForm);
                                                    setUploadedImage(null);
                                                }}
                                                onUpload={() => fileInputRef.current.click()}
                                                onCaptionIdeas={() => navigate(`/product-selection/${productId}/caption-ideas`)}
                                            />
                                            {isAdmin && (
                                                <PrintOptionsEditor content={productsPageContent} onSaved={setProductsPageContent} />
                                            )}
                                            <input type="file" ref={fileInputRef} onChange={uploadReadyDesign} className="hidden" accept="image/*" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {uploadedImage && isDesignProduct && (
                            <UploadedDesignPreview
                                imageUrl={uploadedImage}
                                fit={uploadFit}
                                onRemove={removeReadyDesign}
                                onDesign={() => openEditor(false)}
                                onReplace={() => fileInputRef.current?.click()}
                                onAddToCart={() => addToCartAndNavigate([cartItem({
                                    id: `${product._id}-upload-${Date.now()}`,
                                    image: uploadedImage,
                                    customization: { type: 'upload-only', originalImage: product.image },
                                })])}
                            />
                        )}

                        {showDesignerForm && isDesignProduct && (
                            <DesignerRequestForm
                                ref={designerFormRef}
                                request={designerRequest}
                                setRequest={setDesignerRequest}
                                onSubmit={submitDesignerRequest}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/** A new product address starts the page fresh: its product, quantity, uploaded photo and designer form */
export default function ProductSelectionRoute() {
    const { productId } = useParams();
    return <ProductSelectionPage key={productId} />;
}

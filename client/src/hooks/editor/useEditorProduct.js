import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getProductById } from '../../api/products';
import { withMagnetPrintDimensions } from '../../utils/magnetSize';
import { useProductStore } from '../../store/productStore';

/**
 * The product being designed: the one passed from the product page, or fetched by the id in the URL
 * (a refresh or a shared link).
 */
export function useEditorProduct() {
    const { productId } = useParams();
    const location = useLocation();
    const { selectedProduct, setSelectedProduct, orderQuantity } = useProductStore();

    useEffect(() => {
        const productFromNav = location.state?.product;
        if (productFromNav) {
            setSelectedProduct(withMagnetPrintDimensions(productFromNav));
            return undefined;
        }
        if (!productId) return undefined;

        let cancelled = false;
        getProductById(productId)
            .then((product) => {
                if (!cancelled && product) setSelectedProduct(withMagnetPrintDimensions(product));
            })
            .catch((err) => console.error('Failed to load product for editor', err));
        return () => { cancelled = true; };
    }, [productId, location.state, setSelectedProduct]);

    return { productId, selectedProduct, selectProduct: setSelectedProduct, orderQuantity };
}

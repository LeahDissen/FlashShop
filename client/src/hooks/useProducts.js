import { useEffect, useState } from 'react';
import { getProducts } from '../api/products';

let productsRequest = null;

/** רשימת המוצרים, נטענת פעם אחת לכל ביקור ומשותפת לכל מי שצריך אותה */
const loadProductsOnce = () => {
    if (!productsRequest) {
        productsRequest = getProducts()
            .then((data) => (Array.isArray(data) ? data : []))
            .catch((error) => {
                productsRequest = null; // ניסיון חוזר בפעם הבאה
                throw error;
            });
    }
    return productsRequest;
};

export function useProducts() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        let cancelled = false;
        loadProductsOnce()
            .then((list) => { if (!cancelled) setProducts(list); })
            .catch((error) => console.error('Failed to load products for search', error));
        return () => { cancelled = true; };
    }, []);

    return products;
}

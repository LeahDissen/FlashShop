import { useEffect, useState } from 'react';
import { getProducts } from '../api/products';

let productsRequest = null;

/** The product list, loaded once per visit and shared with everyone who needs it */
const loadProductsOnce = () => {
    if (!productsRequest) {
        productsRequest = getProducts()
            .then((data) => (Array.isArray(data) ? data : []))
            .catch((error) => {
                productsRequest = null; // Retry next time
                throw error;
            });
    }
    return productsRequest;
};

/** @returns {{ products: object[], loading: boolean, error: Error | null }} */
export function useProducts() {
    const [state, setState] = useState({ products: [], loading: true, error: null });

    useEffect(() => {
        let cancelled = false;
        loadProductsOnce()
            .then((products) => { if (!cancelled) setState({ products, loading: false, error: null }); })
            .catch((error) => {
                console.error('Failed to load products', error);
                if (!cancelled) setState({ products: [], loading: false, error });
            });
        return () => { cancelled = true; };
    }, []);

    return state;
}

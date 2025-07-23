'use client';

import React, { createContext, useState, useEffect } from 'react';
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from '@/app/api/globalFetcher';
import useSWR from 'swr';

export const ProductContext = createContext({});

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState('All');
    const [selectedGender, setSelectedGender] = useState('All');
    const [selectedColor, setSelectedColor] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [cartItems, setCartItems] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedCartItems = localStorage.getItem('cartItems');
            return storedCartItems ? JSON.parse(storedCartItems) : [];
        } else {
            return [];
        }
    });

    const { data: productsData, isLoading: isProductsLoading, error: productsError, mutate } = useSWR(
        '/api/eCommerce',
        getFetcher
    );

    useEffect(() => {
        if (productsData) {
            setProducts(productsData.data);
            setLoading(isProductsLoading);
        } else if (productsError) {
            setError(productsError);
            setLoading(isProductsLoading);
        } else {
            setLoading(isProductsLoading);
        }
    }, [productsData, productsError, isProductsLoading]);

    const { data: cartsData, isLoading: isCartsLoading, error: cartsError, mutate: cartMutate } =
        useSWR('/api/eCommerce/carts', getFetcher);

    useEffect(() => {
        if (cartsData) {
            setCartItems(cartsData.data);
            setLoading(isCartsLoading);
        } else if (cartsError) {
            setError(cartsError);
            setLoading(isCartsLoading);
        } else {
            setLoading(isCartsLoading);
        }
    }, [cartsData, cartsError, isCartsLoading]);

    useEffect(() => {
        if (cartItems) {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
    }, [cartItems]);

    useEffect(() => {
        const storedCartItems = localStorage.getItem('cartItems');
        if (storedCartItems) {
            setCartItems(JSON.parse(storedCartItems));
        }
    }, []);

    const filterProducts = (product) => {
        const matchesSearch = product.title.toLowerCase().includes(searchProduct.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category.includes(selectedCategory);
        const withinPriceRange =
            priceRange === 'All' ||
            (priceRange === '0-50' && product.price <= 50) ||
            (priceRange === '50-100' && product.price > 50 && product.price <= 100) ||
            (priceRange === '100-200' && product.price > 100 && product.price <= 200) ||
            (priceRange === '200-99999' && product.price > 200);
        const matchesGender = selectedGender === 'All' || product.gender === selectedGender;
        const matchesColor = selectedColor === 'All' || product.colors.includes(selectedColor);

        return matchesSearch && matchesCategory && withinPriceRange && matchesGender && matchesColor;
    };

    const sortProducts = (filteredProducts) => {
        switch (sortBy) {
            case 'newest':
                return filteredProducts.sort((a, b) => new Date(b.created) - new Date(a.created));
            case 'priceDesc':
                return filteredProducts.sort((a, b) => b.price - a.price);
            case 'priceAsc':
                return filteredProducts.sort((a, b) => a.price - b.price);
            case 'discount':
                return filteredProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
            default:
                return filteredProducts;
        }
    };

    const getProductById = (productId) => {
        return products.find((p) => p.id === Number(productId));
    };

    const filteredProducts = products.filter(filterProducts);
    const filteredAndSortedProducts = sortProducts(filteredProducts);

    const selectCategory = (category) => setSelectedCategory(category);
    const updateSortBy = (sortOption) => setSortBy(sortOption);
    const updatePriceRange = (range) => setPriceRange(range);
    const selectGender = (gender) => setSelectedGender(gender);
    const selectColor = (color) => setSelectedColor(color);
    const searchProducts = (text) => setSearchProduct(text);

    const addToCart = async (productId) => {
        try {
            await cartMutate(postFetcher('/api/eCommerce/carts', { productId }));
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error adding product to cart:', error);
        }
    };

    const removeFromCart = async (id) => {
        await cartMutate(deleteFetcher('/api/eCommerce/carts', { id, action: 'Increment' }));
    };

    const incrementQuantity = async (id) => {
        await cartMutate(putFetcher('/api/eCommerce/carts', { id, action: 'Increment' }));
    };

    const decrementQuantity = async (id) => {
        await cartMutate(putFetcher('/api/eCommerce/carts', { id, action: 'Decrement' }));
    };

    const deleteProduct = (productId) => {
        setProducts(products.filter((product) => product.id !== productId));
    };

    const deleteAllProducts = () => {
        setProducts([]);
    };

    const updateProduct = (productId, updatedProduct) => {
        setProducts(products.map((product) => (product.id === Number(productId) ? updatedProduct : product)));
    };

    const filterReset = () => {
        setSelectedCategory('All');
        setSelectedColor('All');
        setSelectedGender('All');
        setPriceRange('All');
        setSortBy('newest');
    };

    return (
        <ProductContext.Provider
            value={{
                products,
                searchProduct,
                selectedCategory,
                sortBy,
                priceRange,
                selectedGender,
                selectedColor,
                loading,
                error,
                cartItems,
                setProducts,
                setSearchProduct,
                setSelectedCategory,
                setSortBy,
                setPriceRange,
                setSelectedGender,
                setSelectedColor,
                setLoading,
                setCartItems,
                deleteProduct,
                searchProducts,
                updateSortBy,
                updatePriceRange,
                selectCategory,
                selectGender,
                selectColor,
                incrementQuantity,
                decrementQuantity,
                removeFromCart,
                addToCart,
                deleteAllProducts,
                filteredAndSortedProducts,
                filterReset,
                getProductById,
                updateProduct,
            }}
        >
            {children}
        </ProductContext.Provider>
    );
};

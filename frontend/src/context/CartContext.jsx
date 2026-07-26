import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'nexus_cart';

function loadCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((listing) => {
    setItems(prev => {
      if (prev.some(i => i._id === listing._id)) return prev;
      return [...prev, {
        _id: listing._id,
        title: listing.title,
        price: listing.price,
        image: listing.images?.[0]?.url || null,
        seller: listing.seller,
        condition: listing.condition,
        quantity: 1,
      }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i._id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

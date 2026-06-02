"use client";
// Shopping cart for study guides. Each episode is a one-time $20 purchase
// that unlocks its study guide and video. Persisted to localStorage.
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export const GUIDE_PRICE = 20;
const KEY = "cb_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  const save = useCallback((next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(
    (item) => {
      setItems((cur) => {
        if (cur.some((i) => i.episodeId === item.episodeId)) return cur;
        const next = [...cur, { ...item, price: GUIDE_PRICE }];
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const remove = useCallback(
    (episodeId) =>
      setItems((cur) => {
        const next = cur.filter((i) => i.episodeId !== episodeId);
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      }),
    []
  );

  const clear = useCallback(() => save([]), [save]);

  const has = useCallback(
    (episodeId) => items.some((i) => i.episodeId === episodeId),
    [items]
  );

  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, add, remove, clear, has, total, count: items.length }}
    >
      {children}
    </CartContext.Provider>
  );
}

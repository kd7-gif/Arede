import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Categories rarely change, so fetch once per page load and share between header and footer.
let cache = null;
let pending = null;

export function useCategories() {
  const [items, setItems] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    pending ??= api('/categories').then((d) => (cache = d.items || [])).catch(() => { pending = null; return []; });
    let alive = true;
    pending.then((c) => alive && setItems(c));
    return () => { alive = false; };
  }, []);
  return items;
}

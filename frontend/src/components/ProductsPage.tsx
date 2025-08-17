import React, { useEffect, useState } from 'react';
import { productsAPI } from '../services/api'; // adjust path

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsAPI.getProducts()
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <h2>Products</h2>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul>
          {products.map(p => (
            <li key={p._id}>
              <strong>{p.name}</strong> — {p.unitPrice} {p.unit} — Stock: {p.stockQuantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductsPage;

import React, { useState, useEffect } from 'react';
import { stockAPI, productAPI } from '../api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import './Stock.css';

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ product_id: '', quantity: '' });

  useEffect(() => {
    fetchStocks();
    fetchProducts();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await stockAPI.getAll();
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({});
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await stockAPI.update(editingId, { quantity: parseInt(formData.quantity) });
      } else {
        await stockAPI.add({ product_id: parseInt(formData.product_id), quantity: parseInt(formData.quantity) });
      }
      fetchStocks();
      setFormData({ product_id: '', quantity: '' });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      alert('Error: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock) => {
    setEditingId(stock.product_id);
    setFormData({ product_id: stock.product_id, quantity: stock.quantity });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ product_id: '', quantity: '' });
  };

  return (
    <div className="stock-container">
      <div className="stock-header">
        <h2>Stock Management</h2>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          <FiPlus /> Add Stock
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? 'Edit Stock' : 'Add Stock'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                disabled={editingId ? true : false}
                required
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} ({product.product_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stocks-list">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Product Code</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => (
              <tr key={stock.product_id}>
                <td>{stock.product_name}</td>
                <td>{stock.product_code}</td>
                <td>{stock.category}</td>
                <td>₹{stock.price}</td>
                <td className={stock.quantity < 20 ? 'low-stock' : ''}>
                  {stock.quantity}
                </td>
                <td>{new Date(stock.last_updated).toLocaleDateString()}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(stock)}>
                    <FiEdit2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stock;

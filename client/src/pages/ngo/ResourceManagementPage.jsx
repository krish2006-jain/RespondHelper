import React, { useState, useEffect } from 'react';
import { resourceAPI } from '../../api/resources';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CATEGORIES } from '../../utils/constants';
import {
  Package,
  PlusCircle,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
} from 'lucide-react';

export const ResourceManagementPage = () => {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Add/Edit Resource Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [activeResId, setActiveResId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Medicine');
  const [formQty, setFormQty] = useState(50);
  const [formUnit, setFormUnit] = useState('units');
  const [formAddress, setFormAddress] = useState('Central Warehouse, Mumbai');
  const [formExpiry, setFormExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = async () => {
    try {
      const res = await resourceAPI.getAll({
        search: search || undefined,
        category: selectedCategory || undefined,
      });
      setResources(res.data?.resources || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [search, selectedCategory]);

  const handleQuickQtyChange = async (resItem, delta) => {
    const nextQty = Math.max(0, resItem.quantity + delta);
    try {
      await resourceAPI.update(resItem._id, {
        quantity: nextQty,
        changeReason: delta > 0 ? 'Manual stock arrival' : 'Manual stock distribution',
      });
      setResources(
        resources.map((r) => (r._id === resItem._id ? { ...r, quantity: nextQty } : r))
      );
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setActiveResId(null);
    setFormName('');
    setFormCategory('Medicine');
    setFormQty(100);
    setFormUnit('boxes');
    setFormAddress('Relief Warehouse, Mumbai');
    setFormExpiry('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r) => {
    setModalMode('edit');
    setActiveResId(r._id);
    setFormName(r.name);
    setFormCategory(r.category);
    setFormQty(r.quantity);
    setFormUnit(r.unit);
    setFormAddress(r.address);
    setFormExpiry(r.expiryDate ? new Date(r.expiryDate).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formName,
        category: formCategory,
        quantity: Number(formQty),
        unit: formUnit,
        address: formAddress,
        expiryDate: formExpiry || undefined,
      };

      if (modalMode === 'add') {
        await resourceAPI.create(payload);
      } else {
        await resourceAPI.update(activeResId, payload);
      }
      setIsModalOpen(false);
      fetchResources();
    } catch (err) {
      alert(err.message || 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource item?')) return;
    try {
      await resourceAPI.delete(id);
      setResources(resources.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Resource & Supply Inventory</h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Manage real-time supplies, monitor expiration dates, and perform quick quantity adjustments.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenAddModal} className="font-bold">
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add New Supplies
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine, food, water supplies..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border text-sm font-semibold bg-white text-text"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-sm">Loading supplies...</div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-text">No supplies matching your search</h3>
            <p className="text-xs text-text-muted">Add your warehouse inventory using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-border text-text-muted uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="p-4">Supply Name & Category</th>
                  <th className="p-4">Available Quantity</th>
                  <th className="p-4">Quick Adjust</th>
                  <th className="p-4">Warehouse Location</th>
                  <th className="p-4">Status & Expiry</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resources.map((resItem) => (
                  <tr key={resItem._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-text text-sm">{resItem.name}</div>
                      <span className="text-[11px] text-text-muted font-medium">{resItem.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-base text-text tabular-nums">
                        {resItem.quantity}
                      </span>{' '}
                      <span className="text-xs text-text-muted font-medium">{resItem.unit}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickQtyChange(resItem, -10)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-border flex items-center justify-center font-bold text-xs"
                          title="Reduce 10"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleQuickQtyChange(resItem, 10)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-border flex items-center justify-center font-bold text-xs"
                          title="Add 10"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <span className="text-xs text-text-muted truncate block">{resItem.address}</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <Badge
                          variant={
                            resItem.alertStatus === 'Expired'
                              ? 'danger'
                              : resItem.alertStatus === 'Expiring Soon'
                              ? 'warning'
                              : resItem.alertStatus === 'Low Stock'
                              ? 'danger'
                              : 'success'
                          }
                        >
                          {resItem.alertStatus}
                        </Badge>
                        {resItem.expiryDate && (
                          <span className="text-[10px] text-text-muted block">
                            Exp: {new Date(resItem.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(resItem)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-100"
                          title="Edit Supply"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resItem._id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light"
                          title="Delete Supply"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add Supplies to Inventory' : 'Edit Supply Item'}
      >
        <form onSubmit={handleSaveResource} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-text-muted mb-1">
              Resource Name
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Paracetamol Tablets (500mg)"
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-text-muted mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-text-muted mb-1">
                Quantity & Unit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-24 px-3 py-2.5 rounded-xl border border-border text-sm"
                />
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border text-sm bg-white"
                >
                  <option value="units">units</option>
                  <option value="boxes">boxes</option>
                  <option value="kg">kg</option>
                  <option value="litres">litres</option>
                  <option value="meals">meals</option>
                  <option value="bottles">bottles</option>
                  <option value="kits">kits</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-muted mb-1">
              Warehouse Depot Address
            </label>
            <input
              type="text"
              required
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-muted mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formExpiry}
              onChange={(e) => setFormExpiry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={submitting}>
            {modalMode === 'add' ? 'Create Supply Item' : 'Save Changes'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

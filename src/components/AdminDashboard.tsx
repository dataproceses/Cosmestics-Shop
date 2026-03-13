import React from 'react';
import { 
  Plus, Search, Edit2, Trash2, Package, 
  TrendingUp, ShoppingCart, Users, DollarSign,
  ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw,
  Upload, Loader2, Image as ImageIcon, X
} from 'lucide-react';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Category, Order, ProductVariant } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState<'inventory' | 'analytics' | 'orders'>('inventory');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [stockFilter, setStockFilter] = React.useState('All');

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      const matchesStock = stockFilter === 'All' || 
                           (stockFilter === 'In Stock' && product.stock > 10) ||
                           (stockFilter === 'Low Stock' && product.stock > 0 && product.stock <= 10) ||
                           (stockFilter === 'Out of Stock' && product.stock === 0);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const getFallbackImage = (id: string) => `https://picsum.photos/seed/${id}/800/1000`;

  const fixUnsplashUrl = (url: string) => {
    if (url.includes('unsplash.com/photos/')) {
      const parts = url.split('/');
      const lastPart = parts.pop()?.split('?')[0];
      if (lastPart) {
        // Extract the ID (usually the last part after the last hyphen)
        const id = lastPart.includes('-') ? lastPart.split('-').pop() : lastPart;
        if (id) return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`;
      }
    }
    return url;
  };

  // Form State
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    stock: 0,
    variants: [] as ProductVariant[]
  });

  React.useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeOrders();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          variants: formData.variants
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          variants: formData.variants,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, category: '', imageUrl: '', stock: 0, variants: [] });
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, editingProduct ? `products/${editingProduct.id}` : 'products');
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productToDelete}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
      variants: product.variants || []
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload failed", error);
        alert("Upload failed. Please check your Firebase Storage rules.");
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
        setUploading(false);
        setUploadProgress(0);
      }
    );
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { id: crypto.randomUUID(), type: 'Size', value: '', price: 0, stock: 0 }
      ]
    }));
  };

  const handleUpdateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const handleRemoveVariant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id)
    }));
  };

  const seedSampleData = async () => {
    const sampleProducts = [
      {
        name: "Radiance Serum",
        description: "A powerful vitamin C serum that brightens and evens skin tone.",
        price: 48.00,
        category: "Skincare",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800",
        stock: 15,
        createdAt: new Date().toISOString()
      },
      {
        name: "Velvet Matte Lipstick",
        description: "Long-lasting, creamy matte lipstick in a classic rose shade.",
        price: 24.00,
        category: "Makeup",
        imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=800",
        stock: 20,
        createdAt: new Date().toISOString()
      },
      {
        name: "Midnight Bloom Perfume",
        description: "An enchanting blend of jasmine, vanilla, and dark amber.",
        price: 85.00,
        category: "Fragrance",
        imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800",
        stock: 8,
        createdAt: new Date().toISOString()
      },
      {
        name: "Silk Glow Foundation",
        description: "Lightweight foundation for a natural, dewy finish.",
        price: 36.00,
        category: "Makeup",
        imageUrl: "https://images.unsplash.com/photo-1599733589046-10c005739ef0?auto=format&fit=crop&q=80&w=800",
        stock: 12,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      for (const p of sampleProducts) {
        await addDoc(collection(db, 'products'), p);
      }
      alert("Sample data seeded successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 5).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="serif text-3xl font-bold text-stone-900">Admin Panel</h1>
          <p className="text-stone-500 text-sm">Manage your store inventory and track performance.</p>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          {(['inventory', 'orders', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-emerald-600" />} trend="+12.5%" trendUp />
          <StatCard title="Total Orders" value={totalOrders.toString()} icon={<ShoppingCart className="text-blue-600" />} trend="+8.2%" trendUp />
          <StatCard title="Total Products" value={totalProducts.toString()} icon={<Package className="text-amber-600" />} trend="0%" />
          <StatCard title="Low Stock Items" value={lowStockProducts.toString()} icon={<TrendingUp className="text-red-600" />} trend="-2" trendUp={false} />
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-200 flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={seedSampleData}
                  className="flex items-center justify-center space-x-2 bg-stone-100 text-stone-600 px-4 py-2 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span className="hidden sm:inline">Seed Data</span>
                </button>
                <button 
                  onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                  className="flex items-center justify-center space-x-2 bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Product</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2 shrink-0">Category:</span>
                {['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      categoryFilter === cat 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="hidden sm:block w-px h-6 bg-stone-200 self-center" />
              
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2 shrink-0">Stock:</span>
                {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStockFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      stockFilter === status 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product.imageUrl || getFallbackImage(product.id)} 
                          alt={product.name} 
                          className="w-10 h-10 rounded-md object-cover border border-stone-200"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== getFallbackImage(product.id)) {
                              target.src = getFallbackImage(product.id);
                            }
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{product.name}</p>
                          <p className="text-xs text-stone-500 truncate max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-stone-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-stone-600">{product.stock} units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(product.id)}
                          className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Product List */}
          <div className="md:hidden divide-y divide-stone-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={product.imageUrl || getFallbackImage(product.id)} 
                    alt={product.name} 
                    className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== getFallbackImage(product.id)) {
                        target.src = getFallbackImage(product.id);
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-900 truncate">{product.name}</p>
                    <p className="text-xs text-stone-500 line-clamp-1">{product.description}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded">
                        {product.category}
                      </span>
                      <span className="text-sm font-bold text-stone-900">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-stone-600">{product.stock} units in stock</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="p-2 bg-stone-50 text-stone-600 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(product.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900">Recent Orders</h2>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-stone-500">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-stone-900">{order.userId}</td>
                    <td className="px-6 py-4 text-sm text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-stone-900">${order.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Orders List */}
          <div className="md:hidden divide-y divide-stone-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Order ID</p>
                    <p className="text-sm font-mono text-stone-900">#{order.id.slice(0, 8)}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Customer ID</p>
                    <p className="text-xs text-stone-600 truncate max-w-[150px]">{order.userId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-stone-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
              >
              <div className="p-6 border-b border-stone-100">
                <h2 className="serif text-2xl font-bold text-stone-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Description</label>
                    <textarea 
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Price ($)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Stock</label>
                    <input 
                      required
                      type="number" 
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Category</label>
                    <select 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    >
                      <option value="">Select Category</option>
                      <option value="Skincare">Skincare</option>
                      <option value="Makeup">Makeup</option>
                      <option value="Fragrance">Fragrance</option>
                      <option value="Haircare">Haircare</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Product Image</label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-24 h-24 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
                        {formData.imageUrl ? (
                          <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ImageIcon className="text-stone-300" size={32} />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-2">
                            <Loader2 className="animate-spin mb-1" size={20} />
                            <span className="text-[10px] font-bold">{Math.round(uploadProgress)}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                            id="image-upload"
                          />
                          <label 
                            htmlFor="image-upload"
                            className={`flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-stone-400 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Upload size={18} className="text-stone-500" />
                            <span className="text-sm font-medium text-stone-600">
                              {uploading ? 'Uploading...' : 'Upload from device'}
                            </span>
                          </label>
                        </div>
                        <div className="relative">
                          <input 
                            type="url" 
                            placeholder="Or paste image URL"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({...formData, imageUrl: fixUnsplashUrl(e.target.value)})}
                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 text-sm"
                          />
                          <p className="text-[10px] text-stone-400 mt-1">Tip: Use direct image links for best results.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="col-span-2 border-t border-stone-100 pt-4 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold text-stone-500 uppercase">Product Variants</label>
                      <button 
                        type="button" 
                        onClick={handleAddVariant}
                        className="flex items-center space-x-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md"
                      >
                        <Plus size={14} />
                        <span>Add Variant</span>
                      </button>
                    </div>
                    
                    {formData.variants.length === 0 ? (
                      <div className="text-center py-6 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                        <p className="text-sm text-stone-500">No variants added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.variants.map((variant, index) => (
                          <div key={variant.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg relative">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveVariant(variant.id)}
                              className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full p-1 shadow-sm border border-stone-200 transition-colors"
                            >
                              <X size={14} />
                            </button>
                            
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Type</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Size"
                                  value={variant.type}
                                  onChange={(e) => handleUpdateVariant(variant.id, 'type', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Value</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 50ml"
                                  value={variant.value}
                                  onChange={(e) => handleUpdateVariant(variant.id, 'value', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Price ($)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={variant.price}
                                  onChange={(e) => handleUpdateVariant(variant.id, 'price', Number(e.target.value))}
                                  className="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Stock</label>
                                <input 
                                  type="number" 
                                  value={variant.stock}
                                  onChange={(e) => handleUpdateVariant(variant.id, 'stock', Number(e.target.value))}
                                  className="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[70] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeleteModalOpen(false)}
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center my-8"
              >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 size={32} />
              </div>
              <h3 className="serif text-xl font-bold text-stone-900 mb-2">Delete Product?</h3>
              <p className="text-stone-500 text-sm mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp = true }: { title: string, value: string, icon: React.ReactNode, trend?: string, trendUp?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-stone-50 rounded-lg">{icon}</div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span className="ml-1">{trend}</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

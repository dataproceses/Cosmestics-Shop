import React from 'react';
import { ShoppingBag, Star, Filter, ChevronRight, ArrowRight, Search } from 'lucide-react';
import { Product, Category, UserProfile, ProductVariant } from '../types';
import { motion } from 'motion/react';
import ProductModal from './ProductModal';

interface StoreFrontProps {
  user: UserProfile | null;
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onNavigate: (page: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  isShopPage?: boolean;
}

export default function StoreFront({ user, products, categories, onAddToCart, onNavigate, selectedCategory, setSelectedCategory, isShopPage }: StoreFrontProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  
  const filteredProducts = React.useMemo(() => {
    let filtered = products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || selectedCategory === 'New Arrivals' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (selectedCategory === 'New Arrivals') {
      filtered = filtered.slice(0, 8);
    } else if (!isShopPage && selectedCategory === 'All' && !searchQuery) {
      filtered = filtered.slice(0, 8);
    }

    return filtered;
  }, [products, selectedCategory, searchQuery, isShopPage]);

  const getFallbackImage = (id: string) => `https://picsum.photos/seed/${id}/800/1000`;

  return (
    <div className={`space-y-12 pb-20 ${isShopPage ? 'pt-8' : ''}`}>
      {/* Hero Section */}
      {!isShopPage && (
        <section className="relative h-[70vh] md:h-[80vh] flex items-center overflow-hidden bg-stone-900">
          <div className="absolute inset-0 opacity-70">
            <img 
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1920" 
              alt="Beauty background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4 block text-stone-300">New Collection 2026</span>
              <h1 className="serif text-5xl md:text-8xl font-bold leading-tight mb-6">
                Reveal Your <br />
                <span className="italic font-normal">Natural</span> Glow
              </h1>
              <p className="text-base md:text-lg text-stone-300 mb-8 max-w-lg">
                Discover our curated selection of premium skincare and makeup, 
                crafted with organic ingredients for a timeless beauty experience.
              </p>
              <button 
                onClick={() => onNavigate('shop')}
                className="group flex items-center space-x-3 bg-white text-stone-900 px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold hover:bg-stone-100 transition-all text-sm md:text-base"
              >
                <span>Shop Collection</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Brand Logos Section */}
      {!isShopPage && (
        <section className="py-12 border-b border-stone-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">iS</div>
                <span className="font-bold text-stone-900 tracking-tighter">InStyle</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-stone-900" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span className="font-bold text-stone-900 tracking-tighter uppercase">Vogue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white">
                  <span className="text-[10px] font-black">A</span>
                </div>
                <span className="font-bold text-stone-900 tracking-tighter uppercase">Allure</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 border-2 border-stone-900 flex items-center justify-center">
                  <span className="text-[10px] font-bold">E</span>
                </div>
                <span className="font-bold text-stone-900 tracking-tighter uppercase">Elle</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-stone-200 rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-stone-400 rounded-sm" />
                </div>
                <span className="font-bold text-stone-900 tracking-tighter uppercase text-[10px]">Bazaar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2 h-2 bg-stone-900" />
                    <div className="w-2 h-2 bg-stone-400" />
                    <div className="w-2 h-2 bg-stone-400" />
                    <div className="w-2 h-2 bg-stone-900" />
                  </div>
                </div>
                <span className="font-bold text-stone-900 tracking-tighter uppercase text-[10px]">Glamour</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories and Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <h2 className="serif text-2xl md:text-3xl font-bold text-stone-900">Shop by Category</h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 md:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                id="product-search"
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all text-sm"
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto">
              {['All', 'New Arrivals', 'Skincare', 'Makeup', 'Fragrance', 'Haircare'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-100">
            <h3 className="serif text-2xl font-bold text-stone-900 mb-2">No products found</h3>
            <p className="text-stone-500">Try adjusting your search or category filter.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-6 px-6 py-2 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div 
                className="relative aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-4 cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <img 
                  src={product.imageUrl || getFallbackImage(product.id)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== getFallbackImage(product.id)) {
                      target.src = getFallbackImage(product.id);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (product.variants && product.variants.length > 0) {
                      setSelectedProduct(product);
                    } else {
                      onAddToCart(product); 
                    }
                  }}
                  className="absolute bottom-4 left-4 right-4 bg-white text-stone-900 py-3 rounded-xl font-semibold opacity-100 lg:opacity-0 lg:translate-y-4 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300 shadow-xl flex items-center justify-center space-x-2"
                >
                  <ShoppingBag size={18} />
                  <span>{product.variants && product.variants.length > 0 ? 'Select Options' : 'Add to Cart'}</span>
                </button>
                {product.stock < 5 && product.stock > 0 && (
                  <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    Low Stock
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    Out of Stock
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-stone-900 font-medium group-hover:underline decoration-stone-300 underline-offset-4">
                    {product.name}
                  </h3>
                  <span className="text-stone-900 font-bold">
                    {product.variants && product.variants.length > 0 
                      ? `From $${Math.min(...product.variants.map(v => v.price)).toFixed(2)}`
                      : `$${product.price.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-stone-500 text-sm">{product.category}</p>
                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                  <span className="text-stone-400 text-[10px] ml-1">(24 reviews)</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </section>

      {/* Featured Section */}
      {!isShopPage && (
        <section className="bg-stone-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=1000" 
                    alt="Featured product" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('picsum')) {
                        target.src = 'https://picsum.photos/seed/featured-serum/1000/1000';
                      }
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl max-w-[200px]">
                  <p className="serif text-lg font-bold text-stone-900 mb-1">Editor's Choice</p>
                  <p className="text-xs text-stone-500">"The most hydrating serum I've ever used. A true game changer."</p>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="serif text-4xl font-bold text-stone-900">The Science of <br />Beautiful Skin</h2>
                <p className="text-stone-600 leading-relaxed">
                  Our products are formulated with high-performance botanicals and clinical-grade 
                  actives to deliver visible results without compromising on safety. 
                  We believe in clean beauty that actually works.
                </p>
                <ul className="space-y-4">
                  {['Cruelty Free', 'Vegan Ingredients', 'Dermatologist Tested', 'Sustainable Packaging'].map((item) => (
                    <li key={item} className="flex items-center space-x-3 text-stone-700">
                      <div className="w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center">
                        <ChevronRight size={12} className="text-white" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="text-stone-900 font-bold border-b-2 border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-all">
                  Learn More About Our Process
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Product Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={onAddToCart}
        user={user}
      />
    </div>
  );
}

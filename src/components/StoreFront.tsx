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

      {/* Brand Logos Section (Dock Style) */}
      {!isShopPage && (
        <section className="py-16 bg-stone-50 border-y border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 bg-stone-900/5 backdrop-blur-sm py-6 px-8 rounded-2xl border border-stone-200/50">
              {/* Unsplash-like Logo */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-stone-900 flex items-center justify-center rounded-sm">
                  <div className="w-4 h-4 border-2 border-white border-t-0" />
                  <div className="absolute w-2 h-2 bg-white top-[30%]" />
                </div>
              </div>
              
              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* iS Logo */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">iS</div>
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Whale/Dolphin Logo (Lucide doesn't have a perfect one, using a stylized wave/fish) */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,2C6.47,2,2,6.47,2,12c0,4.42,2.87,8.17,6.84,9.39c0.19,0.04,0.26-0.08,0.26-0.18c0-0.09-0.01-0.32-0.01-0.63 c-2.78,0.6-3.37-1.34-3.37-1.34c-0.45-1.15-1.11-1.46-1.11-1.46c-0.91-0.62,0.07-0.61,0.07-0.61c1.01,0.07,1.54,1.03,1.54,1.03 c0.89,1.53,2.34,1.09,2.91,0.83c0.09-0.65,0.35-1.09,0.63-1.34c-2.22-0.25-4.55-1.11-4.55-4.94c0-1.09,0.39-1.98,1.03-2.68 C6.15,9.02,5.81,8,6.35,6.65c0,0,0.84-0.27,2.75,1.02C9.9,7.4,10.96,7.27,12,7.27c1.04,0,2.1,0.13,2.9,0.4c1.91-1.29,2.75-1.02,2.75-1.02 c0.55,1.35,0.21,2.37,0.1,2.62c0.64,0.7,1.03,1.59,1.03,2.68c0,3.84-2.34,4.68-4.57,4.93c0.36,0.31,0.68,0.92,0.68,1.85 c0,1.34-0.01,2.42-0.01,2.75c0,0.11,0.07,0.23,0.26,0.19C19.14,20.16,22,16.42,22,12C22,6.47,17.53,2,12,2z" />
                  </svg>
                </div>
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Google G Logo */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c3.11 0 5.72-1.03 7.63-2.81l-3.57-2.77c-1.06.71-2.42 1.13-4.06 1.13-3.12 0-5.76-2.11-6.71-4.94H1.71v2.86C3.6 20.17 7.51 23 12 23z" fill="#34A853"/>
                    <path d="M5.29 13.61c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26V6.23H1.71C.62 8.41 0 10.86 0 13.4s.62 4.99 1.71 7.17l3.58-2.86c-.24-.71-.38-1.47-.38-2.26z" fill="#FBBC05"/>
                    <path d="M12 4.64c1.69 0 3.21.58 4.41 1.72l3.31-3.31C17.71 1.05 15.11 0 12 0 7.51 0 3.6 2.83 1.71 6.23L5.29 9.09c.95-2.83 3.59-4.45 6.71-4.45z" fill="#EA4335"/>
                  </svg>
                </div>
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Wave Logo 1 */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-stone-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-stone-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Wave Logo 2 */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-stone-900 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-stone-900 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Blue Document Icons */}
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 bg-blue-500 rounded-md flex flex-col items-center justify-center p-1.5 space-y-0.5">
                    <div className="w-full h-0.5 bg-white/80 rounded-full" />
                    <div className="w-full h-0.5 bg-white/80 rounded-full" />
                    <div className="w-full h-0.5 bg-white/80 rounded-full" />
                  </div>
                ))}
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Settings Gear */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-stone-600">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.84,9.48l2.03,1.58C4.82,11.36,4.8,11.68,4.8,12c0,0.33,0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z" />
                  </svg>
                </div>
              </div>

              <div className="w-px h-8 bg-stone-300 mx-2 hidden sm:block" />

              {/* Another Google G Logo */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c3.11 0 5.72-1.03 7.63-2.81l-3.57-2.77c-1.06.71-2.42 1.13-4.06 1.13-3.12 0-5.76-2.11-6.71-4.94H1.71v2.86C3.6 20.17 7.51 23 12 23z" fill="#34A853"/>
                    <path d="M5.29 13.61c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26V6.23H1.71C.62 8.41 0 10.86 0 13.4s.62 4.99 1.71 7.17l3.58-2.86c-.24-.71-.38-1.47-.38-2.26z" fill="#FBBC05"/>
                    <path d="M12 4.64c1.69 0 3.21.58 4.41 1.72l3.31-3.31C17.71 1.05 15.11 0 12 0 7.51 0 3.6 2.83 1.71 6.23L5.29 9.09c.95-2.83 3.59-4.45 6.71-4.45z" fill="#EA4335"/>
                  </svg>
                </div>
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

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, getDoc, setDoc, collection, onSnapshot, 
  query, orderBy, addDoc, updateDoc, increment 
} from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { UserProfile, Product, Category, CartItem, Order, ProductVariant } from './types';
import Navbar from './components/Navbar';
import StoreFront from './components/StoreFront';
import AdminDashboard from './components/AdminDashboard';
import Cart from './components/Cart';
import AIAssistant from './components/AIAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, Mail, Send, CheckCircle2 } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        if (this.state.error?.message) {
          try {
            const parsed = JSON.parse(this.state.error.message);
            if (parsed.error) errorMessage = `Permission Error: ${parsed.error}`;
            else if (parsed.message) errorMessage = parsed.message;
          } catch (e) {
            // Not JSON, use raw message
            errorMessage = this.state.error.message;
          }
        }
      } catch (e) {
        console.error("Error in ErrorBoundary render:", e);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertCircle size={32} />
            </div>
            <h2 className="serif text-2xl font-bold text-stone-900 mb-2">Application Error</h2>
            <p className="text-stone-500 text-sm mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all"
            >
              <RefreshCw size={18} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState('home');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [userOrders, setUserOrders] = React.useState<Order[]>([]);
  const [toast, setToast] = React.useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Guest',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.email === 'tarikukebede200@gmail.com' ? 'admin' : 'customer',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Toast timeout
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Data Listeners
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

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  // User Orders Listener
  React.useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setUserOrders(allOrders.filter(o => o.userId === user.uid));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribeOrders();
  }, [user]);

  // Dynamic Page Title & Scroll to top on page change
  React.useEffect(() => {
    const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
    document.title = `Cosmetics | ${pageTitle === 'Home' ? 'Premium Beauty' : pageTitle}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const stockToCheck = variant ? variant.stock : product.stock;
    if (stockToCheck <= 0) {
      setToast({ message: "Item out of stock", type: 'error' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedVariant?.id === variant?.id);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedVariant?.id === variant?.id) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedVariant: variant }];
    });
    setToast({ message: `${product.name}${variant ? ` (${variant.value})` : ''} added to cart`, type: 'success' });
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        setToast({ message: "Verification email sent!", type: 'success' });
      } catch (error: any) {
        setToast({ message: error.message, type: 'error' });
      }
    }
  };

  const checkVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setToast({ message: "Email verified!", type: 'success' });
        // Trigger a re-render by updating dummy state or just letting the listener handle it if it triggers
        // Actually onAuthStateChanged might not trigger on reload, so we might need to force it
        window.location.reload(); 
      } else {
        setToast({ message: "Still not verified. Please check your inbox.", type: 'error' });
      }
    }
  };

  const updateCartQuantity = (id: string, variantId: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedVariant?.id === variantId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string, variantId: string | undefined) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedVariant?.id === variantId)));
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("Please sign in to complete your purchase.");
      return;
    }

    try {
      const orderData = {
        userId: user.uid,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.selectedVariant ? item.selectedVariant.price : item.price,
          quantity: item.quantity,
          variant: item.selectedVariant
        })),
        totalAmount: cart.reduce((acc, item) => acc + (item.selectedVariant ? item.selectedVariant.price : item.price) * item.quantity, 0),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Update stock
      for (const item of cart) {
        await updateDoc(doc(db, 'products', item.id), {
          stock: increment(-item.quantity)
        });
      }

      setCart([]);
      setCurrentPage('orders');
      alert("Order placed successfully!");
    } catch (error) {
      console.error("Checkout failed", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-stone-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200/30 rounded-full blur-3xl" />
        
        <div className="flex flex-col items-center space-y-8 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-stone-200 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-t-2 border-stone-900 rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <h1 className="serif text-3xl md:text-4xl font-bold text-stone-900 tracking-tighter mb-2">COSMETICS</h1>
            <p className="text-stone-400 text-xs uppercase tracking-[0.3em] font-medium animate-pulse">Loading Excellence</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />

      {/* Email Verification Banner */}
      {auth.currentUser && !auth.currentUser.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-100 py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3 text-amber-800">
              <Mail size={18} className="shrink-0" />
              <p className="text-sm font-medium">
                Please verify your email address to access all features.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={resendVerification}
                className="flex items-center space-x-2 text-sm font-bold text-amber-900 hover:text-amber-700 transition-colors bg-white px-4 py-1.5 rounded-full shadow-sm border border-amber-200"
              >
                <Send size={14} />
                <span>Resend</span>
              </button>
              <button 
                onClick={checkVerification}
                className="flex items-center space-x-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors px-4 py-1.5 rounded-full shadow-sm"
              >
                <CheckCircle2 size={14} />
                <span>I've Verified</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 ${
              toast.type === 'success' ? 'bg-stone-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-white animate-pulse'}`} />
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentPage === 'home' || currentPage === 'shop' ? (
              <StoreFront 
                user={user}
                products={products} 
                categories={categories} 
                onAddToCart={addToCart}
                onNavigate={setCurrentPage}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                isShopPage={currentPage === 'shop'}
              />
            ) : currentPage === 'cart' ? (
              <Cart 
                items={cart} 
                onUpdateQuantity={updateCartQuantity} 
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                onNavigate={setCurrentPage}
              />
            ) : currentPage === 'admin' && user?.role === 'admin' ? (
              <AdminDashboard />
            ) : currentPage === 'orders' ? (
              <UserOrders orders={userOrders} />
            ) : currentPage === 'about' ? (
              <AboutPage />
            ) : currentPage === 'sustainability' ? (
              <SustainabilityPage />
            ) : currentPage === 'contact' ? (
              <ContactPage />
            ) : currentPage === 'privacy' ? (
              <PrivacyPage />
            ) : (
              <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="serif text-4xl font-bold text-stone-900 mb-4">Coming Soon</h2>
                <p className="text-stone-500">We're working hard to bring you this feature.</p>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="mt-8 text-stone-900 font-bold border-b-2 border-stone-900"
                >
                  Back to Home
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <span className="serif text-2xl font-bold tracking-tighter text-stone-900">COSMETICS</span>
              <p className="mt-4 text-stone-500 max-w-sm">
                Premium beauty and skincare products for the modern individual. 
                Ethically sourced, clinically proven, and beautifully packaged.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><button onClick={() => { setSelectedCategory('All'); setCurrentPage('shop'); }} className="hover:text-stone-900 transition-colors cursor-pointer text-left">All Products</button></li>
                <li><button onClick={() => { setSelectedCategory('Skincare'); setCurrentPage('shop'); }} className="hover:text-stone-900 transition-colors cursor-pointer text-left">Skincare</button></li>
                <li><button onClick={() => { setSelectedCategory('Makeup'); setCurrentPage('shop'); }} className="hover:text-stone-900 transition-colors cursor-pointer text-left">Makeup</button></li>
                <li><button onClick={() => { setSelectedCategory('All'); setCurrentPage('shop'); }} className="hover:text-stone-900 transition-colors cursor-pointer text-left">New Arrivals</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><button onClick={() => setCurrentPage('about')} className="hover:text-stone-900 transition-colors cursor-pointer text-left">About Us</button></li>
                <li><button onClick={() => setCurrentPage('sustainability')} className="hover:text-stone-900 transition-colors cursor-pointer text-left">Sustainability</button></li>
                <li><button onClick={() => setCurrentPage('contact')} className="hover:text-stone-900 transition-colors cursor-pointer text-left">Contact</button></li>
                <li><button onClick={() => setCurrentPage('privacy')} className="hover:text-stone-900 transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-4">
              <p className="text-xs text-stone-400">© 2026 Cosmetics. All rights reserved.</p>
              <div className="flex items-center space-x-3 opacity-30 grayscale hover:grayscale-0 transition-all">
                {/* Google Pay Icon */}
                <div className="w-10 h-6 bg-white border border-stone-200 rounded flex items-center justify-center p-1">
                  <svg viewBox="0 0 40 16" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M15.5 8.1c0-.4 0-.8-.1-1.1H11v2.1h2.5c-.1.6-.5 1.1-.9 1.4v1.2h1.5c.9-.8 1.4-2 1.4-3.6z"/>
                    <path fill="#34A853" d="M11 12.5c1.2 0 2.2-.4 3-1.1l-1.5-1.2c-.4.3-.9.4-1.5.4-1.1 0-2.1-.8-2.4-1.8H7.1v1.2c.7 1.5 2.2 2.5 3.9 2.5z"/>
                    <path fill="#FBBC05" d="M8.6 8.8c-.1-.3-.1-.6-.1-.9s0-.6.1-.9V5.8H7.1c-.4.8-.6 1.7-.6 2.7s.2 1.9.6 2.7l1.5-1.2z"/>
                    <path fill="#EA4335" d="M11 5.1c.7 0 1.3.2 1.8.7l1.3-1.3c-.8-.8-1.9-1.2-3.1-1.2-1.7 0-3.2 1-3.9 2.5l1.5 1.2c.3-1 1.3-1.9 2.4-1.9z"/>
                    <text x="18" y="12" fill="#5F6368" style={{fontSize: '10px', fontWeight: 'bold'}}>Pay</text>
                  </svg>
                </div>
                {/* Apple Pay Icon */}
                <div className="w-10 h-6 bg-white border border-stone-200 rounded flex items-center justify-center p-1">
                  <svg viewBox="0 0 40 16" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 8.5c0-1.2.6-2.2 1.5-2.8-.6-.8-1.5-1.3-2.5-1.3-1.1 0-2.1.8-2.7.8-.6 0-1.4-.7-2.3-.7-1.2 0-2.3.7-2.9 1.7-1.2 2.1-.3 5.2.9 6.9.6.8 1.3 1.7 2.2 1.7.9 0 1.2-.5 2.3-.5 1.1 0 1.4.5 2.3.5.9 0 1.5-.8 2.1-1.6.7-1 .9-2 .9-2.1 0 0-1.8-.7-1.8-2.6zM10.8 4.1c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.3-.8 2.1.8.1 1.7-.4 2.2-1z" fill="black"/>
                    <text x="18" y="12" fill="black" style={{fontSize: '10px', fontWeight: 'bold'}}>Pay</text>
                  </svg>
                </div>
                {/* Generic Card Icon */}
                <div className="w-10 h-6 bg-white border border-stone-200 rounded flex items-center justify-center p-1">
                  <div className="w-full h-full bg-stone-100 rounded-sm relative overflow-hidden">
                    <div className="absolute top-1 left-1 w-2 h-1.5 bg-amber-400 rounded-xs" />
                    <div className="absolute bottom-1 right-1 flex space-x-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
                      <div className="w-2 h-2 rounded-full bg-amber-500 opacity-80 -ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-6 text-stone-400">
              <button className="text-xs hover:text-stone-900 transition-colors cursor-pointer">Instagram</button>
              <button className="text-xs hover:text-stone-900 transition-colors cursor-pointer">Pinterest</button>
              <button className="text-xs hover:text-stone-900 transition-colors cursor-pointer">Twitter</button>
            </div>
          </div>
        </div>
      </footer>
      <AIAssistant products={products} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="serif text-4xl font-bold text-stone-900 mb-8">About Us</h1>
      <div className="prose prose-stone max-w-none">
        <p className="text-lg text-stone-600 mb-6">Welcome to Cosmetics, where beauty meets science and nature. Founded in 2026, we believe that everyone deserves to feel confident in their own skin.</p>
        <p className="text-lg text-stone-600">Our mission is to provide premium, ethically sourced, and clinically proven skincare and cosmetics that enhance your natural beauty without compromising on health or the environment.</p>
      </div>
    </div>
  );
}

function SustainabilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="serif text-4xl font-bold text-stone-900 mb-8">Sustainability</h1>
      <div className="prose prose-stone max-w-none">
        <p className="text-lg text-stone-600 mb-6">At Cosmetics, sustainability is at the core of everything we do. We are committed to reducing our environmental footprint and promoting ethical practices across our supply chain.</p>
        <ul className="space-y-4 text-stone-600 list-disc pl-5">
          <li><strong className="text-stone-900">Eco-Friendly Packaging:</strong> All our packaging is 100% recyclable or biodegradable.</li>
          <li><strong className="text-stone-900">Cruelty-Free:</strong> We never test on animals, and we only work with suppliers who share this commitment.</li>
          <li><strong className="text-stone-900">Ethical Sourcing:</strong> Our ingredients are sustainably harvested to protect local ecosystems.</li>
        </ul>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="serif text-4xl font-bold text-stone-900 mb-8">Contact Us</h1>
      <div className="prose prose-stone max-w-none">
        <p className="text-lg text-stone-600 mb-8">We'd love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello, our team is here to assist.</p>
        <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 space-y-4">
          <p className="text-stone-600"><strong className="text-stone-900">Email:</strong> support@cosmetics.com</p>
          <p className="text-stone-600"><strong className="text-stone-900">Phone:</strong> 1-800-COSMETICS</p>
          <p className="text-stone-600"><strong className="text-stone-900">Address:</strong> 123 Beauty Lane, Glow City, CA 90210</p>
        </div>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="serif text-4xl font-bold text-stone-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-stone max-w-none space-y-6 text-stone-600">
        <p className="text-lg">Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.</p>
        
        <h3 className="text-xl font-bold text-stone-900 mt-8 mb-4">Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This may include your name, email address, shipping address, and payment details.</p>
        
        <h3 className="text-xl font-bold text-stone-900 mt-8 mb-4">How We Use Your Information</h3>
        <p>We use your information to process orders, communicate with you, and improve our products and services. We do not sell your personal information to third parties.</p>
      </div>
    </div>
  );
}

function UserOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="serif text-3xl md:text-4xl font-bold text-stone-900 mb-6 md:mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl p-8 md:p-12 text-center border border-stone-200">
          <p className="text-stone-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 md:p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Order ID</p>
                  <p className="text-sm font-mono text-stone-900">#{order.id.slice(0, 12)}</p>
                </div>
                <div className="sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider sm:mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-stone-900 line-clamp-1">
                          {item.name} {item.variant && <span className="text-stone-500 font-normal">({item.variant.value})</span>}
                        </span>
                        <span className="text-xs text-stone-400 shrink-0">x{item.quantity}</span>
                      </div>
                      <span className="text-sm font-semibold text-stone-900 shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <p className="text-stone-500 text-xs md:text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-base md:text-lg font-bold text-stone-900">Total: ${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

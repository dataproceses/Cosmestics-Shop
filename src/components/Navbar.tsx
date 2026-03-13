import React from 'react';
import { ShoppingBag, User, LogOut, LayoutDashboard, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import AuthModal from './AuthModal';

interface NavbarProps {
  user: UserProfile | null;
  cartCount: number;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Navbar({ user, cartCount, onNavigate, currentPage }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate('home');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSearchClick = () => {
    if (currentPage !== 'home' && currentPage !== 'shop') {
      onNavigate('shop');
    }
    setTimeout(() => {
      const searchInput = document.getElementById('product-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'about', label: 'About' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white md:bg-white/80 md:backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer mr-4" 
            onClick={() => onNavigate('home')}
          >
            <span className="serif text-xl sm:text-2xl font-bold tracking-tighter text-stone-900">COSMOSTICS</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors hover:text-stone-900 ${
                  currentPage === item.id ? 'text-stone-900' : 'text-stone-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-5">
            <button 
              onClick={handleSearchClick}
              className="text-stone-500 hover:text-stone-900 transition-colors"
            >
              <Search size={20} />
            </button>
            
            <button 
              onClick={() => onNavigate('cart')}
              className="relative text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' && (
                  <button 
                    onClick={() => onNavigate('admin')}
                    className="text-stone-500 hover:text-stone-900 transition-colors flex items-center space-x-1"
                  >
                    <LayoutDashboard size={20} />
                    <span className="text-xs font-medium">Admin</span>
                  </button>
                )}
                <div className="group relative">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full border border-stone-200"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg py-1 hidden group-hover:block">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-semibold text-stone-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => onNavigate('orders')}
                      className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      My Orders
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
              >
                <User size={20} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={() => {
                handleSearchClick();
                setIsMenuOpen(false);
              }}
              className="text-stone-500 hover:text-stone-900 transition-colors"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={() => onNavigate('cart')}
              className="relative text-stone-500"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-stone-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="serif text-xl font-bold tracking-tighter text-stone-900">COSMOSTICS</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-stone-500">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left text-lg font-medium transition-colors ${
                      currentPage === item.id ? 'text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <hr className="border-stone-100" />
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
                        className="block w-full text-left text-lg font-medium text-stone-900"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button 
                      onClick={() => { onNavigate('orders'); setIsMenuOpen(false); }}
                      className="block w-full text-left text-lg font-medium text-stone-900"
                    >
                      My Orders
                    </button>
                  </>
                ) : null}
              </div>

              <div className="mt-auto pt-6 border-t border-stone-100">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-lg font-medium text-red-600"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                    className="flex items-center space-x-2 text-lg font-medium text-stone-900"
                  >
                    <User size={20} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
}

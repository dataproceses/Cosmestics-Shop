import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, CreditCard, Lock, Loader2, Smartphone } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, variantId: string | undefined, delta: number) => void;
  onRemove: (id: string, variantId: string | undefined) => void;
  onCheckout: () => void;
  onNavigate: (page: string) => void;
}

export default function Cart({ items, onUpdateQuantity, onRemove, onCheckout, onNavigate }: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'airtel'>('card');
  const [paymentDetails, setPaymentDetails] = useState({
    name: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [airtelDetails, setAirtelDetails] = useState({
    phoneNumber: ''
  });

  const subtotal = items.reduce((acc, item) => acc + (item.selectedVariant ? item.selectedVariant.price : item.price) * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onCheckout();
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-stone-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={32} className="text-stone-400" />
        </div>
        <h2 className="serif text-3xl font-bold text-stone-900 mb-4">Your cart is empty</h2>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">
          Looks like you haven't added anything to your cart yet. 
          Explore our collection and find something beautiful.
        </p>
        <button 
          onClick={() => onNavigate('shop')}
          className="bg-stone-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-stone-800 transition-all"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="serif text-4xl font-bold text-stone-900 mb-12">
        {isCheckingOut ? 'Checkout' : 'Shopping Bag'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column (Items or Payment Form) */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {!isCheckingOut ? (
              <motion.div
                key="cart-items"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {items.map((item) => (
                  <motion.div 
                    key={`${item.id}-${item.selectedVariant?.id || 'base'}`}
                    layout
                    className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-8 border-b border-stone-100"
                  >
                    <div className="w-full sm:w-24 h-48 sm:h-32 flex-shrink-0 bg-stone-100 rounded-xl overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-semibold text-stone-900 truncate pr-4">
                          {item.name} {item.selectedVariant && <span className="text-stone-500 font-normal">({item.selectedVariant.value})</span>}
                        </h3>
                        <p className="text-lg font-bold text-stone-900 whitespace-nowrap">${((item.selectedVariant ? item.selectedVariant.price : item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-stone-500 mb-4">{item.category}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-stone-200 rounded-lg p-1">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, item.selectedVariant?.id, -1)}
                            className="p-1 hover:bg-stone-100 rounded transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, item.selectedVariant?.id, 1)}
                            className="p-1 hover:bg-stone-100 rounded transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={() => onRemove(item.id, item.selectedVariant?.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors flex items-center space-x-1"
                        >
                          <Trash2 size={16} />
                          <span className="text-xs font-medium">Remove</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="payment-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">Payment Details</h2>
                    <p className="text-sm text-stone-500">Complete your purchase securely</p>
                  </div>
                </div>

                <div className="flex space-x-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${paymentMethod === 'card' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}
                  >
                    <CreditCard size={18} />
                    <span className="font-semibold text-sm">Credit Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('airtel')}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${paymentMethod === 'airtel' ? 'border-red-600 bg-red-600 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}
                  >
                    <Smartphone size={18} />
                    <span className="font-semibold text-sm">Airtel Money</span>
                  </button>
                </div>

                <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-6">
                  {paymentMethod === 'card' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Name on Card</label>
                        <input 
                          type="text" 
                          required
                          value={paymentDetails.name}
                          onChange={(e) => setPaymentDetails({...paymentDetails, name: e.target.value})}
                          placeholder="Jane Doe"
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Card Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            maxLength={19}
                            value={paymentDetails.cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                              setPaymentDetails({...paymentDetails, cardNumber: formatted});
                            }}
                            placeholder="0000 0000 0000 0000"
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all font-mono"
                          />
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Expiry Date</label>
                          <input 
                            type="text" 
                            required
                            maxLength={5}
                            value={paymentDetails.expiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length >= 2) {
                                val = val.slice(0, 2) + '/' + val.slice(2, 4);
                              }
                              setPaymentDetails({...paymentDetails, expiry: val});
                            }}
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">CVC</label>
                          <input 
                            type="text" 
                            required
                            maxLength={4}
                            value={paymentDetails.cvc}
                            onChange={(e) => setPaymentDetails({...paymentDetails, cvc: e.target.value.replace(/\D/g, '')})}
                            placeholder="123"
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Airtel Mobile Number</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          required
                          value={airtelDetails.phoneNumber}
                          onChange={(e) => setAirtelDetails({...airtelDetails, phoneNumber: e.target.value.replace(/\D/g, '')})}
                          placeholder="e.g. 099 123 4567"
                          className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-mono"
                        />
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      </div>
                      <p className="text-xs text-stone-500 ml-1 mt-2">You will receive a prompt on your phone to enter your PIN and confirm the payment.</p>
                    </div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 rounded-2xl p-8 sticky top-24">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-[10px] text-stone-400 italic">
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
              <div className="pt-4 border-t border-stone-200 flex justify-between text-xl font-bold text-stone-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            {!isCheckingOut ? (
              <button 
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center space-x-3"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <div className="space-y-3">
                <button 
                  type="submit"
                  form="payment-form"
                  disabled={isProcessing}
                  className={`w-full text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-3 disabled:opacity-70 ${paymentMethod === 'airtel' ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-900 hover:bg-stone-800'}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Pay ${total.toFixed(2)}</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setIsCheckingOut(false)}
                  disabled={isProcessing}
                  className="w-full bg-white text-stone-900 border border-stone-200 py-3 rounded-xl font-bold hover:bg-stone-50 transition-all disabled:opacity-50"
                >
                  Back to Cart
                </button>
              </div>
            )}
            
            <p className="text-center text-xs text-stone-400 mt-6">
              Secure checkout powered by Cosmetics. <br />
              Free returns within 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

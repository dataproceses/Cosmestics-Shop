import React from 'react';
import { X, Star, ShoppingBag, Send } from 'lucide-react';
import { Product, Review, UserProfile, ProductVariant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  user: UserProfile | null;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart, user }: ProductModalProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | undefined>();

  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(undefined);
    }
  }, [product]);

  React.useEffect(() => {
    if (!product || !isOpen) return;

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', product.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => unsubscribe();
  }, [product, isOpen]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date().toISOString()
      });
      setNewComment('');
      setNewRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const getFallbackImage = (id: string) => `https://picsum.photos/seed/${id}/800/1000`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-stone-500 hover:text-stone-900 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Product Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-stone-100 relative shrink-0">
              <img 
                src={product.imageUrl || getFallbackImage(product.id)} 
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== getFallbackImage(product.id)) {
                    target.src = getFallbackImage(product.id);
                  }
                }}
              />
            </div>

            {/* Product Details & Reviews */}
            <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 overflow-y-auto">
              <div className="p-6 md:p-8 border-b border-stone-100 shrink-0">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{product.category}</span>
                <h2 className="serif text-2xl md:text-3xl font-bold text-stone-900 mt-1 mb-2">{product.name}</h2>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < (reviews.length ? Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 5) ? "currentColor" : "none"} className={i >= (reviews.length ? Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 5) ? "text-stone-200" : ""} />
                    ))}
                  </div>
                  <span className="text-sm text-stone-500">({reviews.length} reviews)</span>
                </div>
                <p className="text-stone-600 mb-6 leading-relaxed">{product.description}</p>
                
                {/* Variants Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                      {product.variants[0].type}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedVariant?.id === variant.id
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {variant.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-stone-900">
                    ${(selectedVariant ? selectedVariant.price : product.price).toFixed(2)}
                  </span>
                  <button 
                    onClick={() => { onAddToCart(product, selectedVariant); onClose(); }}
                    disabled={(selectedVariant ? selectedVariant.stock : product.stock) <= 0}
                    className="flex items-center space-x-2 bg-stone-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={18} />
                    <span>{(selectedVariant ? selectedVariant.stock : product.stock) <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="p-6 md:p-8 bg-stone-50 flex-1">
                <h3 className="serif text-xl font-bold text-stone-900 mb-6">Customer Reviews</h3>
                
                {/* Review Form */}
                {user ? (
                  <form onSubmit={handleSubmitReview} className="mb-8 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex items-center space-x-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`p-1 transition-colors ${star <= newRating ? 'text-amber-400' : 'text-stone-200 hover:text-amber-200'}`}
                        >
                          <Star size={20} fill={star <= newRating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this product..."
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all text-sm resize-none h-24 mb-3"
                      required
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="flex items-center space-x-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>Post Review</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                    Please sign in to leave a review.
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-stone-500 text-sm text-center py-4">No reviews yet. Be the first to review!</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-stone-900 text-sm">{review.userName}</p>
                            <p className="text-xs text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-stone-200" : ""} />
                            ))}
                          </div>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

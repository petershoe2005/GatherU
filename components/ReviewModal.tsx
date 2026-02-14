
import React, { useState } from 'react';

interface ReviewModalProps {
    sellerName: string;
    itemTitle: string;
    onSubmit: (rating: number, comment: string) => void;
    onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ sellerName, itemTitle, onSubmit, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        await onSubmit(rating, comment);
        setIsSubmitting(false);
    };

    const displayRating = hoverRating || rating;

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1a2332] rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
                {/* Handle */}
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                        <span className="material-icons-round text-3xl">star</span>
                    </div>
                    <h2 className="text-lg font-bold">Rate Your Experience</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        How was your transaction with <span className="text-primary font-semibold">{sellerName}</span>?
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{itemTitle}</p>
                </div>

                {/* Star Rating */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-125 active:scale-95"
                        >
                            <span className={`material-icons-round text-4xl transition-colors ${star <= displayRating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                                }`}>
                                {star <= displayRating ? 'star' : 'star_border'}
                            </span>
                        </button>
                    ))}
                </div>
                <p className={`text-center text-xs font-bold transition-all h-5 ${displayRating > 0 ? 'text-amber-400 opacity-100' : 'opacity-0'
                    }`}>
                    {ratingLabels[displayRating]}
                </p>

                {/* Comment */}
                <div className="mt-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                        placeholder="Share details about your experience (optional)..."
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="flex-1 py-3.5 rounded-xl bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-icons-round text-sm">send</span>
                                Submit
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;


import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { fetchPublicProfile } from '../services/profileService';
import { fetchReviewsForSeller, Review } from '../services/reviewsService';

interface UserProfileScreenProps {
    userId: string;
    onBack: () => void;
    onMessage?: () => void;
    initialData?: {
        name: string;
        avatar: string;
        institution?: string;
        rating?: number;
        reviewsCount?: number;
        isVerified?: boolean;
    };
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ userId, onBack, onMessage, initialData }) => {
    const [profile, setProfile] = useState<Profile | null>(
        initialData ? {
            id: userId,
            name: initialData.name,
            avatar_url: initialData.avatar,
            institution: initialData.institution || '',
            rating: initialData.rating || 0,
            reviews_count: initialData.reviewsCount || 0,
            is_verified: initialData.isVerified || false,
            username: '', email: '', location: '', gps_radius: 5,
            accept_cash: true, bidding_alerts: true, message_alerts: true,
            created_at: '', updated_at: '',
        } as Profile : null
    );
    const [stats, setStats] = useState({ itemsSold: 0, itemsBought: 0 });
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        const load = async () => {
            const [publicData, reviewsData] = await Promise.all([
                fetchPublicProfile(userId),
                fetchReviewsForSeller(userId),
            ]);
            if (publicData.profile) setProfile(publicData.profile);
            setStats({ itemsSold: publicData.itemsSold, itemsBought: publicData.itemsBought });
            setReviews(reviewsData);
            setLoading(false);
        };
        load();
    }, [userId]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex-1 bg-background-light min-h-screen font-display flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex-1 bg-background-light min-h-screen font-display">
                <header className="sticky top-0 z-10 px-4 pt-12 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-secondary">
                        <span className="material-icons-round">arrow_back_ios</span>
                    </button>
                </header>
                <div className="py-20 text-center">
                    <span className="material-icons text-5xl text-slate-300 mb-2">person_off</span>
                    <p className="text-sm text-slate-400">User not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-background-light min-h-screen font-display pb-10">
            {/* Header / Hero */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-12 pb-20 px-4">
                <button onClick={onBack} className="absolute top-12 left-4 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors z-10">
                    <span className="material-icons-round">arrow_back_ios</span>
                </button>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
            </div>

            {/* Profile Card overlapping hero */}
            <div className="px-5 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    {/* Avatar + Name */}
                    <div className="flex flex-col items-center pt-5 px-6 pb-5">
                        <img
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            src={profile.avatar_url || 'https://picsum.photos/seed/profile/200/200'}
                            alt={profile.name}
                        />
                        <h1 className="text-xl font-bold text-secondary mt-3 text-center">{profile.name || 'User'}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {profile.institution && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="material-icons-round text-[14px]">school</span>
                                    {profile.institution}
                                </span>
                            )}
                            {profile.is_verified && (
                                <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <span className="material-icons text-[12px]">verified</span>
                                    Verified
                                </span>
                            )}
                        </div>
                        {/* Bio */}
                        {profile.bio && (
                            <p className="text-sm text-slate-500 text-center mt-3 max-w-[280px] leading-relaxed">{profile.bio}</p>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 border-t border-slate-100">
                        <div className="flex flex-col items-center py-4">
                            <span className="text-lg font-bold text-secondary">{stats.itemsSold}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sold</span>
                        </div>
                        <div className="flex flex-col items-center py-4 border-x border-slate-100">
                            <span className="text-lg font-bold text-secondary">{stats.itemsBought}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Bought</span>
                        </div>
                        <div className="flex flex-col items-center py-4">
                            <div className="flex items-center gap-1">
                                <span className="text-primary text-sm">★</span>
                                <span className="text-lg font-bold text-secondary">{(profile.rating || 0).toFixed(1)}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Rating</span>
                        </div>
                    </div>

                    {/* Message Button */}
                    {onMessage && (
                        <div className="px-6 py-4 border-t border-slate-100">
                            <button
                                onClick={onMessage}
                                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <span className="material-icons-round text-lg">chat</span>
                                Send Message
                            </button>
                        </div>
                    )}
                </div>

                {/* Member Since */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                    <span className="material-icons-round text-slate-300 text-[14px]">calendar_today</span>
                    <span className="text-[11px] text-slate-400">Member since {formatDate(profile.created_at)}</span>
                </div>

                {/* Reviews */}
                {reviews.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase px-1 mb-3">
                            Reviews ({reviews.length})
                        </h2>
                        <div className="space-y-3">
                            {reviews.map(review => (
                                <div key={review.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <img
                                            className="w-8 h-8 rounded-full object-cover border border-slate-100"
                                            src={review.reviewer_avatar || 'https://picsum.photos/seed/reviewer/50/50'}
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-secondary">{review.reviewer_name}</span>
                                                <span className="text-[10px] text-slate-400">{formatDate(review.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <span key={i} className={`text-xs ${i < review.rating ? 'text-primary' : 'text-slate-200'}`}>★</span>
                                                ))}
                                            </div>
                                            {review.comment && (
                                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{review.comment}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileScreen;

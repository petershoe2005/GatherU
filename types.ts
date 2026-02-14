
export enum AppScreen {
  VERIFY = 'verify',
  LOGIN = 'login',
  SETUP_PROFILE = 'setup_profile',
  FEED = 'feed',
  DETAILS = 'details',
  CREATE = 'create',
  BIDS = 'bids',
  DELIVERY = 'delivery',
  MESSAGES = 'messages',
  PROFILE = 'profile',
  CHAT_DETAIL = 'chat_detail',
  LIVE_STATUS = 'live_status',
  MAP_LOCATION = 'map_location',
  MY_LISTINGS = 'my_listings',
  PURCHASE_HISTORY = 'purchase_history',
  PAYMENT_METHODS = 'payment_methods',
  ACCOUNT_SETTINGS = 'account_settings',
  NOTIFICATIONS = 'notifications',
  FAVORITES = 'favorites'
}


export interface User {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  institution: string;
  avatar: string;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string;
  institution: string;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  location: string;
  gps_radius: number;
  accept_cash: boolean;
  bidding_alerts: boolean;
  message_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  seller_id?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  distance: string;
  timeLeft: string;
  images: string[];
  seller: User;
  isVerifiedSeller: boolean;
  status?: 'active' | 'winning' | 'outbid' | 'sold' | 'ended';
  currentBid: number;
  startingPrice: number;
  viewCount: number;
  activeBidders: number;
  payment_method?: string;
  ends_at?: string;
  created_at?: string;
  listing_type?: 'auction' | 'fixed' | 'both';
  buyNowPrice?: number;
  // Housing fields
  housing_type?: 'apartment' | 'room' | 'sublet' | 'house';
  lease_start?: string;
  lease_end?: string;
  rent_period?: 'month' | 'semester' | 'year' | 'total';
  is_furnished?: boolean;
  utilities_included?: boolean;
  sqft?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Bid {
  id: string;
  item_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder?: Profile;
}

export interface Conversation {
  id: string;
  item_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  // Joined data
  other_user?: Profile;
  item?: Item;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  type: 'text' | 'bid' | 'alert';
  metadata: Record<string, any>;
  created_at: string;
}

export interface Order {
  id: string;
  item_id: string | null;
  buyer_id: string;
  seller_id: string;
  final_price: number;
  platform_fee: number;
  status: 'pending' | 'delivered' | 'rated';
  rating: number | null;
  review_comment: string;
  created_at: string;
  updated_at: string;
  // Joined data
  item?: Item;
  seller?: Profile;
}

// Helper to convert DB profile to legacy User interface
export function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    name: profile.name,
    rating: profile.rating,
    reviewsCount: profile.reviews_count,
    isVerified: profile.is_verified,
    institution: profile.institution,
    avatar: profile.avatar_url || 'https://picsum.photos/seed/default/100/100',
  };
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'bid' | 'outbid' | 'message' | 'sold' | 'order' | 'system' | 'review';
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

// Helper to convert DB item row to frontend Item interface
export function dbItemToItem(row: any, sellerProfile?: Profile): Item {
  const seller: User = sellerProfile
    ? profileToUser(sellerProfile)
    : row.profiles
      ? profileToUser(row.profiles)
      : { id: row.seller_id, name: 'Unknown', rating: 0, reviewsCount: 0, isVerified: false, institution: '', avatar: '' };

  return {
    id: row.id,
    seller_id: row.seller_id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'other',
    price: Number(row.starting_price),
    currentBid: Number(row.current_bid) || Number(row.starting_price),
    startingPrice: Number(row.starting_price),
    distance: row.distance || '0.1 mi',
    timeLeft: row.time_left || '3d',
    images: row.images?.length ? row.images : ['https://picsum.photos/seed/' + row.id + '/400/300'],
    seller,
    isVerifiedSeller: seller.isVerified,
    status: row.status === 'active' ? undefined : row.status,
    viewCount: row.view_count || 0,
    activeBidders: row.active_bidders || 0,
    payment_method: row.payment_method,
    ends_at: row.ends_at,
    created_at: row.created_at,
    listing_type: row.listing_type || 'auction',
    buyNowPrice: row.buy_now_price ? Number(row.buy_now_price) : undefined,
    // Housing fields
    housing_type: row.housing_type,
    lease_start: row.lease_start,
    lease_end: row.lease_end,
    rent_period: row.rent_period,
    is_furnished: row.is_furnished,
    utilities_included: row.utilities_included,
    sqft: row.sqft,
  };
}

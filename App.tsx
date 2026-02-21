
import React, { useState, useEffect, useCallback } from 'react';
import { Item, Category, AppScreen, DraftItem, profileToUser, AppLocation } from './types';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { fetchItems, subscribeToItems } from './services/itemsService';
import { createConversation } from './services/messagesService';
import { pushRoute, parseHash, onRouteChange } from './lib/router';
import { haversineDistance } from './lib/geo';
import VerifyScreen from './components/VerifyScreen';
import LoginScreen from './components/LoginScreen';
import SetupProfileScreen from './components/SetupProfileScreen';
import FeedScreen from './components/FeedScreen';
import DetailsScreen from './components/DetailsScreen';
import CreateListingScreen from './components/CreateListingScreen';
import BidsScreen from './components/BidsScreen';
import DeliveryConfirmationScreen from './components/DeliveryConfirmationScreen';
import MessagesScreen from './components/MessagesScreen';
import ProfileScreen from './components/ProfileScreen';
import ChatDetailScreen from './components/ChatDetailScreen';
import ItemLiveStatusScreen from './components/ItemLiveStatusScreen';
import MapLocationScreen from './components/MapLocationScreen';
import MyListingsScreen from './components/MyListingsScreen';
import PurchaseHistoryScreen from './components/PurchaseHistoryScreen';
import PaymentMethodsScreen from './components/PaymentMethodsScreen';
import AccountSettingsScreen from './components/AccountSettingsScreen';
import NotificationsScreen from './components/NotificationsScreen';
import FavoritesScreen from './components/FavoritesScreen';
import LandingPage from './components/LandingPage';
import CheckoutScreen from './components/CheckoutScreen';
import UserProfileScreen from './components/UserProfileScreen';
import DepositCheckoutScreen from './components/DepositCheckoutScreen';

const AppContent: React.FC = () => {
  const { session, profile, loading, updateProfile } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LANDING);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(5);
  const [userLocation, setUserLocation] = useState<AppLocation>({ name: 'Detecting...', lat: 37.4419, lng: -122.1430 });
  const [activeDraft, setActiveDraft] = useState<DraftItem | undefined>(undefined);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<Item | null>(null);
  const [depositItem, setDepositItem] = useState<Item | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Request location on mount
  useEffect(() => {
    // If user already has a saved location in their profile, use it
    if (profile?.location && profile.location !== 'Palo Alto') {
      setUserLocation(prev => ({ ...prev, name: profile.location }));
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode to get city name
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            if (!res.ok) throw new Error('Geocode failed');
            const text = await res.text();
            if (!text) throw new Error('Empty response');
            const data = JSON.parse(text);
            const cityName = data?.address?.city || data?.address?.town || data?.address?.village || 'Current Location';

            setUserLocation({
              name: cityName,
              lat: latitude,
              lng: longitude
            });

            // Save to profile so it persists in Supabase
            if (profile && (!profile.location || profile.location === 'Palo Alto' || profile.location === 'Detecting...')) {
              updateProfile({ location: cityName }).catch(console.error);
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            setUserLocation({
              name: 'Current Location',
              lat: latitude,
              lng: longitude
            });
          }
        },
        (error) => {
          console.log('Location permission denied or error:', error);
          // Fall back to profile location or default
          if (profile?.location) {
            setUserLocation(prev => ({ ...prev, name: profile.location }));
          }
        }
      );
    }
  }, [profile?.id]);

  // Hash router: sync URL → screen
  useEffect(() => {
    const unsub = onRouteChange(({ screen, params }) => {
      setCurrentScreen(screen);
      if (params.convId) setSelectedConversationId(params.convId);
    });
    return unsub;
  }, []);

  // Determine initial screen based on auth state
  useEffect(() => {
    if (loading) return;
    if (!session) {
      // Allow user to be on LOGIN screen even if not authenticated
      const { screen } = parseHash();
      if (screen === AppScreen.LOGIN) {
        setCurrentScreen(AppScreen.LOGIN);
      } else if (screen === AppScreen.VERIFY) {
        setCurrentScreen(AppScreen.VERIFY);
      } else {
        setCurrentScreen(AppScreen.LOGIN);
        pushRoute(AppScreen.LOGIN);
      }
    } else if (profile && !profile.name) {
      setCurrentScreen(AppScreen.SETUP_PROFILE);
      pushRoute(AppScreen.SETUP_PROFILE);
    } else if (session) {
      // Check if URL has a valid hash route
      const { screen } = parseHash();
      if (screen !== AppScreen.VERIFY && screen !== AppScreen.SETUP_PROFILE && screen !== AppScreen.LOGIN && screen !== AppScreen.LANDING && screen !== AppScreen.CHECKOUT && screen !== AppScreen.DEPOSIT_CHECKOUT) {
        setCurrentScreen(screen);
      } else {
        setCurrentScreen(AppScreen.FEED);
        pushRoute(AppScreen.FEED);
      }
    }
  }, [session, profile, loading]);

  // Load items from Supabase
  useEffect(() => {
    if (currentScreen === AppScreen.FEED || currentScreen === AppScreen.DETAILS) {
      loadItems();
    }
  }, [currentScreen, profile?.institution, profile?.gps_radius, userLocation]);

  // Subscribe to realtime item changes
  useEffect(() => {
    const channel = subscribeToItems(() => {
      loadItems();
    });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadItems = async () => {
    const allItems = await fetchItems();
    if (allItems.length === 0) return;

    // Apply school + radius filtering
    if (profile && userLocation.lat && userLocation.lng) {
      const radius = profile.gps_radius || 5;
      const isStudent = profile.is_verified && !!profile.institution;

      const filtered = allItems.filter(item => {
        // Check if same school (for .edu students)
        const sameSchool = isStudent && item.seller?.institution === profile.institution;

        // Check if within radius (only for items with coordinates)
        let withinRadius = false;
        if (item.latitude != null && item.longitude != null) {
          const dist = haversineDistance(
            userLocation.lat, userLocation.lng,
            item.latitude, item.longitude
          );
          withinRadius = dist <= radius;
        }

        if (isStudent) {
          // Students see: same school items (regardless of coords) + nearby items that opted into show_nearby
          return sameSchool || (withinRadius && item.show_nearby);
        } else {
          // Local members see: only nearby items that opted into show_nearby
          return withinRadius && item.show_nearby;
        }
      });

      // If filtering results in nothing (e.g. no items have coords yet), show all for now
      setItems(filtered.length > 0 ? filtered : allItems);
    } else {
      setItems(allItems);
    }
  };

  const navigate = useCallback((screen: AppScreen, item: Item | null = null) => {
    if (item) setSelectedItem(item);
    setCurrentScreen(screen);
    // Push hash route with params
    const params: Record<string, string> = {};
    if (screen === AppScreen.DETAILS && item) params.id = item.id;
    pushRoute(screen, params);
    window.scrollTo(0, 0);
  }, []);

  const handleVerify = () => {
    setCurrentScreen(AppScreen.SETUP_PROFILE);
    pushRoute(AppScreen.SETUP_PROFILE);
  };

  const handleProfileComplete = () => {
    setCurrentScreen(AppScreen.FEED);
    pushRoute(AppScreen.FEED);
    setTimeout(() => setShowWelcome(true), 1000);
    setTimeout(() => setShowWelcome(false), 6000);
  };

  const handlePublishListing = async () => {
    await loadItems();
    setCurrentScreen(AppScreen.FEED);
    pushRoute(AppScreen.FEED);
  };

  const handleEndBidding = async (itemId: string) => {
    const { endBidding } = await import('./services/itemsService');
    await endBidding(itemId);
    await loadItems();
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => prev ? { ...prev, status: 'sold', timeLeft: 'Ended' } : null);
    }
  };

  const handleMessageSeller = useCallback(async () => {
    if (!selectedItem) return;

    if (!profile) {
      alert("Please log in to start a chat.");
      setCurrentScreen(AppScreen.LOGIN);
      pushRoute(AppScreen.LOGIN);
      return;
    }

    const sellerId = selectedItem.seller_id;
    if (!sellerId) return;

    if (sellerId === profile.id) {
      alert("You cannot chat with your own listing.");
      return;
    }

    // Demo items use fake non-UUID seller IDs — can't create a real conversation
    if (sellerId.startsWith('demo-')) {
      alert('Chat is only available for real listings. Create a listing to start chatting!');
      return;
    }

    const isDemo = selectedItem.id.startsWith('demo-');
    const itemContext = {
      title: selectedItem.title,
      price: `$${selectedItem.price}`,
      image: selectedItem.images?.[0],
    };
    const conv = await createConversation(isDemo ? null : selectedItem.id, profile.id, sellerId, itemContext);

    if (conv) {
      setSelectedConversationId(conv.id);
      setCurrentScreen(AppScreen.CHAT_DETAIL);
      pushRoute(AppScreen.CHAT_DETAIL, { convId: conv.id });
    } else {
      alert("Failed to create conversation. Please try again.");
    }
  }, [selectedItem, profile]);

  const currentUser = profile ? profileToUser(profile) : null;

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm font-semibold">Loading GatherU...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.LANDING:
        return <LandingPage onGetStarted={() => { setCurrentScreen(AppScreen.VERIFY); pushRoute(AppScreen.VERIFY); }} onLogin={() => { setCurrentScreen(AppScreen.LOGIN); pushRoute(AppScreen.LOGIN); }} />;
      case AppScreen.VERIFY:
        return <VerifyScreen onVerify={handleVerify} onLogin={() => { setCurrentScreen(AppScreen.LOGIN); pushRoute(AppScreen.LOGIN); }} />;
      case AppScreen.LOGIN:
        return <LoginScreen onLoginSuccess={handleProfileComplete} onBack={() => { setCurrentScreen(AppScreen.VERIFY); pushRoute(AppScreen.VERIFY); }} />;
      case AppScreen.SETUP_PROFILE:
        return <SetupProfileScreen onComplete={handleProfileComplete} />;
      case AppScreen.FEED:
        return (
          <>
            {showWelcome && (
              <div className="fixed top-12 left-0 right-0 z-[100] px-4 animate-in fade-in slide-in-from-top-10 duration-500">
                <div className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20 flex items-center gap-4 text-white">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-icons">celebration</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Welcome to GatherU! 🎉</h4>
                    <p className="text-[11px] text-slate-400">Your student status is verified.</p>
                  </div>
                </div>
              </div>
            )}
            <FeedScreen
              items={items}
              onSelectItem={(item) => navigate(AppScreen.DETAILS, item)}
              onNavigate={navigate}
              selectedDistance={selectedDistance}
              onDistanceChange={setSelectedDistance}
              userLocation={userLocation}
              onOpenMap={() => navigate(AppScreen.MAP_LOCATION)}
            />
          </>
        );
      case AppScreen.DETAILS:
        return selectedItem ? (
          <DetailsScreen
            item={selectedItem}
            onBack={() => { setCurrentScreen(AppScreen.FEED); pushRoute(AppScreen.FEED); }}
            onConfirmDelivery={() => navigate(AppScreen.DELIVERY, selectedItem)}
            onViewLive={() => navigate(AppScreen.LIVE_STATUS, selectedItem)}
            onEndBidding={() => handleEndBidding(selectedItem.id)}
            onBuyNow={() => { setCheckoutItem(selectedItem); setCurrentScreen(AppScreen.CHECKOUT); pushRoute(AppScreen.CHECKOUT); }}
            onMessageSeller={handleMessageSeller}
            onViewSellerProfile={() => { setSelectedUserId(selectedItem.seller_id); setCurrentScreen(AppScreen.USER_PROFILE); pushRoute(AppScreen.USER_PROFILE); }}
            onPayDeposit={() => { setDepositItem(selectedItem); setCurrentScreen(AppScreen.DEPOSIT_CHECKOUT); pushRoute(AppScreen.DEPOSIT_CHECKOUT); }}
          />
        ) : null;
      case AppScreen.CREATE:
        return (
          <CreateListingScreen
            onBack={() => {
              setActiveDraft(undefined);
              navigate(AppScreen.FEED);
            }}
            onPublish={async (itemData) => {
              setActiveDraft(undefined);
              await handlePublishListing();
            }}
            initialDraft={activeDraft}
          />
        );
      case AppScreen.BIDS:
        return <BidsScreen items={items} onNavigate={navigate} />;
      case AppScreen.MESSAGES:
        return <MessagesScreen onNavigate={navigate} onOpenChat={(convId: string) => { setSelectedConversationId(convId); setCurrentScreen(AppScreen.CHAT_DETAIL); pushRoute(AppScreen.CHAT_DETAIL, { convId }); }} />;
      case AppScreen.PROFILE:
        return <ProfileScreen onNavigate={navigate} />;
      case AppScreen.MY_LISTINGS:
        return (
          <MyListingsScreen
            onBack={() => navigate(AppScreen.PROFILE)}
            onSelectItem={(item) => navigate(AppScreen.DETAILS, item)}
            onAddListing={() => {
              setActiveDraft(undefined);
              navigate(AppScreen.CREATE);
            }}
            onEditDraft={(draft) => {
              setActiveDraft(draft);
              navigate(AppScreen.CREATE);
            }}
          />
        );
      case AppScreen.PURCHASE_HISTORY:
        return <PurchaseHistoryScreen onBack={() => navigate(AppScreen.PROFILE)} />;
      case AppScreen.PAYMENT_METHODS:
        return <PaymentMethodsScreen onBack={() => navigate(AppScreen.PROFILE)} />;
      case AppScreen.ACCOUNT_SETTINGS:
        return <AccountSettingsScreen onBack={() => navigate(AppScreen.PROFILE)} />;
      case AppScreen.DELIVERY:
        return selectedItem ? (
          <DeliveryConfirmationScreen
            item={selectedItem}
            onBack={() => navigate(AppScreen.DETAILS, selectedItem)}
            onSuccess={() => { setCurrentScreen(AppScreen.FEED); pushRoute(AppScreen.FEED); }}
          />
        ) : null;
      case AppScreen.LIVE_STATUS:
        return selectedItem ? (
          <ItemLiveStatusScreen
            item={selectedItem}
            onBack={() => navigate(AppScreen.DETAILS, selectedItem)}
            onEndBidding={() => handleEndBidding(selectedItem.id)}
          />
        ) : null;
      case AppScreen.MAP_LOCATION:
        return <MapLocationScreen currentLocation={userLocation} onBack={() => navigate(AppScreen.FEED)} onSelectLocation={(loc) => { setUserLocation(loc); navigate(AppScreen.FEED); }} />;
      case AppScreen.NOTIFICATIONS:
        return <NotificationsScreen onBack={() => navigate(AppScreen.FEED)} onNavigate={navigate} />;
      case AppScreen.FAVORITES:
        return <FavoritesScreen onBack={() => navigate(AppScreen.PROFILE)} onNavigate={(screen: AppScreen, item?: Item | null) => { if (item) setSelectedItem(item); setCurrentScreen(screen); pushRoute(screen, item ? { id: item.id } : {}); }} />;
      case AppScreen.CHAT_DETAIL:
        return <ChatDetailScreen conversationId={selectedConversationId} onBack={() => { setCurrentScreen(AppScreen.MESSAGES); pushRoute(AppScreen.MESSAGES); }} />;
      case AppScreen.CHECKOUT:
        return checkoutItem ? (
          <CheckoutScreen
            item={checkoutItem}
            onBack={() => { setCurrentScreen(AppScreen.DETAILS); pushRoute(AppScreen.DETAILS, { id: checkoutItem.id }); }}
            onSuccess={() => { setCheckoutItem(null); setCurrentScreen(AppScreen.FEED); pushRoute(AppScreen.FEED); }}
          />
        ) : null;
      case AppScreen.DEPOSIT_CHECKOUT:
        return depositItem ? (
          <DepositCheckoutScreen
            item={depositItem}
            onBack={() => { setCurrentScreen(AppScreen.DETAILS); if (depositItem) pushRoute(AppScreen.DETAILS, { id: depositItem.id }); }}
            onSuccess={() => { setDepositItem(null); setCurrentScreen(AppScreen.FEED); pushRoute(AppScreen.FEED); }}
          />
        ) : null;
      case AppScreen.USER_PROFILE:
        return selectedUserId ? (
          <UserProfileScreen
            userId={selectedUserId}
            onBack={() => { setCurrentScreen(AppScreen.DETAILS); if (selectedItem) pushRoute(AppScreen.DETAILS, { id: selectedItem.id }); }}
            onMessage={() => {
              if (selectedItem) handleMessageSeller();
            }}
            initialData={selectedItem ? {
              name: selectedItem.seller.name,
              avatar: selectedItem.seller.avatar,
              institution: selectedItem.seller.institution,
              rating: selectedItem.seller.rating,
              reviewsCount: selectedItem.seller.reviewsCount,
              isVerified: selectedItem.seller.isVerified,
            } : undefined}
          />
        ) : null;
      default:
        return <FeedScreen items={items} onSelectItem={(item) => navigate(AppScreen.DETAILS, item)} onNavigate={navigate} selectedDistance={selectedDistance} onDistanceChange={setSelectedDistance} userLocation={userLocation} onOpenMap={() => navigate(AppScreen.MAP_LOCATION)} />;
    }
  };

  const isLanding = currentScreen === AppScreen.LANDING;

  return (
    <div className={isLanding ? "min-h-screen bg-[#0F172A]" : "max-w-md mx-auto min-h-screen bg-background-light relative flex flex-col shadow-2xl border-x border-slate-200"}>
      {renderScreen()}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

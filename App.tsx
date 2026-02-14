
import React, { useState, useEffect, useCallback } from 'react';
import { AppScreen, Item, profileToUser } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchItems, subscribeToItems } from './services/itemsService';
import { pushRoute, parseHash, onRouteChange } from './lib/router';
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

const AppContent: React.FC = () => {
  const { session, profile, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.VERIFY);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(5);
  const [userLocation, setUserLocation] = useState('Palo Alto');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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
      } else {
        setCurrentScreen(AppScreen.VERIFY);
        pushRoute(AppScreen.VERIFY);
      }
    } else if (profile && !profile.name) {
      setCurrentScreen(AppScreen.SETUP_PROFILE);
      pushRoute(AppScreen.SETUP_PROFILE);
    } else if (session) {
      // Check if URL has a valid hash route
      const { screen } = parseHash();
      if (screen !== AppScreen.VERIFY && screen !== AppScreen.SETUP_PROFILE && screen !== AppScreen.LOGIN) {
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
  }, [currentScreen]);

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
    const data = await fetchItems();
    if (data.length > 0) {
      setItems(data);
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
      case AppScreen.VERIFY:
        return <VerifyScreen onVerify={handleVerify} onSkip={() => { setCurrentScreen(AppScreen.FEED); pushRoute(AppScreen.FEED); }} onLogin={() => { setCurrentScreen(AppScreen.LOGIN); pushRoute(AppScreen.LOGIN); }} />;
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
          />
        ) : null;
      case AppScreen.CREATE:
        return <CreateListingScreen onBack={() => { setCurrentScreen(AppScreen.FEED); pushRoute(AppScreen.FEED); }} onPublish={handlePublishListing} />;
      case AppScreen.BIDS:
        return <BidsScreen items={items} onNavigate={navigate} />;
      case AppScreen.MESSAGES:
        return <MessagesScreen onNavigate={navigate} onOpenChat={(convId: string) => { setSelectedConversationId(convId); setCurrentScreen(AppScreen.CHAT_DETAIL); pushRoute(AppScreen.CHAT_DETAIL, { convId }); }} />;
      case AppScreen.PROFILE:
        return <ProfileScreen onNavigate={navigate} />;
      case AppScreen.MY_LISTINGS:
        return (
          <MyListingsScreen
            items={items.filter(item => item.seller_id === profile?.id)}
            onBack={() => navigate(AppScreen.PROFILE)}
            onSelectItem={(item) => navigate(AppScreen.DETAILS, item)}
            onAddListing={() => navigate(AppScreen.CREATE)}
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
      default:
        return <FeedScreen items={items} onSelectItem={(item) => navigate(AppScreen.DETAILS, item)} onNavigate={navigate} selectedDistance={selectedDistance} onDistanceChange={setSelectedDistance} userLocation={userLocation} onOpenMap={() => navigate(AppScreen.MAP_LOCATION)} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background-light relative flex flex-col shadow-2xl border-x border-slate-200">
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

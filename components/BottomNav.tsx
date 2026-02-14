import React from 'react';
import { AppScreen } from '../types';

interface BottomNavProps {
    currentScreen: AppScreen;
    onNavigate: (screen: AppScreen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
    const navItems = [
        { screen: AppScreen.FEED, icon: 'home', label: 'Explore' },
        { screen: AppScreen.BIDS, icon: 'gavel', label: 'My Bids' },
        { screen: AppScreen.CREATE, icon: 'add_circle', label: 'Sell', isPrimary: true },
        { screen: AppScreen.MESSAGES, icon: 'chat', label: 'Chats' },
        { screen: AppScreen.PROFILE, icon: 'person', label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-secondary-dark/95 backdrop-blur-lg border-t border-white/5 px-2 pb-safe pt-2 z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto relative px-2">
                {navItems.map((item) => {
                    const isActive = currentScreen === item.screen;

                    if (item.isPrimary) {
                        return (
                            <button
                                key={item.screen}
                                onClick={() => onNavigate(item.screen)}
                                className="relative -top-5"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center transform transition-transform active:scale-95 border-4 border-background-dark">
                                    <span className="material-icons-round text-background-dark text-2xl font-bold">{item.icon}</span>
                                </div>
                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.screen}
                            onClick={() => onNavigate(item.screen)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <div className={`transition-all duration-300 ${isActive ? 'transform -translate-y-1' : ''}`}>
                                <span className={`material-icons-round text-2xl ${isActive ? 'font-bold' : ''}`}>{item.icon}</span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="w-1 h-1 bg-primary rounded-full absolute bottom-2 transition-all"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;


import React, { useEffect } from 'react';
import { AppScreen } from '../types';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    useEffect(() => {
        // Add custom font for landing page
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); }
    }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-['Space_Grotesk'] overflow-x-hidden selection:bg-[#FF6B00] selection:text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#FF6B00] opacity-[0.08] blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6] opacity-[0.08] blur-[120px]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Navigation */}
                <nav className="flex items-center justify-between py-6 md:py-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <img src="/GatherU_Transparent_Logo.png" alt="GatherU" className="w-[30px] h-6 object-contain" />
                        </div>
                        <span className="text-xl md:text-2xl font-bold tracking-tight">GatherU</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onLogin}
                            className="text-sm md:text-base font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-sm md:text-base transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get Started
                        </button>
                    </div>
                </nav>

                {/* Hero Section */}
                <main className="mt-12 md:mt-24 lg:mt-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs md:text-sm font-medium text-slate-300 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Launching at Top 50 Campuses
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            The Future of <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF9F2E]">
                                Campus Commerce
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            The exclusive marketplace for verified students. Buy, sell, and auction textbooks, furniture, and tickets safely within your campus bubble.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-lg transition-all shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                            >
                                Join Waitlist
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all backdrop-blur-sm flex items-center justify-center gap-2">
                                <span className="material-icons-round text-xl">play_circle</span>
                                Watch Demo
                            </button>
                        </div>
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0F172A] bg-slate-700 overflow-hidden">
                                        <img src={`https://picsum.photos/seed/${i + 55}/100/100`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <p>Trusted by 2,000+ students</p>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none animate-in fade-in zoom-in-95 duration-1000 delay-300">
                        {/* Mockup Container */}
                        <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                            <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-[#0F172A]">
                                {/* Simplified App UI for Mockup */}
                                <img src="/campus_hero_1770931905600.png" alt="App Preview" className="w-full h-full object-cover opacity-90" />
                            </div>
                        </div>
                        {/* Floating Elements */}
                        <div className="absolute top-[20%] -right-12 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <span className="material-icons-round">gavel</span>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Winning Bid</div>
                                    <div className="text-sm font-bold text-white">$45.00</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-[20%] -left-12 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl animate-bounce duration-[4000ms] delay-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                    <span className="material-icons-round">inventory_2</span>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">New Listing</div>
                                    <div className="text-sm font-bold text-white">Calculus 2</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Features Grid */}
                <section className="py-24 grid md:grid-cols-3 gap-8">
                    {[
                        { icon: 'school', title: 'Verified Students', desc: 'No strangers, no scams. Only users with a valid .edu email can join.' },
                        { icon: 'gavel', title: 'Live Auctions', desc: 'Get the best price for your items through our competitive bidding system.' },
                        { icon: 'map', title: 'Campus Radius', desc: 'Find items within walking distance on your specific campus map.' }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-3xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] mb-4">
                                <span className="material-icons-round text-2xl">{feature.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-sm">
                    <p>© 2026 GatherU. Built for students, by students.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;

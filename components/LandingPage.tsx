
import React, { useEffect, useState } from 'react';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        // Add custom font
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.head.removeChild(link);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-['Space_Grotesk'] overflow-x-hidden selection:bg-[#FF6B00] selection:text-white">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#FF6B00] opacity-[0.06] blur-[120px] animate-pulse duration-[4000ms]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6] opacity-[0.06] blur-[120px] animate-pulse duration-[5000ms] delay-1000"></div>
                <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500 opacity-[0.04] blur-[100px]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20"></div>
            </div>

            <div className="relative z-10 font-sans">
                {/* Navigation */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/80 backdrop-blur-lg border-b border-white/5 py-4' : 'py-6 md:py-8'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={onGetStarted}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#FF9F2E] p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center">
                                    <img src="/GatherU_Transparent_Logo.png" alt="GatherU" className="w-[24px] h-[24px] object-contain" />
                                </div>
                            </div>
                            <span className="text-xl md:text-2xl font-bold tracking-tight font-['Space_Grotesk']">GatherU</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onLogin}
                                className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                Log In
                            </button>
                            <button
                                onClick={onGetStarted}
                                className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Get App
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm font-medium text-slate-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Now Live at Top 50 Campuses
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8 font-['Space_Grotesk'] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                Connect Seamlessly <br />
                                with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF9F2E]">GatherU</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                Discover and optimize your networking potential. The exclusive marketplace for verified students to buy, sell, and connect safely.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <button
                                    onClick={onGetStarted}
                                    className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-lg transition-all shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-round">download</span>
                                    Download App
                                </button>
                                <button
                                    onClick={() => window.open('https://youtube.com', '_blank')}
                                    className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-medium text-lg transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <span className="material-icons-round text-sm">play_arrow</span>
                                    </span>
                                    Watch Demo
                                </button>
                            </div>

                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F172A] bg-slate-700 overflow-hidden ring-2 ring-white/5">
                                            <img src={`https://picsum.photos/seed/${i + 88}/100/100`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex text-amber-400 mb-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <span key={i} className="material-icons-round text-base">star</span>)}
                                    </div>
                                    <p className="font-medium text-slate-400">Trusted by 2,000+ students</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Hero Image */}
                        <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none perspective-[2000px] animate-in fade-in zoom-in-95 duration-1000 delay-300">
                            <div className="relative mx-auto transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out preserve-3d">
                                {/* Glow behind phone */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B00] to-purple-600 rounded-[3rem] blur-[60px] opacity-40"></div>

                                {/* Phone Frame */}
                                <div className="relative bg-[#1E293B] border-[8px] border-slate-800 rounded-[3rem] shadow-2xl h-[700px] w-[350px] overflow-hidden mx-auto">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-slate-800 rounded-b-xl z-20"></div>

                                    {/* Screen Content */}
                                    <div className="w-full h-full bg-[#0F172A] relative overflow-hidden">
                                        {/* Status Bar */}
                                        <div className="h-12 w-full flex justify-between items-center px-6 pt-2 text-xs font-semibold">
                                            <span>9:41</span>
                                            <div className="flex gap-1.5">
                                                <span className="material-icons-round text-xs">signal_cellular_4_bar</span>
                                                <span className="material-icons-round text-xs">wifi</span>
                                                <span className="material-icons-round text-xs">battery_full</span>
                                            </div>
                                        </div>

                                        {/* App Header */}
                                        <div className="px-6 pb-4">
                                            <h3 className="text-xl font-bold font-['Space_Grotesk']">Discover</h3>
                                            <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                                {['All', 'Books', 'Tickets', 'Furniture'].map((cat, i) => (
                                                    <span key={i} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${i === 0 ? 'bg-[#FF6B00] text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Feed Items (Mock) */}
                                        <div className="px-4 space-y-4">
                                            <div className="bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                                                <div className="h-32 bg-slate-700 rounded-xl mb-3 relative overflow-hidden">
                                                    <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000" alt="Book" className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold">$45</div>
                                                </div>
                                                <h4 className="font-bold text-sm">Calculus: Early Transcendentals</h4>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-slate-400">Stanford Univ.</span>
                                                    <button className="px-3 py-1 bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-bold rounded-lg">Bid</button>
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                                                <div className="h-32 bg-slate-700 rounded-xl mb-3 relative overflow-hidden">
                                                    <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000" alt="Ticket" className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold">$120</div>
                                                </div>
                                                <h4 className="font-bold text-sm">Football vs USC Front Row</h4>
                                            </div>
                                        </div>

                                        {/* Floating Elements on phone */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-6 shadow-2xl">
                                            <span className="material-icons-round text-[#FF6B00]">home</span>
                                            <span className="material-icons-round text-slate-500">search</span>
                                            <div className="w-10 h-10 -mt-8 bg-[#FF6B00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                                                <span className="material-icons-round text-white">add</span>
                                            </div>
                                            <span className="material-icons-round text-slate-500">chat_bubble</span>
                                            <span className="material-icons-round text-slate-500">person</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Notification Cards */}
                                <div className="absolute top-[20%] -right-8 bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700 shadow-2xl animate-bounce duration-[3000ms] w-48 z-30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <span className="material-icons-round text-xl">gavel</span>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Winning Bid</div>
                                            <div className="text-sm font-bold text-white">Math 101 Notes</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-[20%] -left-8 bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700 shadow-2xl animate-bounce duration-[4000ms] delay-700 w-52 z-30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <span className="material-icons-round text-xl">verified</span>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Verified Student</div>
                                            <div className="text-sm font-bold text-white">john.d@stanford.edu</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Slogans / Mission Section */}
                <section className="py-24 bg-slate-900/50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <span className="material-icons-round text-[#FF6B00] text-5xl mb-6 animate-pulse">bolt</span>
                        <h2 className="text-4xl md:text-6xl font-bold font-['Space_Grotesk'] mb-8">
                            "Discover and optimize your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">networking potential</span>"
                        </h2>
                        <div className="h-1 w-24 bg-[#FF6B00] mx-auto rounded-full mb-8"></div>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            GatherU is more than just a marketplace. It's the ecosystem for your campus life.
                            <strong className="text-white"> Connect seamlessly</strong> with peers, trade safely, and build your reputation.
                        </p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk'] mb-6">Why Students Choose GatherU</h2>
                        <p className="text-slate-400 text-lg">Safe, verified, and exclusive to your community.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: 'verified_user',
                                title: 'Verified Students Only',
                                desc: 'No strangers. No bots. We verify every user via their .edu email to ensure a safe trading environment.',
                                color: 'blue'
                            },
                            {
                                icon: 'gavel',
                                title: 'Live Auctions',
                                desc: 'Don\'t settle for lowball offers. Let the market decide the value of your items with real-time bidding.',
                                color: 'orange'
                            },
                            {
                                icon: 'place',
                                title: 'Campus Radius',
                                desc: 'Hyper-local trading. Find items within walking distance on your campus. Meet up safely on school grounds.',
                                color: 'emerald'
                            },
                            {
                                icon: 'chat',
                                title: 'Instant Messaging',
                                desc: 'Chat instantly with sellers and buyers without sharing your personal phone number.',
                                color: 'purple'
                            },
                            {
                                icon: 'history',
                                title: 'Purchase Protection',
                                desc: 'Secure exchanges with our delivery confirmation system. Money is only released when you get your item.',
                                color: 'pink'
                            },
                            {
                                icon: 'groups',
                                title: 'Community Driven',
                                desc: 'Build your reputation score with every successful trade. Become a trusted seller on campus.',
                                color: 'cyan'
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="group p-8 rounded-[2rem] bg-slate-800/20 border border-slate-700/50 hover:bg-slate-800/40 transition-all hover:-translate-y-1 duration-300">
                                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center text-${feature.color}-500 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <span className="material-icons-round text-3xl">{feature.icon}</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 font-['Space_Grotesk']">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed font-sans">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Mobile Download CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#FF6B00] skew-y-3 z-0 transform origin-bottom-left scale-150 opacity-10"></div>
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[3rem] p-12 md:p-20 border border-slate-700 shadow-2xl relative overflow-hidden group">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF6B00] opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-700"></div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] mb-6">
                                        Ready to optimize your <br /> campus experience?
                                    </h2>
                                    <p className="text-lg text-slate-400 mb-10 max-w-md mx-auto md:mx-0">
                                        Join thousands of students buying, selling, and connecting on GatherU today.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                        <button onClick={onGetStarted} className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-8" />
                                        </button>
                                        <button onClick={onGetStarted} className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-8" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-center md:justify-end">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-[#FF6B00] blur-2xl opacity-20 animate-pulse"></div>
                                        <img src="/GatherU_Official_Icon.png" alt="App Icon" className="w-48 h-48 rounded-[3rem] shadow-2xl relative z-10 transform -rotate-12 group-hover:-rotate-6 transition-transform duration-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-800 bg-[#020617] pt-16 pb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                            <div className="col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-6">
                                    <img src="/GatherU_Transparent_Logo.png" alt="GatherU" className="w-8 h-8 opacity-80" />
                                    <span className="text-xl font-bold font-['Space_Grotesk']">GatherU</span>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    The safest way to buy and sell on campus. Verified students only.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-4 text-slate-300">Product</h4>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Features</a></li>
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Safety</a></li>
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Verified Status</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-4 text-slate-300">Company</h4>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">About Us</a></li>
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Careers</a></li>
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Brand Assets</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-4 text-slate-300">Legal</h4>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-[#FF6B00] transition-colors">Terms of Service</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
                            <p>© 2026 GatherU Inc. All rights reserved.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-slate-400">Twitter</a>
                                <a href="#" className="hover:text-slate-400">Instagram</a>
                                <a href="#" className="hover:text-slate-400">LinkedIn</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;


import React, { useState } from 'react';
import { Item } from '../types';
import { useAuth } from '../contexts/useAuth';
import { createItem } from '../services/itemsService';
import ImageUploader from './ImageUploader';

interface CreateListingScreenProps {
  onBack: () => void;
  onPublish: (itemData: Partial<Item>) => void;
}

const CreateListingScreen: React.FC<CreateListingScreenProps> = ({ onBack, onPublish }) => {

  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [category, setCategory] = useState('tech');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [listingType, setListingType] = useState<'auction' | 'fixed' | 'both'>('auction');
  const [bidIncrement, setBidIncrement] = useState('1');

    const [isPublishing, setIsPublishing] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [depositPercentage, setDepositPercentage] = useState(10);
  const [showNearby, setShowNearby] = useState(false);

  // Housing specific state
  const [housingType, setHousingType] = useState<'apartment' | 'room' | 'sublet' | 'house'>('sublet');
  const [rentPeriod, setRentPeriod] = useState<'month' | 'semester' | 'year' | 'total'>('month');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [isFurnished, setIsFurnished] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [sqft, setSqft] = useState('');

  const handlePublish = async () => {
    if (!title || !user) return;

    // Validation
    if (category === 'housing') {
      if (!buyNowPrice || !leaseStart || !leaseEnd) return;
    } else {
      if (listingType === 'auction' && !startingBid) return;
      if (listingType === 'fixed' && !buyNowPrice) return;
      if (listingType === 'both' && (!startingBid || !buyNowPrice)) return;
    }

    setIsPublishing(true);

    const startPrice = (category === 'housing' || listingType === 'fixed')
      ? parseFloat(buyNowPrice)
      : parseFloat(startingBid);

      const itemData: any = {
        seller_id: user.id,
        title,
        description,
        category: category.toLowerCase(),
        starting_price: startPrice,
        images: uploadedImages.length > 0 ? uploadedImages : ['https://picsum.photos/seed/' + title.replace(/\s/g, '-') + '/400/300'],
        payment_method: paymentMethod,
        listing_type: category === 'housing' ? 'fixed' : listingType,
          deposit_percentage: paymentMethod === 'online' ? depositPercentage : 10,
          show_nearby: showNearby,
      };

    if (category === 'housing') {
      itemData.housing_type = housingType;
      itemData.rent_period = rentPeriod;
      itemData.lease_start = leaseStart;
      itemData.lease_end = leaseEnd;
      itemData.is_furnished = isFurnished;
      itemData.utilities_included = utilitiesIncluded;
      itemData.buy_now_price = parseFloat(buyNowPrice);
      if (sqft) itemData.sqft = parseInt(sqft);
    } else if (listingType !== 'auction') {
      itemData.buy_now_price = parseFloat(buyNowPrice);
    }

    if (listingType !== 'fixed') {
      itemData.bid_increment = parseFloat(bidIncrement) || 1;
    }

    // Attach user's current location for radius-based feed filtering
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
      );
      itemData.latitude = pos.coords.latitude;
      itemData.longitude = pos.coords.longitude;
    } catch {
      // Location unavailable — item will only show for same-school users
    }

      try {
        const newItem = await createItem(itemData);
        if (newItem) onPublish(newItem);
      } catch (err) {
        console.error('Failed to publish listing:', err);
      } finally {
        setIsPublishing(false);
      }
    };

  const isValid = title && (
    (category === 'housing' && buyNowPrice && leaseStart && leaseEnd) ||
    (category !== 'housing' && (
      (listingType === 'auction' && startingBid) ||
      (listingType === 'fixed' && buyNowPrice) ||
      (listingType === 'both' && startingBid && buyNowPrice)
    ))
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-200">
        <button onClick={onBack} className="text-secondary font-medium text-sm">Cancel</button>
        <h1 className="text-lg font-bold text-secondary">New Listing</h1>
        <button className="text-primary font-bold text-sm">Save Draft</button>
      </header>

      <form className="flex-1 overflow-y-auto pb-32">
        <section className="p-4">
          <ImageUploader images={uploadedImages} onImagesChange={setUploadedImages} maxImages={5} />
        </section>

        <section className="px-4 py-2 space-y-4">
          <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Item Title <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 text-sm transition-all text-secondary placeholder-slate-400"
              placeholder={category === 'housing' ? "e.g. Sunny Room near Campus" : "e.g. MacBook Pro 2021 M1 Pro"}
              required
              type="text"
            />
          </div>
          <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Category <span className="text-red-500">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 text-sm appearance-none text-secondary"
            >
              <option value="tech">Electronics</option>
              <option value="textbooks">Textbooks</option>
              <option value="furniture">Furniture</option>
              <option value="apparel">Clothing</option>
              <option value="housing">Housing / Apartments</option>
              <option value="other">Other</option>
            </select>
          </div>

          {category === 'housing' && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Details</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select
                    value={housingType} onChange={(e) => setHousingType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg text-sm text-secondary"
                  >
                    <option value="sublet">Sublet</option>
                    <option value="room">Room</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sq Ft (Optional)</label>
                  <input
                    type="number" value={sqft} onChange={e => setSqft(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg text-sm text-secondary"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lease Start</label>
                  <input
                    type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg text-sm text-secondary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lease End</label>
                  <input
                    type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg text-sm text-secondary"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFurnished} onChange={e => setIsFurnished(e.target.checked)} className="rounded text-primary focus:ring-primary bg-slate-800 border-transparent" />
                  <span className="text-xs font-medium">Furnished</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={utilitiesIncluded} onChange={e => setUtilitiesIncluded(e.target.checked)} className="rounded text-primary focus:ring-primary bg-slate-800 border-transparent" />
                  <span className="text-xs font-medium">Utilities Inc.</span>
                </label>
              </div>
            </div>
          )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Description</label>
              </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 text-sm resize-none transition-all text-secondary placeholder-slate-400"
              placeholder={category === 'housing' ? "Describe amenities, roommates, location..." : "Describe the item condition, features, or reasons for selling..."}
              rows={3}
            ></textarea>
          </div>
        </section>

        {/* Listing Type / Pricing Section */}
        {category !== 'housing' ? (
          <>
            <section className="mt-4 px-4 py-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 ml-1">Listing Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'auction' as const, icon: 'gavel', label: 'Auction' },
                  { value: 'fixed' as const, icon: 'sell', label: 'Fixed Price' },
                  { value: 'both' as const, icon: 'flash_on', label: 'Both' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setListingType(opt.value)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${listingType === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-500 bg-white'
                      }`}
                  >
                    <span className="material-icons-round text-xl">{opt.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="px-4 py-4 bg-primary/5 border-y border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-primary">
                  {listingType === 'fixed' ? 'sell' : 'gavel'}
                </span>
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
                  {listingType === 'fixed' ? 'Pricing' : listingType === 'both' ? 'Auction + Buy Now' : 'Auction Settings'}
                </h2>
              </div>
              <div className={`grid ${listingType === 'both' ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                {(listingType === 'auction' || listingType === 'both') && (
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Starting Bid <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-8 pr-4 text-sm font-bold text-secondary"
                        placeholder="0.00"
                        type="number"
                      />
                    </div>
                  </div>
                )}
                {(listingType === 'fixed' || listingType === 'both') && (
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        {listingType === 'both' ? 'Buy Now Price' : 'Price'} <span className="text-red-500">*</span>
                      </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        value={buyNowPrice}
                        onChange={(e) => setBuyNowPrice(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-8 pr-4 text-sm font-bold text-secondary"
                        placeholder="0.00"
                        type="number"
                      />
                    </div>
                  </div>
                )}
                {listingType !== 'fixed' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Duration</label>
                    <select className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 text-sm appearance-none text-secondary">
                      <option>1 Day</option>
                      <option>3 Days</option>
                      <option>5 Days</option>
                      <option>1 Week</option>
                    </select>
                  </div>
                )}
                {listingType !== 'fixed' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Bid Increment</label>
                    <select
                      value={bidIncrement}
                      onChange={(e) => setBidIncrement(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 text-sm appearance-none text-secondary"
                    >
                      <option value="1">$1</option>
                      <option value="2">$2</option>
                      <option value="5">$5</option>
                      <option value="10">$10</option>
                      <option value="25">$25</option>
                      <option value="50">$50</option>
                      <option value="100">$100</option>
                    </select>
                  </div>
                )}
              </div>
              {listingType === 'both' && (
                <p className="text-[10px] text-slate-500 mt-3 ml-1 flex items-center gap-1">
                  <span className="material-icons-round text-[12px] text-primary">info</span>
                  Buyers can bid or purchase instantly at the buy-now price
                </p>
              )}
            </section>
          </>
        ) : (
          /* Housing Pricing */
          <section className="px-4 py-4 bg-primary/5 border-y border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-icons-round text-primary">payments</span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Rent & Terms</h2>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Rent Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    value={buyNowPrice}
                    onChange={(e) => setBuyNowPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-8 pr-4 text-sm font-bold text-secondary"
                    placeholder="0.00"
                    type="number"
                  />
                </div>
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Per</label>
                <select
                  value={rentPeriod} onChange={(e) => setRentPeriod(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-2 text-sm text-secondary"
                >
                  <option value="month">Month</option>
                  <option value="semester">Semester</option>
                  <option value="year">Year</option>
                  <option value="total">Total</option>
                </select>
              </div>
            </div>
          </section>
        )}

        <section className="px-4 py-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 ml-1">Preferred Payment</label>
            <div className="flex gap-4">
              <button
                className={`flex-1 py-4 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500'}`}
                type="button"
                onClick={() => setPaymentMethod('cash')}
              >
                <span className="material-icons-round text-2xl">payments</span>
                <span className="text-xs font-black uppercase tracking-widest">Cash</span>
              </button>
              <button
                  className={`flex-1 py-4 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === 'online' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500'}`}
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                >
                  <span className="material-icons-round text-2xl">qr_code_2</span>
                  <span className="text-xs font-black uppercase tracking-widest">Online</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'online' && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-icons-round text-primary text-lg">account_balance</span>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Deposit Requirement</h3>
                </div>
                <p className="text-[11px] text-slate-500">Buyers must pay a deposit when they win. Funds are held by GatherU until delivery is confirmed.</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Deposit Percentage</span>
                    <span className="text-sm font-black text-primary">{depositPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={depositPercentage}
                    onChange={(e) => setDepositPercentage(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>5%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </div>
                {(startingBid || buyNowPrice) && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Estimated deposit</span>
                    <span className="text-sm font-bold text-secondary">
                      ${((parseFloat(startingBid || buyNowPrice || '0') * depositPercentage) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-icons-round text-lg">near_me</span>
              </div>
              <div>
                  <h3 className="text-sm font-bold leading-tight">Location</h3>
                  <p className="text-[11px] text-slate-500">
                    {category === 'housing' ? 'Show detailed location' : 'Also show to nearby users'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showNearby}
                    onChange={e => setShowNearby(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
            </div>
            {category !== 'housing' && (
              <div className="flex items-start gap-2 px-1 mt-2">
                <span className="material-icons-round text-sm text-amber-500 mt-0.5">info</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your listing is shown to students at your institution by default. Enable this to also reach nearby users outside your institution.
                </p>
              </div>
            )}
          </section>
      </form>

      <footer className="p-4 bg-white border-t border-slate-200">
        <button
          onClick={handlePublish}
          disabled={!isValid || isPublishing}
          className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {isPublishing ? (
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
          ) : (
            <>
              <span>
                {category === 'housing' ? 'List Housing' : listingType === 'fixed' ? 'List for Sale' : 'Publish Listing'}
              </span>
              <span className="material-icons-round text-sm">rocket_launch</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default CreateListingScreen;

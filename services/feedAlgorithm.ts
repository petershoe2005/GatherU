import { supabase } from '../lib/supabase';
import { Item } from '../types';

// ─────────────────────────────────────────────
// SCORING
// Each item gets a composite score:
//   boost       +1000  (paid, active)
//   engagement  0–300  (views + bids, log-normalised)
//   urgency     0–200  (ends within 24 h)
//   personalis. 0–150  (category matches user interest)
//   freshness   0–100  (newer = higher)
// ─────────────────────────────────────────────

function timeToMs(timeLeft: string): number {
  if (!timeLeft || timeLeft === 'Ended') return 0;
  const parts = timeLeft.match(/(\d+)\s*([dhm])/gi) || [];
  let ms = 0;
  for (const part of parts) {
    const num = parseInt(part);
    if (/d/i.test(part)) ms += num * 86400000;
    else if (/h/i.test(part)) ms += num * 3600000;
    else if (/m/i.test(part)) ms += num * 60000;
  }
  return ms;
}

function engagementScore(item: Item): number {
  const views = item.viewCount || 0;
  const bids = item.activeBidders || 0;
  // log-normalise so viral items don't dominate
  return Math.min(300, Math.log1p(views) * 20 + Math.log1p(bids) * 40);
}

function urgencyScore(item: Item): number {
  if (item.listing_type === 'fixed' || item.category === 'housing') return 0;
  const ms = item.ends_at
    ? new Date(item.ends_at).getTime() - Date.now()
    : timeToMs(item.timeLeft);
  if (ms <= 0) return 0;
  const hours = ms / 3600000;
  if (hours <= 1) return 200;
  if (hours <= 6) return 160;
  if (hours <= 24) return 100;
  return 0;
}

function freshnessScore(item: Item): number {
  if (!item.created_at) return 0;
  const ageHours = (Date.now() - new Date(item.created_at).getTime()) / 3600000;
  return Math.max(0, 100 - ageHours * 0.5); // decays to 0 after ~8 days
}

export function scoreItem(
  item: Item,
  interestMap: Record<string, number>
): number {
  const boost = item.is_boosted ? 1000 : 0;
  const engagement = engagementScore(item);
  const urgency = urgencyScore(item);
  const interest = Math.min(150, (interestMap[item.category] || 0) * 15);
  const freshness = freshnessScore(item);
  return boost + engagement + urgency + interest + freshness;
}

// ─────────────────────────────────────────────
// INTEREST MAP
// ─────────────────────────────────────────────

export async function fetchUserInterests(
  userId: string
): Promise<Record<string, number>> {
  if (!userId) return {};
  const { data } = await supabase
    .from('user_interests')
    .select('category, score')
    .eq('user_id', userId);
  if (!data) return {};
  return Object.fromEntries(data.map((r: any) => [r.category, r.score]));
}

export async function upsertInterest(
  userId: string,
  category: string,
  delta = 1
): Promise<void> {
  if (!userId || !category) return;
  // fetch current score
  const { data } = await supabase
    .from('user_interests')
    .select('id, score')
    .eq('user_id', userId)
    .eq('category', category)
    .maybeSingle();

  if (data) {
    await supabase
      .from('user_interests')
      .update({ score: (data.score || 0) + delta, updated_at: new Date().toISOString() })
      .eq('id', data.id);
  } else {
    await supabase
      .from('user_interests')
      .insert({ user_id: userId, category, score: delta });
  }
}

// ─────────────────────────────────────────────
// VIEW TRACKING
// ─────────────────────────────────────────────

export async function recordItemView(
  userId: string,
  item: Item
): Promise<void> {
  if (!userId || item.id.startsWith('demo-')) return;

  // upsert so we don't double-count the same user
  await supabase.from('item_views').upsert(
    { user_id: userId, item_id: item.id, category: item.category, viewed_at: new Date().toISOString() },
    { onConflict: 'user_id,item_id' }
  );

  // boost interest score for this category
  await upsertInterest(userId, item.category, 1);
}

// ─────────────────────────────────────────────
// SECTION BUILDERS
// All sections exclude ended / sold items
// ─────────────────────────────────────────────

export interface FeedSection {
  id: string;
  title: string;
  icon: string;
  items: Item[];
}

export function buildFeedSections(
  items: Item[],
  interestMap: Record<string, number>
): FeedSection[] {
  const active = items.filter(
    i => i.status !== 'sold' && i.status !== 'ended' && i.timeLeft !== 'Ended'
  );

  // 1. Boosted — active boosts
  const boosted = active
    .filter(i => (i as any).is_boosted)
    .sort((a, b) => scoreItem(b, interestMap) - scoreItem(a, interestMap))
    .slice(0, 4);

  // 2. Ending Soon — auctions ending within 24 h
  const endingSoon = active
    .filter(i => {
      if (i.listing_type === 'fixed' || i.category === 'housing') return false;
      const ms = i.ends_at
        ? new Date(i.ends_at).getTime() - Date.now()
        : timeToMs(i.timeLeft);
      return ms > 0 && ms <= 86400000;
    })
    .sort((a, b) => {
      const msA = a.ends_at ? new Date(a.ends_at).getTime() - Date.now() : timeToMs(a.timeLeft);
      const msB = b.ends_at ? new Date(b.ends_at).getTime() - Date.now() : timeToMs(b.timeLeft);
      return msA - msB;
    })
    .slice(0, 6);

  // 3. For You — personalised (top interest categories, scored)
  const topCategories = Object.entries(interestMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  const forYou = active
    .filter(i => topCategories.includes(i.category))
    .sort((a, b) => scoreItem(b, interestMap) - scoreItem(a, interestMap))
    .slice(0, 8);

  // 4. Popular Near You — highest engagement score
  const popular = active
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 8);

  // 5. New Arrivals — posted in last 48 h
  const cutoff = Date.now() - 48 * 3600000;
  const newArrivals = active
    .filter(i => i.created_at && new Date(i.created_at).getTime() >= cutoff)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 8);

  // 6. All ranked — fallback / full list
  const allRanked = active
    .sort((a, b) => scoreItem(b, interestMap) - scoreItem(a, interestMap));

  const sections: FeedSection[] = [];

  if (boosted.length > 0) {
    sections.push({ id: 'boosted', title: 'Sponsored', icon: 'rocket_launch', items: boosted });
  }
  if (endingSoon.length > 0) {
    sections.push({ id: 'ending_soon', title: 'Ending Soon', icon: 'timer', items: endingSoon });
  }
  if (forYou.length > 0) {
    sections.push({ id: 'for_you', title: 'For You', icon: 'auto_awesome', items: forYou });
  }
  if (popular.length > 0) {
    sections.push({ id: 'popular', title: 'Popular Near You', icon: 'local_fire_department', items: popular });
  }
  if (newArrivals.length > 0) {
    sections.push({ id: 'new', title: 'New Arrivals', icon: 'new_releases', items: newArrivals });
  }
  // Always show a full ranked list at the bottom
  sections.push({ id: 'all', title: 'All Listings', icon: 'grid_view', items: allRanked });

  return sections;
}

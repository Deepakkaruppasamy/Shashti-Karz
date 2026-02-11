-- Seed Showroom Data for Testing
-- Run this in Supabase SQL Editor to populate Showroom with demo content

-- 1. Create Active Contests
INSERT INTO showroom_contests (
    title, 
    description, 
    theme, 
    start_date, 
    end_date, 
    status, 
    winner_points, 
    banner_image_url
) VALUES 
(
    'Ultimate Gloss Challenge', 
    'Show us your best ceramic coating results! The glossier, the better.', 
    'Mirror Finish', 
    NOW(), 
    NOW() + INTERVAL '14 days', 
    'active', 
    5000, 
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80'
),
(
    'Interior Transformation', 
    'Dirty to Dazzling - Show your best interior deep cleaning results.', 
    'Extreme Detail', 
    NOW() - INTERVAL '7 days', 
    NOW() + INTERVAL '7 days', 
    'active', 
    3000, 
    'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80'
);

-- 2. Seed Referral Leaderboard
-- Replacing placeholder UUIDs with actual user IDs from profiles
INSERT INTO referral_leaderboard (
    user_id, 
    total_referrals, 
    successful_referrals, 
    total_revenue_generated, 
    total_rewards_earned, 
    current_rank, 
    achievement_badges
) VALUES 
(
    'a184491d-08bd-4be4-8670-146dd19c09d4', 
    25, 
    18, 
    45000, 
    4500, 
    1, 
    ARRAY['Top Referrer', 'Elite Partner']
),
(
    'd77d2eba-1d27-4d51-a432-310bb6f40221', 
    15, 
    10, 
    28000, 
    2800, 
    2, 
    ARRAY['Rising Star']
),
(
    '1267d64b-6a3e-4c7f-b3b4-86cc0c5e1ffb', 
    12, 
    9, 
    15000, 
    1500, 
    3, 
    ARRAY['Frequent User']
),
(
    'a9c0743b-d174-452e-a65a-796d70a77c82', 
    8, 
    5, 
    8500, 
    850, 
    4, 
    ARRAY['Influencer']
)
ON CONFLICT (user_id) DO UPDATE SET 
    total_referrals = EXCLUDED.total_referrals,
    current_rank = EXCLUDED.current_rank;

-- 3. Seed some dummy posts if needed (already have 1, but let's add more variety)
INSERT INTO showroom_posts (
    user_id, 
    title, 
    description, 
    media_type, 
    media_url, 
    status, 
    featured, 
    car_model,
    likes_count,
    comments_count
) VALUES 
(
    'a184491d-08bd-4be4-8670-146dd19c09d4', 
    'Signature Ceramic Glow on BMW M4', 
    'Just finished this absolute beast with our premium 9H coating. The depth of color is insane!', 
    'photo', 
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80', 
    'approved', 
    true, 
    'BMW M4 Competition',
    24,
    5
),
(
    'd77d2eba-1d27-4d51-a432-310bb6f40221', 
    'Muddy Off-roader to Showroom Ready', 
    'Extreme deep clean on this Thar. Swipe to see the mud we removed!', 
    'photo', 
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80', 
    'approved', 
    false, 
    'Mahindra Thar',
    15,
    2
) ON CONFLICT DO NOTHING;

-- Community Showroom Portal System
-- Social platform for car enthusiasts to showcase detailing results
-- API FIX VERSION: References public.profiles instead of auth.users to allow API joins

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS showroom_comment_likes CASCADE;
DROP TABLE IF EXISTS showroom_post_comments CASCADE;
DROP TABLE IF EXISTS showroom_post_votes CASCADE;
DROP TABLE IF EXISTS showroom_post_likes CASCADE;
DROP TABLE IF EXISTS showroom_posts CASCADE;
DROP TABLE IF EXISTS showroom_contests CASCADE;
DROP TABLE IF EXISTS showroom_user_stats CASCADE;
DROP TABLE IF EXISTS showroom_follows CASCADE;
DROP TABLE IF EXISTS referral_leaderboard CASCADE;

-- ============================================================================
-- 1. SHOWROOM CONTESTS
-- ============================================================================
CREATE TABLE showroom_contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    rules TEXT,
    theme TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    voting_start_date TIMESTAMPTZ,
    voting_end_date TIMESTAMPTZ,
    prizes JSONB,
    winner_points INTEGER DEFAULT 1000,
    runner_up_points INTEGER DEFAULT 500,
    participant_points INTEGER DEFAULT 100,
    min_entries INTEGER DEFAULT 1,
    max_entries_per_user INTEGER DEFAULT 3,
    entry_fee_points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'ended', 'cancelled')),
    total_entries INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    winner_post_id UUID,
    runner_up_ids UUID[],
    winners_announced_at TIMESTAMPTZ,
    banner_image_url TEXT,
    sponsor_name TEXT,
    sponsor_logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. SHOWROOM POSTS
-- ============================================================================
CREATE TABLE showroom_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video', 'reel')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    additional_media TEXT[],
    vehicle_id UUID REFERENCES user_vehicles(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    service_type TEXT,
    car_model TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    contest_id UUID REFERENCES showroom_contests(id) ON DELETE SET NULL,
    contest_entry BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'archived')),
    featured BOOLEAN DEFAULT false,
    featured_at TIMESTAMPTZ,
    featured_order INTEGER,
    tags TEXT[],
    hashtags TEXT[],
    before_photo_url TEXT,
    location TEXT,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Add FK from contests to posts
ALTER TABLE showroom_contests 
ADD CONSTRAINT fk_contest_winner_post 
FOREIGN KEY (winner_post_id) REFERENCES showroom_posts(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. POST INTERACTIONS
-- ============================================================================
CREATE TABLE showroom_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES showroom_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE showroom_post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES showroom_posts(id) ON DELETE CASCADE,
    contest_id UUID NOT NULL REFERENCES showroom_contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_weight INTEGER DEFAULT 1,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, contest_id, user_id)
);

CREATE TABLE showroom_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES showroom_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES showroom_post_comments(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    likes_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE showroom_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES showroom_post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- 4. REFERRAL LEADERBOARD
-- ============================================================================
CREATE TABLE referral_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(10, 2) DEFAULT 0,
    total_rewards_earned DECIMAL(10, 2) DEFAULT 0,
    current_rank INTEGER,
    previous_rank INTEGER,
    highest_rank INTEGER,
    rank_updated_at TIMESTAMPTZ,
    achievement_badges TEXT[],
    milestone_reached INTEGER,
    monthly_referrals INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(10, 2) DEFAULT 0,
    last_month_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SOCIAL FEATURES
-- ============================================================================
CREATE TABLE showroom_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE TABLE showroom_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    total_posts INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    total_comments_received INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    contests_entered INTEGER DEFAULT 0,
    contests_won INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    engagement_score DECIMAL(5, 2) DEFAULT 0,
    popularity_rank INTEGER,
    last_post_at TIMESTAMPTZ,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES
-- ============================================================================
CREATE INDEX idx_showroom_posts_user ON showroom_posts(user_id);
CREATE INDEX idx_showroom_posts_status ON showroom_posts(status);
CREATE INDEX idx_showroom_posts_contest ON showroom_posts(contest_id);
CREATE INDEX idx_showroom_posts_featured ON showroom_posts(featured, featured_order);
CREATE INDEX idx_showroom_posts_created ON showroom_posts(created_at DESC);
CREATE INDEX idx_showroom_posts_likes ON showroom_posts(likes_count DESC);
CREATE INDEX idx_contests_status ON showroom_contests(status);
CREATE INDEX idx_contests_dates ON showroom_contests(start_date, end_date);
CREATE INDEX idx_post_likes_post ON showroom_post_likes(post_id);
CREATE INDEX idx_post_likes_user ON showroom_post_likes(user_id);
CREATE INDEX idx_post_votes_contest ON showroom_post_votes(contest_id);
CREATE INDEX idx_post_votes_post ON showroom_post_votes(post_id);
CREATE INDEX idx_comments_post ON showroom_post_comments(post_id);
CREATE INDEX idx_comments_user ON showroom_post_comments(user_id);
CREATE INDEX idx_leaderboard_rank ON referral_leaderboard(current_rank);
CREATE INDEX idx_leaderboard_referrals ON referral_leaderboard(total_referrals DESC);
CREATE INDEX idx_follows_follower ON showroom_follows(follower_id);
CREATE INDEX idx_follows_following ON showroom_follows(following_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE showroom_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_approved_posts" ON showroom_posts FOR SELECT USING (status = 'approved' AND visibility = 'public');
CREATE POLICY "view_own_posts" ON showroom_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "create_own_posts" ON showroom_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_posts" ON showroom_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_posts" ON showroom_posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE showroom_contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_contests" ON showroom_contests FOR SELECT USING (true);

ALTER TABLE showroom_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_likes" ON showroom_post_likes FOR SELECT USING (true);
CREATE POLICY "manage_own_likes" ON showroom_post_likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE showroom_post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_votes" ON showroom_post_votes FOR SELECT USING (true);
CREATE POLICY "create_votes" ON showroom_post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE showroom_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_comments" ON showroom_post_comments FOR SELECT USING (status = 'active');
CREATE POLICY "create_comments" ON showroom_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_comments" ON showroom_post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_comments" ON showroom_post_comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE showroom_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_follows" ON showroom_follows FOR SELECT USING (true);
CREATE POLICY "manage_own_follows" ON showroom_follows FOR ALL USING (auth.uid() = follower_id);

ALTER TABLE referral_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_leaderboard" ON referral_leaderboard FOR SELECT USING (true);

ALTER TABLE showroom_user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_stats" ON showroom_user_stats FOR SELECT USING (true);

-- ============================================================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE showroom_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE showroom_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON showroom_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE showroom_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE showroom_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON showroom_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE showroom_user_stats SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
        UPDATE showroom_user_stats SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE showroom_user_stats SET followers_count = GREATEST(0, followers_count - 1) WHERE user_id = OLD.following_id;
        UPDATE showroom_user_stats SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
AFTER INSERT OR DELETE ON showroom_follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

CREATE OR REPLACE FUNCTION update_referral_rankings()
RETURNS void AS $$
BEGIN
    WITH ranked_users AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY total_referrals DESC, total_revenue_generated DESC) as new_rank
        FROM referral_leaderboard
    )
    UPDATE referral_leaderboard rl
    SET 
        previous_rank = rl.current_rank,
        current_rank = ru.new_rank,
        highest_rank = LEAST(COALESCE(rl.highest_rank, 999999), ru.new_rank),
        rank_updated_at = NOW()
    FROM ranked_users ru
    WHERE rl.user_id = ru.user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_trending_posts(p_limit INTEGER DEFAULT 20, p_days INTEGER DEFAULT 7)
RETURNS TABLE(
    post_id UUID,
    title TEXT,
    media_url TEXT,
    likes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER,
    engagement_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.title,
        sp.media_url,
        sp.likes_count,
        sp.comments_count,
        sp.views_count,
        ((sp.likes_count * 1.0) + (sp.comments_count * 2.0) + (sp.shares_count * 3.0) + (sp.views_count * 0.1)) / 
        EXTRACT(EPOCH FROM (NOW() - sp.created_at)) * 86400 as engagement_score
    FROM showroom_posts sp
    WHERE sp.status = 'approved' AND sp.created_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY engagement_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Community Showroom Portal API-COMPATIBLE schema created!';
    RAISE NOTICE '📋 Tables now reference profiles(id) instead of auth.users(id)';
    RAISE NOTICE '🔐 This enables foreign key joins in API calls';
    RAISE NOTICE '⚠️ PLEASE RUN THIS IN SUPABASE SQL EDITOR';
END $$;

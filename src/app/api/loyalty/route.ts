import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5000,
  gold: 15000,
  platinum: 30000,
};

function calculateTier(totalSpent: number): "bronze" | "silver" | "gold" | "platinum" {
  if (totalSpent >= TIER_THRESHOLDS.platinum) return "platinum";
  if (totalSpent >= TIER_THRESHOLDS.gold) return "gold";
  if (totalSpent >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

function generateReferralCode(userId: string): string {
  const prefix = "SK";
  const suffix = userId.substring(0, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    let { data: loyaltyData, error } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      const referralCode = generateReferralCode(userId);
      const { data: newData, error: insertError } = await supabase
        .from("loyalty_points")
        .insert({
          user_id: userId,
          points: 100,
          tier: "bronze",
          total_spent: 0,
          total_bookings: 0,
          referral_code: referralCode,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      await supabase.from("loyalty_transactions").insert({
        user_id: userId,
        points: 100,
        type: "bonus",
        description: "Welcome bonus points",
      });

      loyaltyData = newData;
    } else if (error) {
      throw error;
    }

    const { data: transactions } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      ...loyaltyData,
      transactions: transactions || [],
      nextTier: getNextTier(loyaltyData?.tier),
      pointsToNextTier: getPointsToNextTier(loyaltyData?.total_spent || 0),
    });
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty points" }, { status: 500 });
  }
}

function getNextTier(currentTier: string): string | null {
  const tiers = ["bronze", "silver", "gold", "platinum"];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

function getPointsToNextTier(totalSpent: number): number {
  if (totalSpent >= TIER_THRESHOLDS.platinum) return 0;
  if (totalSpent >= TIER_THRESHOLDS.gold) return TIER_THRESHOLDS.platinum - totalSpent;
  if (totalSpent >= TIER_THRESHOLDS.silver) return TIER_THRESHOLDS.gold - totalSpent;
  return TIER_THRESHOLDS.silver - totalSpent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, booking_id, amount, type, description } = body;

    const pointsEarned = type === "earned" ? Math.floor(amount * 0.1) : body.points || 0;

    const { data: currentData, error: fetchError } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError) throw fetchError;

    let newPoints = currentData.points;
    let newTotalSpent = currentData.total_spent;
    let newTotalBookings = currentData.total_bookings;

    if (type === "earned") {
      newPoints += pointsEarned;
      newTotalSpent += amount;
      newTotalBookings += 1;
    } else if (type === "redeemed") {
      newPoints -= body.points;
    } else if (type === "referral" || type === "bonus") {
      newPoints += body.points;
    }

    const newTier = calculateTier(newTotalSpent);

    const { data: updatedData, error: updateError } = await supabase
      .from("loyalty_points")
      .update({
        points: newPoints,
        tier: newTier,
        total_spent: newTotalSpent,
        total_bookings: newTotalBookings,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from("loyalty_transactions").insert({
      user_id,
      booking_id,
      points: type === "redeemed" ? -body.points : pointsEarned,
      type,
      description: description || `${type === "earned" ? "Earned" : type === "redeemed" ? "Redeemed" : "Bonus"} points`,
    });

    if (newTier !== currentData.tier) {
      await supabase.from("loyalty_transactions").insert({
        user_id,
        points: 0,
        type: "bonus",
        description: `Congratulations! Upgraded to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} tier`,
      });
    }

    return NextResponse.json(updatedData);
  } catch (error) {
    console.error("Error updating loyalty points:", error);
    return NextResponse.json({ error: "Failed to update loyalty points" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referral_code, user_id } = body;

    const { data: referrer, error: referrerError } = await supabase
      .from("loyalty_points")
      .select("user_id")
      .eq("referral_code", referral_code)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    if (referrer.user_id === user_id) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    const { data: existingReferral } = await supabase
      .from("loyalty_points")
      .select("referred_by")
      .eq("user_id", user_id)
      .single();

    if (existingReferral?.referred_by) {
      return NextResponse.json({ error: "Referral already applied" }, { status: 400 });
    }

    await supabase
      .from("loyalty_points")
      .update({ referred_by: referrer.user_id })
      .eq("user_id", user_id);

    const referralBonus = 200;

    await supabase.rpc("increment_points", { user_id_param: user_id, points_param: referralBonus });
    await supabase.rpc("increment_points", { user_id_param: referrer.user_id, points_param: referralBonus });

    await supabase.from("loyalty_transactions").insert([
      {
        user_id,
        points: referralBonus,
        type: "referral",
        description: "Referral bonus - Welcome reward",
      },
      {
        user_id: referrer.user_id,
        points: referralBonus,
        type: "referral",
        description: "Referral bonus - New member referred",
      },
    ]);

    return NextResponse.json({ success: true, bonus: referralBonus });
  } catch (error) {
    console.error("Error applying referral:", error);
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 });
  }
}

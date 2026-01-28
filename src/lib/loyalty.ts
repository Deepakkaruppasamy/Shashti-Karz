import { createClient } from "@supabase/supabase-js";

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

export async function updateLoyaltyPoints(
  user_id: string,
  booking_id: string,
  amount: number,
  type: "earned" | "redeemed" | "referral" | "bonus",
  description?: string,
  points?: number
) {
  try {
    const pointsEarned = type === "earned" ? Math.floor(amount * 0.1) : points || 0;

    // Prevent double counting for the same booking
    if (booking_id && type === "earned") {
      const { data: existingTransaction } = await supabase
        .from("loyalty_transactions")
        .select("id")
        .eq("booking_id", booking_id)
        .eq("type", "earned")
        .single();
      
      if (existingTransaction) {
        console.log(`Loyalty points already earned for booking ${booking_id}`);
        return null;
      }
    }

    const { data: currentData, error: fetchError } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError) {
        if (fetchError.code === "PGRST116") {
            // If doesn't exist, create it (should have been created on first GET, but safe to handle)
            const { data: newData, error: insertError } = await supabase
                .from("loyalty_points")
                .insert({
                    user_id: user_id,
                    points: 100 + (type === "earned" ? pointsEarned : (points || 0)),
                    tier: calculateTier(type === "earned" ? amount : 0),
                    total_spent: type === "earned" ? amount : 0,
                    total_bookings: type === "earned" ? 1 : 0,
                    referral_code: `SK${user_id.substring(0, 6).toUpperCase()}`,
                })
                .select()
                .single();
            
            if (insertError) throw insertError;

            await supabase.from("loyalty_transactions").insert({
                user_id: user_id,
                booking_id,
                points: 100 + (type === "earned" ? pointsEarned : (points || 0)),
                type: "bonus",
                description: "Welcome bonus + " + (description || "first points"),
            });
            return newData;
        }
        throw fetchError;
    }

    let newPoints = currentData.points;
    let newTotalSpent = currentData.total_spent;
    let newTotalBookings = currentData.total_bookings;

    if (type === "earned") {
      newPoints += pointsEarned;
      newTotalSpent += amount;
      newTotalBookings += 1;
    } else if (type === "redeemed") {
      newPoints -= points || 0;
    } else if (type === "referral" || type === "bonus") {
      newPoints += points || 0;
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
      points: type === "redeemed" ? -(points || 0) : pointsEarned,
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

    return updatedData;
  } catch (error) {
    console.error("Error updating loyalty points in lib:", error);
    throw error;
  }
}

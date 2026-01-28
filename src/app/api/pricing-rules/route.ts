import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");
  const ruleType = searchParams.get("rule_type");

  let query = supabase
    .from("pricing_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (active === "true") {
    query = query.eq("active", true);
  }

  if (ruleType) {
    query = query.eq("rule_type", ruleType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  if (body.action === "calculate") {
    const { base_price, date, time } = body;
    
    const { data: rules, error } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let finalPrice = base_price;
    const appliedRules: any[] = [];
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();
    const hour = parseInt(time?.split(":")[0] || "12");

    for (const rule of rules || []) {
      let applies = false;
      
      switch (rule.rule_type) {
        case "weekend":
          applies = dayOfWeek === 0 || dayOfWeek === 6;
          break;
        case "peak_hour":
          const startHour = parseInt(rule.conditions?.start_hour || "10");
          const endHour = parseInt(rule.conditions?.end_hour || "14");
          applies = hour >= startHour && hour < endHour;
          break;
        case "high_demand":
          applies = rule.conditions?.always === true;
          break;
        case "weather":
          applies = rule.conditions?.weather === body.weather;
          break;
      }

      if (applies) {
        if (rule.modifier_type === "percentage") {
          const modifier = rule.modifier_value / 100;
          if (modifier > 0) {
            finalPrice = finalPrice * (1 + modifier);
          } else {
            finalPrice = finalPrice * (1 + modifier);
          }
        } else {
          finalPrice = finalPrice + rule.modifier_value;
        }
        appliedRules.push(rule);
      }
    }

    return NextResponse.json({
      base_price,
      final_price: Math.round(finalPrice),
      applied_rules: appliedRules,
      discount: base_price - Math.round(finalPrice),
    });
  }

  const { data, error } = await supabase
    .from("pricing_rules")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

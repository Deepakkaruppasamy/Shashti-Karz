import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  let query = supabase
    .from("availability_slots")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (date) {
    query = query.eq("date", date);
  }

  if (startDate && endDate) {
    query = query.gte("date", startDate).lte("date", endDate);
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

  if (body.generate) {
    const { start_date, end_date, slots_per_day } = body;
    const slotsToInsert = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const defaultSlots = [
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
      { start: "12:00", end: "13:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
      { start: "16:00", end: "17:00" },
      { start: "17:00", end: "18:00" },
    ];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const slotsToUse = slots_per_day 
        ? defaultSlots.slice(0, slots_per_day) 
        : defaultSlots;

      for (const slot of slotsToUse) {
        slotsToInsert.push({
          date: dateStr,
          start_time: slot.start,
          end_time: slot.end,
          max_capacity: body.max_capacity || 2,
          current_occupancy: 0,
          is_blocked: false,
        });
      }
    }

    const { data, error } = await supabase
      .from("availability_slots")
      .upsert(slotsToInsert, { onConflict: "date,start_time" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("availability_slots")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

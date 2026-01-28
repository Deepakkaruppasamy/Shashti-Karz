import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");

    let query = supabase
      .from("invoices")
      .select(`
        *,
        invoice_items(*)
      `)
      .order("created_at", { ascending: false });

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    if (startDate) {
      query = query.gte("invoice_date", startDate);
    }
    if (endDate) {
      query = query.lte("invoice_date", endDate);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_id,
      vehicle_number,
      payment_mode,
      payment_reference,
      items,
      discount_percent = 0,
      tax_percent = 0,
      notes,
      created_by,
      created_by_name,
    } = body;

    const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const discountAmount = (subtotal * discount_percent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * tax_percent) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const invoiceNumber = generateInvoiceNumber();

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        customer_name,
        customer_phone,
        customer_email,
        customer_id,
        vehicle_number,
        invoice_date: new Date().toISOString().split("T")[0],
        payment_mode,
        payment_reference,
        subtotal,
        discount_percent,
        discount_amount: discountAmount,
        tax_percent,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes,
        status: "paid",
        created_by,
        created_by_name,
        is_finalized: true,
        finalized_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const invoiceItems = items.map((item: any, index: number) => ({
      invoice_id: invoice.id,
      service_name: item.service_name,
      description: item.description || "",
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) throw itemsError;

    const { data: fullInvoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        *,
        invoice_items(*)
      `)
      .eq("id", invoice.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(fullInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}

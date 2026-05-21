import { NextResponse } from "next/server";

export function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message, status = 400, details = null) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export function mapItem(row) {
  return {
    id: row.id,
    name: row.name,
    stock: row.stock,
    created_at: row.created_at,
    updated_at: row.updated_at,
    nama: row.name,
    stok: row.stock,
  };
}

export function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapTransaction(row) {
  return {
    id: row.id,
    item_id: row.item_id,
    item_name: row.item_name,
    type: row.type,
    quantity: row.quantity,
    stock_before: row.stock_before,
    stock_after: row.stock_after,
    notes: row.notes,
    created_at: row.created_at,
    nama: row.item_name,
    jumlah: row.quantity,
    tanggal: row.created_at,
  };
}

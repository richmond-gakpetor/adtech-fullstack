import type { Billboard } from "@/lib/types/billboard"

export type OwnerBillboard = Billboard & {
  requiresPayment: true
  createdAtIso: string
}

const OWNER_BILLBOARDS_KEY = "xp_owner_billboards_v1"

const safeRead = (): OwnerBillboard[] => {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(OWNER_BILLBOARDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OwnerBillboard[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const safeWrite = (value: OwnerBillboard[]) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(OWNER_BILLBOARDS_KEY, JSON.stringify(value))
}

export const listOwnerBillboards = (): OwnerBillboard[] => {
  return safeRead()
}

export const upsertOwnerBillboard = (billboard: OwnerBillboard) => {
  const all = safeRead()
  const id = String(billboard.id)
  const next = [billboard, ...all.filter((b) => String(b.id) !== id)]
  safeWrite(next)
}

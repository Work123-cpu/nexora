import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getVendorById } from '@/mocks/seed/vendors.seed'
import type { Vendor } from '@/types/entities/vendor'

const STORAGE_KEY = 'Nexora.vendor-session'

interface VendorAuthContextValue {
  vendor: Vendor | null
  isAuthenticated: boolean
  login: (vendorId: string, _password: string) => Promise<void>
  logout: () => void
}

const VendorAuthContext = createContext<VendorAuthContextValue | null>(null)

function readStoredVendorId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Mock vendor session, mirroring AuthContext.tsx's pattern (any password signs in),
 * but scoped to a single vendorId picked at login — since there's no real per-vendor
 * credential system yet, the login screen has the vendor identify themselves by
 * selecting their company name, same honesty as the internal "any email/password"
 * disclaimer.
 */
export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendorId, setVendorId] = useState<string | null>(() => readStoredVendorId())

  const login = useCallback(async (nextVendorId: string, _password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    window.localStorage.setItem(STORAGE_KEY, nextVendorId)
    setVendorId(nextVendorId)
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setVendorId(null)
  }, [])

  const vendor = vendorId ? (getVendorById(vendorId) ?? null) : null

  const value = useMemo(
    () => ({ vendor, isAuthenticated: vendor !== null, login, logout }),
    [vendor, login, logout],
  )

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  const ctx = useContext(VendorAuthContext)
  if (!ctx) throw new Error('useVendorAuth must be used within VendorAuthProvider')
  return ctx
}

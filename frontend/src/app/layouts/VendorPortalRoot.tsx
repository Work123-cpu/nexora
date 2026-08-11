import { Outlet } from 'react-router-dom'
import { VendorAuthProvider } from '@/features/vendor-portal/context/VendorAuthContext'

/** Isolates the vendor portal's own auth session from the internal app's AuthContext. */
export function VendorPortalRoot() {
  return (
    <VendorAuthProvider>
      <Outlet />
    </VendorAuthProvider>
  )
}

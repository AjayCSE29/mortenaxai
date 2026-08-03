import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/RequireAuth'
import Auth from '@/pages/Auth'
import Chat from '@/pages/Chat'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

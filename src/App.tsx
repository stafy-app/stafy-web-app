import { RouterProvider } from '@tanstack/react-router'
import './App.css'
import { AuthProvider } from './context/AuthProvider'
import { ToastHost } from './components/toast/ToastHost'
import { router } from './routes'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastHost />
    </AuthProvider>
  )
}

export default App

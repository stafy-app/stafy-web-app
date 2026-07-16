import { RouterProvider } from '@tanstack/react-router'
import './App.css'
import { AuthProvider } from './context/AuthProvider'
import { router } from './routes'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App

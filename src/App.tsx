import { AuthProvider } from "./contexts/AuthContext"
import { AppContent } from "./components/AppContent"
import { CategoryProvider } from "./contexts/CategoryContext"

function App() {
  return (
    <AuthProvider>
      <CategoryProvider>
        <AppContent />
      </CategoryProvider>
    </AuthProvider>
  )
}

export default App

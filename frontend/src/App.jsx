import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { LandingPage } from "./pages/LandingPage"
import { Toaster } from "sonner"
import "./App.css"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
      <Toaster theme="dark" position="bottom-right" />
    </Router>
  )
}

export default App
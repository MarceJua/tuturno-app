import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Cliente from './Pages/Cliente'
import Dashboard from './Pages/Administrador'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Cliente />} />
        <Route path="/admin" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

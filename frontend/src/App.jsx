import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage.jsx'
import SignUpPage from './components/SignUpPage.jsx'
import LoginPage from './components/LoginPage.jsx'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/signup' element={<SignUpPage />} />
        <Route path='/login' element={<LoginPage />} />
      </Routes>
    </div>
  )
}

export default App
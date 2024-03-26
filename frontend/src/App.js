import { useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// pages
import HomeScreen from './pages/Home/HomeScreen'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import Profile from './pages/Profile/Profile';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

const PrivateWrapper = ({ auth }) => {
  return auth ? <Outlet /> : <Navigate to="/" />;
};

const App = () => {
  const auth = useState(localStorage.getItem('E_COMMERCE_TOKEN'))

  return (
    <>
      <main className="app">
        <Header />
        <div className='body-main-part'>
          <Routes>

            <Route path="/" element={<HomeScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<PrivateWrapper auth={auth} />}>
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default App;

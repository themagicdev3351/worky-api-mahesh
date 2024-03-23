import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { useSelector } from 'react-redux';
import Homepage from './pages/Homepage';
// import AdminDashboard from './pages/admin/AdminDashboard';
// import StudentDashboard from './pages/student/StudentDashboard';
// import TeacherDashboard from './pages/teacher/TeacherDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChooseUser from './pages/ChooseUser';
import VerifyPage from './pages/VerifyPage';
// require('dotenv').config()

const App = () => {
  // const { currentRole } = useSelector(state => state.user);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/choose" element={<ChooseUser visitor="normal" />} />
        {/* <Route path="/chooseasguest" element={<ChooseUser visitor="guest" />} /> */}

        <Route path="/login" element={<LoginPage role="Admin" />} />
        {/* <Route path="/Studentlogin" element={<LoginPage role="Student" />} />
        <Route path="/Teacherlogin" element={<LoginPage role="Teacher" />} /> */}

        <Route path="/register" element={<RegisterPage />} />


        <Route path='*' element={<Navigate to="/" />} />
        <Route path="/verify-email" element={<VerifyPage />} />
      </Routes>

      {/* {currentRole === "Admin" &&
        <>
          <AdminDashboard />
        </>
      }

      {currentRole === "Student" &&
        <>
          <StudentDashboard />
        </>
      }

      {currentRole === "Teacher" &&
        <>
          <TeacherDashboard />
        </>
      } */}
    </Router>
  )
}

export default App
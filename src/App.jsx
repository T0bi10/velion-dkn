import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Submit from "./pages/Submit";
import Validate from "./pages/Validate";
import Admin from "./pages/Admin";
import AdminRequests from "./pages/AdminRequests";
import Leaderboard from "./pages/Leaderboard";
import Search from "./pages/Search";
import About from "./pages/About";
import Recommendations from "./pages/Recommendations";

import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />

        <Route path="/submit" element={
          <ProtectedRoute>
            <RoleRoute roles={["Consultant"]}>
              <Submit />
            </RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="/validate" element={
          <ProtectedRoute>
            <RoleRoute roles={["KnowledgeChampion"]}>
              <Validate />
            </RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <RoleRoute roles={["Admin"]}>
              <Admin />
            </RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin/requests" element={
          <ProtectedRoute>
            <RoleRoute roles={["Admin"]}>
              <AdminRequests />
            </RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } />

        <Route path="/search" element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } />

        <Route path="/recommendations" element={
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        } />
      </Routes>
      <Footer />
    </>
  );
}

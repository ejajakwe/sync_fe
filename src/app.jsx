// src/app.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './css/app.css';
import Topup from './Pages/Game';
import Leveling from './Pages/Leveling';
import Invoice from './Pages/Invoice';
import GameDetail from './Pages/GameDetail';
import LevelingDetail from './Pages/LevelingDetail';
import Login from "./Pages/Auth/Login";
import Kelola from "./Pages/Kelola";
import Dashboard from "./Pages/Dashboard";
import ProtectedRoute from "./Pages/Auth/ProtectedRoute";
import Search from "./Pages/Search";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Topup />} />
        <Route path="/game" element={<Topup />} />
        <Route path="/game/:slug" element={<GameDetail />} />
        <Route path="/leveling" element={<Leveling />} />
        <Route path="/leveling/:slug" element={<LevelingDetail />} />
        <Route path="/cek-transaksi" element={<Invoice />} />
        <Route path="/cek-transaksi/:invoice" element={<Invoice />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/kelola" element={
          <ProtectedRoute><Kelola /></ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

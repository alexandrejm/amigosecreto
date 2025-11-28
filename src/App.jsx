import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import GroupPage from '@/pages/GroupPage';
import JoinPage from '@/pages/JoinPage';
import ParticipantPage from '@/pages/ParticipantPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';

function App() {
  return (
    <>
      <Helmet>
        <title>Amigo Secreto - Organize seu sorteio perfeito</title>
        <meta name="description" content="Crie e gerencie grupos de amigo secreto com sorteio automático, notificações e mensagens anônimas." />
      </Helmet>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/g/:groupSlug" element={<GroupPage />} />
        <Route path="/g/:groupSlug/join" element={<JoinPage />} />
        <Route path="/g/:groupSlug/my" element={<ParticipantPage />} />
      </Routes>
    </>
  );
}

export default App;
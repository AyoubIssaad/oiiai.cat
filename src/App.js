import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CatPage } from "./components/pages/CatPage";
import { SecretMessagePage } from "./components/pages/SecretMessagePage";
import { GamesPage } from "./components/pages/GamesPage";
import { AboutPage } from "./components/pages/AboutPage"; // We'll create this
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";
import ScrollToTop from "./components/ScrollToTop";
import { MainLayout } from "./components/MainLayout";
import KawaiiNav from "./components/KawaiiNav";

function App() {
  return (
    <>
      <ScrollToTop />
      <KawaiiNav />
      <MainLayout>
        <Routes>
          {/* Make CatPage the homepage */}
          <Route path="/" element={<CatPage />} />

          {/* New routes */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/secret-messages" element={<SecretMessagePage />} />
          <Route path="/games" element={<GamesPage />} />

          {/* Legacy routes with redirects */}
          <Route path="/cat" element={<Navigate to="/" replace />} />
          <Route path="/secret" element={<Navigate to="/secret-messages" replace />} />
          <Route path="/games" element={<Navigate to="/games" replace />} />

          {/* Other routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
        </Routes>
      </MainLayout>
    </>
  );
}

export default App;

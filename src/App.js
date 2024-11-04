import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./components/pages/HomePage";
import { CatPage } from "./components/pages/CatPage";
import { GamesPage } from "./components/pages/GamesPage";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";
import ScrollToTop from "./components/ScrollToTop";
import { MainLayout } from "./components/MainLayout";
import KawaiiNav from "./components/KawaiiNav";
import SecretMessagePage from "./components/pages/SecretMessagePage";

function App() {
  return (
    <>
      <ScrollToTop />
      <KawaiiNav />
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* New SEO-friendly routes */}
          <Route path="/cat-goes-spin" element={<CatPage />} />
          <Route path="/secret-cat-messages" element={<SecretMessagePage />} />
          <Route path="/banana-cat-games" element={<GamesPage />} />

          {/* Legacy routes with redirects */}
          <Route
            path="/cat"
            element={<Navigate to="/cat-goes-spin" replace />}
          />
          <Route
            path="/secret"
            element={<Navigate to="/secret-cat-messages" replace />}
          />
          <Route
            path="/games"
            element={<Navigate to="/banana-cat-games" replace />}
          />

          {/* Other routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
        </Routes>
      </MainLayout>
    </>
  );
}

export default App;

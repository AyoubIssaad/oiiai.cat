import React from "react";
import { Routes, Route } from "react-router-dom";
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
          <Route path="/cat" element={<CatPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/secret" element={<SecretMessagePage />} />
        </Routes>
      </MainLayout>
    </>
  );
}

export default App;

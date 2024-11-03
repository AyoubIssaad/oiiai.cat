import React from "react";
import SEO from "./SEO";
import { Button } from "./ui/Button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  // Update page title for SEO
  React.useEffect(() => {
    document.title =
      "Privacy Policy - Oiiai Cat | Safe and Transparent Data Practices";
  }, []);

  return (
    <>
      <SEO
        title="Privacy Policy - Oiiai Cat | Safe and Transparent Data Practices"
        description="Learn about how Oiiai Cat protects your privacy and handles your data. Our comprehensive privacy policy ensures transparency and security for all users."
        path="/privacy"
      />
      <div className="min-h-screen kawaii-theme py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/">
            <Button className="kawaii-button mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <article className="kawaii-card p-8">
            <h1 className="kawaii-heading text-3xl mb-8 text-center">
              Privacy Policy
            </h1>

            <div className="prose prose-blue max-w-none">
              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Introduction</h2>
                <p className="text-blue-700 mb-4">
                  Welcome to Oiiai Cat's Privacy Policy. At Oiiai Cat, we
                  respect your privacy and are committed to protecting your
                  personal data. This privacy policy explains how we handle your
                  information when you visit oiiai.cat ("the Website").
                </p>
                <p className="text-blue-700 mb-4">
                  Last Updated: {new Date().toLocaleDateString()}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Information We Collect
                </h2>
                <p className="text-blue-700 mb-4">
                  We collect and process the following information:
                </p>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>
                    <strong>Usage Data:</strong> Information about how you
                    interact with our website, including game scores,
                    preferences, and settings.
                  </li>
                  <li>
                    <strong>Technical Data:</strong> Internet protocol (IP)
                    address, browser type and version, time zone setting,
                    browser plug-in types and versions, operating system.
                  </li>
                  <li>
                    <strong>Analytics Data:</strong> Page views, time spent on
                    site, and other anonymous statistical data.
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>To provide and maintain our service</li>
                  <li>To improve user experience</li>
                  <li>To analyze usage patterns and optimize performance</li>
                  <li>To detect and prevent technical issues</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Cookies and Tracking
                </h2>
                <p className="text-blue-700 mb-4">
                  We use cookies and similar tracking technologies to track
                  activity on our Website and store certain information. These
                  help us to improve your experience and our service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Data Security</h2>
                <p className="text-blue-700 mb-4">
                  We implement appropriate security measures to protect your
                  data against unauthorized access, alteration, disclosure, or
                  destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Your Rights</h2>
                <p className="text-blue-700 mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>Access your personal data</li>
                  <li>Request correction of your personal data</li>
                  <li>Request deletion of your personal data</li>
                  <li>Object to processing of your personal data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Contact Us</h2>
                <p className="text-blue-700 mb-4">
                  For any questions about this Privacy Policy, please contact us
                  at:{" "}
                  <a
                    href="mailto:contact@oiiai.cat"
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    contact@oiiai.cat
                  </a>
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

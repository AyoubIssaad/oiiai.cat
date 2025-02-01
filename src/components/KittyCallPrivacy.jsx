import React from "react";
import SEO from "./SEO";
import { Button } from "./ui/Button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function KittyCallPrivacy() {
  React.useEffect(() => {
    document.title = "Privacy Policy - KittyCall | Binary PAX";
  }, []);

  return (
    <>
      <SEO
        title="Privacy Policy - KittyCall | Binary PAX"
        description="Privacy policy for KittyCall Android app - Your purr-fect cat sound companion. Learn about our privacy-first approach and data handling practices."
        path="/apps/kittycall/privacy"
      />
      <div className="pt-20 sm:pt-24 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/">
            <Button className="kawaii-button mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <article className="kawaii-card p-8">
            <h1 className="kawaii-heading text-3xl mb-8">
              Privacy Policy for KittyCall
            </h1>

            <div className="prose prose-blue max-w-none">
              <p className="text-sm text-blue-600 mb-8">
                Last Updated: February 2, 2025
              </p>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Introduction</h2>
                <p className="text-blue-700 mb-4">
                  KittyCall ("we," "our," or "us") is committed to protecting
                  your privacy. This Privacy Policy explains how we handle
                  information when you use our KittyCall mobile application (the
                  "App").
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Information We Don't Collect
                </h2>
                <p className="text-blue-700 mb-4">
                  KittyCall is designed with privacy in mind. Our app:
                </p>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>Does not collect any personal information</li>
                  <li>Does not require user registration</li>
                  <li>Does not track your location</li>
                  <li>Does not require internet access</li>
                  <li>Does not collect usage statistics</li>
                  <li>Does not use analytics services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">App Permissions</h2>
                <p className="text-blue-700 mb-4">
                  KittyCall only requires access to:
                </p>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>
                    Device storage: To store your favorite sound preferences
                    locally on your device
                  </li>
                  <li>Audio settings: To play cat sounds</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Data Storage</h2>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>
                    All data (such as your favorite sounds) is stored locally on
                    your device
                  </li>
                  <li>No data is transmitted to external servers</li>
                  <li>No data is shared with third parties</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Advertisements</h2>
                <p className="text-blue-700 mb-4">
                  KittyCall does not display any advertisements and does not use
                  any ad-related services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Children's Privacy
                </h2>
                <p className="text-blue-700 mb-4">
                  Our App does not collect any personal information from anyone,
                  including children under 13.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-blue-700 mb-4">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the "Last Updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Contact Us</h2>
                <p className="text-blue-700 mb-4">
                  If you have any questions about this Privacy Policy, please
                  contact us at:
                  <br />
                  Email:{" "}
                  <a
                    href="mailto:contact@oiiai.cat"
                    className="text-blue-500 hover:underline"
                  >
                    contact@oiiai.cat
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  App Store Information
                </h2>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>App Name: KittyCall</li>
                  <li>Developer: Binary PAX</li>
                  <li>Platform: Android</li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

import React from "react";
import SEO from "./SEO";
import { Button } from "./ui/Button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  // Update page title for SEO
  React.useEffect(() => {
    document.title =
      "Terms of Use - Oiiai Cat | User Guidelines and Legal Information";
  }, []);

  return (
    <>
      <SEO
        title="Terms of Use - Oiiai Cat | User Guidelines and Legal Information"
        description="Review Oiiai Cat's terms of use, user guidelines, and legal information. Clear and fair terms for enjoying our interactive cat animation and games."
        path="/terms"
      />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/">
            <Button className="kawaii-button mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <article className="kawaii-card p-8">
            <h1 className="kawaii-heading text-3xl mb-8 text-center">
              Terms of Use
            </h1>

            <div className="prose prose-blue max-w-none">
              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Welcome to Oiiai Cat
                </h2>
                <p className="text-blue-700 mb-4">
                  These terms and conditions outline the rules and regulations
                  for the use of Oiiai Cat's Website, located at oiiai.cat.
                </p>
                <p className="text-blue-700 mb-4">
                  Last Updated: {new Date().toLocaleDateString()}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Acceptance of Terms
                </h2>
                <p className="text-blue-700 mb-4">
                  By accessing this website, you accept these terms and
                  conditions. Please read them carefully before using our
                  service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  License and Usage
                </h2>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>
                    You may access and use our service for personal,
                    non-commercial purposes
                  </li>
                  <li>
                    You may not modify, copy, distribute, transmit, display,
                    perform, reproduce, publish, license, transfer, or sell any
                    information obtained from the website
                  </li>
                  <li>
                    You agree not to use the service for any unlawful purpose or
                    prohibited activity
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Intellectual Property
                </h2>
                <p className="text-blue-700 mb-4">
                  The website and its original content, features, and
                  functionality are owned by Oiiai Cat and are protected by
                  international copyright, trademark, patent, trade secret, and
                  other intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">User Conduct</h2>
                <p className="text-blue-700 mb-4">You agree to:</p>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li>
                    Use the website in a way that does not interfere with
                    others' use
                  </li>
                  <li>
                    Not attempt to gain unauthorized access to our systems
                  </li>
                  <li>
                    Not engage in any activity that could harm or disrupt our
                    service
                  </li>
                  <li>Respect other users and their experience</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Disclaimer</h2>
                <p className="text-blue-700 mb-4">
                  The website is provided "as is" without any warranties,
                  expressed or implied. We do not warrant that the website will
                  be uninterrupted or error-free.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">Changes to Terms</h2>
                <p className="text-blue-700 mb-4">
                  We reserve the right to modify these terms at any time. We
                  will notify users of any material changes by posting the new
                  terms on this page.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="kawaii-title text-2xl mb-4">
                  Contact Information
                </h2>
                <p className="text-blue-700 mb-4">
                  For any questions about these Terms of Use, please contact us
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

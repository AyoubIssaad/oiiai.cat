import React from "react";
import { Helmet } from "react-helmet";

export default function SEO({
  title,
  description,
  type = "website",
  imageUrl = "/og-image.jpg",
  imageAlt = "✨ Oiiai Cat - Banana Cat doing the spinny spin! ✨",
  path = "",
}) {
  const baseUrl = "https://oiiai.cat";
  const fullUrl = `${baseUrl}${path}`;
  const fullImageUrl = `${baseUrl}${imageUrl}`;

  const getStructuredData = () => {
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "✨ Oiiai Cat - Banana Cat - The Spinning Wonder!",
      applicationCategory: "Entertainment",
      browserRequirements: "Requires JavaScript (and a sense of humor 😉)",
      description:
        "Make the famous Oiiai Cat and Banana Cat go spinny spin! Control the viral meme cat, send secret cat messages, play typing games, and spread joy across the internet! Featuring the legendary Oiiai Cat in all its rotating glory.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      keywords:
        "banana cat, bananacat, oiiai cat, spinning cat, cat spinning meme, banana cat meme, oiia oiia cat, cat meme code, secret cat messages, cat translator",
      url: baseUrl,
      potentialAction: {
        "@type": "PlayAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://oiiai.cat/cat",
          description: "Make cat go spin!",
        },
      },
    };

    return JSON.stringify(baseStructuredData);
  };

  return (
    <Helmet>
      {/* Fun but SEO-friendly titles and meta */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Expanded keywords including secret message feature */}
      <meta
        name="keywords"
        content="banana cat, bananacat, oiiai cat, spinning cat, cat spinning meme, banana cat meme, oiia oiia cat, secret cat messages, cat meme language, cat meme translator, spinning cat messages"
      />

      {/* OpenGraph with playful descriptions */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={imageAlt} />

      {/* Twitter cards with meme-friendly content */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* SEO best practices with a twist */}
      <link rel="canonical" href={fullUrl} />
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />

      {/* Structured fun data */}
      <script type="application/ld+json">{getStructuredData()}</script>

      <html lang="en" />
    </Helmet>
  );
}

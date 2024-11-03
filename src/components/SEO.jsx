import React from "react";
import { Helmet } from "react-helmet";

export default function SEO({
  title,
  description,
  type = "website",
  imageUrl = "/og-image.jpg",
  imageAlt = "Oiiai Cat - Interactive Spinning Cat Animation",
  path = "",
}) {
  const baseUrl = "https://oiiai.cat";
  const fullUrl = `${baseUrl}${path}`;
  const fullImageUrl = `${baseUrl}${imageUrl}`;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={imageAlt} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional SEO tags */}
      <link rel="canonical" href={fullUrl} />
      <meta name="robots" content="index, follow" />

      {/* Language */}
      <html lang="en" />
    </Helmet>
  );
}

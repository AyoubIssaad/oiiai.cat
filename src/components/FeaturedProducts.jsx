import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";

const STOREFRONT_ACCESS_TOKEN = process.env.REACT_APP_SHOPIFY_PUBLIC_TOKEN;
const SHOP_DOMAIN = "kuzc0a-kz.myshopify.com"; // Replace with your myshopify domain

// GraphQL query to fetch featured products
const FEATURED_PRODUCTS_QUERY = `{
  products(first: 10) {
    edges {
      node {
        id
        title
        handle
        description
        variants(first: 1) {
          edges {
            node {
              price {
                amount
                currencyCode
              }
            }
          }
        }
        featuredImage {
          url
          altText
        }
      }
    }
  }
}`;

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log("Fetching products..."); // Debug log
        const response = await fetch(
          `https://${SHOP_DOMAIN}/api/2023-10/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
              Accept: "application/json",
            },
            body: JSON.stringify({ query: FEATURED_PRODUCTS_QUERY }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        console.log("Products data:", data); // Debug log
        setProducts(data.data.products.edges.map((edge) => edge.node));
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === products.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? products.length - 1 : prevIndex - 1,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">Failed to load products: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      <h2 className="kawaii-title text-xl text-center mb-4">Shop Merch</h2>

      <div className="relative">
        <button
          onClick={prevSlide}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-lg hover:bg-white"
          aria-label="Previous product"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-lg hover:bg-white"
          aria-label="Next product"
        >
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-full flex-shrink-0 px-2">
                <a
                  href={`https://${SHOP_DOMAIN}/products/${product.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:transform hover:scale-105 transition-transform"
                >
                  <div className="kawaii-card p-3 flex flex-col items-center">
                    {product.featuredImage && (
                      <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        className="w-32 h-32 object-contain mb-2 rounded-lg"
                      />
                    )}

                    <h3 className="kawaii-subtitle text-sm text-center line-clamp-1">
                      {product.title}
                    </h3>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-1 mt-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentIndex ? "bg-blue-500" : "bg-blue-200"
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeaturedProducts;

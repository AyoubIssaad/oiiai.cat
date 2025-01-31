import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const STOREFRONT_ACCESS_TOKEN = process.env.REACT_APP_SHOPIFY_PUBLIC_TOKEN;
const SHOP_DOMAIN = "kuzc0a-kz.myshopify.com";

// Updated query with sorting and randomization
const FEATURED_PRODUCTS_QUERY = `
query GetProducts($sortKey: ProductSortKeys!, $reverse: Boolean!) {
  products(first: 12, sortKey: $sortKey, reverse: $reverse) {
    edges {
      node {
        id
        title
        handle
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

// Available sort options
const sortOptions = [
  { key: "BEST_SELLING", reverse: true },
  { key: "CREATED_AT", reverse: true },
  { key: "UPDATED_AT", reverse: true },
];

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to shuffle array
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Randomly select a sort option
        const randomSortOption =
          sortOptions[Math.floor(Math.random() * sortOptions.length)];

        const response = await fetch(
          `https://${SHOP_DOMAIN}/api/2023-10/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
              Accept: "application/json",
            },
            body: JSON.stringify({
              query: FEATURED_PRODUCTS_QUERY,
              variables: {
                sortKey: randomSortOption.key,
                reverse: randomSortOption.reverse,
              },
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        // Shuffle the products before setting them
        const shuffledProducts = shuffleArray(
          data.data.products.edges.map((edge) => edge.node),
        );
        setProducts(shuffledProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []); // Only run on mount

  const nextSlide = () => {
    const maxIndex = isMobile ? products.length - 1 : products.length - 3;
    setCurrentIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    const maxIndex = isMobile ? products.length - 1 : products.length - 3;
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? maxIndex : prevIndex - 1,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50/50 py-8 mb-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-6 px-4 sm:px-0">
          <h2 className="kawaii-title text-xl sm:text-2xl text-blue-700">
            Gifts & Giggles ≡ƒÄü≡ƒÿå
          </h2>
          <a
            href="https://store.oiiai.cat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            View All →
          </a>
        </div>

        <div className="relative">
          <button
            onClick={prevSlide}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/90 shadow-lg hover:bg-white"
            aria-label="Previous product"
          >
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/90 shadow-lg hover:bg-white"
            aria-label="Next product"
          >
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * (isMobile ? 100 : 100 / 3)}%)`,
              }}
            >
              {products.map((product) => (
                <div key={product.id} className="flex-none w-full md:w-1/3">
                  <a
                    href={`https://store.oiiai.cat/products/${product.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      {product.featuredImage && (
                        <img
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          className="w-full aspect-square object-contain rounded-md"
                        />
                      )}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedProducts;

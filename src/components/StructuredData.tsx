import React from 'react';

export function StructuredData() {
  const businessData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://shashtikarz.app/#localbusiness",
        "name": "Shashti Karz",
        "image": "https://shashtikarz.app/logo.png",
        "url": "https://shashtikarz.app",
        "telephone": "+91 73583 03550",
        "priceRange": "₹₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rajalakshmi Roofing Gundon Left Side 100 Meters",
          "addressLocality": "Tirupur",
          "addressRegion": "Tamil Nadu",
          "postalCode": "641654",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 11.1085,
          "longitude": 77.3411
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "09:00",
          "closes": "20:00"
        },
        "sameAs": [
          "https://facebook.com/shashtikarz",
          "https://instagram.com/shashtikarz"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "128"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://shashtikarz.app/#organization",
        "name": "Shashti Karz",
        "url": "https://shashtikarz.app",
        "logo": "https://shashtikarz.app/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91 73583 03550",
          "contactType": "customer service"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://shashtikarz.app/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What services does Shashti Karz offer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Shashti Karz offers premium car detailing services including Ceramic Coating, Graphene Coating, Paint Protection Film (PPF), and advanced Paint Correction."
            }
          },
          {
            "@type": "Question",
            "name": "Where is Shashti Karz located?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We are located in Tirupur, Tamil Nadu. Address: Rajalakshmi Roofing Gundon Left Side 100 Meters, Tirupur-641654."
            }
          },
          {
            "@type": "Question",
            "name": "Do you offer warranty on Ceramic Coating?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we offer multiple years of warranty on our premium Ceramic and Graphene coatings, ranging from 1 to 5 years depending on the package."
            }
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData) }}
    />
  );
}

"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#fafafa",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "1rem",
                backgroundColor: "#fef2f2",
                marginBottom: "1.5rem",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#0a0a0a",
                margin: "0 0 0.75rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "#737373",
                margin: "0 0 2rem",
              }}
            >
              A critical error occurred. Please try refreshing the page or return to the homepage.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  height: "2.75rem",
                  padding: "0 1.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#fafafa",
                  backgroundColor: "#0a0a0a",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  height: "2.75rem",
                  padding: "0 1.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#0a0a0a",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Go home
              </a>
            </div>
            {error.digest && (
              <p
                style={{
                  marginTop: "1.5rem",
                  fontSize: "0.6875rem",
                  color: "#a3a3a3",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}

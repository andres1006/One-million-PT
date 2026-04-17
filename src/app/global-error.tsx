"use client";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Last-resort error boundary used when the root layout itself throws.
 * Keeps the HTML structure minimal so it renders even if providers
 * or Tailwind styles are broken.
 */
export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0a0a0a",
          color: "#f5f5f5",
        }}
      >
        <div style={{ maxWidth: "480px", textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Error crítico
          </h1>
          <p style={{ opacity: 0.8, marginBottom: "16px" }}>
            La aplicación no pudo cargar. Intenta recargar la página.
          </p>
          {error.digest && (
            <code style={{ fontSize: "12px", opacity: 0.6 }}>
              digest: {error.digest}
            </code>
          )}
          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#f5f5f5",
                color: "#0a0a0a",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

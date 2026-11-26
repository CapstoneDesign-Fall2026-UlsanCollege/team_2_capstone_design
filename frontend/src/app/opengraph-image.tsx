import { ImageResponse } from "next/og";

export const alt = "ShopCraft — Your shop, online, before your chiya cools.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          color: "#F5F5F7",
          padding: "72px 84px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "13px",
              backgroundColor: "#0D1412",
              border: "1px solid rgba(52, 211, 153, 0.32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <path
                d="M46 14.5C46 12.6 44.4 11 42.5 11H25.5C17.4 11 12 16.2 12 23.2C12 29.8 16.8 34.4 25.2 35.4H29L31.4 28H26.2C21.4 27.4 19.2 25.6 19.2 23C19.2 20 21.8 18.2 26.2 18.2H42.5C44.4 18.2 46 16.6 46 14.5Z"
                fill="#F5F5F7"
              />
              <path
                d="M18 49.5C18 51.4 19.6 53 21.5 53H38.5C46.6 53 52 47.8 52 40.8C52 34.2 47.2 29.6 38.8 28.6H35L32.6 36H37.8C42.6 36.6 44.8 38.4 44.8 41C44.8 44 42.2 45.8 37.8 45.8H21.5C19.6 45.8 18 47.4 18 49.5Z"
                fill="#34D399"
              />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: "34px",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ fontWeight: 700, color: "#F5F5F7" }}>Shop</span>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#34D399",
              }}
            >
              Craft
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              fontSize: "68px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "#F5F5F7",
            }}
          >
            Your shop, online, before your chiya cools.
          </div>
          <div
            style={{
              width: "220px",
              height: "6px",
              borderRadius: "999px",
              backgroundColor: "#34D399",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "24px",
            color: "#A1A1A6",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "28px",
          }}
        >
          <span>Online Store Builder for Nepal · Khalti &amp; COD</span>
          <span style={{ color: "#F5F5F7" }}>shopcraft.me</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

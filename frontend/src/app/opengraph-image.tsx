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
          backgroundColor: "#0E0F12",
          color: "#ECECE9",
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
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#ECECE9",
              color: "#0E0F12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#ECECE9",
            }}
          >
            ShopCraft
          </span>
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
              color: "#ECECE9",
            }}
          >
            Your shop, online, before your chiya cools.
          </div>
          <div
            style={{
              width: "220px",
              height: "6px",
              borderRadius: "999px",
              backgroundColor: "#F2A900",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "24px",
            color: "#B4B6BD",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "28px",
          }}
        >
          <span>Online Store Builder for Nepal · Khalti &amp; COD</span>
          <span style={{ color: "#ECECE9" }}>shopcraft.me</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

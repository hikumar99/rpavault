import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/config";

export const runtime = "edge";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  const isPersonal = !APP_NAME.toLowerCase().includes("rpavault");
  const letter = isPersonal ? (APP_NAME.charAt(0).toUpperCase() || "K") : "R";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #4772fa 0%, #6366f1 100%)",
          color: "white",
          fontSize: "20px",
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 2px 8px rgba(71, 114, 250, 0.4)",
        }}
      >
        {letter}
      </div>
    ),
    {
      ...size,
    }
  );
}

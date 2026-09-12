import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/config";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: "40px",
          background: "linear-gradient(135deg, #4772fa 0%, #6366f1 100%)",
          color: "white",
          fontSize: "108px",
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
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

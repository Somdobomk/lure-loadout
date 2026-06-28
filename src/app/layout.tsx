import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "LureLoadout",
  description: "Know what to throw. AI-powered fishing gear inventory & lure recommendations.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LureLoadout" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1d2021",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      appearance={{
        variables: {
          colorBackground:      "#282828",   // card/modal background
          colorInput:           "#1d2021",   // input field background (was colorInputBackground)
          colorInputForeground: "#ebdbb2",   // input text (was colorInputText)
          colorForeground:      "#ebdbb2",   // primary text (was colorText)
          colorMutedForeground: "#a89984",   // secondary text (was colorTextSecondary)
          colorPrimary:         "#689d6a",   // accent color
          colorDanger:          "#fb4934",   // error color
          colorNeutral:         "#3c3836",   // borders and neutral shades
          borderRadius:         "2px",
        },
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

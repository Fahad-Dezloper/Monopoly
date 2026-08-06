import type { Metadata } from "next";
import { Anton, Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Robinverse Monopoly",
  description:
    "Robinverse Monopoly — multiplayer property wars. Create a room, join friends, roll dice, buy cities.",
  icons: {
    icon: "/brand/robinverse-mascot.png",
    apple: "/brand/robinverse-mascot.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${sans.variable} ${display.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

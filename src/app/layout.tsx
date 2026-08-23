import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Game Backlog",
  description: "Track your game backlog: platforms, status, ratings, playtime and more.",
};

// Applies the persisted theme before paint to avoid a flash of the wrong theme.
const themeInit = `(function(){try{if(localStorage.getItem("theme")==="light"){document.documentElement.classList.remove("dark")}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}

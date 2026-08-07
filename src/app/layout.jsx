import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import EasterEggs from "@/components/providers/EasterEggs";

export const metadata = {
  title: {
    default: "The Turing Circle Journal",
    template: "%s | The Turing Circle",
  },
  description:
    "Field notes from the edge of mathematics, computation, and collective intelligence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <EasterEggs />
      </body>
    </html>
  );
}

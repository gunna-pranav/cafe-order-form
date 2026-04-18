import "./globals.css";

export const metadata = {
  title: "Cafe 4147 Orders",
  description: "Cafe order form with Airtable integration"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

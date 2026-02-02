import "../styles/globals.css";

export const metadata = {
  title: "Fiori Adoption Assistant",
  description: "Simple UI to query the assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

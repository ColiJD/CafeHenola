import { Montserrat, Roboto } from "next/font/google";
import "antd/dist/reset.css";
import "./globals.css";
import ClientProviders from "@/config/providers"; // wrapper para client-side
import DashboardLayout from "@/components/MenuAnt";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Cafe Henola",
  description: "Beneficio Cafe Henola",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${roboto.variable}`}>
        <ClientProviders>
          <DashboardLayout>{children}</DashboardLayout>
        </ClientProviders>
      </body>
    </html>
  );
}

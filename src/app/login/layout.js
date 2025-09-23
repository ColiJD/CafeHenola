// app/login/layout.js
import { Montserrat, Roboto } from "next/font/google";
import "antd/dist/reset.css";
import "../globals.css";
import ClientProviders from "@/config/providers";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400","700"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400","700"] });

export default function LoginLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${roboto.variable}`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

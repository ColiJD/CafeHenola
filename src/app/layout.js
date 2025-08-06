import { Montserrat, Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"], // Puedes agregar los pesos que necesites
  style: ["normal"], // Puedes agregar estilos si quieres (normal, italic)
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal"],
});

export const metadata = {
  title: "Cafe Henola",
  description: "Beneficio Cafe henola",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${roboto.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}

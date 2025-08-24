"use client";
import { ConfigProvider } from "antd";
import esEs from "antd/locale/es_ES";
import theme from "@/config/themeConfig";

export default function ClientProviders({ children }) {
  return (
    <ConfigProvider theme={theme} locale={esEs}>
      {children}
    </ConfigProvider>
  );
}

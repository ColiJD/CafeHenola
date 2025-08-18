"use client";
import { ConfigProvider } from "antd";
import theme from "@/config/themeConfig";

export default function ClientProviders({ children }) {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}

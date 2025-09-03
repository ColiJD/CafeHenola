"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { menuItem } from "@/lib/menu";
import { Layout, Menu, Button, theme, Grid, Drawer } from "antd";
import "@/style/menu.css";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function DashboardLayout({ children }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [collapsed, setCollapsed] = useState(false); // desktop: colapsable
  const [drawerVisible, setDrawerVisible] = useState(false); // mobile: Drawer

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 🔹 Ajustar collapsed en desktop cuando cambie la resolución
  useEffect(() => {
    if (!isMobile) setCollapsed(false);
  }, [isMobile]);

  // 🔹 Generar items del menú
  const generateMenuItems = (items) =>
    items.map((item) => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children.map((sub) => ({
            key: sub.key,
            label: <Link href={sub.route}>{sub.label}</Link>,
            onClick: () => isMobile && setDrawerVisible(false), // cerrar Drawer en mobile
          })),
        };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: <Link href={item.route}>{item.label}</Link>,
        onClick: () => isMobile && setDrawerVisible(false), // cerrar Drawer en mobile
      };
    });

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      defaultSelectedKeys={["inicio"]}
      items={generateMenuItems(menuItem)}
      style={{ height: "100%", borderRight: 0 }}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 🔹 Desktop Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="dark"
          width={250}
          style={{
            height: "100vh",
            overflowY: "auto",
            flexShrink: 0,
          }}
          className="scroll-hidden"
        >
          <div
            style={{
              display: "grid",
              gridAutoFlow: collapsed ? "row" : "column",
              justifyItems: "center",
              alignItems: "center",
              gap: collapsed ? 4 : 8,
              color: "#fff",
              margin: "16px 0",
              transition: "all 0.2s",
            }}
          >
            <h1
              style={{
                fontSize: collapsed ? 14 : 18,
                fontWeight: 700,
                textAlign: "center",
                margin: 0,
                whiteSpace: "wrap",
                transition: "all 0.2s",
              }}
            >
              Cafe Henola
            </h1>

            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: collapsed ? 14 : 16,
                width: collapsed ? "28px" : "32px",
                height: collapsed ? "28px" : "32px",
                color: "#fff",
                padding: 0,
                transition: "all 0.2s",
              }}
            />
          </div>

          {menu}
        </Sider>
      )}

      {/* 🔹 Mobile Drawer */}
      {isMobile && (
        <Drawer
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          placement="left"
          closable={false} // 🔹 desactiva la X predeterminada
          styles={{ body: { padding: 0, height: "100%" } }}
          width={250}
        >
          {/* Header personalizado: título + botón cerrar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "#001529",
            }}
          >
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "#fff",
              }}
            >
              Cafe Henola
            </h1>
            <Button
              type="text"
              onClick={() => setDrawerVisible(false)}
              style={{
                fontSize: 50,
                color: "#fff",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </Button>
          </div>

          {/* Menú */}
          {menu}
        </Drawer>
      )}

      {/* 🔹 Contenido principal */}
      <Layout style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        <Content
          style={{
            height: "100vh",
            overflowY: "auto",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
          className="scroll-hidden"
        >
          {/* 🔹 Botón de menú para mobile */}
          {isMobile && (
            <Button
              type="primary"
              onClick={() => setDrawerVisible(true)}
              style={{ marginBottom: 16 }}
            >
              <MenuUnfoldOutlined /> Menú
            </Button>
          )}

          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

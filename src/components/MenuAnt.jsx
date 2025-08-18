"use client";
import React, { useState } from "react";
import Link from "next/link";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { menuItem } from "@/lib/menu";
import { Layout, Menu, Button, theme } from "antd";

const { Sider, Content } = Layout;

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
          })),
        };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: <Link href={item.route}>{item.label}</Link>,
      };
    });

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Menu lateral fijo */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={250}
        style={{
          overflow: "hidden",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
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
              whiteSpace: 'wrap',
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

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["inicio"]}
          items={generateMenuItems(menuItem)}
        />
      </Sider>

      {/* Contenido independiente y scrollable */}
      <Layout style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

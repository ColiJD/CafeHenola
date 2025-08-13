"use client";

import React from "react";
import "@/style/menu.css"; // Asumiendo que @ apunta a raíz del proyecto
import Link from "next/link";
import Image from "next/image";

import eventos from "@/img/eventos.png";
import producto from "@/img/cliente.png";
import cliente from "@/img/product.png";
import depo from "@/img/deposito.png";


const menuItems = [
  {
    id: 1,
    name: "Compra Directa",
    image: depo, // imagen importada
    link: "/compra",
  },
  {
    id: 2,
    name: "Clientes",
    image: producto, // ruta desde public
    link: "/cliente",
  },
  {
    id: 3,
    name: "Producto",
    image: cliente,
    link: "/producto",
  },
  {
    id: 4,
    name: "Evento",
    image: eventos,
    link: "/eventos",
  },
  {
    id: 5,
    name: "Deposito",
    image: depo,
    link: "/deposito",
  },
];

export default function Menu() {
  return (
    <main className="menu-container">
      {menuItems.map(({ id, name, image, link }) => (
        <Link key={id} href={link} className="menu-card">
          {/* Si la imagen es importada, usa Image con src importado.
              Si es string, también funciona */}
          <Image
            src={image}
            alt={name}
            className="menu-card-image"
            width={320}
            height={140}
            style={{ objectFit: "cover" }}
            priority={id === 1} // ejemplo: prioridad para la primera imagen
          />
          <h2 className="menu-card-title">{name}</h2>
        </Link>
      ))}
    </main>
  );
}

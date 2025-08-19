// 📂 app/page/menu/[key]/page.js
"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { menuItems } from "@/lib/menu";
import "@/style/menu.css";

export default function SubMenuPage() {
  const params = useParams();
  const menuId = Number(params.key);

  const menu = menuItems.find((item) => item.id === menuId);

  if (!menu) return <p>Menú no encontrado</p>;

  return (
    <main>
      <h1 className="menu-title">{menu.name}</h1>

      {menu.subItems ? (
        <div className="menu-container">
          {menu.subItems.map((sub) => (
            <Link key={sub.id} href={sub.href} className="menu-card">
              <Image
                src={sub.image}
                alt={sub.name}
                className="menu-card-image"
                width={320}
                height={140}
                style={{ objectFit: "cover" }}
              />
              <h2 className="menu-card-title">{sub.name}</h2>
            </Link>
          ))}
        </div>
      ) : (
        <p>No hay submenús disponibles</p>
      )}
    </main>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Modal } from "antd";

export default function SessionTimeout({ warnBeforeSeconds = 60 }) {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const signOutTimeoutRef = useRef(null);
  const warnTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    clearTimeout(signOutTimeoutRef.current);
    clearTimeout(warnTimeoutRef.current);
    clearInterval(intervalRef.current);

    if (!session?.expires) return;

    const expiresAt = new Date(session.expires).getTime();
    const now = Date.now();
    const msUntilExpire = Math.max(0, expiresAt - now);
    const warnMs = Math.max(0, msUntilExpire - warnBeforeSeconds * 1000);

    // Mostrar modal antes de expirar
    warnTimeoutRef.current = setTimeout(() => {
      setVisible(true);
      setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      intervalRef.current = setInterval(() => {
        const secondsLeft = Math.max(
          0,
          Math.ceil((expiresAt - Date.now()) / 1000)
        );
        setCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(intervalRef.current);
        }
      }, 1000);
    }, warnMs);

    // Auto signOut al expirar
    signOutTimeoutRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, msUntilExpire);

    return () => {
      clearTimeout(signOutTimeoutRef.current);
      clearTimeout(warnTimeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [session, warnBeforeSeconds]);

  return (
    <Modal
      open={visible}
      title="Tu sesión está por expirar"
      okText="Seguir conectado"
      cancelText="Cerrar sesión"
      onOk={() => setVisible(false)}
      onCancel={() => signOut({ callbackUrl: "/login" })}
    >
      <p>
        Tu sesión expirará en <strong>{countdown ?? "..."}</strong> segundos.
      </p>
      <p>Si no haces nada se cerrará automáticamente.</p>
    </Modal>
  );
}

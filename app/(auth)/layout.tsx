import type { ReactNode } from "react";

import "../auth.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}

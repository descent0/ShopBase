"use client";

import { usePathname } from "next/navigation";
import FloatingChatbot from "./FloatingChatbot";

export default function ConditionalChatbot() {
  const pathname = usePathname();

  // Don't show chatbot on homepage (/)
  if (pathname === "/") {
    return null;
  }

  return <FloatingChatbot />;
}

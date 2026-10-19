"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Settings,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import styles from "../Style/Sidebar.module.css"
import { ThemeToggle } from "./theme-toggle"

export function AppSidebar() {
  const pathname = usePathname()

  const navMain = [
    {
      title: "Tableau de Bord",
      items: [
        { title: "Statistiques", url: "/", icon: Home },
      ],
    },
    {
      title: "Catalogue",
      items: [
        { title: "Articles", url: "/articles", icon: Package },
      ],
    },
    {
      title: "Commandes",
      items: [
        { title: "Clients", url: "/commandes-clients", icon: ShoppingCart },
        { title: "Fournisseurs", url: "/commandes-fournisseurs", icon: ShoppingCart },
      ],
    },
    {
      title: "Gestion",
      items: [
        { title: "Clients", url: "/clients", icon: Users },
        { title: "Budget", url: "/budget", icon: Wallet },
      ],
    },
  ]

  return (
    <aside className={styles.sidebar}>
      {/* Header (Like Image 2 user selector) */}
      <div className={styles.header}>
        <div className={styles.avatar}>C</div>
        <div className={styles.headerInfo}>
          <span className={styles.username}>celestia.jewelry</span>
        </div>
        <ChevronDown className="h-4 w-4 text-zinc-500" />
      </div>

      {/* Navigation list */}
      <div className={styles.content}>
        {navMain.map((group) => (
          <div key={group.title} className={styles.group}>
            <span className={styles.groupLabel}>{group.title}</span>
            {group.items.map((item) => {
              const isActive = pathname === item.url
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                >
                  <Icon className={styles.icon} />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer with theme switcher */}
      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <span>Mode Sombre</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

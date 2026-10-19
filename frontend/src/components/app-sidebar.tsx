"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Menu,
  X,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import styles from "../Style/Sidebar.module.css"
import { ThemeToggle } from "./theme-toggle"

export function AppSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Fermer le menu lors du changement de route
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Fermer avec la touche Échap
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Bloquer le scroll de la page quand le menu mobile est ouvert
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

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
    <>
      {/* ── Top Bar Mobile (Visible uniquement sur mobile < 768px) ── */}
      <div className={styles.mobileTopBar}>
        <button
          type="button"
          className={styles.hamburgerButton}
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className={styles.mobileBrand}>
          <div className={styles.avatar}>C</div>
          <span className={styles.mobileBrandName}>celestia.jewelry</span>
        </div>

        <div className={styles.mobileThemeToggle}>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Backdrop Overlay (Flou & assombrissement lors de l'ouverture mobile) ── */}
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (Fixe sur Desktop, Tiroir coulissant sur Mobile) ── */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
        {/* Header avec logo / profil et bouton fermeture mobile */}
        <div className={styles.header}>
          <div className={styles.avatar}>C</div>
          <div className={styles.headerInfo}>
            <span className={styles.username}>celestia.jewelry</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-zinc-500 ${styles.desktopOnlyChevron}`} />

          {/* Bouton fermer (X) visible uniquement sur mobile */}
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
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
                    onClick={() => setMobileOpen(false)}
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

        {/* Footer avec theme switcher */}
        <div className={styles.footer}>
          <div className={styles.footerRow}>
            <span>Mode Sombre</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  )
}

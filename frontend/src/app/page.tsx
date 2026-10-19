"use client"

import * as React from "react"
import { BarChart3, Plus, ChevronLeft, ChevronRight, Package, Users, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"
import styles from "../Style/Dashboard.module.css"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchDashboardData, fetchProfitsData, defaultData, type DashboardData } from "./actions"



export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData>(defaultData)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"transactions" | "commandes">("transactions")
  const [profitsData, setProfitsData] = React.useState<any[]>([])
  const [profitsLoading, setProfitsLoading] = React.useState(true)
  const [selectedPeriod, setSelectedPeriod] = React.useState<"30" | "90" | "180" | "365" | "1095" | "all">("30")
  const [margePeriod, setMargePeriod] = React.useState<"all" | "today" | "week" | "month" | "custom">("all")
  const [margeDateFrom, setMargeDateFrom] = React.useState("")
  const [margeDateTo, setMargeDateTo] = React.useState("")
  const [showMargeFilter, setShowMargeFilter] = React.useState(false)
  const [showRoiInfo, setShowRoiInfo] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    fetchDashboardData(margePeriod, margeDateFrom, margeDateTo)
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats:", err)
        setLoading(false)
      })
  }, [margePeriod, margeDateFrom, margeDateTo])

  React.useEffect(() => {
    setProfitsLoading(true)
    fetchProfitsData(selectedPeriod)
      .then((data) => {
        setProfitsData(data)
        setProfitsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch profits data:", err)
        setProfitsLoading(false)
      })
  }, [selectedPeriod])

  const solde = data.portefeuille?.solde_actuel ?? 0
  const resteEncaisser = data.commandes_clients?.reste_a_encaisser ?? 0
  const margeBeneficiaire = data.marge_beneficiaire ?? 0

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Vue d'ensemble</h1>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Live Data
        </div>
        <span className={styles.subInfo}>Dernière synchronisation : À l'instant</span>
      </div>

      {/* Top Row (Two large cards) */}
      <div className={styles.topRow}>
        {/* Card 1: Portefeuille */}
        <div className={styles.premiumCard}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardLabel}>Solde Global (Portefeuille)</span>
              <div className={styles.cardValue}>
                {loading ? "..." : `${parseFloat(solde.toString()).toLocaleString("fr-DZ")} DA`}
              </div>
            </div>
            <select className={styles.cardSelect}>
              <option>Actuel</option>
            </select>
          </div>

          {!data.derniers_logs || data.derniers_logs.length === 0 ? (
            <div className={styles.cardBody}>
              <BarChart3 className="h-8 w-8 text-zinc-600 mb-2" />
              <span>Aucune donnée de transaction disponible</span>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem", justifyContent: "flex-end" }}>
              {data.derniers_logs.slice(0, 3).map((log) => (
                <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem", padding: "0.4rem 0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "0.5rem" }}>{log.description}</span>
                  <span style={{ color: log.type === "credit" ? "#34d399" : "#f87171", fontWeight: 600, fontSize: "0.78rem", backgroundColor: log.type === "credit" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)", padding: "0.15rem 0.45rem", borderRadius: "5px", flexShrink: 0 }}>
                    {log.type === "credit" ? "+" : "−"}{parseFloat(log.montant.toString()).toLocaleString("fr-DZ")} DA
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Commandes Clients */}
        <div className={styles.premiumCard}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardLabel}>Reste à Encaisser (Clients)</span>
              <div className={styles.cardValue}>
                {loading ? "..." : `${parseFloat(resteEncaisser.toString()).toLocaleString("fr-DZ")} DA`}
              </div>
            </div>
            <select className={styles.cardSelect}>
              <option>Total</option>
            </select>
          </div>

          <div className={styles.ordersGrid}>
            <div className={styles.orderPill}>
              <div className={styles.orderPillValue} style={{ color: "#e4e4e7" }}>{loading ? "..." : (data.commandes_clients?.en_cours ?? 0)}</div>
              <div className={styles.orderPillLabel}>En cours</div>
            </div>
            <div className={styles.orderPill} style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div className={styles.orderPillValue} style={{ color: "#fbbf24" }}>{loading ? "..." : (data.commandes_clients?.pret ?? 0)}</div>
              <div className={styles.orderPillLabel}>Prêtes</div>
            </div>
            <div className={styles.orderPill}>
              <div className={styles.orderPillValue} style={{ color: "#34d399" }}>{loading ? "..." : (data.commandes_clients?.livrees ?? 0)}</div>
              <div className={styles.orderPillLabel}>Livrées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row (6 Small Cards) */}
      <div className={styles.middleRow}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Catalogue</span>
            <Package className={styles.statIcon} />
          </div>
          <div>
            <div className={styles.statValue}>{loading ? "..." : (data.articles?.total ?? 0)}</div>
            <div className={styles.statLabel}>Articles enregistrés</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Fournisseurs</span>
            <ShoppingCart className={styles.statIcon} />
          </div>
          <div>
            <div className={styles.statValue}>{loading ? "..." : (data.commandes_fournisseur?.total ?? 0)}</div>
            <div className={styles.statLabel}>Commandes d'achats</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Clients</span>
            <Users className={styles.statIcon} />
          </div>
          <div>
            <div className={styles.statValue}>{loading ? "..." : (data.clients?.total ?? 0)}</div>
            <div className={styles.statLabel}>Fiches clients</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ position: "relative" }}>
          <div className={styles.statHeader}>
            <span>Marge Bénéficiaire</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setShowMargeFilter(!showMargeFilter)}
                style={{
                  padding: "0.25rem",
                  borderRadius: "4px",
                  border: "1px solid #27272a",
                  backgroundColor: "transparent",
                  color: "#71717a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Filtrer par période"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </button>
              <TrendingDown className={styles.statIcon} style={{ color: margeBeneficiaire >= 0 ? "#10b981" : "#f87171" }} />
            </div>
          </div>
          <div>
            <div className={styles.statValue}>
              {loading ? "..." : `${parseFloat(margeBeneficiaire.toString()).toLocaleString("fr-DZ")} DA`}
            </div>
            <div className={styles.statLabel}>
              Marge bénéficiaire
              {margePeriod !== "all" && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#71717a" }}>
                  ({margePeriod === "today" ? "Aujourd'hui" : margePeriod === "week" ? "Cette semaine" : margePeriod === "month" ? "Ce mois" : margePeriod === "custom" ? "Personnalisé" : "Tout"})
                </span>
              )}
            </div>
          </div>
          {showMargeFilter && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                right: 0,
                marginBottom: "0.5rem",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                padding: "0.75rem",
                zIndex: 100,
                minWidth: "200px",
                maxWidth: "calc(100vw - 2rem)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={() => { setMargePeriod("all"); setShowMargeFilter(false) }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: margePeriod === "all" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: margePeriod === "all" ? "#10b981" : "#e4e4e7",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem"
                  }}
                >
                  Tout
                </button>
                <button
                  onClick={() => { setMargePeriod("today"); setShowMargeFilter(false) }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: margePeriod === "today" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: margePeriod === "today" ? "#10b981" : "#e4e4e7",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem"
                  }}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => { setMargePeriod("week"); setShowMargeFilter(false) }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: margePeriod === "week" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: margePeriod === "week" ? "#10b981" : "#e4e4e7",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem"
                  }}
                >
                  Cette semaine
                </button>
                <button
                  onClick={() => { setMargePeriod("month"); setShowMargeFilter(false) }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: margePeriod === "month" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: margePeriod === "month" ? "#10b981" : "#e4e4e7",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem"
                  }}
                >
                  Ce mois
                </button>
                <button
                  onClick={() => setMargePeriod("custom")}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: margePeriod === "custom" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: margePeriod === "custom" ? "#10b981" : "#e4e4e7",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem"
                  }}
                >
                  Personnalisé
                </button>
                {margePeriod === "custom" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #27272a" }}>
                    <input
                      type="date"
                      value={margeDateFrom}
                      onChange={(e) => setMargeDateFrom(e.target.value)}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #27272a",
                        backgroundColor: "#09090b",
                        color: "#e4e4e7",
                        fontSize: "0.875rem"
                      }}
                      placeholder="Du"
                    />
                    <input
                      type="date"
                      value={margeDateTo}
                      onChange={(e) => setMargeDateTo(e.target.value)}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #27272a",
                        backgroundColor: "#09090b",
                        color: "#e4e4e7",
                        fontSize: "0.875rem"
                      }}
                      placeholder="Au"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Total Prix Produits</span>
            <Package className={styles.statIcon} />
          </div>
          <div>
            <div className={styles.statValue}>{loading ? "..." : `${parseFloat(data.articles?.total_prix_achat?.toString() || "0").toLocaleString("fr-DZ")} DA`}</div>
            <div className={styles.statLabel}>Valeur du stock (prix achat)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Argent Total Possédé</span>
            <TrendingUp className={styles.statIcon} style={{ color: "#fbbf24" }} />
          </div>
          <div>
            <div className={styles.statValue}>{loading ? "..." : `${parseFloat(data.argent_total_possede?.toString() || "0").toLocaleString("fr-DZ")} DA`}</div>
            <div className={styles.statLabel}>Stock + Portefeuille</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ position: "relative" }}>
          <div className={styles.statHeader}>
            <span>ROI Global</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {!loading && (
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "20px",
                  backgroundColor: data.roi_global >= 20 ? "rgba(16, 185, 129, 0.15)" : data.roi_global >= 0 ? "rgba(251, 191, 36, 0.15)" : "rgba(248, 113, 113, 0.15)",
                  color: data.roi_global >= 20 ? "#10b981" : data.roi_global >= 0 ? "#fbbf24" : "#f87171",
                }}>
                  {data.roi_global >= 20 ? "🔥 Excellent" : data.roi_global >= 0 ? "📈 Positif" : "⚠️ Négatif"}
                </span>
              )}
              <button
                onClick={() => setShowRoiInfo(!showRoiInfo)}
                title="Comment est calculé le ROI ?"
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backgroundColor: showRoiInfo ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  color: showRoiInfo ? "#818cf8" : "#71717a",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                !
              </button>
            </div>
          </div>

          {showRoiInfo && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              width: "min(320px, calc(100vw - 2rem))",
              backgroundColor: "#0f0f10",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "10px",
              padding: "1rem",
              zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              fontSize: "0.8rem",
              lineHeight: "1.6",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 700, color: "#818cf8", fontSize: "0.85rem" }}>📐 Comment est calculé le ROI ?</span>
                <button onClick={() => setShowRoiInfo(false)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ backgroundColor: "rgba(99,102,241,0.08)", borderRadius: "6px", padding: "0.6rem 0.75rem", marginBottom: "0.75rem", fontFamily: "monospace", color: "#c4b5fd", fontSize: "0.78rem" }}>
                ROI = (Bénéfice Net / Investi) × 100
              </div>
              <div style={{ color: "#a1a1aa", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div><span style={{ color: "#e4e4e7", fontWeight: 600 }}>Bénéfice Net</span> = Ventes livrées − Coût achat articles vendus − Dépenses générales</div>
                <div style={{ paddingLeft: "0.75rem", fontSize: "0.75rem", borderLeft: "2px solid rgba(99,102,241,0.3)" }}>
                  <div>✅ Dépenses comptées : packaging, pub, loyer, salaires...</div>
                  <div>❌ Exclues : achat fournisseur (déjà dans &quot;Investi&quot;)</div>
                </div>
                <div><span style={{ color: "#e4e4e7", fontWeight: 600 }}>Investi</span> = Total commandes fournisseurs reçues (table Commande)</div>
              </div>
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#71717a", fontSize: "0.75rem" }}>
                💡 Si ton ROI est bas alors que tu as vendu, c&apos;est souvent que tu as encore beaucoup de stock non vendu — ton capital est « bloqué ».
              </div>
            </div>
          )}

          <div>
            <div className={styles.statValue} style={{
              color: loading ? "#e4e4e7" : data.roi_global >= 20 ? "#10b981" : data.roi_global >= 0 ? "#fbbf24" : "#f87171"
            }}>
              {loading ? "..." : `${data.roi_global > 0 ? "+" : ""}${data.roi_global.toLocaleString("fr-DZ")} %`}
            </div>
            <div className={styles.statLabel}>
              Rentabilité sur {loading ? "..." : `${parseFloat(data.total_investi_fournisseurs?.toString() || "0").toLocaleString("fr-DZ")} DA investis`}
            </div>
          </div>
        </div>
      </div>

      {/* Profits Chart Section */}
      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <TrendingUp className={styles.chartIcon} />
            <h2 className={styles.chartTitle}>Évolution des Bénéfices</h2>
          </div>
          <div className={styles.chartPeriodsWrapper}>
            {[
              { value: "30", label: "30 jours" },
              { value: "90", label: "3 mois" },
              { value: "180", label: "6 mois" },
              { value: "365", label: "1 an" },
              { value: "1095", label: "3 ans" },
              { value: "all", label: "Tout" }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={`${styles.chartPeriodBtn} ${selectedPeriod === period.value ? styles.chartPeriodBtnActive : ""}`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.chartContainer}>
          {profitsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#71717a" }}>
              Chargement...
            </div>
          ) : profitsData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#71717a" }}>
              Aucune donnée de bénéfice disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  tickFormatter={(value) => `${value.toLocaleString("fr-DZ")} DA`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#e4e4e7"
                  }}
                  formatter={(value: any) => [`${value?.toLocaleString("fr-DZ") || 0} DA`, "Bénéfice"]}
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("fr-DZ")
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="benefice"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Section (Recent Activities) */}
      <div className={styles.bottomSection}>
        <div className={styles.tabsContainer}>
          <div className={styles.tabsHeaderWrapper}>
            <h2 className={styles.sectionTitle}>Flux d'Activités</h2>
            <div className={styles.tabs}>
              <div
                className={`${styles.tab} ${activeTab === "transactions" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("transactions")}
              >
                Mouvements Caisse
              </div>
              <div
                className={`${styles.tab} ${activeTab === "commandes" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("commandes")}
              >
                Commandes Récentes
              </div>
            </div>
          </div>

          <Link href={activeTab === "transactions" ? "/budget" : "/commandes-clients"}>
            <button className={styles.actionButton}>
              <Plus className="h-4 w-4" />
              <span>Nouveau {activeTab === "transactions" ? "Mouvement" : "Client"}</span>
            </button>
          </Link>
        </div>

        {/* Table content depending on the active tab */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              {activeTab === "transactions" ? (
                <tr>
                  <th className={styles.tableHeaderCell}>Description</th>
                  <th className={styles.tableHeaderCell}>Type</th>
                  <th className={styles.tableHeaderCell}>Date</th>
                  <th className={styles.tableHeaderCell} style={{ textAlign: "right" }}>Montant</th>
                </tr>
              ) : (
                <tr>
                  <th className={styles.tableHeaderCell}>Client</th>
                  <th className={styles.tableHeaderCell}>Description</th>
                  <th className={styles.tableHeaderCell}>Statut</th>
                  <th className={styles.tableHeaderCell} style={{ textAlign: "right" }}>Total</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === "transactions" ? (
                !data.derniers_logs || data.derniers_logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.tableCell} style={{ textAlign: "center", padding: "3rem", color: "#71717a" }}>
                      Aucun mouvement récent enregistré.
                    </td>
                  </tr>
                ) : (
                  data.derniers_logs.map((log) => (
                    <tr key={log.id} className={styles.tableRow}>
                      <td className={styles.tableCell} data-label="Description" style={{ fontWeight: 500, color: "#fff" }}>{log.description}</td>
                      <td className={styles.tableCell} data-label="Type">
                        <span className={styles.badgeStatus} style={{
                          backgroundColor: log.type === "credit" ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.12)",
                          color: log.type === "credit" ? "#34d399" : "#f87171"
                        }}>
                          {log.type === "credit" ? "Revenu" : "Dépense"}
                        </span>
                      </td>
                      <td className={styles.tableCell} data-label="Date" style={{ color: "#a1a1aa" }}>{new Date(log.createdAt).toLocaleDateString("fr-DZ", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className={styles.tableCell} data-label="Montant" style={{ textAlign: "right", fontWeight: 700, color: log.type === "credit" ? "#34d399" : "#f87171" }}>
                        {log.type === "credit" ? "+" : "−"}{parseFloat(log.montant.toString()).toLocaleString("fr-DZ")} DA
                      </td>
                    </tr>
                  ))
                )
              ) : (
                !data.dernieres_commandes_clients || data.dernieres_commandes_clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.tableCell} style={{ textAlign: "center", padding: "3rem", color: "#71717a" }}>
                      Aucune commande client récente.
                    </td>
                  </tr>
                ) : (
                  data.dernieres_commandes_clients.map((cmd) => (
                    <tr key={cmd.id} className={styles.tableRow}>
                      <td className={styles.tableCell} data-label="Client" style={{ fontWeight: 500, color: "#fff" }}>{cmd.Client?.nom || "Client Anonyme"}</td>
                      <td className={styles.tableCell} data-label="Description" style={{ color: "#a1a1aa" }}>{cmd.description}</td>
                      <td className={styles.tableCell} data-label="Statut">
                        <span className={styles.badgeStatus} style={{
                          backgroundColor: cmd.statut === "en_cours" ? "rgba(245, 158, 11, 0.15)" : cmd.statut === "pret" ? "rgba(59, 130, 246, 0.15)" : "rgba(52, 211, 153, 0.15)",
                          color: cmd.statut === "en_cours" ? "#fbbf24" : cmd.statut === "pret" ? "#60a5fa" : "#34d399",
                        }}>
                          {cmd.statut.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={styles.tableCell} data-label="Total" style={{ textAlign: "right", fontWeight: 700, color: "#e4e4e7" }}>
                        {parseFloat(cmd.prix_total.toString()).toLocaleString("fr-DZ")} DA
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Navigation controls */}
        <div className={styles.paginationFooter}>
          <div className={styles.paginationCount}>
            Affichage de {activeTab === "transactions" ? data.derniers_logs?.length ?? 0 : data.dernieres_commandes_clients?.length ?? 0} éléments
          </div>
          <div className={styles.paginationBtnGroup}>
            <button className={styles.paginationBtn} aria-label="Page précédente">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className={styles.paginationBtn} aria-label="Page suivante">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

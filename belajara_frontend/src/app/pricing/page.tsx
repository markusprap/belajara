"use client";

import React, { useEffect, useState } from "react";
import { Check, Zap, BookOpen, GraduationCap, Sparkles, ArrowRight, Star, Lock, CreditCard, RefreshCw, AlertCircle } from "lucide-react";
import { getUser, api } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingTier {
  id: "free" | "scholar" | "pro";
  name: string;
  tagline: string;
  price: number | null;
  priceLabel: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgGradient: string;
  ctaLabel: string;
  ctaStyle: "outline" | "filled" | "accent";
  features: string[];
  notIncluded?: string[];
}

const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Mulai tanpa biaya",
    price: null,
    priceLabel: "Gratis",
    icon: BookOpen,
    color: "#7E7C82",
    borderColor: "#E8E5E9",
    bgGradient: "linear-gradient(135deg, #FAF9FB 0%, #F3F1F4 100%)",
    ctaLabel: "Mulai Sekarang",
    ctaStyle: "outline",
    features: [
      "Akses dashboard belajar mahasiswa",
      "Rekomendasi KRS / Rencana Studi Berbasis AI (Dasar - 1×/bulan)",
      "Mengikuti evaluasi pembelajaran berdurasi standar (10 menit)",
      "Bergabung di Forum Diskusi umum",
    ],
    notIncluded: [
      "Rekomendasi Rencana Studi AI tingkat lanjut",
      "Akses modul belajar premium & bank soal kompetensi",
      "Prioritas diskusi bersama Dosen / Pengajar",
      "Integrasi checkout Midtrans Snap API",
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    tagline: "Paling populer untuk mahasiswa",
    price: 49000,
    priceLabel: "Rp49.000",
    badge: "Terpopuler",
    badgeColor: "#C6B5BF",
    icon: GraduationCap,
    color: "#060708",
    borderColor: "#C6B5BF",
    bgGradient: "linear-gradient(135deg, #FAF9FB 0%, #F0EBF0 100%)",
    ctaLabel: "Mulai Scholar",
    ctaStyle: "filled",
    features: [
      "Semua manfaat dalam Paket Dasar",
      "Rekomendasi Rencana Studi Berbasis AI tingkat lanjut (Unlimited)",
      "Akses modul belajar premium & bank soal kompetensi",
      "Prioritas diskusi bersama Dosen / Pengajar kelas",
      "Integrasi checkout aman instan dengan Midtrans Snap API",
      "Download materi kuliah (PDF & slides)",
      "Tanpa iklan",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Untuk mahasiswa ambisius",
    price: 99000,
    priceLabel: "Rp99.000",
    badge: "Pro Value",
    badgeColor: "#CF3A1F",
    icon: Sparkles,
    color: "#CF3A1F",
    borderColor: "#CF3A1F",
    bgGradient: "linear-gradient(135deg, #FFF8F7 0%, #FDECEA 100%)",
    ctaLabel: "Upgrade ke Pro",
    ctaStyle: "accent",
    features: [
      "Semua manfaat dalam Paket Scholar",
      "Sertifikat digital (shareable LinkedIn)",
      "Priority AI support — respons 2× lebih cepat",
      "Learning analytics advanced",
      "Export progress report PDF",
      "Akses beta fitur AI generasi berikutnya",
    ],
  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── Components ──────────────────────────────────────────────────────────────

function PricingCard({ tier, currentTier, onSubscribe, isLoading }: {
  tier: PricingTier;
  currentTier: string | null;
  onSubscribe: (tierId: "scholar" | "pro") => void;
  isLoading: string | null;
}) {
  const isCurrentPlan = currentTier === tier.id;
  const isBusy = isLoading === tier.id;
  const Icon = tier.icon;

  const ctaButton = () => {
    if (tier.id === "free") {
      return (
        <a
          href="/dashboard"
          id={`cta-${tier.id}`}
          className="pricing-btn pricing-btn-outline"
        >
          {tier.ctaLabel}
          <ArrowRight size={16} />
        </a>
      );
    }

    if (isCurrentPlan) {
      return (
        <button
          id={`cta-${tier.id}`}
          className="pricing-btn pricing-btn-disabled"
          disabled
        >
          ✓ Plan Aktif Anda
        </button>
      );
    }

    return (
      <button
        id={`cta-${tier.id}`}
        className={`pricing-btn pricing-btn-${tier.ctaStyle}`}
        onClick={() => onSubscribe(tier.id as "scholar" | "pro")}
        disabled={isBusy}
      >
        {isBusy ? (
          <span className="loading-dots">Memproses</span>
        ) : (
          <>
            {tier.ctaLabel}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    );
  };

  return (
    <div
      className="pricing-card"
      style={{
        border: `1.5px solid ${tier.borderColor}`,
        background: tier.bgGradient,
      }}
      data-featured={tier.id === "scholar"}
    >
      {/* Badge */}
      {tier.badge && (
        <div
          className="pricing-badge flex items-center gap-1 w-fit"
          style={{ backgroundColor: tier.badgeColor, color: tier.id === "pro" ? "#fff" : "#060708" }}
        >
          {tier.id === "scholar" && <Star className="h-2.5 w-2.5 fill-current shrink-0" />}
          {tier.id === "pro" && <Sparkles className="h-2.5 w-2.5 fill-current shrink-0" />}
          <span>{tier.badge}</span>
        </div>
      )}

      {/* Header */}
      <div className="pricing-card-header">
        <div className="pricing-icon" style={{ color: tier.color }}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <h2 className="pricing-tier-name" style={{ color: tier.color }}>
          {tier.name}
        </h2>
        <p className="pricing-tagline">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="pricing-price-block">
        <span className="pricing-price" style={{ color: tier.color }}>
          {tier.priceLabel}
        </span>
        {tier.price && (
          <span className="pricing-period">/bulan</span>
        )}
      </div>

      {/* CTA */}
      <div className="pricing-cta-wrapper">
        {ctaButton()}
      </div>

      {/* Divider */}
      <div className="pricing-divider" style={{ borderColor: tier.borderColor }} />

      {/* Features */}
      <ul className="pricing-features">
        {tier.features.map((feature) => (
          <li key={feature} className="pricing-feature-item">
            <Check size={14} className="pricing-check" style={{ color: tier.color }} />
            <span>{feature}</span>
          </li>
        ))}
        {tier.notIncluded?.map((feature) => (
          <li key={feature} className="pricing-feature-item pricing-feature-disabled">
            <div className="pricing-check-placeholder" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Apakah saya bisa membatalkan langganan kapan saja?",
    a: "Ya. Batalkan kapan saja tanpa penalti. Akses premium tetap aktif hingga akhir periode pembayaran saat ini.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Kami mendukung QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank (BCA, BRI, BNI, Mandiri), Kartu Kredit/Debit, dan Alfamart/Indomaret via Midtrans.",
  },
  {
    q: "Apakah ada masa percobaan gratis?",
    a: "Tier Free kami sudah tersedia selamanya! Anda dapat mencoba 3 kursus dengan 1 modul gratis per kursus tanpa batas waktu.",
  },
  {
    q: "Bisakah saya membeli kursus satu per satu tanpa berlangganan?",
    a: "Ya! Kursus premium tersedia juga secara per-kursus (Rp99.000–Rp299.000) dengan akses seumur hidup. Klik tombol 'Beli Kursus' di halaman detail kursus.",
  },
  {
    q: "Apakah sertifikat diakui secara formal?",
    a: "Sertifikat Belajara adalah sertifikat penyelesaian digital yang dapat dibagikan ke LinkedIn. Kami bekerja menuju akreditasi formal di iterasi berikutnya.",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setUser(u);
      if (u.is_premium) {
        // Fetch subscription tier from API
        api.payment.mySubscription?.()
          .then((data: any) => {
            if (data?.subscription?.tier) {
              setCurrentTier(data.subscription.tier);
            } else if (u.is_premium) {
              setCurrentTier("scholar"); // fallback
            }
          })
          .catch(() => {
            if (u.is_premium) setCurrentTier("scholar");
          });
      } else {
        setCurrentTier("free");
      }
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.classList.add("light");
    return () => {
      if (hadDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    };
  }, []);

  const handleSubscribe = async (tierId: "scholar" | "pro") => {
    setIsLoading(tierId);
    setError(null);

    try {
      const data = await api.payment.subscribe(tierId);

      if (data.snap_token && typeof window !== "undefined") {
        // Load Midtrans Snap script
        const snapScript = document.getElementById("midtrans-snap");
        if (!snapScript) {
          const script = document.createElement("script");
          script.id = "midtrans-snap";
          script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute(
            "data-client-key",
            process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
          );
          document.body.appendChild(script);
          script.onload = () => openSnap(data.snap_token, tierId);
        } else {
          openSnap(data.snap_token, tierId);
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal memulai proses pembayaran. Coba lagi.");
      setIsLoading(null);
    }
  };

  const openSnap = (token: string, tierId: string) => {
    (window as any).snap?.pay(token, {
      onSuccess: () => {
        setCurrentTier(tierId);
        setIsLoading(null);
        window.location.href = "/dashboard?subscribed=true";
      },
      onPending: () => {
        setIsLoading(null);
        window.location.href = "/dashboard?payment=pending";
      },
      onError: () => {
        setError("Pembayaran gagal. Silakan coba lagi.");
        setIsLoading(null);
      },
      onClose: () => {
        setIsLoading(null);
      },
    });
  };

  const pageContent = (
    <div className="pricing-page">
      {/* Hero */}
      <div className="pricing-hero">
        <div className="pricing-hero-eyebrow">
          <Star size={12} />
          Pilih Plan Anda
        </div>
        <h1 className="pricing-hero-title">
          Investasi Terbaik untuk<br />
          <span>Karier Akademik</span> Anda
        </h1>
        <p className="pricing-hero-desc">
          Mulai gratis, upgrade kapan saja. Semua plan mendukung QRIS, e-wallet, dan transfer bank.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="pricing-error flex items-center justify-center gap-2" role="alert">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="pricing-grid">
        {TIERS.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            currentTier={currentTier}
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Trust strip */}
      <div className="trust-strip">
        <div className="trust-item">
          <div className="trust-item-icon text-[#060708] bg-[#E8E5E9]/40 p-2.5 rounded-full border border-[#E8E5E9]/60 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <div className="trust-item-label">Pembayaran Aman<br />via Midtrans</div>
        </div>
        <div className="trust-item">
          <div className="trust-item-icon text-[#060708] bg-[#E8E5E9]/40 p-2.5 rounded-full border border-[#E8E5E9]/60 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="trust-item-label">QRIS · GoPay · OVO<br />Dana · Transfer Bank</div>
        </div>
        <div className="trust-item">
          <div className="trust-item-icon text-[#060708] bg-[#E8E5E9]/40 p-2.5 rounded-full border border-[#E8E5E9]/60 flex items-center justify-center">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="trust-item-label">Batalkan<br />Kapan Saja</div>
        </div>
        <div className="trust-item">
          <div className="trust-item-icon text-[#060708] bg-[#E8E5E9]/40 p-2.5 rounded-full border border-[#E8E5E9]/60 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="trust-item-label">AI Powered<br />by Gemini</div>
        </div>
      </div>

      {/* Per-course note */}
      <p className="pricing-note">
        Lebih suka bayar per kursus?{" "}
        <a href="/catalog" style={{ color: "#CF3A1F", fontWeight: 600, textDecoration: "none" }}>
          Lihat katalog kursus →
        </a>{" "}
        Tersedia pembelian <strong>lifetime access</strong> mulai Rp99.000/kursus.
      </p>

      {/* FAQ */}
      <div className="pricing-faq">
        <h2 className="pricing-faq-title">Pertanyaan Umum</h2>
        {FAQS.map((faq, i) => (
          <div key={i} className="faq-item">
            <button
              id={`faq-${i}`}
              className="faq-question"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              aria-expanded={openFaq === i}
            >
              {faq.q}
              <svg
                className={`faq-chevron ${openFaq === i ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={`faq-answer ${openFaq === i ? "open" : ""}`}>
              {faq.a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const styleElement = (
    <style>{`
      /* ─── Pricing Page Styles ───────────────────────────── */

      .pricing-page {
        min-height: 100vh;
        background: #FAF9FB;
        padding-bottom: 5rem;
      }

      /* Hero */
      .pricing-hero {
        text-align: center;
        padding: 4rem 1.5rem 2rem;
        max-width: 800px;
        margin: 0 auto;
      }
      .pricing-hero-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        background: #F3F1F4;
        border: 1px solid #E8E5E9;
        color: #7E7C82;
        font-family: "Montserrat", sans-serif;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        margin-bottom: 1.25rem;
      }
      .pricing-hero-title {
        font-family: "Playfair Display", serif;
        font-size: 2.75rem;
        font-weight: 800;
        color: #060708;
        line-height: 1.15;
        margin-bottom: 1rem;
      }
      .pricing-hero-title span {
        color: #CF3A1F;
      }
      .pricing-hero-desc {
        font-family: "Montserrat", sans-serif;
        font-size: 0.9375rem;
        color: #7E7C82;
        line-height: 1.6;
        max-width: 600px;
        margin: 0 auto;
      }

      /* Grid */
      .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        max-width: 1100px;
        margin: 0 auto 4rem;
        padding: 0 1.5rem;
      }
      @media (max-width: 1024px) {
        .pricing-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 640px) {
        .pricing-grid { grid-template-columns: 1fr; max-width: 500px; }
      }

      /* Card */
      .pricing-card {
        background: #fff;
        border: 1.5px solid #E8E5E9;
        border-radius: 1.5rem;
        padding: 2.25rem 2rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        transition: all 0.25s ease;
      }
      .pricing-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(6,7,8,0.06);
      }
      .pricing-card[data-featured="true"] {
        border-color: #060708;
        box-shadow: 0 8px 24px rgba(6,7,8,0.04);
      }
      .pricing-badge {
        position: absolute;
        top: 0;
        right: 2rem;
        transform: translateY(-50%);
        font-family: "Montserrat", sans-serif;
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        color: #FAF9FB;
      }

      /* Header */
      .pricing-card-header { margin-bottom: 1.5rem; }
      .pricing-icon { margin-bottom: 0.75rem; }
      .pricing-icon svg { width: 1.75rem; height: 1.75rem; }
      .pricing-tier-name {
        font-family: "Playfair Display", serif;
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 0.25rem;
      }
      .pricing-tagline {
        font-family: "Montserrat", sans-serif;
        font-size: 0.8125rem;
        color: #7E7C82;
        line-height: 1.4;
      }

      /* Price */
      .pricing-price-block {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
      }
      .pricing-price {
        font-family: "Playfair Display", serif;
        font-size: 2.25rem;
        font-weight: 900;
      }
      .pricing-period {
        font-size: 0.875rem;
        color: #7E7C82;
      }

      /* CTA */
      .pricing-cta-wrapper { margin-bottom: 1.5rem; }
      .pricing-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        font-family: "Montserrat", sans-serif;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        border: none;
      }
      .pricing-btn-outline {
        background: transparent;
        border: 1.5px solid #E8E5E9;
        color: #060708;
      }
      .pricing-btn-outline:hover { border-color: #060708; background: #f0eff1; }
      .pricing-btn-filled {
        background: #060708;
        color: #FAF9FB;
      }
      .pricing-btn-filled:hover { background: #2a2b2d; box-shadow: 0 4px 16px rgba(6,7,8,0.2); }
      .pricing-btn-accent {
        background: #CF3A1F;
        color: #fff;
      }
      .pricing-btn-accent:hover { background: #b5321a; box-shadow: 0 4px 16px rgba(207,58,31,0.3); }
      .pricing-btn-disabled {
        background: #F3F1F4;
        color: #7E7C82;
        cursor: not-allowed;
      }
      .pricing-btn:disabled { opacity: 0.7; cursor: not-allowed; }

      /* Loading */
      .loading-dots {
        opacity: 1;
        animation: fadeText 1.2s infinite;
      }
      @keyframes fadeText {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .pricing-divider {
        border-top: 1px solid #E8E5E9;
        margin-bottom: 1.5rem;
      }

      /* Features */
      .pricing-features {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .pricing-feature-item {
        display: flex;
        gap: 0.75rem;
        font-family: "Montserrat", sans-serif;
        font-size: 0.8125rem;
        color: #060708;
        line-height: 1.5;
      }
      .pricing-check { flex-shrink: 0; margin-top: 2px; }
      .pricing-check-placeholder {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .pricing-feature-disabled { color: #C6B5BF; text-decoration: line-through; }

      /* Error */
      .pricing-error {
        text-align: center;
        color: #CF3A1F;
        font-size: 0.875rem;
        margin: 0 auto 2rem;
        max-width: 500px;
        padding: 0.75rem 1.25rem;
        background: #FFF0ED;
        border-radius: 0.75rem;
        border: 1px solid #FFCFCA;
      }

      /* Comparison note */
      .pricing-note {
        text-align: center;
        font-size: 0.8rem;
        color: #7E7C82;
        margin-bottom: 4rem;
      }
      .pricing-note strong { color: #060708; }

      /* FAQ */
      .pricing-faq {
        max-width: 700px;
        margin: 0 auto;
        padding: 0 1.5rem 6rem;
      }
      .pricing-faq-title {
        font-family: "Playfair Display", serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: #060708;
        text-align: center;
        margin-bottom: 2rem;
      }
      .faq-item {
        border-bottom: 1px solid #E8E5E9;
      }
      .faq-question {
        width: 100%;
        background: none;
        border: none;
        text-align: left;
        font-family: "Montserrat", sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #060708;
        padding: 1.25rem 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        transition: color 0.15s;
      }
      .faq-question:hover { color: #CF3A1F; }
      .faq-chevron {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        transition: transform 0.2s;
      }
      .faq-chevron.open { transform: rotate(180deg); }
      .faq-answer {
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.3s ease, padding 0.3s ease;
        font-size: 0.875rem;
        color: #7E7C82;
        line-height: 1.7;
      }
      .faq-answer.open {
        max-height: 200px;
        padding-bottom: 1.25rem;
      }

      /* Trust badges */
      .trust-strip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        padding: 0 1.5rem 3rem;
        text-align: center;
      }
      .trust-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.375rem;
      }
      .trust-item-icon { font-size: 1.5rem; }
      .trust-item-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #7E7C82;
        letter-spacing: 0.05em;
      }
    `}</style>
  );

  if (user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="font-heading text-lg font-semibold text-[#060708]">
              Langganan Belajara
            </div>
          </header>
          <div className="flex-1 bg-[#FAF9FB] overflow-y-auto">
            {styleElement}
            {pageContent}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <>
      {styleElement}
      <div className="bg-[#FAF9FB] min-h-screen">
        {pageContent}
      </div>
    </>
  );
}

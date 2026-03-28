import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import { sources } from '../data/db';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-3xl text-gold font-light tracking-wide mb-2">{t('about.title')}</h1>
            <p className="font-arabic text-gold-dim text-xl">حول المشروع</p>
            <div className="gold-line w-20 mt-4" />
          </motion.div>

          <div className="space-y-8 text-parchment-dim leading-relaxed text-[0.95rem]">
            <ScrollReveal>
              <p>
                Bu proje, Haçlı Seferlerini (1096–1466) Müslüman birincil kaynaklardan
                dijitalleştiren, coğrafi konumlandırma yapan ve çok perspektifli karşılaştırma
                sunan, dünyada türünün ilk örneği bir dijital beşerî bilimler platformudur.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2 className="text-xl text-gold-dim font-medium mb-3 mt-10">Metodoloji</h2>
              <p>
                Altı önemli Müslüman tarihçinin eserlerinden sistematik biçimde olay çıkarımı
                yapılmış, her olay coğrafi olarak konumlandırılmış (geocoding), olay türü, sonuç
                ve Haçlı seferi bağlamıyla sınıflandırılmıştır. Birden fazla kaynağın aynı olayı
                farklı perspektiflerden anlattığı durumlar "küme" (cluster) olarak işaretlenmiştir.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <h2 className="text-xl text-gold-dim font-medium mb-3 mt-10">Birincil Kaynaklar</h2>
              <div className="space-y-3">
                {sources.map(s => (
                  <div key={s.id} className="glass-card p-4 flex items-start gap-4">
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-parchment font-medium">{s.full_tr}</span>
                          <span className="text-parchment-faint text-xs ml-2">({s.period})</span>
                        </div>
                        <span className="font-arabic text-gold-dim">{s.name_ar}</span>
                      </div>
                      <div className="mt-1 text-xs text-parchment-faint">
                        <em>{s.work_tr}</em> — {s.record_count} kayıt — {s.perspective.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <h2 className="text-xl text-gold-dim font-medium mb-3 mt-10">Veri Katmanları</h2>
              <p>
                Platform dört ana katman sunar: (1) 790 coğrafi konumlandırılmış olay, (2) 24
                Haçlı kalesi fotoğrafları ve el değiştirme kronolojisiyle, (3) 4 Haçlı devletinin
                8 farklı zaman dilimindeki sınırları, (4) 11 sefer güzergâhı (kara ve deniz).
                Ayrıca 21 perspektif kümesi, birden fazla kaynağın aynı olayı nasıl aktardığını
                karşılaştırma imkânı sunar.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <h2 className="text-xl text-gold-dim font-medium mb-3 mt-10">Ekip</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h3 className="text-parchment font-medium mb-1">Dr. Ali Çetinkaya</h3>
                  <p className="text-parchment-faint text-sm">Yrd. Doç., Bilgisayar Mühendisliği Bölümü</p>
                  <p className="text-parchment-faint text-sm">Selçuk Üniversitesi, Konya</p>
                  <p className="text-gold-dim text-xs mt-2">ORCID: 0000-0002-7747-6854</p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-parchment font-medium mb-1">Dr. Hüseyin Gökalp</h3>
                  <p className="text-parchment-faint text-sm">İlahiyat Fakültesi</p>
                  <p className="text-parchment-faint text-sm">Selçuk Üniversitesi, Konya</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <h2 className="text-xl text-gold-dim font-medium mb-3 mt-10">Akademik Atıf</h2>
              <div className="glass-card p-5">
                <p className="text-parchment-faint text-sm italic leading-relaxed">
                  Çetinkaya, A. & Gökalp, H. (2026). Müslüman Gözüyle Haçlı Seferleri: Dijital
                  Beşerî Bilimler Platformu [Veri seti ve web uygulaması]. Selçuk Üniversitesi.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.35}>
              <h2 className="text-xl text-gold-dim font-medium mb-3 mt-10">Teknoloji</h2>
              <p>
                React + Vite + Tailwind CSS · Leaflet.js · Framer Motion · Vercel / GitHub Pages.
                Veri: JSON formatında 790 geocoded olay, 24 kale, 4×8 sınır polygonu, 11 güzergâh, 21 küme.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}

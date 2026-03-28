import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-ink-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="font-arabic text-gold text-xl mb-2">الحروب الصليبية</div>
            <p className="text-parchment-faint text-sm leading-relaxed">
              Müslüman birincil kaynaklardan dijitalleştirilen, dünyada türünün ilk örneği bir dijital beşerî bilimler platformu.
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="text-gold-dim text-xs uppercase tracking-widest mb-3">Keşfet</h4>
            <div className="flex flex-col gap-1.5">
              {[
                ['/map','Harita'], ['/sources','Kaynaklar'], ['/castles','Kaleler'],
                ['/routes','Güzergâhlar'], ['/compare','Karşılaştırma'], ['/timeline','Zaman Çizelgesi'],
              ].map(([to,label]) => (
                <Link key={to} to={to} className="text-parchment-faint text-sm hover:text-gold transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          {/* Team */}
          <div>
            <h4 className="text-gold-dim text-xs uppercase tracking-widest mb-3">Ekip</h4>
            <p className="text-parchment-dim text-sm font-medium">Dr. Ali Çetinkaya</p>
            <p className="text-parchment-faint text-xs mb-2">Bilgisayar Mühendisliği, Selçuk Üniversitesi</p>
            <p className="text-parchment-dim text-sm font-medium">Dr. Hüseyin Gökalp</p>
            <p className="text-parchment-faint text-xs">İlahiyat Fakültesi, Selçuk Üniversitesi</p>
          </div>
        </div>
        <div className="gold-line mb-6" />
        <p className="text-center text-parchment-faint text-xs tracking-wide">
          © 2026 Selçuk Üniversitesi · Tüm hakları saklıdır
        </p>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Target, Activity, ClipboardList, TrendingUp, Users } from 'lucide-react';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';
const features = [{
  icon: Calendar,
  title: 'Annual Plan',
  description: 'Rancang periodisasi latihan tahunan dengan visualisasi grafis yang jelas'
}, {
  icon: Target,
  title: 'Multi-Competition',
  description: 'Kelola beberapa kompetisi dalam satu rencana dengan target tanggal terpisah'
}, {
  icon: Activity,
  title: 'Monthly Planning',
  description: 'Detail perencanaan latihan bulanan dengan sesi latihan harian'
}, {
  icon: ClipboardList,
  title: 'Monitoring',
  description: 'Pantau pelaksanaan program latihan dengan checklist dan catatan'
}, {
  icon: TrendingUp,
  title: 'Tes & Pengukuran',
  description: 'Rekam dan analisis hasil tes fisik atlet dengan radar chart'
}, {
  icon: Users,
  title: 'Manajemen Atlet',
  description: 'Kelola data atlet dan pantau perkembangan performa mereka'
}];
export default function Home() {
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hirocrossLogo} alt="HiroCross Logo" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-xl font-extrabold tracking-wider uppercase text-foreground">
              HiroCross
            </span>
          </div>
          <Link to="/auth">
            <Button className="font-bold">
              Masuk / Daftar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <img src={hirocrossLogo} alt="HiroCross Logo" className="w-24 h-24 mx-auto mb-8 rounded-2xl shadow-lg" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">HIROCROSS Plan</h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Aplikasi periodisasi latihan untuk pelatih olahraga. 
            Rancang, kelola, dan pantau program latihan atlet Anda dengan mudah dan efisien.
          </p>
          <Link to="/auth">
            <Button size="lg" className="font-bold text-lg px-8 py-6">
              Mulai Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Fitur Utama
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => <Card key={feature.title} className="bg-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Siap Meningkatkan Program Latihan Anda?
          </h2>
          <p className="text-muted-foreground mb-8">
            Daftar sekarang dan mulai merancang periodisasi latihan profesional untuk atlet Anda.
          </p>
          <Link to="/auth">
            <Button size="lg" className="font-bold">
              Daftar Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© 2025 HiroCross. Aplikasi periodisasi latihan untuk pelatih.</p>
        </div>
      </footer>
    </div>;
}
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Target, Activity, ClipboardList, TrendingUp, Users, ChevronRight, Sparkles, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';

const features = [
  {
    icon: Calendar,
    title: 'Annual Plan',
    description: 'Rancang periodisasi latihan tahunan dengan visualisasi grafis yang jelas dan terstruktur'
  },
  {
    icon: Target,
    title: 'Multi-Competition',
    description: 'Kelola beberapa kompetisi dalam satu rencana dengan target tanggal terpisah'
  },
  {
    icon: Activity,
    title: 'Monthly Planning',
    description: 'Detail perencanaan latihan bulanan dengan sesi latihan harian yang terorganisir'
  },
  {
    icon: ClipboardList,
    title: 'Monitoring',
    description: 'Pantau pelaksanaan program latihan dengan checklist dan catatan lengkap'
  },
  {
    icon: TrendingUp,
    title: 'Tes & Pengukuran',
    description: 'Rekam dan analisis hasil tes fisik atlet dengan radar chart interaktif'
  },
  {
    icon: Users,
    title: 'Manajemen Atlet',
    description: 'Kelola data atlet dan pantau perkembangan performa mereka secara real-time'
  }
];

const stats = [
  { value: '500+', label: 'Pelatih Aktif' },
  { value: '2,000+', label: 'Atlet Terdaftar' },
  { value: '10,000+', label: 'Program Latihan' },
  { value: '98%', label: 'Kepuasan Pengguna' }
];

const benefits = [
  {
    icon: Zap,
    title: 'Efisien',
    description: 'Hemat waktu dalam merencanakan dan mengelola program latihan'
  },
  {
    icon: Shield,
    title: 'Aman',
    description: 'Data atlet tersimpan dengan aman dan terenkripsi'
  },
  {
    icon: Sparkles,
    title: 'Modern',
    description: 'Antarmuka yang intuitif dan mudah digunakan'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={hirocrossLogo} 
              alt="HiroCross Logo" 
              className="w-10 h-10 rounded-lg object-contain shadow-md" 
            />
            <span className="text-xl font-extrabold tracking-wider uppercase text-foreground">
              HiroCross
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/auth">
              <Button className="font-bold shadow-lg hover:shadow-xl transition-shadow">
                Masuk / Daftar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 py-24 md:py-32">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl blur-xl scale-110" />
              <img 
                src={hirocrossLogo} 
                alt="HiroCross Logo" 
                className="relative w-28 h-28 mx-auto rounded-2xl shadow-2xl" 
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Platform Periodisasi Latihan #1 di Indonesia
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Kelola Latihan
            <span className="block bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Lebih Profesional
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Platform lengkap untuk pelatih olahraga dalam merancang, mengelola, 
            dan memantau program latihan atlet dengan mudah dan efisien.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link to="/auth">
              <Button size="lg" className="font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Mulai Gratis
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="font-bold text-lg px-8 py-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Fitur
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                variants={itemVariants}
              >
                <div className="text-3xl md:text-4xl font-extrabold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/70 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex items-start gap-4 p-6"
                variants={itemVariants}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Fitur Lengkap untuk Pelatih
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola program latihan atlet dalam satu platform terintegrasi
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="h-full bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-accent/20">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-5">
                      <feature.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-primary-foreground rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-primary-foreground rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border-2 border-primary-foreground rounded-full" />
        </div>
        
        <motion.div 
          className="container mx-auto px-6 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Siap Meningkatkan Program Latihan Anda?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Bergabung dengan ratusan pelatih profesional yang sudah menggunakan HiroCross 
              untuk mengoptimalkan performa atlet mereka.
            </p>
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="secondary"
                className="font-bold text-lg px-10 py-6 shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                Daftar Gratis Sekarang
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={hirocrossLogo} 
                alt="HiroCross Logo" 
                className="w-8 h-8 rounded-lg object-contain" 
              />
              <span className="text-lg font-bold text-foreground">HiroCross</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 HiroCross. Aplikasi periodisasi latihan untuk pelatih profesional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

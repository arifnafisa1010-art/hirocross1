import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Target, Activity, ClipboardList, TrendingUp, Users, ChevronRight, Sparkles, Shield, Zap, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';

const features = [
  {
    icon: Calendar,
    title: 'Annual Plan',
    description: 'Rancang periodisasi latihan tahunan dengan visualisasi grafis yang jelas dan terstruktur',
    gradient: 'from-blue-500 to-cyan-400'
  },
  {
    icon: Target,
    title: 'Multi-Competition',
    description: 'Kelola beberapa kompetisi dalam satu rencana dengan target tanggal terpisah',
    gradient: 'from-purple-500 to-pink-400'
  },
  {
    icon: Activity,
    title: 'Monthly Planning',
    description: 'Detail perencanaan latihan bulanan dengan sesi latihan harian yang terorganisir',
    gradient: 'from-orange-500 to-amber-400'
  },
  {
    icon: ClipboardList,
    title: 'Monitoring',
    description: 'Pantau pelaksanaan program latihan dengan checklist dan catatan lengkap',
    gradient: 'from-emerald-500 to-teal-400'
  },
  {
    icon: TrendingUp,
    title: 'Tes & Pengukuran',
    description: 'Rekam dan analisis hasil tes fisik atlet dengan radar chart interaktif',
    gradient: 'from-rose-500 to-red-400'
  },
  {
    icon: Users,
    title: 'Manajemen Atlet',
    description: 'Kelola data atlet dan pantau perkembangan performa mereka secara real-time',
    gradient: 'from-indigo-500 to-violet-400'
  }
];

const benefits = [
  {
    icon: Zap,
    title: 'Efisien',
    description: 'Hemat waktu dalam merencanakan dan mengelola program latihan',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    icon: Shield,
    title: 'Aman',
    description: 'Data atlet tersimpan dengan aman dan terenkripsi',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    icon: Sparkles,
    title: 'Modern',
    description: 'Antarmuka yang intuitif dan mudah digunakan',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-lg shadow-black/20' 
          : 'border-transparent bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <img 
              src={hirocrossLogo} 
              alt="HiroCross Logo" 
              className="w-10 h-10 rounded-lg object-contain" 
            />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
              HiroCross
            </span>
          </motion.div>

          {/* Button Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/auth">
              <Button className="font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all border-0">
                Masuk / Daftar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 py-20 md:py-28">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Centered Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl opacity-20" />
              <img 
                src={hirocrossLogo} 
                alt="HiroCross Logo" 
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl shadow-2xl shadow-blue-500/30" 
              />
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl md:text-4xl font-extrabold tracking-wider uppercase mb-6"
          >
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              HiroCross
            </span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Platform Periodisasi Latihan #1 di Indonesia
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Kelola Latihan
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Lebih Profesional
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Platform lengkap untuk pelatih olahraga dalam merancang, mengelola, 
            dan memantau program latihan atlet dengan mudah dan efisien.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Link to="/auth">
              <Button size="lg" className="font-bold text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all border-0 hover:scale-105">
                Mulai Gratis
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="font-bold text-lg px-8 py-6 border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="w-5 h-5 mr-2" />
              Lihat Fitur
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex items-start gap-4 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all"
                variants={itemVariants}
              >
                <div className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center flex-shrink-0`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{benefit.title}</h3>
                  <p className="text-slate-400 text-sm">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Fitur Lengkap untuk Pelatih
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
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
                <Card className="h-full bg-slate-800/50 border-slate-700/50 hover:border-slate-600 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2 group">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <motion.div 
          className="container mx-auto px-6 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Siap Meningkatkan Program Latihan Anda?
            </h2>
            <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
              Bergabung dengan ratusan pelatih profesional yang sudah menggunakan HiroCross 
              untuk mengoptimalkan performa atlet mereka.
            </p>
            <Link to="/auth">
              <Button 
                size="lg" 
                className="font-bold text-lg px-10 py-6 bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20 hover:shadow-white/30 transition-all hover:scale-105"
              >
                Daftar Gratis Sekarang
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={hirocrossLogo} 
                alt="HiroCross Logo" 
                className="w-10 h-10 rounded-lg object-contain" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                HiroCross
              </span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              © 2025 HiroCross. Aplikasi periodisasi latihan untuk pelatih profesional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

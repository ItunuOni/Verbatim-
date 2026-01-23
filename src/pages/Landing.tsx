import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { 
  ArrowRight, 
  Globe2, 
  Zap, 
  FileAudio, 
  Languages, 
  Sparkles,
  CheckCircle2,
  Mic,
  Wand2
} from 'lucide-react';
import verbatimLogo from '@/assets/verbatim-logo.png';

const features = [
  {
    icon: FileAudio,
    title: 'Audio & Video Support',
    description: 'Upload MP3, MP4, WAV, and more. We handle all major formats up to 500MB.',
  },
  {
    icon: Languages,
    title: 'Multi-Language Translation',
    description: 'Translate your content into 50+ languages with AI-powered accuracy.',
  },
  {
    icon: Mic,
    title: 'Voice-Over Generation',
    description: 'Generate professional voice-overs with emotional control and customization.',
  },
  {
    icon: Wand2,
    title: 'Smart Content Repurposing',
    description: 'Instantly generate blog posts, social media captions, and summaries from your localized content.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get transcriptions in seconds, not hours. Powered by cutting-edge AI.',
  },
  {
    icon: Sparkles,
    title: 'SRT Export',
    description: 'Download perfectly timed subtitles ready for any video platform.',
  },
];

const benefits = [
  'No credit card required',
  'Free tier available',
  'Enterprise-grade security',
  'GDPR compliant',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl opacity-20 gradient-primary pointer-events-none" />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Hero Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <img 
              src={verbatimLogo} 
              alt="Verbatim" 
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-2xl"
            />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-border mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Powered by Google Gemini AI</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
            <span className="text-foreground">Break Language</span>
            <br />
            <span className="text-gradient-primary">Barriers</span>
          </h1>

          <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Transform your audio and video content into accurate transcriptions 
            and translations. Reach a global audience in minutes, not days.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Start Transcribing Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="w-full sm:w-auto border-border text-foreground hover:bg-muted">
              <Globe2 className="w-5 h-5" />
              See Demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Everything You Need
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Professional-grade localization tools that scale with your content needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl glass glass-border hover:glow-subtle transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl gradient-card glass-border relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary-foreground">
                Ready to Go Global?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of creators who trust Verbatim for their content localization.
              </p>
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={verbatimLogo} 
              alt="Verbatim Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-sm text-foreground/60">
              © 2024 Verbatim. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground/60">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
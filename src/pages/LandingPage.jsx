
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Users, Mail, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [view, setView] = useState('auth'); // 'auth' or 'forgot_password'

  const features = [
    { icon: Gift, title: 'Sorteio Inteligente', description: 'Algoritmo garantido sem autoatribuição para um sorteio justo' },
    { icon: Users, title: 'Multi-Grupos', description: 'Crie e gerencie vários grupos de amigo secreto simultaneamente' },
    { icon: Mail, title: 'Notificações Automáticas', description: 'E-mail e WhatsApp para manter todos informados' },
    { icon: MessageCircle, title: 'Chat Anônimo', description: 'Mensagens secretas entre participantes com moderação' },
    { icon: Shield, title: 'Seguro e Privado', description: 'Dados isolados por grupo com total privacidade' },
    { icon: Sparkles, title: 'Fácil de Usar', description: 'Interface intuitiva do convite ao sorteio final' }
  ];

  const AuthForm = () => {
    const { signIn, signUp } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await signIn(email, password);
      if (!error) {
        toast({ title: "Login bem-sucedido!", description: "Redirecionando para o seu painel..." });
        setOpenAuthDialog(false);
        navigate('/dashboard');
      }
      setLoading(false);
    };

    const handleSignUp = async (e) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await signUp(email, password);
      if (!error) {
        setOpenAuthDialog(false);
      }
      setLoading(false);
    };

    return (
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Entrar</TabsTrigger>
          <TabsTrigger value="signup">Criar Conta</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Senha</Label>
                  <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                 <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setView('forgot_password')}>
                  Esqueceu sua senha?
                </Button>
                <Button type="submit" className="w-full !mt-4" disabled={loading}>{loading ? "Carregando..." : "Entrar"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Senha</Label>
                  <Input id="password-signup" type="password" placeholder="Crie uma senha forte" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando conta..." : "Criar Conta Grátis"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };
  
  const ForgotPasswordForm = () => {
    const { sendPasswordResetEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        await sendPasswordResetEmail(email);
        setLoading(false);
        setOpenAuthDialog(false);
    };

    return (
        <div className="p-4">
             <Button variant="ghost" size="sm" onClick={() => setView('auth')} className="mb-4">
                &larr; Voltar para o login
            </Button>
            <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email-reset">Seu e-mail de cadastro</Label>
                    <Input id="email-reset" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Link de Redefinição"}
                </Button>
            </form>
        </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Amigo Secreto - Organize seu sorteio perfeito</title>
        <meta name="description" content="Crie grupos de amigo secreto com sorteio automático, notificações por e-mail e WhatsApp, e chat anônimo entre participantes." />
      </Helmet>
      
      <Dialog open={openAuthDialog} onOpenChange={(isOpen) => { setOpenAuthDialog(isOpen); if (!isOpen) setView('auth'); }}>
        <div className="min-h-screen">
          <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Gift className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                  Amigo Secreto
                </span>
              </div>
              <DialogTrigger asChild>
                <Button size="lg">Começar Agora</Button>
              </DialogTrigger>
            </div>
          </nav>

          <section className="container mx-auto px-4 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Organize o Amigo Secreto Perfeito
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Crie grupos, convide participantes, realize sorteios automáticos e gerencie tudo em um só lugar
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <DialogTrigger asChild>
                  <Button size="lg" className="text-lg px-8">Criar Meu Grupo</Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="text-lg px-8">Ver Demonstração</Button>
                </DialogTrigger>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-16"
            >
              <img class="rounded-2xl shadow-2xl mx-auto max-w-4xl w-full border-4 border-white" alt="Dashboard do Amigo Secreto mostrando grupos e participantes" src="https://images.unsplash.com/photo-1609226196559-602b02607dde" />
            </motion.div>
          </section>

          <section className="bg-white py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12">
                Recursos Incríveis
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <feature.icon className="h-12 w-12 text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-to-r from-primary to-pink-600 rounded-2xl p-12 text-center text-white">
                <h2 className="text-4xl font-bold mb-4">
                  Pronto para começar?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Crie seu primeiro grupo de amigo secreto em menos de 2 minutos
                </p>
                <DialogTrigger asChild>
                  <Button size="lg" variant="secondary" className="text-lg px-8">Criar Grupo Grátis</Button>
                </DialogTrigger>
              </div>
            </div>
          </section>

          <footer className="border-t bg-white py-8">
            <div className="container mx-auto px-4 text-center text-muted-foreground">
              <p>© 2025 Amigo Secreto. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
                {view === 'auth' ? 'Acesse sua conta' : 'Redefinir Senha'}
            </DialogTitle>
            <DialogDescription>
                {view === 'auth' ? 'Entre ou crie uma conta para começar a organizar seus grupos.' : 'Insira seu e-mail para receber um link de redefinição.'}
            </DialogDescription>
          </DialogHeader>
          {view === 'auth' ? <AuthForm /> : <ForgotPasswordForm />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LandingPage;

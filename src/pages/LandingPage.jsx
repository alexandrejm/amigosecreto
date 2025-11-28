import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Gift, Users, Sparkles, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import HeroImage from '@/components/HeroImage';

const LandingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signIn, user } = useAuth();

  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já estiver logado, redirecionar para dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(email, password);
        if (!error) {
          toast({
            title: 'Cadastro realizado!',
            description: 'Verifique seu e-mail para confirmar sua conta.',
          });
          setEmail('');
          setPassword('');
          setAuthMode('signin');
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          toast({ title: 'Login realizado com sucesso!' });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Erro de autenticação:', error);
      toast({
        title: 'Erro',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    console.log('Botão "Começar Agora" clicado');
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Amigo Secreto - Organize seu sorteio perfeito</title>
        <meta name="description" content="Crie e gerencie grupos de amigo secreto com sorteio automático, notificações por e-mail e chat anônimo." />
      </Helmet>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Amigo Secreto Simplificado
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Organize sorteios perfeitos com convites automáticos, chat anônimo e notificações por e-mail. Tudo em um só lugar!
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={handleGetStarted}>
                Criar Meu Grupo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <HeroImage />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Por que escolher nossa plataforma?</h2>
            <p className="text-xl text-muted-foreground">Tudo que você precisa para um amigo secreto perfeito</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Gift className="h-12 w-12 text-purple-600" />,
                title: 'Sorteio Automático',
                description: 'Algoritmo inteligente que garante que ninguém tire a si mesmo e todos tenham um amigo secreto.',
              },
              {
                icon: <Mail className="h-12 w-12 text-pink-600" />,
                title: 'Convites por E-mail',
                description: 'Envie convites automáticos e notifique todos quando o sorteio for realizado.',
              },
              {
                icon: <Users className="h-12 w-12 text-purple-600" />,
                title: 'Chat Anônimo',
                description: 'Converse com os participantes sem revelar sua identidade antes da hora.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Como funciona?</h2>
            <p className="text-xl text-muted-foreground">Simples, rápido e eficiente</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Crie seu grupo', description: 'Defina nome, orçamento e datas' },
              { step: '2', title: 'Convide amigos', description: 'Envie convites por e-mail ou link' },
              { step: '3', title: 'Realize o sorteio', description: 'Com um clique, todos recebem seus amigos secretos' },
              { step: '4', title: 'Aproveite!', description: 'Use o chat anônimo e listas de desejos' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <CardTitle className="text-2xl">Comece Agora Gratuitamente</CardTitle>
                <CardDescription>Crie sua conta e organize seu primeiro amigo secreto</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={authMode} onValueChange={setAuthMode}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <TabsContent value="signin" className="mt-0">
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                      </Button>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0">
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Criar Conta'}
                      </Button>
                    </TabsContent>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Gift className="h-12 w-12 mx-auto mb-4 text-purple-400" />
          <p className="text-lg mb-2">Amigo Secreto</p>
          <p className="text-gray-400">Organize sorteios perfeitos com facilidade</p>
          <p className="text-gray-500 text-sm mt-4">© 2024 Todos os direitos reservados</p>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
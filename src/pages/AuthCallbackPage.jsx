import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = React.useState('processing'); // processing, success, error

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type === 'signup') {
          // The auth state change listener in SupabaseAuthContext will handle session update.
          // This page just provides feedback for email confirmation.
          setStatus('success');
          toast({
            title: 'E-mail confirmado!',
            description: 'Sua conta foi ativada. Você será redirecionado em breve.',
          });
          setTimeout(() => navigate('/dashboard'), 3000);
        } else if (type === 'recovery') {
          // User followed a password recovery link
          toast({
            title: 'Redefinição de Senha',
            description: 'Você pode definir uma nova senha agora.',
          });
          navigate('/update-password');
        } else {
          // Fallback for other cases, though less common
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
             navigate('/dashboard');
          } else {
            throw new Error('Tipo de autenticação não reconhecido.');
          }
        }
      } catch (error) {
        console.error('Erro no callback de autenticação:', error);
        setStatus('error');
        toast({
          title: 'Erro na Autenticação',
          description: error.message || 'Não foi possível completar o processo. Tente novamente.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const statusInfo = {
    processing: {
      icon: <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />,
      title: 'Processando...',
      description: 'Aguarde enquanto validamos sua solicitação.',
    },
    success: {
      icon: <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />,
      title: 'Sucesso!',
      description: 'Redirecionando para a plataforma...',
    },
    error: {
      icon: <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />,
      title: 'Ocorreu um Erro',
      description: 'Houve um problema. Redirecionando para a página inicial...',
    },
  };

  const currentStatus = statusInfo[status];

  return (
    <>
      <Helmet>
        <title>Verificando Autenticação - Amigo Secreto</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              {currentStatus.icon}
              <CardTitle>{currentStatus.title}</CardTitle>
              <CardDescription>{currentStatus.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animation-delay-400"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default AuthCallbackPage;
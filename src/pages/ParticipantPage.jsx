
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Gift, User, Link, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ParticipantPage = () => {
  const { groupSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [group, setGroup] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchParticipantData = useCallback(async () => {
    if(!user) {
        navigate('/');
        return;
    }

    const { data: groupData, error: groupError } = await supabase.from('groups').select('*').eq('slug', groupSlug).single();
    if (groupError || !groupData) {
        toast({title: 'Grupo não encontrado', variant: 'destructive'});
        navigate('/dashboard');
        return;
    }
    setGroup(groupData);

    const { data: memberData, error: memberError } = await supabase.from('group_members').select('*').eq('group_id', groupData.id).eq('user_id', user.id).single();
    if(memberError || !memberData) {
        toast({title: 'Você não é membro deste grupo.', description: 'Clique no link de convite para participar.', variant: 'destructive'});
        navigate('/dashboard');
        return;
    }

    if(groupData.status === 'drawn') {
        const { data: assignmentData, error: assignmentError } = await supabase
            .from('assignments')
            .select('*, receiver:receiver_member_id(*)')
            .eq('group_id', groupData.id)
            .eq('giver_member_id', memberData.id)
            .single();
        
        if (assignmentData) {
            setReceiver(assignmentData.receiver);
        }
    }
    setLoading(false);
  }, [groupSlug, user, navigate, toast]);


  useEffect(() => {
    fetchParticipantData();
  }, [fetchParticipantData]);

  if (loading || !group) return <div className="p-8">Carregando...</div>;

  const cardVariants = {
    hidden: { opacity: 0, y: 50, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' } }
  };

  return (
    <>
      <Helmet><title>Meu Amigo Secreto - {group.name}</title></Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">{group.name}</h1>
            <p className="text-muted-foreground mt-2">Veja os detalhes do seu amigo secreto!</p>
          </div>

          {group.status !== 'drawn' ? (
            <Card><CardContent className="text-center py-20"><Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50"/><h2 className="text-xl font-semibold">Aguardando o sorteio...</h2><p className="text-muted-foreground">Volte aqui após a data do sorteio!</p></CardContent></Card>
          ) : !receiver ? (
            <Card><CardContent className="text-center py-20"><User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50"/><h2 className="text-xl font-semibold">Sorteio não encontrado.</h2><p className="text-muted-foreground">Parece que você não participou deste sorteio.</p></CardContent></Card>
          ) : (
            <motion.div variants={cardVariants} initial="hidden" animate="visible">
              <Card className="shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-pink-500 p-6 text-primary-foreground">
                  <CardTitle className="text-2xl">Seu Amigo Secreto é...</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Clique para revelar!</CardDescription>
                </div>
                <CardContent className="p-6">
                  <div className="relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] cursor-pointer" onClick={() => setRevealed(true)}>
                    {!revealed ? (
                      <div className="text-center"><Eye className="h-10 w-10 mx-auto text-muted-foreground"/><p className="font-semibold mt-2">Clique aqui para revelar</p></div>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center"><User className="h-16 w-16 mx-auto text-primary mb-4"/><p className="text-4xl font-bold">{receiver.name}</p></motion.div>
                    )}
                     {!revealed && <div className="absolute inset-0 bg-white/50 backdrop-blur-md"></div>}
                  </div>
                  {revealed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{delay: 0.3}} className="mt-6 space-y-4">
                       <div className="flex items-center justify-between bg-muted p-3 rounded-lg"><span className="font-semibold">Orçamento do Presente</span><span className="text-primary font-bold">R$ {group.budget_min} - R$ {group.budget_max}</span></div>
                       {receiver.wishlist_url && (<a href={receiver.wishlist_url} target="_blank" rel="noopener noreferrer"><Button className="w-full" variant="outline"><Link className="h-4 w-4 mr-2"/>Ver lista de desejos de {receiver.name.split(' ')[0]}</Button></a>)}
                       <Button className="w-full" onClick={() => toast({ description: '🚧 Recurso em desenvolvimento!' })}><MessageCircle className="h-4 w-4 mr-2"/>Enviar mensagem anônima</Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantPage;

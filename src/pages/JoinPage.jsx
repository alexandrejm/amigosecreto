
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Gift, User, Link, Phone, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { logAudit } from '@/lib/audit';

const JoinPage = () => {
  const { groupSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [member, setMember] = useState(null);
  const [formData, setFormData] = useState({ name: '', wishlist_url: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('slug', groupSlug)
      .single();

    if (groupError || !groupData) {
      toast({ title: "Grupo não encontrado.", variant: "destructive" });
      navigate('/');
      return;
    }
    setGroup(groupData);

    if (user) {
        const { data: existingMember, error: memberError } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupData.id)
            .eq('user_id', user.id)
            .single();
        
        if(existingMember && existingMember.invite_status === 'confirmed') {
            toast({ title: "Você já está neste grupo!"});
            navigate(`/g/${groupSlug}/my`);
            return;
        }
        if(existingMember) {
            setMember(existingMember);
            setFormData({ name: existingMember.name || user.email.split('@')[0], wishlist_url: existingMember.wishlist_url || '', phone: existingMember.phone || '' });
        }
    }
    setLoading(false);
  }, [groupSlug, user, navigate, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: 'Você deve aceitar os termos.', variant: 'destructive' });
      return;
    }
    if(!user) {
        toast({ title: 'Você precisa estar logado para entrar em um grupo.', variant: 'destructive' });
        navigate('/');
        return;
    }
    
    setLoading(true);

    const upsertData = {
        ...formData,
        group_id: group.id,
        user_id: user.id,
        email: user.email,
        invite_status: 'confirmed',
    };

    const { data: updatedMember, error } = await supabase
        .from('group_members')
        .upsert(upsertData, { onConflict: 'group_id, user_id' })
        .select()
        .single();
    
    setLoading(false);

    if (error) {
        toast({ title: 'Erro ao confirmar participação', description: error.message, variant: 'destructive' });
    } else {
        await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'member_confirmed', metadata: { name: updatedMember.name } });
        toast({ title: "Participação confirmada!", description: `Bem-vindo(a) ao grupo, ${updatedMember.name}!` });
        navigate(`/g/${groupSlug}/my`);
    }
  };

  if (loading || !group) return <div>Carregando...</div>;

  return (
    <>
      <Helmet><title>Entrar em {group.name}</title></Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="text-center">
              <Gift className="h-12 w-12 mx-auto text-primary" />
              <CardTitle className="text-2xl mt-4">Confirmar Participação</CardTitle>
              <CardDescription>Você foi convidado para o amigo secreto "{group.name}"!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg mb-6 text-sm">
                <p><strong>Orçamento:</strong> R$ {group.budget_min} - R$ {group.budget_max}</p>
                <p><strong>Prazo para entrar:</strong> {new Date(group.signup_deadline).toLocaleDateString('pt-BR')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name"><User className="inline h-4 w-4 mr-1"/>Seu nome</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wishlistUrl"><Link className="inline h-4 w-4 mr-1"/>Link da sua lista de desejos (opcional)</Label>
                  <Input id="wishlistUrl" type="url" placeholder="https://sualoja.com/lista-de-desejos" value={formData.wishlist_url} onChange={(e) => setFormData({...formData, wishlist_url: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone"><Phone className="inline h-4 w-4 mr-1"/>Celular para WhatsApp (opcional)</Label>
                  <Input id="phone" type="tel" placeholder="(99) 99999-9999" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground">Eu concordo em participar do amigo secreto.</Label>
                </div>

                <Button type="submit" className="w-full mt-4 !h-12 text-lg" disabled={loading}>
                  <CheckSquare className="h-5 w-5 mr-2"/>
                  {loading ? 'Confirmando...' : 'Confirmar e Entrar no Grupo'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default JoinPage;

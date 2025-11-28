
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Gift, Users, Settings, MessageCircle, Copy, Send, MoreVertical, Trash, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { logAudit } from '@/lib/audit';

const GroupPage = () => {
  const { groupSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [settingsData, setSettingsData] = useState(null);

  const fetchGroupData = useCallback(async () => {
    setLoading(true);
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('slug', groupSlug)
      .single();

    if (groupError || !groupData) {
      toast({ title: 'Grupo não encontrado', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }
    setGroup(groupData);
    setSettingsData({
        name: groupData.name,
        description: groupData.description || '',
        budget_min: groupData.budget_min,
        budget_max: groupData.budget_max,
        signup_deadline: groupData.signup_deadline ? new Date(groupData.signup_deadline).toISOString().split('T')[0] : '',
        draw_date: groupData.draw_date ? new Date(groupData.draw_date).toISOString().split('T')[0] : '',
        expected_participants: groupData.expected_participants || 3,
    });


    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupData.id)
      .order('created_at', { ascending: true });
      
    if (membersError) {
        toast({ title: 'Erro ao buscar membros', variant: 'destructive' });
    } else {
        setMembers(membersData);
    }
      
    if (groupData.status === 'drawn') {
        const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('assignments')
            .select('*')
            .eq('group_id', groupData.id);

        if (assignmentsError) {
            toast({ title: 'Erro ao buscar sorteio', variant: 'destructive' });
        } else {
            setAssignments(assignmentsData);
        }
    }

    setLoading(false);
  }, [groupSlug, navigate, toast]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleInvite = async () => {
    if (!inviteEmail || !user) return;

    if (members.some(m => m.email === inviteEmail)) {
        toast({ title: "Este e-mail já foi convidado.", variant: "destructive" });
        return;
    }

    const inviteToken = `token_${Date.now()}${Math.random()}`;
    const { data: newMember, error } = await supabase
        .from('group_members')
        .insert({
            group_id: group.id,
            email: inviteEmail,
            invite_status: 'sent',
            invite_token: inviteToken,
            name: inviteEmail.split('@')[0], // default name
        })
        .select()
        .single();
    
    if (error) {
        toast({ title: "Erro ao convidar membro", description: error.message, variant: "destructive" });
    } else {
        setMembers(prev => [...prev, newMember]);
        setInviteEmail('');
        await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'member_invited', metadata: { email: inviteEmail } });
        toast({ title: "Convite enviado!", description: `Convite para ${inviteEmail} foi registrado. Funcionalidade de envio de email pendente.` });
    }
  };

  const handleExecuteDraw = async () => {
    const confirmedMembers = members.filter(m => m.invite_status === 'confirmed');
    if (confirmedMembers.length < 3) {
      toast({ title: "Sorteio requer no mínimo 3 participantes confirmados.", variant: "destructive" });
      return;
    }

    // This logic should be moved to a Supabase Edge Function for security
    const shuffled = [...confirmedMembers].sort(() => Math.random() - 0.5);
    let assignmentsToInsert = [];
    let isValid = false;
    for(let i=0; i<10; i++) { // Try to generate a valid derangement
        let isDerangement = true;
        assignmentsToInsert = confirmedMembers.map((giver, index) => {
            const receiver = shuffled[(index + 1) % shuffled.length];
            if(giver.id === receiver.id) isDerangement = false;
            return {
                group_id: group.id,
                giver_member_id: giver.id,
                receiver_member_id: receiver.id,
            };
        });
        if(isDerangement) {
            isValid = true;
            break;
        }
        shuffled.sort(() => Math.random() - 0.5); // reshuffle
    }
    
    if(!isValid) {
        toast({ title: "Erro no sorteio", description: "Não foi possível gerar um sorteio válido. Tente novamente.", variant: "destructive" });
        return;
    }

    const { error: assignmentError } = await supabase.from('assignments').insert(assignmentsToInsert);

    if (assignmentError) {
        toast({ title: "Erro ao salvar o sorteio", description: assignmentError.message, variant: "destructive" });
        return;
    }

    const { error: groupUpdateError } = await supabase.from('groups').update({ status: 'drawn' }).eq('id', group.id);

    if (groupUpdateError) {
        toast({ title: "Erro ao atualizar status do grupo", description: groupUpdateError.message, variant: "destructive" });
    } else {
        await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'draw_executed' });
        toast({ title: "Sorteio realizado com sucesso!", description: "Os participantes podem ver seus amigos secretos." });
        fetchGroupData();
    }
  };
  
  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    if (!user || group.owner_id !== user.id) return;

    const { error } = await supabase
        .from('groups')
        .update(settingsData)
        .eq('id', group.id);

    if (error) {
        toast({ title: "Erro ao salvar configurações", description: error.message, variant: "destructive" });
    } else {
        await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'group_settings_updated' });
        toast({ title: "Configurações salvas!" });
        fetchGroupData();
    }
  };
  
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/g/${groupSlug}/join`;
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Link de convite copiado!" });
  };
  
  if (loading || !group || !settingsData) return <div className="p-8">Carregando...</div>;

  const isOwner = user?.id === group.owner_id;
  const confirmedMembersCount = members.filter(m => m.invite_status === 'confirmed').length;

  return (
    <>
      <Helmet><title>{group.name} - Amigo Secreto</title></Helmet>
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">{group.name}</h1>
            <p className="text-muted-foreground mt-2">{group.description}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2 mt-4 md:mt-0">
                <Button variant="outline" onClick={copyInviteLink}><Copy className="h-4 w-4 mr-2" /> Copiar Link Público</Button>
                {group.status !== 'drawn' && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button disabled={confirmedMembersCount < 3}>
                        <Gift className="h-4 w-4 mr-2"/> Realizar Sorteio
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Sorteio?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é irreversível e notificará todos os participantes.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExecuteDraw}>Confirmar e Sortear</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                )}
            </div>
          )}
        </div>

        <Tabs defaultValue="participants">
          <TabsList className="mb-4">
            <TabsTrigger value="participants"><Users className="h-4 w-4 mr-2" />Participantes ({confirmedMembersCount})</TabsTrigger>
            <TabsTrigger value="messages"><MessageCircle className="h-4 w-4 mr-2" />Mensagens</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notificações</TabsTrigger>
            {isOwner && <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Configurações</TabsTrigger>}
          </TabsList>

          <TabsContent value="participants">
            <Card>
              {isOwner && group.status !== 'drawn' && (
                <CardHeader>
                  <CardTitle>Convidar Participantes</CardTitle>
                  <div className="flex gap-2 pt-2">
                    <Input type="email" placeholder="email@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    <Button onClick={handleInvite}><Send className="h-4 w-4 mr-2" />Convidar por E-mail</Button>
                  </div>
                </CardHeader>
              )}
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Status</TableHead>{isOwner && group.status === 'drawn' && <TableHead>Amigo Secreto</TableHead>}{isOwner && <TableHead className="text-right">Ações</TableHead>}</TableRow></TableHeader>
                  <TableBody>
                    {members.map(member => {
                       const assignment = assignments.find(a => a.giver_member_id === member.id);
                       const receiver = assignment ? members.find(m => m.id === assignment.receiver_member_id) : null;
                       return (
                        <TableRow key={member.id}>
                          <TableCell>{member.name || '-'}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell><Badge variant={member.invite_status === 'confirmed' ? 'default' : 'secondary'}>{member.invite_status}</Badge></TableCell>
                          {isOwner && group.status === 'drawn' && <TableCell>{receiver?.name || 'N/A'}</TableCell>}
                          {isOwner && (
                            <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => toast({ description: '🚧 Recurso em desenvolvimento!' })}><Send className="h-4 w-4 mr-2"/>Reenviar Convite</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-500" onClick={() => toast({ description: '🚧 Recurso em desenvolvimento!' })}><Trash className="h-4 w-4 mr-2"/>Remover</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                       )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="messages"><Card className="min-h-[400px] flex items-center justify-center"><CardContent className="text-center text-muted-foreground"><MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30"/><p>🚧 Chat anônimo em construção 🚧</p></CardContent></Card></TabsContent>
          <TabsContent value="notifications"><Card className="min-h-[400px] flex items-center justify-center"><CardContent className="text-center text-muted-foreground"><Bell className="h-16 w-16 mx-auto mb-4 opacity-30"/><p>🚧 Histórico de notificações em construção 🚧</p></CardContent></Card></TabsContent>
          
          {isOwner && (
            <TabsContent value="settings">
              <Card>
                <CardHeader><CardTitle>Configurações do Grupo</CardTitle><CardDescription>Edite as informações do seu grupo.</CardDescription></CardHeader>
                <CardContent>
                  <form onSubmit={handleSettingsUpdate} className="space-y-6">
                    <fieldset disabled={group.status === 'drawn'} className="space-y-6">
                      <div className="space-y-2"><Label htmlFor="groupName">Nome do Grupo</Label><Input id="groupName" value={settingsData.name} onChange={(e) => setSettingsData({...settingsData, name: e.target.value})} /></div>
                      <div className="space-y-2"><Label htmlFor="groupDescription">Descrição</Label><Textarea id="groupDescription" value={settingsData.description} onChange={(e) => setSettingsData({...settingsData, description: e.target.value})} /></div>
                      <div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="budgetMin">Orçamento Mínimo (R$)</Label><Input id="budgetMin" type="number" min="0" value={settingsData.budget_min} onChange={(e) => setSettingsData({...settingsData, budget_min: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="budgetMax">Orçamento Máximo (R$)</Label><Input id="budgetMax" type="number" min="0" value={settingsData.budget_max} onChange={(e) => setSettingsData({...settingsData, budget_max: e.target.value})} /></div></div>
                      <div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="signupDeadline">Prazo de Inscrição</Label><Input id="signupDeadline" type="date" value={settingsData.signup_deadline} onChange={(e) => setSettingsData({...settingsData, signup_deadline: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="drawDate">Data do Sorteio</Label><Input id="drawDate" type="date" value={settingsData.draw_date} onChange={(e) => setSettingsData({...settingsData, draw_date: e.target.value})} /></div></div>
                      <div className="space-y-2"><Label htmlFor="expectedParticipants">Nº de Participantes</Label><Input id="expectedParticipants" type="number" min="3" value={settingsData.expected_participants} onChange={(e) => setSettingsData({...settingsData, expected_participants: e.target.value})} /></div>
                    </fieldset>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={group.status === 'drawn'}>Salvar Alterações</Button>
                    </div>
                    {group.status === 'drawn' && <p className="text-sm text-destructive text-right mt-2">As configurações não podem ser alteradas após o sorteio.</p>}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default GroupPage;

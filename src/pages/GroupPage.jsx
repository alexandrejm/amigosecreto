import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Gift, Users, Settings, MessageCircle, Copy, Send, MoreVertical, Trash, Bell, ArrowLeft } from 'lucide-react';
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
import { sendInviteNotification } from '@/lib/notifications';

const ChatMessages = ({ group, members, isOwner }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchMessages = useCallback(async () => {
        if (!group?.id) return;
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            toast({ title: "Erro ao carregar o chat.", description: "Tente recarregar a página.", variant: 'destructive' });
        } else {
            setMessages(data);
        }
    }, [group?.id, toast]);

    useEffect(() => {
        fetchMessages();
        
        const channel = supabase.channel(`messages-group-${group.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${group.id}` }, (payload) => {
                setMessages(current => [...current, payload.new]);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to messages channel!');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [group.id, fetchMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        
        const myMemberProfile = members.find(m => m.user_id === user.id);
        if (!myMemberProfile) {
            toast({ title: 'Você não é membro deste grupo para enviar mensagens.', variant: 'destructive' });
            return;
        }

        const { error } = await supabase.from('messages').insert({
            group_id: group.id,
            member_id: myMemberProfile.id,
            content: newMessage,
        });

        if (error) {
            toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' });
        } else {
            setNewMessage('');
        }
    };
    
    const getMemberInfo = (memberId) => members.find(m => m.id === memberId) || {};

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chat Anônimo do Grupo</CardTitle>
                <CardDescription>Envie mensagens para os outros participantes. Apenas o dono do grupo pode ver seu nome.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] overflow-y-auto space-y-4 pr-4 border-b pb-4 mb-4">
                    {messages.map(msg => {
                        const memberInfo = getMemberInfo(msg.member_id);
                        const isMyMessage = memberInfo?.user_id === user.id;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${isMyMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p>{msg.content}</p>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {isOwner ? (memberInfo?.name || 'Anônimo') : (isMyMessage ? 'Você' : 'Anônimo')}
                                </span>
                            </div>
                        )
                    })}
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground pt-16">
                            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30"/>
                            <p>Nenhuma mensagem ainda. Seja o primeiro a dizer olá!</p>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Digite sua mensagem anônima..." disabled={!members.some(m => m.user_id === user.id)} />
                    <Button type="submit" disabled={!newMessage.trim() || !members.some(m => m.user_id === user.id)}><Send className="h-4 w-4"/></Button>
                </form>
            </CardContent>
        </Card>
    );
};


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

  const isOwner = user?.id === group?.owner_id;

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
        toast({ title: 'Erro ao buscar membros', description: membersError.message, variant: 'destructive' });
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
    const newMemberData = {
        group_id: group.id,
        email: inviteEmail,
        invite_status: 'sent',
        invite_token: inviteToken,
        name: inviteEmail.split('@')[0], // default name
    };

    const { data: newMember, error } = await supabase
        .from('group_members')
        .insert(newMemberData)
        .select()
        .single();
    
    if (error) {
        toast({ title: "Erro ao convidar membro", description: error.message, variant: "destructive" });
    } else {
        setMembers(prev => [...prev, newMember]);
        setInviteEmail('');
        await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'member_invited', metadata: { email: inviteEmail } });
        
        toast({ title: "Convite registrado!", description: `Um e-mail de convite será enviado para ${inviteEmail}.` });

        // Envia o e-mail em segundo plano
        sendInviteNotification(group, newMember).then(({ error: emailError }) => {
            if (emailError) {
                 console.warn(`Falha ao enviar e-mail de convite para ${inviteEmail}: ${emailError.message}`);
                 // Opcional: pode-se adicionar um toast de aviso aqui se desejar
                 toast({ title: "Aviso: Falha ao enviar e-mail de convite.", description: 'O membro foi adicionado, mas o e-mail não pôde ser enviado.', variant: "destructive" });
            }
        });
    }
  };

  const handleResendInvite = async (member) => {
    if (!member) return;
    toast({ title: "Reenviando convite..." });
    const { error: emailError } = await sendInviteNotification(group, member);
    if (emailError) {
      toast({ title: "Falha ao reenviar e-mail.", description: `Verifique as configurações SMTP. Detalhes: ${emailError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Convite reenviado!", description: `Um novo convite foi enviado para ${member.email}.` });
    }
  };
  
  const handleRemoveParticipant = async (memberId) => {
    if (!isOwner) return;
    const { error } = await supabase.from('group_members').delete().eq('id', memberId);
    if (error) {
      toast({ title: "Erro ao remover participante", description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Participante removido com sucesso!" });
      setMembers(prev => prev.filter(m => m.id !== memberId));
      await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'member_removed', metadata: { removedMemberId: memberId } });
    }
  };

  const handleExecuteDraw = async () => {
    const confirmedMembers = members.filter(m => m.invite_status === 'confirmed');
    if (confirmedMembers.length < 3) {
      toast({ title: "Sorteio requer no mínimo 3 participantes confirmados.", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.functions.invoke('execute-draw', {
      body: { groupId: group.id }
    });

    if (error || data?.error) {
      toast({ title: "Erro ao executar o sorteio", description: error?.message || data?.error, variant: "destructive" });
    } else {
      await logAudit({ groupId: group.id, actorUserId: user.id, eventType: 'draw_executed' });
      toast({ title: "Sorteio realizado com sucesso!", description: "Os participantes serão notificados por e-mail." });
      fetchGroupData();
    }
  };
  
  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

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
  
  const handleDeleteGroup = async () => {
    if (!isOwner) return;
    
    const { error } = await supabase.rpc('delete_group_and_dependents', {
      group_id_to_delete: group.id
    });

    if (error) {
        toast({ title: "Erro ao excluir o grupo", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Grupo excluído com sucesso."});
        navigate('/dashboard');
    }
  };
  
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/#/g/${groupSlug}/join`;
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Link de convite copiado!" });
  };
  
  if (loading || !group || !settingsData) return <div className="p-8">Carregando...</div>;
  
  const confirmedMembersCount = members.filter(m => m.invite_status === 'confirmed').length;

  return (
    <>
      <Helmet><title>{group.name} - Amigo Secreto</title></Helmet>
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-4">
             {isOwner && (
              <Link to="/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">{group.name}</h1>
              <p className="text-muted-foreground mt-2">{group.description}</p>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2 mt-4 md:mt-0 self-end md:self-center">
                <Button variant="outline" onClick={copyInviteLink}><Copy className="h-4 w-4 mr-2" /> Copiar Link</Button>
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
                        <AlertDialogDescription>Esta ação é irreversível e notificará todos os participantes por e-mail.</AlertDialogDescription>
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
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={group.status === 'drawn'}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleResendInvite(member)} disabled={member.invite_status === 'confirmed'}><Send className="h-4 w-4 mr-2"/>Reenviar Convite</DropdownMenuItem>
                                   <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" className="text-red-500 w-full justify-start px-2 py-1.5 h-auto font-normal" disabled={member.user_id === group.owner_id}>
                                        <Trash className="h-4 w-4 mr-2"/>Remover
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover {member.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta ação não pode ser desfeita. O participante precisará ser convidado novamente.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveParticipant(member.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
          <TabsContent value="messages">
            <ChatMessages group={group} members={members} isOwner={isOwner} />
          </TabsContent>
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
                  <div className="mt-10 border-t pt-6 border-destructive/50">
                    <h3 className="text-lg font-semibold text-destructive">Zona de Perigo</h3>
                    <p className="text-sm text-muted-foreground mb-4">Esta ação não pode ser desfeita. Isso excluirá permanentemente o grupo e todos os seus dados.</p>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Excluir Grupo</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o grupo <strong>{group.name}</strong> e todos os seus dados, incluindo membros e sorteios.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Sim, excluir grupo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { PlusCircle, LogOut, Key, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import CreateGroupDialog from '@/components/CreateGroupDialog';

const Dashboard = () => {
  const { user, signOut, updateUserPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Erro ao buscar grupos', description: error.message, variant: 'destructive' });
      } else {
        setGroups(data);
      }
      setLoading(false);
    };

    fetchGroups();
  }, [user, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
    navigate(`/g/${newGroup.slug}`);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    const { error } = await updateUserPassword(newPassword);
    if (!error) {
      setChangePasswordOpen(false);
      setNewPassword('');
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Amigo Secreto</title>
      </Helmet>
      <div className="min-h-screen p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <User className="h-8 w-8 text-primary" />
             <div>
                <h1 className="text-2xl md:text-3xl font-bold">Seu Painel</h1>
                <p className="text-muted-foreground">{user?.email}</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isChangePasswordOpen} onOpenChange={setChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Key className="h-4 w-4 mr-2" />Alterar Senha</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Salvar Nova Senha</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />Sair
            </Button>
          </div>
        </header>

        <main>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Seus Grupos</h2>
            <Button onClick={() => setCreateGroupOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Criar Novo Grupo
            </Button>
          </div>

          {loading ? (
            <p>Carregando seus grupos...</p>
          ) : groups.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">Nenhum grupo encontrado</h3>
              <p className="text-muted-foreground mb-4">Que tal criar o seu primeiro grupo de amigo secreto?</p>
              <Button onClick={() => setCreateGroupOpen(true)}>Criar meu primeiro grupo</Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group, index) => (
                <motion.div 
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/g/${group.slug}`}>
                    <Card className="h-full hover:border-primary transition-colors">
                      <CardHeader>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.status === 'collecting' ? 'Coletando participantes' : 'Sorteio realizado'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Orçamento: R$ {group.budget_min} - R$ {group.budget_max}</p>
                        <p className="text-sm text-muted-foreground">Prazo: {new Date(group.signup_deadline).toLocaleDateString('pt-BR')}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
      <CreateGroupDialog 
        open={isCreateGroupOpen} 
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};

export default Dashboard;
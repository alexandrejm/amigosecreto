import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { logAudit } from '@/lib/audit';

const CreateGroupDialog = ({ trigger }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget_min: 50,
    budget_max: 150,
    expected_participants: 5,
    signup_deadline: '',
    draw_date: '',
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Math.random().toString(36).substring(2, 7);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: 'Você precisa estar logado para criar um grupo.', variant: 'destructive' });
      return;
    }

    const slug = generateSlug(formData.name);
    
    const groupData = {
      ...formData,
      slug,
      owner_id: user.id,
      owner_email: user.email,
      status: 'active',
    };

    // Passo 1: Criar o grupo
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert(groupData)
      .select()
      .single();

    if (groupError) {
      console.error('Erro ao criar grupo:', groupError);
      toast({ 
        title: 'Erro ao criar grupo', 
        description: groupError.message, 
        variant: 'destructive' 
      });
      return;
    }

    // Passo 2: Adicionar o dono automaticamente como membro confirmado
    const ownerMemberData = {
      group_id: newGroup.id,
      user_id: user.id,
      email: user.email,
      name: user.email.split('@')[0], // Nome padrão baseado no email
      invite_status: 'confirmed',
    };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert(ownerMemberData);

    if (memberError) {
      console.error('Aviso: Não foi possível adicionar o dono como membro:', memberError);
      toast({ 
        title: 'Grupo criado com aviso', 
        description: 'O grupo foi criado, mas você precisa se adicionar manualmente como participante.', 
        variant: 'default' 
      });
    }

    // Passo 3: Registrar no audit log
    await logAudit({ 
      groupId: newGroup.id, 
      actorUserId: user.id, 
      eventType: 'group_created', 
      metadata: { groupName: newGroup.name } 
    });

    // Passo 4: Feedback e navegação
    toast({ 
      title: 'Grupo criado com sucesso!', 
      description: `O grupo "${newGroup.name}" está pronto. Convide seus amigos!` 
    });

    setOpen(false);
    navigate(`/g/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Criar Novo Grupo</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo de Amigo Secreto</DialogTitle>
          <DialogDescription>Preencha as informações do seu grupo. Você poderá editar depois.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nome do Grupo *</Label>
            <Input
              id="groupName"
              placeholder="Ex: Amigo Secreto da Família 2024"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Adicione detalhes sobre o grupo..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Orçamento Mínimo (R$) *</Label>
              <Input
                id="budgetMin"
                type="number"
                min="0"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Orçamento Máximo (R$) *</Label>
              <Input
                id="budgetMax"
                type="number"
                min="0"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedParticipants">Número Esperado de Participantes *</Label>
            <Input
              id="expectedParticipants"
              type="number"
              min="3"
              value={formData.expected_participants}
              onChange={(e) => setFormData({ ...formData, expected_participants: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signupDeadline">Prazo para Inscrições *</Label>
              <Input
                id="signupDeadline"
                type="date"
                value={formData.signup_deadline}
                onChange={(e) => setFormData({ ...formData, signup_deadline: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drawDate">Data do Sorteio *</Label>
              <Input
                id="drawDate"
                type="date"
                value={formData.draw_date}
                onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Grupo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
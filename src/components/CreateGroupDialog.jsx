
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { logAudit } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Gift } from 'lucide-react';

const CreateGroupDialog = ({ open, onOpenChange, onGroupCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget_min: '',
    budget_max: '',
    signup_deadline: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
      + '-' + Math.random().toString(36).substring(2, 8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Você não está logado.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const slug = createSlug(formData.name);
    const newGroup = {
      name: formData.name,
      description: formData.description,
      budget_min: parseFloat(formData.budget_min) || 0,
      budget_max: parseFloat(formData.budget_max) || 0,
      signup_deadline: formData.signup_deadline,
      owner_id: user.id,
      owner_email: user.email,
      slug: slug,
      status: 'collecting',
    };

    const { data, error } = await supabase
      .from('groups')
      .insert(newGroup)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar grupo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo criado com sucesso!", description: "Agora convide seus amigos." });
      
      await logAudit({
        groupId: data.id,
        actorUserId: user.id,
        eventType: 'group_created',
        metadata: { name: data.name },
      });

      onGroupCreated(data);
      onOpenChange(false);
      setFormData({ name: '', description: '', budget_min: '', budget_max: '', signup_deadline: '' });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-center">
          <Gift className="mx-auto h-12 w-12 text-primary" />
          <DialogTitle className="text-2xl mt-2">Criar um Novo Grupo</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para começar a diversão!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Grupo</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Amigo Secreto da Firma" required />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Uma breve descrição sobre o evento" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min">Orçamento Mínimo (R$)</Label>
              <Input id="budget_min" name="budget_min" type="number" value={formData.budget_min} onChange={handleChange} placeholder="Ex: 50" />
            </div>
            <div>
              <Label htmlFor="budget_max">Orçamento Máximo (R$)</Label>
              <Input id="budget_max" name="budget_max" type="number" value={formData.budget_max} onChange={handleChange} placeholder="Ex: 100" />
            </div>
          </div>
          <div>
            <Label htmlFor="signup_deadline">Data Limite para Inscrição</Label>
            <Input id="signup_deadline" name="signup_deadline" type="date" value={formData.signup_deadline} onChange={handleChange} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Grupo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;

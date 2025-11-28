
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Key, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const UpdatePasswordPage = () => {
    const { updateUserPassword } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        // This effect runs when the component mounts and checks for the password recovery token.
        // Supabase automatically handles the token from the URL hash.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                setHasToken(true);
            }
        });

        // Check if the URL hash contains the recovery token on initial load
        if (window.location.hash.includes('access_token')) {
            setHasToken(true);
        }

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({ title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const { error } = await updateUserPassword(password);
        setLoading(false);

        if (!error) {
            toast({ title: 'Senha alterada com sucesso!', description: 'Você já pode fazer login com sua nova senha.' });
            navigate('/');
        }
    };
    
    if (!hasToken) {
        return (
             <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Token inválido ou expirado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>O link de redefinição de senha não é válido. Por favor, solicite um novo.</p>
                        <Button onClick={() => navigate('/')} className="mt-4">Voltar para o início</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <Helmet><title>Redefinir Senha</title></Helmet>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="w-full max-w-md shadow-2xl">
                        <CardHeader className="text-center">
                            <Key className="h-12 w-12 mx-auto text-primary" />
                            <CardTitle className="text-2xl mt-4">Crie sua Nova Senha</CardTitle>
                            <CardDescription>Escolha uma senha forte para proteger sua conta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password"><Lock className="inline h-4 w-4 mr-1"/>Nova Senha</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="Pelo menos 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full mt-4 !h-12 text-lg" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default UpdatePasswordPage;

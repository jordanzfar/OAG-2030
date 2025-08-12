import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationBadge from '@/components/dashboard/VerificationBadge';
import PlanBadge from '@/components/dashboard/PlanBadge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const ProfilePage = () => {
    const { toast } = useToast();
    const { user, userProfile, updateProfile, loading } = useSupabaseAuth();
    const supabase = useSupabaseClient();
    const [profileData, setProfileData] = useState({
        full_name: '',
        phone: '',
        address: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setProfileData({
                full_name: userProfile.full_name || '',
                phone: userProfile.phone || '',
                address: userProfile.address || '',
            });
        }
    }, [userProfile]);

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        const result = await updateProfile(profileData);
        if (result.success) {
            setIsEditing(false);
            toast({
                title: "Perfil Actualizado",
                description: "Tus datos han sido guardados correctamente.",
            });
        }
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleManageSubscription = async () => {
        setIsPortalLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session');

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            window.location.href = data.url;

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo abrir el portal de suscripción: " + error.message,
            });
        } finally {
            setIsPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
                    <p>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
            <p className="text-muted-foreground">
                Consulta y actualiza tu información personal y de contacto.
            </p>

            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="flex flex-row items-start space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Usuario'} />
                        <AvatarFallback>
                            {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-2xl">{userProfile?.full_name || 'Usuario'}</CardTitle>
                            <VerificationBadge isVerified={userProfile?.verification_status === 'verified'} />
                            <PlanBadge planId={userProfile?.membership_plan} />
                        </div>
                        <CardDescription className="mt-2">{user?.email}</CardDescription>

                        {userProfile?.short_id && (
                                <CardDescription className="mt-1 text-sm text-muted-foreground">
                                    ID: {userProfile.short_id}
                                </CardDescription>
                            )}

                        {userProfile?.verification_status === 'verified' && userProfile?.buying_power > 0 && (
                            <div className="mt-2">
                                <span className="text-sm text-muted-foreground">Poder de Compra: </span>
                                <span className="font-semibold text-green-600">
                                    ${userProfile.buying_power?.toLocaleString('en-US') || '0'}
                                </span>
                            </div>
                        )}
                    </div>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-shrink-0">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    ) : null}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveChanges} className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="full_name">Nombre Completo</Label>
                                <Input id="full_name" value={profileData.full_name} disabled={true} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" value={user?.email || ''} disabled={true} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} className="mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="address">Dirección</Label>
                            <Textarea id="address" value={profileData.address} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} className="mt-1" rows={3} />
                        </div>
                        {isEditing && (
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button onClick={() => setIsEditing(false)} variant="outline">
                                    <X className="w-4 h-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    <Save className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle>Gestionar Suscripción</CardTitle>
                    <CardDescription>
                        Revisa tu plan actual, mejora tu suscripción o actualiza tus datos de pago.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-foreground">Tu Plan Actual</p>
                            <div className="mt-2">
                                <PlanBadge planId={userProfile?.membership_plan} />
                            </div>
                        </div>
                        <Button 
                            onClick={handleManageSubscription} 
                            disabled={isPortalLoading}
                            className="mt-4 sm:mt-0"
                        >
                            {isPortalLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Settings className="w-4 h-4 mr-2" />
                            )}
                            {isPortalLoading ? 'Abriendo portal...' : 'Gestionar mi Plan'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Serás redirigido a nuestro portal seguro de Stripe para gestionar tu suscripción.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
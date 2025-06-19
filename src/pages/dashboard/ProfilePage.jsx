
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationBadge from '@/components/dashboard/VerificationBadge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const ProfilePage = () => {
  const { toast } = useToast();
  const { user, userProfile, updateProfile, loading } = useSupabaseAuth();
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
        <CardHeader className="flex flex-row items-center space-x-4">
           <Avatar className="h-16 w-16">
             <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Usuario'} />
             <AvatarFallback>
               {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
             </AvatarFallback>
           </Avatar>
           <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">
                {userProfile?.full_name || 'Usuario'}
              </CardTitle>
              <VerificationBadge isVerified={userProfile?.verification_status === 'verified'} />
            </div>
            <CardDescription>{user?.email}</CardDescription>
            {userProfile?.verification_status === 'verified' && userProfile?.buying_power > 0 && (
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">Poder de Compra: </span>
                <span className="font-semibold text-green-600">
                  ${userProfile.buying_power?.toLocaleString() || '0'}
                </span>
              </div>
            )}
           </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="space-x-2">
                <Button onClick={handleSaveChanges} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled={true}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
                rows={3}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
          <CardDescription>Detalles de tu cuenta en Opulent Auto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Estado de Verificación</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.verification_status === 'verified' ? 'Verificado' : 
                 userProfile?.verification_status === 'pending' ? 'Pendiente' : 'No verificado'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Rol</Label>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {userProfile?.role || 'Cliente'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Fecha de Registro</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Última Actualización</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

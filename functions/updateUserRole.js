import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('🚀 Función updateUserRole iniciada');
  
  try {
    const base44 = createClientFromRequest(req);
    console.log('✅ Cliente Base44 creado');
    
    // Verificar autenticación
    const currentUser = await base44.auth.me();
    console.log('👤 Usuario actual:', currentUser?.email, 'Rol:', currentUser?.role);
    
    if (!currentUser) {
      console.log('❌ No hay usuario autenticado');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del request
    const body = await req.json();
    console.log('📥 Body completo:', JSON.stringify(body, null, 2));
    
    const userId = body.userId;
    const userData = body.userData || {};
    const newRole = userData.role;

    console.log('🔍 Datos extraídos:', {
      userId,
      userData,
      newRole
    });

    if (!userId) {
      console.log('❌ Falta userId');
      return Response.json({ error: 'userId es requerido' }, { status: 400 });
    }

    if (!newRole) {
      console.log('❌ Falta role en userData');
      return Response.json({ 
        error: 'role es requerido en userData',
        received: userData
      }, { status: 400 });
    }

    // Verificar permisos
    const isAppCreator = currentUser.email === 'joltcab@gmail.com';
    const canManageUsers = currentUser.role === 'admin' || currentUser.role === 'superadmin' || isAppCreator;

    console.log('🔐 Check permisos:', {
      isAppCreator,
      currentUserRole: currentUser.role,
      canManageUsers
    });

    if (!canManageUsers) {
      console.log('❌ Sin permisos para gestionar usuarios');
      return Response.json({ 
        error: 'No tienes permisos para cambiar roles de usuarios',
        currentRole: currentUser.role
      }, { status: 403 });
    }

    // Si se está cambiando a superadmin, verificar permisos especiales
    if (newRole === 'superadmin' && currentUser.role !== 'superadmin' && !isAppCreator) {
      console.log('❌ Solo superadmin puede asignar superadmin');
      return Response.json({ 
        error: 'Solo un superadmin puede asignar el rol de superadmin' 
      }, { status: 403 });
    }

    console.log('🔄 Intentando actualizar usuario...');
    console.log('   - User ID:', userId);
    console.log('   - New Role:', newRole);

    // Actualizar usando asServiceRole
    const result = await base44.asServiceRole.entities.User.update(userId, {
      role: newRole
    });

    console.log('✅ Actualización exitosa:', result);

    return Response.json({
      success: true,
      user: result,
      message: `Rol actualizado a ${newRole}`
    }, { status: 200 });

  } catch (error) {
    console.error('💥 ERROR CAPTURADO:');
    console.error('   Message:', error.message);
    console.error('   Name:', error.name);
    console.error('   Stack:', error.stack);
    
    // Intentar extraer más detalles del error
    if (error.response) {
      console.error('   Response Data:', error.response.data);
      console.error('   Response Status:', error.response.status);
    }
    
    return Response.json({ 
      success: false,
      error: error.message || 'Error desconocido',
      errorName: error.name,
      errorDetails: error.response?.data || null,
      stack: error.stack
    }, { status: 500 });
  }
});
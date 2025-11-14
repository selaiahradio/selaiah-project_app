import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, immediate } = await req.json();

    if (!notificationId) {
      return Response.json({ error: 'notificationId requerido' }, { status: 400 });
    }

    // Obtener la notificación
    const notification = await base44.asServiceRole.entities.PushNotification.filter({ id: notificationId });
    
    if (!notification || notification.length === 0) {
      return Response.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    const notif = notification[0];

    // Verificar si debe enviarse ahora o está programada
    if (!immediate && notif.scheduled_for) {
      const scheduledDate = new Date(notif.scheduled_for);
      if (scheduledDate > new Date()) {
        return Response.json({ 
          message: 'Notificación programada',
          scheduled_for: notif.scheduled_for 
        });
      }
    }

    // Obtener suscripciones según el target
    let subscriptions = [];
    
    if (notif.target_users && notif.target_users.length > 0) {
      // Enviar a usuarios específicos
      for (const email of notif.target_users) {
        const userSubs = await base44.asServiceRole.entities.PushSubscription.filter({
          user_email: email,
          is_active: true
        });
        subscriptions.push(...userSubs);
      }
    } else {
      // Broadcast a todos los suscritos al tópico
      const allSubs = await base44.asServiceRole.entities.PushSubscription.filter({
        is_active: true
      });
      
      subscriptions = allSubs.filter(sub => 
        sub.topics && (sub.topics.includes('all') || sub.topics.includes(notif.topic))
      );
    }

    if (subscriptions.length === 0) {
      return Response.json({ 
        message: 'No hay suscriptores para esta notificación',
        sent: 0 
      });
    }

    // Obtener Server Key de Firebase
    const serverKey = Deno.env.get('FIREBASE_SERVER_KEY');
    
    if (!serverKey) {
      throw new Error('FIREBASE_SERVER_KEY no configurada');
    }

    let sentCount = 0;
    let failedCount = 0;

    // Enviar notificaciones en lotes
    const batchSize = 100;
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);
      
      const promises = batch.map(async (sub) => {
        try {
          const message = {
            to: sub.device_token,
            notification: {
              title: notif.title,
              body: notif.body,
              icon: notif.icon_url || '/icon-192.png',
              image: notif.image_url,
              click_action: notif.click_action || '/',
              tag: 'selaiah-radio',
            },
            data: {
              url: notif.click_action || '/',
              topic: notif.topic
            }
          };

          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${serverKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
          });

          if (response.ok) {
            sentCount++;
            // Actualizar última vez usado
            await base44.asServiceRole.entities.PushSubscription.update(sub.id, {
              last_used: new Date().toISOString()
            });
          } else {
            failedCount++;
            console.error(`Error enviando a ${sub.device_token}:`, await response.text());
          }
        } catch (error) {
          failedCount++;
          console.error(`Error enviando notificación:`, error);
        }
      });

      await Promise.all(promises);
    }

    // Actualizar estado de la notificación
    await base44.asServiceRole.entities.PushNotification.update(notificationId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount
    });

    return Response.json({
      success: true,
      message: 'Notificaciones enviadas',
      sent: sentCount,
      failed: failedCount,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Error en sendPushNotification:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
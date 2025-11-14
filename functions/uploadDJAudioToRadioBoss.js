import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticación
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { audio_base64, filename } = await req.json();

    if (!audio_base64 || !filename) {
      return Response.json({ 
        success: false,
        error: 'audio_base64 y filename son requeridos' 
      }, { status: 400 });
    }

    // Obtener configuración del DJ (incluye FTP config)
    const configs = await base44.asServiceRole.entities.DJConfig.list();
    const djConfig = configs[0];

    if (!djConfig || !djConfig.ftp_config || !djConfig.ftp_config.enabled) {
      console.error('❌ FTP no configurado en DJConfig');
      return Response.json({ 
        success: false,
        error: 'FTP no está configurado. Ve a Admin → DJ Virtual → Configuración FTP.' 
      }, { status: 500 });
    }

    const ftpConfig = djConfig.ftp_config;
    
    // Obtener password del secret configurado
    const ftpPassword = Deno.env.get(ftpConfig.password_secret_key || 'RADIOBOSS_FTP_PASSWORD');

    if (!ftpPassword) {
      console.error(`❌ Secret '${ftpConfig.password_secret_key}' no configurado`);
      return Response.json({ 
        success: false,
        error: `El secret '${ftpConfig.password_secret_key}' no está configurado. Configúralo en Admin → Settings → Secrets.` 
      }, { status: 500 });
    }

    console.log('📡 Iniciando conexión FTP genérica...');
    console.log('🌐 Host:', ftpConfig.host);
    console.log('🔌 Port:', ftpConfig.port);
    console.log('👤 User:', ftpConfig.username);
    console.log('📁 Carpeta remota:', ftpConfig.remote_folder);
    console.log('🔐 Encryption:', ftpConfig.encryption);

    // Convertir base64 a bytes
    let bytes;
    try {
      const binaryString = atob(audio_base64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('✅ Audio convertido:', Math.round(bytes.length / 1024), 'KB');
    } catch (error) {
      console.error('❌ Error convirtiendo base64:', error);
      return Response.json({
        success: false,
        error: 'Error al convertir el audio base64',
        details: error.message
      }, { status: 500 });
    }

    // Construir path remoto
    const remotePath = `${ftpConfig.remote_folder}/${filename}`;
    
    // Construir URL FTP según configuración
    let ftpUrl;
    if (ftpConfig.encryption === 'sftp') {
      // SFTP usa puerto 22 por defecto
      ftpUrl = `sftp://${ftpConfig.username}:${ftpPassword}@${ftpConfig.host}:${ftpConfig.port || 22}/${remotePath}`;
    } else {
      // FTP/FTPS usa puerto 21 por defecto
      ftpUrl = `ftp://${ftpConfig.username}:${ftpPassword}@${ftpConfig.host}:${ftpConfig.port || 21}/${remotePath}`;
    }
    
    console.log('📤 Subiendo archivo vía FTP...');
    console.log('🔗 URL:', ftpUrl.replace(ftpPassword, '***'));

    try {
      const uploadResponse = await fetch(ftpUrl, {
        method: 'PUT',
        body: bytes,
        headers: {
          'Content-Type': 'audio/mpeg'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`FTP upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      console.log('✅ Archivo subido exitosamente a:', remotePath);

      // Construir URL pública del archivo
      // Para RadioBOSS Cloud: https://c34.radioboss.fm/path
      // Para localhost: http://localhost:8000/path
      // Para otros: http://host:port/path
      let publicUrl;
      if (ftpConfig.host.includes('radioboss.fm')) {
        publicUrl = `https://${ftpConfig.host}/${remotePath}`;
      } else if (ftpConfig.host === 'localhost' || ftpConfig.host === '127.0.0.1') {
        publicUrl = `http://${ftpConfig.host}:${ftpConfig.port || 8000}/${remotePath}`;
      } else {
        publicUrl = `http://${ftpConfig.host}/${remotePath}`;
      }
      
      // Crear log de éxito
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'success',
        module: 'dj_virtual',
        message: 'Audio subido vía FTP genérico',
        details: {
          filename: filename,
          size_bytes: bytes.length,
          size_kb: Math.round(bytes.length / 1024),
          remote_path: remotePath,
          public_url: publicUrl,
          ftp_host: ftpConfig.host,
          ftp_port: ftpConfig.port,
          encryption: ftpConfig.encryption
        }
      });

      return Response.json({
        success: true,
        remote_path: remotePath,
        public_url: publicUrl,
        filename: filename,
        size_bytes: bytes.length,
        size_kb: Math.round(bytes.length / 1024),
        message: `Audio subido exitosamente vía FTP (${Math.round(bytes.length / 1024)} KB)`
      });

    } catch (ftpError) {
      console.error('❌ Error en subida FTP:', ftpError);
      
      // Crear log de error
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'error',
        module: 'dj_virtual',
        message: 'Error subiendo audio vía FTP',
        details: {
          error: ftpError.message,
          filename: filename,
          ftp_host: ftpConfig.host,
          ftp_port: ftpConfig.port
        },
        stack_trace: ftpError.stack
      });
      
      return Response.json({
        success: false,
        error: 'Error al subir vía FTP',
        details: ftpError.message,
        troubleshooting: [
          'Verifica que el host FTP sea correcto',
          `Verifica que el secret '${ftpConfig.password_secret_key}' tenga la contraseña correcta`,
          'Verifica que tengas permisos de escritura en la carpeta remota',
          'Verifica que el puerto sea correcto (21 para FTP, 22 para SFTP)',
          'Si usas localhost, asegúrate de tener un servidor FTP corriendo'
        ]
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error en uploadDJAudioToRadioBoss:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'error',
        module: 'dj_virtual',
        message: 'Error crítico en upload de DJ audio',
        details: {
          error: error.message,
          stack: error.stack
        },
        stack_trace: error.stack
      });
    } catch (logError) {
      console.error('No se pudo crear log:', logError);
    }
    
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
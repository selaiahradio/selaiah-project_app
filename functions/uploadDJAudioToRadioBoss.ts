import { createClientFromRequest } from 'npm:@selaiah/sdk@1.0.0';
import { Client as FTPClient } from 'npm:basic-ftp@5.0.5';

Deno.serve(async (req) => {
  let ftpClient;
  
  try {
    const selaiah = createClientFromRequest(req);
    
    // Verificar autenticación
    const user = await selaiah.auth.me();
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
    const configs = await selaiah.asServiceRole.entities.DJConfig.list();
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

    console.log('📡 Iniciando conexión FTP...');
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

    // Crear cliente FTP
    ftpClient = new FTPClient();
    ftpClient.ftp.verbose = true; // Log detallado

    try {
      // Configurar opciones de conexión
      const connectOptions = {
        host: ftpConfig.host,
        port: ftpConfig.port || 21,
        user: ftpConfig.username,
        password: ftpPassword,
        secure: ftpConfig.encryption === 'explicit_tls' || ftpConfig.encryption === 'implicit_tls',
        secureOptions: {
          rejectUnauthorized: false // Permitir certificados auto-firmados
        }
      };

      // Para implicit TLS, conectar directamente con TLS
      if (ftpConfig.encryption === 'implicit_tls') {
        connectOptions.secure = 'implicit';
      }

      console.log('🔗 Conectando a FTP...');
      await ftpClient.access(connectOptions);
      console.log('✅ Conectado exitosamente');

      // Verificar/crear directorio remoto si es necesario
      if (ftpConfig.remote_folder && ftpConfig.remote_folder !== '.' && ftpConfig.remote_folder !== '/') {
        try {
          console.log('📁 Verificando carpeta:', ftpConfig.remote_folder);
          await ftpClient.ensureDir(ftpConfig.remote_folder);
          console.log('✅ Carpeta verificada/creada');
        } catch (dirError) {
          console.warn('⚠️ No se pudo crear carpeta, continuando:', dirError.message);
        }
      }

      // Construir path completo
      const remotePath = ftpConfig.remote_folder 
        ? `${ftpConfig.remote_folder}/${filename}`.replace(/\/+/g, '/')
        : filename;

      console.log('📤 Subiendo archivo:', remotePath);

      // Subir archivo desde buffer
      await ftpClient.uploadFrom(
        new ReadableStream({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          }
        }),
        remotePath
      );

      console.log('✅ Archivo subido exitosamente');

      // Cerrar conexión FTP
      ftpClient.close();

      // Construir URL pública del archivo
      let publicUrl;
      if (ftpConfig.host.includes('radioboss.fm')) {
        // RadioBOSS Cloud usa HTTPS
        publicUrl = `https://${ftpConfig.host}/${remotePath}`;
      } else if (ftpConfig.host === 'localhost' || ftpConfig.host === '127.0.0.1') {
        publicUrl = `http://${ftpConfig.host}:${ftpConfig.port || 8000}/${remotePath}`;
      } else {
        publicUrl = `http://${ftpConfig.host}/${remotePath}`;
      }
      
      // Crear log de éxito
      await selaiah.asServiceRole.entities.SystemLog.create({
        log_type: 'success',
        module: 'dj_virtual',
        message: 'Audio subido vía FTP exitosamente',
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
      console.error('❌ Error en conexión/subida FTP:', ftpError);
      
      // Intentar cerrar la conexión si está abierta
      if (ftpClient) {
        try {
          ftpClient.close();
        } catch (closeError) {
          console.error('Error cerrando conexión FTP:', closeError);
        }
      }
      
      // Analizar el error para dar mejor feedback
      let errorMessage = ftpError.message || 'Error desconocido en FTP';
      let troubleshooting = [
        'Verifica que el host FTP sea correcto',
        `Verifica que el secret '${ftpConfig.password_secret_key}' tenga la contraseña correcta`,
        'Verifica que tengas permisos de escritura en la carpeta remota',
        'Verifica que el puerto sea correcto (21 para FTP/FTPS)'
      ];

      // Errores específicos
      if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'No se pudo conectar al servidor FTP - Conexión rechazada';
        troubleshooting = [
          'Verifica que el host y puerto sean correctos',
          'Verifica que el servidor FTP esté corriendo',
          'Verifica que no haya firewall bloqueando la conexión'
        ];
      } else if (errorMessage.includes('530') || errorMessage.includes('Login')) {
        errorMessage = 'Error de autenticación FTP - Usuario o contraseña incorrectos';
        troubleshooting = [
          'Verifica que el usuario FTP sea correcto',
          'Verifica que el secret RADIOBOSS_FTP_PASSWORD tenga la contraseña correcta',
          'Intenta reconectar desde un cliente FTP para probar las credenciales'
        ];
      } else if (errorMessage.includes('550')) {
        errorMessage = 'Error de permisos FTP - No tienes acceso a la carpeta';
        troubleshooting = [
          'Verifica que tengas permisos de escritura en la carpeta',
          'Verifica que la carpeta remota exista',
          'Intenta con otra carpeta como "/"'
        ];
      } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
        errorMessage = 'Timeout de conexión FTP';
        troubleshooting = [
          'El servidor FTP tardó mucho en responder',
          'Verifica tu conexión a internet',
          'Intenta de nuevo en unos minutos'
        ];
      }
      
      // Crear log de error
      await selaiah.asServiceRole.entities.SystemLog.create({
        log_type: 'error',
        module: 'dj_virtual',
        message: 'Error subiendo audio vía FTP',
        details: {
          error: errorMessage,
          original_error: ftpError.message,
          filename: filename,
          ftp_host: ftpConfig.host,
          ftp_port: ftpConfig.port,
          ftp_user: ftpConfig.username,
          encryption: ftpConfig.encryption
        },
        stack_trace: ftpError.stack
      });
      
      return Response.json({
        success: false,
        error: errorMessage,
        details: ftpError.message,
        troubleshooting: troubleshooting
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error general en uploadDJAudioToRadioBoss:', error);
    
    // Intentar cerrar la conexión FTP si está abierta
    if (ftpClient) {
      try {
        ftpClient.close();
      } catch (closeError) {
        console.error('Error cerrando conexión FTP:', closeError);
      }
    }
    
    try {
      const selaiah = createClientFromRequest(req);
      await selaiah.asServiceRole.entities.SystemLog.create({
        log_type: 'critical',
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
      error: error.message || 'Error desconocido',
      stack: error.stack
    }, { status: 500 });
  }
});
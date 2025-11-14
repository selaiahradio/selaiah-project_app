import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Obtener configuración del stream activo
    const configs = await base44.asServiceRole.entities.StreamConfig.filter({ 
      is_active: true, 
      is_primary: true 
    });

    if (!configs || configs.length === 0) {
      return Response.json({ 
        error: 'No hay stream configurado' 
      }, { status: 404 });
    }

    const streamConfig = configs[0];

    // Si tiene configuración de AzuraCast, usar su API
    if (streamConfig.azuracast_api_url && streamConfig.azuracast_station_id) {
      try {
        const azuracastUrl = `${streamConfig.azuracast_api_url}/station/${streamConfig.azuracast_station_id}/nowplaying`;
        console.log('Consultando AzuraCast:', azuracastUrl);
        
        const response = await fetch(azuracastUrl);
        
        if (!response.ok) {
          throw new Error(`AzuraCast API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extraer información relevante
        const nowPlaying = {
          song_title: data.now_playing?.song?.title || 'SELAIAH RADIO',
          artist: data.now_playing?.song?.artist || 'Radio Cristiana',
          album: data.now_playing?.song?.album || null,
          cover_art_url: data.now_playing?.song?.art || null,
          started_at: data.now_playing?.played_at ? new Date(data.now_playing.played_at * 1000).toISOString() : null,
          duration: data.now_playing?.duration || null,
          listeners: data.listeners?.current || 0,
          stream_id: streamConfig.id
        };

        // Guardar en la base de datos
        await base44.asServiceRole.entities.NowPlaying.create(nowPlaying);

        return Response.json({
          success: true,
          data: nowPlaying
        });

      } catch (azuraError) {
        console.error('Error consultando AzuraCast:', azuraError);
        // Continuar con método alternativo
      }
    }

    // Método alternativo: intentar parsear metadata del stream
    if (streamConfig.stream_url) {
      try {
        console.log('Intentando obtener metadata del stream:', streamConfig.stream_url);
        
        // Hacer una petición HEAD al stream para obtener metadata
        const streamResponse = await fetch(streamConfig.stream_url, {
          method: 'GET',
          headers: {
            'Icy-MetaData': '1',
            'User-Agent': 'SELAIAH RADIO Player'
          }
        });

        const icyName = streamResponse.headers.get('icy-name');
        const icyDescription = streamResponse.headers.get('icy-description');
        const icyGenre = streamResponse.headers.get('icy-genre');

        // Información básica del stream
        const nowPlaying = {
          song_title: icyName || 'EN VIVO',
          artist: icyDescription || 'SELAIAH RADIO',
          album: icyGenre || 'Radio Cristiana',
          cover_art_url: null,
          started_at: new Date().toISOString(),
          duration: null,
          listeners: 0,
          stream_id: streamConfig.id
        };

        return Response.json({
          success: true,
          data: nowPlaying,
          source: 'stream_metadata'
        });

      } catch (streamError) {
        console.error('Error obteniendo metadata del stream:', streamError);
      }
    }

    // Fallback: obtener el último Now Playing de la base de datos
    const recentPlaying = await base44.asServiceRole.entities.NowPlaying.filter(
      { stream_id: streamConfig.id },
      "-created_date",
      1
    );

    if (recentPlaying && recentPlaying.length > 0) {
      return Response.json({
        success: true,
        data: recentPlaying[0],
        source: 'cached'
      });
    }

    // Si no hay nada, devolver información por defecto
    return Response.json({
      success: true,
      data: {
        song_title: 'SELAIAH RADIO',
        artist: 'Radio Cristiana',
        album: 'Transmitiendo 24/7',
        cover_art_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e8/8116342ff_IMG-20251102-WA0000.jpg',
        started_at: new Date().toISOString(),
        duration: null,
        listeners: 0,
        stream_id: streamConfig.id
      },
      source: 'default'
    });

  } catch (error) {
    console.error('Error general:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
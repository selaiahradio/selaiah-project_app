import { createClientFromRequest } from 'npm:@selaiah/sdk@1.0.0';

Deno.serve(async (req) => {
  try {
    const selaiah = createClientFromRequest(req);
    
    // Autenticación opcional
    let user = null;
    try {
      user = await selaiah.auth.me();
    } catch (error) {
      console.log('Usuario no autenticado');
    }

    const { type, reference, language = 'es', version = 'auto' } = await req.json();

    if (!type || !reference) {
      return Response.json({ 
        error: 'Se requiere type (bible/quran/torah/etc) y reference' 
      }, { status: 400 });
    }

    let result = null;

    switch (type) {
      case 'bible':
        result = await fetchBibleVerse(reference, language, version);
        break;
      case 'quran':
        result = await fetchQuranVerse(reference, language);
        break;
      case 'torah':
        result = await fetchTorahVerse(reference, language);
        break;
      case 'buddhist_sutra':
        result = await fetchBuddhistSutra(reference, language);
        break;
      case 'hindu_scripture':
        result = await fetchHinduScripture(reference, language);
        break;
      default:
        return Response.json({ 
          error: `Tipo de escritura no soportado: ${type}` 
        }, { status: 400 });
    }

    if (!result) {
      return Response.json({ 
        error: 'No se pudo obtener el texto',
        success: false 
      }, { status: 404 });
    }

    // Registrar en logs
    await selaiah.asServiceRole.entities.SystemLog.create({
      log_type: 'info',
      module: 'scripture_api',
      message: `Escritura obtenida: ${type}`,
      details: {
        user_email: user?.email || 'anonymous',
        type,
        reference,
        language,
        success: true
      }
    });

    return Response.json({
      success: true,
      type,
      reference,
      language,
      ...result
    });

  } catch (error) {
    console.error('❌ Error en fetchScriptureFromAPI:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});

// 📖 BIBLIA - Múltiples APIs con fallback
async function fetchBibleVerse(reference, language, version) {
  try {
    // 🔧 Parsear referencia (ej: "Juan 3:16", "Génesis 1:1-5")
    const parsed = parseReference(reference);
    if (!parsed) {
      throw new Error('Formato de referencia inválido');
    }

    const { book, chapter, verse, endVerse } = parsed;
    
    // Mapear versión por idioma
    const versionMap = {
      es: version === 'auto' ? 'RVR1960' : version,
      en: version === 'auto' ? 'NIV' : version,
      pt: 'NVI-PT',
      fr: 'LSG'
    };
    
    const bibleVersion = versionMap[language] || 'NIV';

    // 🌐 API 1: Bible API (gratuita, confiable)
    try {
      const url = `https://bible-api.com/${book}+${chapter}:${verse}${endVerse ? `-${endVerse}` : ''}?translation=${bibleVersion}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.text) {
        return {
          text: data.text.trim(),
          reference: data.reference,
          version: bibleVersion,
          source: 'bible-api.com'
        };
      }
    } catch (error) {
      console.log('Bible API falló, intentando alternativa...');
    }

    // 🌐 API 2: Labs.Bible (API v2)
    try {
      const bookId = getBookId(book);
      const url = `https://labs.bible.org/api/?passage=${bookId}%20${chapter}:${verse}&type=json&formatting=plain`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0].text) {
        return {
          text: data[0].text.trim(),
          reference: `${book} ${chapter}:${verse}`,
          version: 'ASV',
          source: 'labs.bible.org'
        };
      }
    } catch (error) {
      console.log('Labs.Bible falló, intentando alternativa...');
    }

    // 🌐 API 3: Bolls.life (Español específico)
    if (language === 'es') {
      try {
        const url = `https://bolls.life/get-verse/RVR1960/${book}/${chapter}/${verse}/`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.text) {
          return {
            text: data.text.trim(),
            reference: `${book} ${chapter}:${verse}`,
            version: 'RVR1960',
            source: 'bolls.life'
          };
        }
      } catch (error) {
        console.log('Bolls.life falló');
      }
    }

    throw new Error('No se pudo obtener el versículo de ninguna API');

  } catch (error) {
    console.error('Error en fetchBibleVerse:', error);
    return null;
  }
}

// 📖 CORÁN - Quran.com API
async function fetchQuranVerse(reference, language) {
  try {
    // Parsear referencia (ej: "2:255", "1:1-7")
    const match = reference.match(/(\d+):(\d+)(?:-(\d+))?/);
    if (!match) {
      throw new Error('Formato de referencia inválido para Corán');
    }

    const surah = parseInt(match[1]);
    const ayahStart = parseInt(match[2]);
    const ayahEnd = match[3] ? parseInt(match[3]) : ayahStart;

    // Mapear edición por idioma
    const editionMap = {
      es: 'es.cortes', // Julio Cortes
      en: 'en.sahih',  // Sahih International
      ar: 'ar.alafasy', // Sheikh Alafasy
      fr: 'fr.hamidullah',
      ur: 'ur.jalandhry'
    };
    
    const edition = editionMap[language] || 'en.sahih';

    // Obtener versículos
    const verses = [];
    for (let ayah = ayahStart; ayah <= ayahEnd; ayah++) {
      const url = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${edition}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        verses.push(data.data.text);
      }
    }

    if (verses.length === 0) {
      throw new Error('No se encontraron los versículos');
    }

    return {
      text: verses.join(' '),
      reference: `Corán ${surah}:${ayahStart}${ayahEnd > ayahStart ? `-${ayahEnd}` : ''}`,
      edition,
      source: 'alquran.cloud'
    };

  } catch (error) {
    console.error('Error en fetchQuranVerse:', error);
    return null;
  }
}

// 📖 TORÁ - Sefaria API
async function fetchTorahVerse(reference, language) {
  try {
    // Sefaria API - textos judaicos completos
    const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(reference)}?context=0&lang=${language === 'es' ? 'es' : 'en'}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.text) {
      const text = Array.isArray(data.text) ? data.text.join(' ') : data.text;
      return {
        text: text.trim(),
        reference: data.ref || reference,
        version: data.versionTitle || 'Hebrew/English',
        source: 'sefaria.org'
      };
    }

    throw new Error('No se encontró el texto en Sefaria');

  } catch (error) {
    console.error('Error en fetchTorahVerse:', error);
    return null;
  }
}

// 📖 SUTRAS BUDISTAS - BuddhaNet/AccessToInsight
async function fetchBuddhistSutra(reference, language) {
  try {
    // Por ahora placeholder - en producción integrar con:
    // - BuddhaNet (https://www.buddhanet.net)
    // - Access to Insight (https://www.accesstoinsight.org)
    // - SuttaCentral (https://suttacentral.net)
    
    return {
      text: `[Sutra budista: ${reference}]\nTexto del sutra aquí... (Integrando APIs budistas)`,
      reference,
      source: 'suttacentral.net',
      note: 'API en desarrollo - usar SuttaCentral para textos completos'
    };

  } catch (error) {
    console.error('Error en fetchBuddhistSutra:', error);
    return null;
  }
}

// 📖 ESCRITURAS HINDÚES - Bhagavad Gita API
async function fetchHinduScripture(reference, language) {
  try {
    // API Bhagavad Gita (gratuita)
    // Referencia: "2.47" (capítulo.verso)
    const match = reference.match(/(\d+)\.(\d+)/);
    if (!match) {
      throw new Error('Formato de referencia inválido para Bhagavad Gita');
    }

    const chapter = match[1];
    const verse = match[2];
    
    const url = `https://bhagavadgitaapi.in/verse/${chapter}/${verse}/`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.text) {
      return {
        text: data.text,
        translation: data.meaning?.en || '',
        reference: `Bhagavad Gita ${chapter}.${verse}`,
        source: 'bhagavadgitaapi.in'
      };
    }

    throw new Error('No se encontró el verso en la API');

  } catch (error) {
    console.error('Error en fetchHinduScripture:', error);
    return null;
  }
}

// 🔧 HELPERS
function parseReference(reference) {
  // Parsear "Juan 3:16", "1 Juan 2:5", "Génesis 1:1-5"
  const match = reference.match(/((?:1|2|3)\s)?([A-Za-zÁ-ú]+)\s+(\d+):(\d+)(?:-(\d+))?/);
  if (!match) return null;
  
  return {
    book: (match[1] || '') + match[2],
    chapter: parseInt(match[3]),
    verse: parseInt(match[4]),
    endVerse: match[5] ? parseInt(match[5]) : null
  };
}

function getBookId(bookName) {
  const bookMap = {
    'génesis': 'Genesis',
    'éxodo': 'Exodus',
    'juan': 'John',
    'mateo': 'Matthew',
    'marcos': 'Mark',
    'lucas': 'Luke',
    'hechos': 'Acts',
    'romanos': 'Romans',
    // ... agregar más mapeos según necesidad
  };
  
  return bookMap[bookName.toLowerCase()] || bookName;
}
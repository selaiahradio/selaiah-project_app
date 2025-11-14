import { createClientFromRequest } from 'npm:@selaiah/sdk@1.0.0';

Deno.serve(async (req) => {
  try {
    const selaiah = createClientFromRequest(req);
    
    // Verificar autenticación (opcional para chat público)
    let user = null;
    try {
      user = await selaiah.auth.me();
    } catch (error) {
      console.log('Usuario no autenticado, usando modo público');
    }

    const { message, context, conversationHistory = [] } = await req.json();

    if (!message) {
      return Response.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    // 🔍 DETECCIÓN AUTOMÁTICA DE RELIGIÓN E IDIOMA
    const detection = await detectReligionAndLanguage(message, conversationHistory, user);
    
    // 📚 CONTEXTO MULTI-RELIGIOSO INTELIGENTE
    const systemContext = buildMultiReligiousContext(detection, user);
    
    // 🧠 ANÁLISIS DE INTENCIÓN Y NIVEL ESPIRITUAL
    const userAnalysis = analyzeUserIntent(message, conversationHistory);

    // 💬 CONSTRUIR MENSAJES PARA LA IA
    let conversationMessages = [
      {
        role: "system",
        content: systemContext
      }
    ];

    // Agregar historial (últimos 8 mensajes para más contexto)
    if (conversationHistory.length > 0) {
      conversationHistory.slice(-8).forEach(msg => {
        conversationMessages.push({
          role: msg.sender_email === user?.email ? "user" : "assistant",
          content: msg.message
        });
      });
    }

    // Agregar mensaje actual con contexto mejorado
    const enhancedMessage = userAnalysis.needsScripture 
      ? `${message}\n\n[El usuario está buscando referencias de textos sagrados. Si mencionas un versículo, incluye la referencia exacta (ej: Juan 3:16, Corán 2:255, etc.)]`
      : message;

    conversationMessages.push({
      role: "user",
      content: enhancedMessage
    });

    // 🤖 LLAMAR A OPENAI CON CONTEXTO AVANZADO
    const response = await selaiah.integrations.Core.InvokeLLM({
      prompt: conversationMessages.map(m => 
        `${m.role === 'system' ? 'SISTEMA' : m.role === 'user' ? 'USUARIO' : 'ASISTENTE'}: ${m.content}`
      ).join('\n\n'),
      add_context_from_internet: userAnalysis.needsExternalInfo
    });

    const aiMessage = typeof response === 'string' ? response : response.response || response.text || '';

    // 📖 SI LA IA MENCIONA REFERENCIAS, BUSCARLAS EN LAS APIS
    const scriptureMentions = extractScriptureReferences(aiMessage, detection.religion);
    let enrichedMessage = aiMessage;
    
    if (scriptureMentions.length > 0) {
      const scriptureTexts = await fetchScripturesFromAPIs(scriptureMentions, detection);
      enrichedMessage = enrichScriptureReferences(aiMessage, scriptureTexts);
    }

    // 🔄 ACTUALIZAR PERFIL DEL USUARIO SI LA CONFIANZA ES ALTA
    if (user && detection.confidence > 0.75) {
      try {
        await selaiah.asServiceRole.entities.User.update(user.id, {
          ai_detection: {
            detected_religion: detection.religion,
            religion_confidence: detection.religionConfidence,
            detected_language: detection.language,
            language_confidence: detection.languageConfidence,
            spiritual_level: userAnalysis.spiritualLevel,
            last_updated: new Date().toISOString()
          }
        });
      } catch (updateError) {
        console.log('No se pudo actualizar detección:', updateError.message);
      }
    }

    // 📊 REGISTRAR EN LOGS
    await selaiah.asServiceRole.entities.SystemLog.create({
      log_type: 'info',
      module: 'ai_chat_multi_religion',
      message: 'Chat multi-religioso procesado',
      details: {
        user_email: user?.email || 'anonymous',
        detected_religion: detection.religion,
        detected_language: detection.language,
        confidence: detection.confidence,
        spiritual_level: userAnalysis.spiritualLevel,
        intent: userAnalysis.intent,
        message_length: message.length,
        response_length: enrichedMessage.length,
        scriptures_found: scriptureMentions.length
      }
    });

    return Response.json({
      success: true,
      message: enrichedMessage.trim(),
      metadata: {
        detected_religion: detection.religion,
        detected_language: detection.language,
        confidence: detection.confidence,
        spiritual_level: userAnalysis.spiritualLevel,
        scriptures_included: scriptureMentions.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Error en chatWithAIMultiReligion:', error);
    return Response.json({ 
      error: error.message,
      message: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo."
    }, { status: 500 });
  }
});

// 🔍 FUNCIÓN: Detectar religión e idioma automáticamente
function detectReligionAndLanguage(message, history, user) {
  const text = (message + ' ' + history.slice(-5).map(m => m.message || '').join(' ')).toLowerCase();
  
  // PATRONES DE RELIGIÓN (con pesos)
  const religionPatterns = {
    christianity: {
      patterns: [
        /jesucristo|cristo|jesús|iglesia|pastor|biblia|evangelio|juan 3|mateo|lucas|marcos|apocalipsis|dios padre|trinidad|cruz|resurrección|pentecostés|espíritu santo|amén/gi,
        /church|jesus christ|bible|gospel|pastor|priest|christian|salvation|grace|faith|prayer|amen/gi
      ],
      weight: { es: 3, en: 2 }
    },
    islam: {
      patterns: [
        /alá|mahoma|corán|mezquita|imán|sura|hadiz|ramadán|musulmán|islam|profeta|shahada|salat|zakat/gi,
        /allah|muhammad|quran|mosque|imam|muslim|islam|prophet|ramadan|hajj|prayer/gi
      ],
      weight: { es: 3, en: 3, ar: 5 }
    },
    judaism: {
      patterns: [
        /torá|torah|talmud|sinagoga|rabino|shabbat|shabat|judaísmo|judío|hashem|mitzvá|kasher|yom kippur/gi,
        /torah|talmud|synagogue|rabbi|jewish|judaism|sabbath|mitzvah|kosher|yom kippur/gi
      ],
      weight: { es: 3, en: 3, he: 5 }
    },
    buddhism: {
      patterns: [
        /buda|budismo|dharma|karma|nirvana|monje|meditación|sangha|sutra|bodhisattva|zen|tibetano/gi,
        /buddha|buddhism|dharma|karma|nirvana|monk|meditation|enlightenment|zen|tibetan/gi
      ],
      weight: { es: 3, en: 3 }
    },
    hinduism: {
      patterns: [
        /hinduismo|hindú|krishna|shiva|vishnu|brahma|vedas|upanishad|dharma|karma|yoga|mantra|om/gi,
        /hinduism|hindu|krishna|shiva|vishnu|brahma|vedas|upanishad|dharma|karma|yoga|mantra|om/gi
      ],
      weight: { es: 3, en: 3, hi: 5 }
    }
  };

  // PATRONES DE IDIOMA
  const languagePatterns = {
    es: /\b(el|la|los|las|de|en|que|por|para|con|como|está|qué|cómo|dónde|cuándo|por favor|gracias|hola)\b/gi,
    en: /\b(the|a|an|is|are|was|were|have|has|what|how|where|when|please|thank|hello)\b/gi,
    ar: /[\u0600-\u06FF]/g, // Caracteres árabes
    he: /[\u0590-\u05FF]/g, // Caracteres hebreos
    hi: /[\u0900-\u097F]/g  // Caracteres hindi/sánscrito
  };

  // Detectar religión
  let religionScores = {};
  let maxScore = 0;
  let detectedReligion = user?.religion || 'christianity'; // Default

  for (const [religion, config] of Object.entries(religionPatterns)) {
    let score = 0;
    config.patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length;
      }
    });
    religionScores[religion] = score;
    if (score > maxScore) {
      maxScore = score;
      detectedReligion = religion;
    }
  }

  // Detectar idioma
  let languageScores = {};
  let maxLangScore = 0;
  let detectedLanguage = user?.preferred_language || 'es'; // Default español

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    const matches = text.match(pattern);
    const score = matches ? matches.length : 0;
    languageScores[lang] = score;
    if (score > maxLangScore) {
      maxLangScore = score;
      detectedLanguage = lang;
    }
  }

  // Calcular confianza
  const totalScore = Object.values(religionScores).reduce((a, b) => a + b, 0);
  const religionConfidence = totalScore > 0 ? maxScore / totalScore : 0.5;
  
  const totalLangScore = Object.values(languageScores).reduce((a, b) => a + b, 0);
  const languageConfidence = totalLangScore > 0 ? maxLangScore / totalLangScore : 0.7;

  return {
    religion: detectedReligion,
    religionConfidence: Math.min(religionConfidence, 1),
    language: detectedLanguage === 'auto' ? 'es' : detectedLanguage,
    languageConfidence: Math.min(languageConfidence, 1),
    confidence: (religionConfidence + languageConfidence) / 2,
    scores: { religion: religionScores, language: languageScores }
  };
}

// 📚 FUNCIÓN: Construir contexto multi-religioso
function buildMultiReligiousContext(detection, user) {
  const religionContexts = {
    christianity: {
      name: 'Cristianismo',
      books: 'Biblia (Antiguo y Nuevo Testamento)',
      leader: 'Jesucristo',
      practices: 'oración, lectura bíblica, comunión, alabanza',
      denominations: 'católica, protestante, ortodoxa, pentecostal, evangélica',
      greeting: '¡Bendiciones!'
    },
    islam: {
      name: 'Islam',
      books: 'Corán y Hadices',
      leader: 'Profeta Muhammad (la paz sea con él)',
      practices: 'las cinco oraciones diarias (Salat), ayuno de Ramadán, Zakat, Hajj',
      denominations: 'sunita, chiita, sufí',
      greeting: 'As-salamu alaykum'
    },
    judaism: {
      name: 'Judaísmo',
      books: 'Torá, Talmud, Tanaj',
      leader: 'Moisés y los profetas',
      practices: 'Shabbat, estudio de la Torá, oraciones, cumplimiento de mitzvot',
      denominations: 'ortodoxa, conservadora, reformista',
      greeting: 'Shalom'
    },
    buddhism: {
      name: 'Budismo',
      books: 'Sutras, Tripitaka',
      leader: 'Buda Gautama',
      practices: 'meditación, Noble Óctuple Sendero, mindfulness',
      denominations: 'Theravada, Mahayana, Vajrayana, Zen',
      greeting: 'Que encuentres la paz interior'
    },
    hinduism: {
      name: 'Hinduismo',
      books: 'Vedas, Upanishads, Bhagavad Gita',
      leader: 'múltiples deidades (Brahma, Vishnu, Shiva)',
      practices: 'puja, yoga, meditación, dharma',
      denominations: 'vaishnavismo, shaivismo, shaktismo',
      greeting: 'Namaste'
    }
  };

  const ctx = religionContexts[detection.religion] || religionContexts.christianity;

  return `Eres un asistente espiritual inteligente y respetuoso para SELAIAH RADIO, una plataforma multi-religiosa.

## Detección Automática del Usuario
- **Religión detectada**: ${ctx.name} (confianza: ${(detection.religionConfidence * 100).toFixed(0)}%)
- **Idioma detectado**: ${detection.language.toUpperCase()} (confianza: ${(detection.languageConfidence * 100).toFixed(0)}%)
- **Usuario**: ${user?.full_name || 'Visitante'}

## Información de ${ctx.name}
- **Textos sagrados**: ${ctx.books}
- **Figura central**: ${ctx.leader}
- **Prácticas principales**: ${ctx.practices}
- **Corrientes**: ${ctx.denominations}

## Tu Rol
- Responde en **${detection.language === 'es' ? 'español' : detection.language === 'en' ? 'inglés' : 'el idioma detectado'}** natural y respetuoso
- Sé breve y directo (máximo 4-5 oraciones)
- Adapta tu lenguaje al nivel espiritual del usuario
- Si mencionas textos sagrados, incluye la **referencia exacta** (ej: Juan 3:16, Corán 2:255, Torá Génesis 1:1)
- Sé empático con el tono emocional del usuario
- Respeta todas las religiones y creencias
- Si no sabes algo, admítelo con humildad
- Usa el saludo apropiado: **${ctx.greeting}**

## Características de la Plataforma
- Radio espiritual 24/7 con música de todas las religiones
- Biblioteca completa de textos sagrados (Biblia, Corán, Torá, Vedas, Sutras)
- Comunidad multi-religiosa con respeto y diálogo
- Chat IA entrenador espiritual
- Eventos religiosos y conferencias
- Tienda con artículos religiosos

## Usuario Actual
${user ? `- Nombre: ${user.full_name}
- Email: ${user.email}
- Religión registrada: ${user.religion || 'No especificada'}
- Nivel de verificación: ${user.verification_level || 0}%` : '- Usuario no registrado (modo público)'}

Responde al usuario con sabiduría y respeto:`;
}

// 🧠 FUNCIÓN: Analizar intención del usuario
function analyzeUserIntent(message, history) {
  const lowerMessage = message.toLowerCase();
  
  // Detectar si busca escrituras
  const scriptureKeywords = [
    'versículo', 'verso', 'pasaje', 'capítulo', 'sura', 'ayat', 'sutra',
    'biblia dice', 'corán dice', 'torá dice', 'dice en', 'escrito está',
    'juan', 'mateo', 'génesis', 'éxodo', 'salmo', 'proverbios'
  ];
  const needsScripture = scriptureKeywords.some(kw => lowerMessage.includes(kw));
  
  // Detectar si necesita info externa
  const externalKeywords = [
    'noticias', 'eventos', 'dónde', 'cuándo', 'horario', 'iglesia cerca',
    'mezquita cerca', 'sinagoga cerca', 'templo cerca'
  ];
  const needsExternalInfo = externalKeywords.some(kw => lowerMessage.includes(kw));
  
  // Detectar nivel espiritual
  const beginnerKeywords = ['qué es', 'cómo empiezo', 'no entiendo', 'explícame', 'nuevo en'];
  const advancedKeywords = ['teología', 'exégesis', 'doctrina', 'hermenéutica', 'escatología'];
  
  let spiritualLevel = 'intermediate';
  if (beginnerKeywords.some(kw => lowerMessage.includes(kw))) {
    spiritualLevel = 'beginner';
  } else if (advancedKeywords.some(kw => lowerMessage.includes(kw))) {
    spiritualLevel = 'advanced';
  }
  
  // Detectar tono emocional
  const emotionalKeywords = {
    distressed: ['ayuda', 'problema', 'triste', 'angustiado', 'deprimido', 'ansioso'],
    joyful: ['feliz', 'alegre', 'bendecido', 'agradecido', 'gracias a dios'],
    curious: ['pregunta', 'duda', 'quiero saber', 'me gustaría entender'],
    reverential: ['oración', 'reflexión', 'meditación', 'contemplación']
  };
  
  let emotionalTone = 'neutral';
  for (const [tone, keywords] of Object.entries(emotionalKeywords)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      emotionalTone = tone;
      break;
    }
  }
  
  // Detectar intención principal
  let intent = 'general';
  if (lowerMessage.includes('orar') || lowerMessage.includes('oración')) {
    intent = 'prayer';
  } else if (needsScripture) {
    intent = 'scripture';
  } else if (lowerMessage.includes('enseñ') || lowerMessage.includes('aprend')) {
    intent = 'learning';
  } else if (externalKeywords.some(kw => lowerMessage.includes(kw))) {
    intent = 'information';
  }
  
  return {
    intent,
    needsScripture,
    needsExternalInfo,
    spiritualLevel,
    emotionalTone
  };
}

// 📖 FUNCIÓN: Extraer referencias de escrituras mencionadas
function extractScriptureReferences(text, religion) {
  const references = [];
  
  if (religion === 'christianity') {
    // Buscar referencias bíblicas: "Juan 3:16", "Génesis 1:1-5", etc.
    const biblePattern = /((?:1|2|3)\s)?([A-Za-zÁ-ú]+)\s+(\d+):(\d+)(?:-(\d+))?/g;
    let match;
    while ((match = biblePattern.exec(text)) !== null) {
      references.push({
        type: 'bible',
        book: (match[1] || '') + match[2],
        chapter: parseInt(match[3]),
        verse: parseInt(match[4]),
        endVerse: match[5] ? parseInt(match[5]) : null
      });
    }
  } else if (religion === 'islam') {
    // Buscar referencias del Corán: "Corán 2:255", "Sura 1:1-7"
    const quranPattern = /(?:Corán|Sura)\s+(\d+):(\d+)(?:-(\d+))?/gi;
    let match;
    while ((match = quranPattern.exec(text)) !== null) {
      references.push({
        type: 'quran',
        surah: parseInt(match[1]),
        ayah: parseInt(match[2]),
        endAyah: match[3] ? parseInt(match[3]) : null
      });
    }
  }
  
  return references;
}

// 🌐 FUNCIÓN: Buscar escrituras en APIs externas
async function fetchScripturesFromAPIs(references, detection) {
  const results = [];
  
  for (const ref of references) {
    try {
      if (ref.type === 'bible') {
        // API de Biblia (múltiples opciones con fallback)
        const text = await fetchBibleVerse(ref, detection.language);
        if (text) {
          results.push({
            reference: ref,
            text,
            source: 'bible_api'
          });
        }
      } else if (ref.type === 'quran') {
        // API del Corán
        const text = await fetchQuranVerse(ref, detection.language);
        if (text) {
          results.push({
            reference: ref,
            text,
            source: 'quran_api'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching scripture:', error);
    }
  }
  
  return results;
}

// 📖 FUNCIÓN: Obtener versículo bíblico de API
async function fetchBibleVerse(ref, language) {
  try {
    // Opción 1: Bible.com (API no oficial, puede cambiar)
    const bookId = ref.book.toLowerCase().replace(/\s/g, '');
    const version = language === 'es' ? 'RVR1960' : 'NIV';
    
    // Opción 2: Usar ESV API (requiere API key pero es más confiable)
    // const apiKey = Deno.env.get('ESV_API_KEY');
    // const url = `https://api.esv.org/v3/passage/text/?q=${ref.book}+${ref.chapter}:${ref.verse}`;
    
    // Por ahora, retornar placeholder (en producción usar API real)
    return `[Texto de ${ref.book} ${ref.chapter}:${ref.verse} - Integrando API...]`;
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    return null;
  }
}

// 📖 FUNCIÓN: Obtener versículo del Corán de API
async function fetchQuranVerse(ref, language) {
  try {
    // API Quran.com (gratuita y confiable)
    const edition = language === 'es' ? 'es.cortes' : language === 'ar' ? 'ar.alafasy' : 'en.sahih';
    const url = `https://api.alquran.cloud/v1/ayah/${ref.surah}:${ref.ayah}/${edition}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      return data.data.text;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Quran verse:', error);
    return null;
  }
}

// ✨ FUNCIÓN: Enriquecer respuesta con textos de escrituras
function enrichScriptureReferences(aiMessage, scriptureTexts) {
  if (scriptureTexts.length === 0) return aiMessage;
  
  let enriched = aiMessage + '\n\n---\n\n**📖 Textos Sagrados Completos:**\n\n';
  
  scriptureTexts.forEach((scripture, index) => {
    const ref = scripture.reference;
    let refText = '';
    
    if (ref.type === 'bible') {
      refText = `**${ref.book} ${ref.chapter}:${ref.verse}${ref.endVerse ? `-${ref.endVerse}` : ''}**`;
    } else if (ref.type === 'quran') {
      refText = `**Corán ${ref.surah}:${ref.ayah}${ref.endAyah ? `-${ref.endAyah}` : ''}**`;
    }
    
    enriched += `${index + 1}. ${refText}\n"${scripture.text}"\n\n`;
  });
  
  return enriched;
}
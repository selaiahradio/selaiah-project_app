import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Lista de palabras y temas prohibidos
const PROHIBITED_CONTENT = {
  offensive_words: [
    // Palabras ofensivas en español
    'idiota', 'estúpido', 'imbécil', 'tonto', 'pendejo', 'cabrón', 'mierda',
    'puto', 'puta', 'joder', 'coño', 'carajo', 'verga', 'chingar',
    // Palabras ofensivas en inglés
    'stupid', 'idiot', 'fool', 'damn', 'hell', 'shit', 'fuck', 'bitch',
    'bastard', 'ass', 'asshole', 'crap'
  ],
  
  controversial_topics: [
    // Temas religiosos controversiales
    'católicos son', 'protestantes son', 'evangelicos son', 'pentecostales son',
    'secta', 'falsa religión', 'religión falsa', 'herejía', 'hereje',
    'apostasía', 'apóstata', 'anticristo',
    
    // Guerra y violencia
    'guerra', 'matar', 'asesinar', 'violencia', 'armas', 'bomba', 'terrorismo',
    'genocidio', 'masacre',
    
    // Contenido sexual
    'sexo', 'sexual', 'pornografía', 'porno', 'desnudo', 'erótico',
    'prostitución', 'adulterio', 'fornicación',
    
    // Temas políticos divisivos
    'comunismo', 'socialismo', 'fascismo', 'dictadura'
  ],
  
  hate_speech: [
    'odio', 'desprecio', 'asco', 'repugnante', 'asqueroso',
    'basura', 'escoria', 'maldito', 'maldita', 'condenado'
  ]
};

// Palabras y frases positivas (dan puntos extra)
const POSITIVE_CONTENT = [
  'bendición', 'bendiciones', 'gracia', 'paz', 'amor', 'fe', 'esperanza',
  'alabanza', 'adoración', 'gloria', 'aleluya', 'amén', 'gracias',
  'testimonio', 'milagro', 'sanidad', 'liberación', 'salvación',
  'hermano', 'hermana', 'familia', 'comunidad', 'unidad',
  'perdón', 'misericordia', 'compasión', 'gratitud', 'humildad'
];

/**
 * Función para moderar contenido de usuarios
 * Retorna un objeto con el resultado de la moderación
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticación
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false,
        error: 'No autorizado' 
      }, { status: 401 });
    }

    const { content, check_type } = await req.json();

    if (!content) {
      return Response.json({ 
        success: false,
        error: 'El contenido es requerido' 
      }, { status: 400 });
    }

    // Convertir a minúsculas para comparación
    const lowerContent = content.toLowerCase();
    
    // Objeto de resultado
    const result = {
      is_approved: true,
      violations: [],
      warnings: [],
      positive_score: 0,
      negative_score: 0,
      suggestions: []
    };

    // 1. Verificar palabras ofensivas
    const foundOffensive = PROHIBITED_CONTENT.offensive_words.filter(word => 
      lowerContent.includes(word)
    );
    
    if (foundOffensive.length > 0) {
      result.is_approved = false;
      result.negative_score += foundOffensive.length * 10;
      result.violations.push({
        type: 'offensive_language',
        severity: 'high',
        message: '❌ Lenguaje ofensivo detectado',
        details: `Palabras no permitidas: ${foundOffensive.join(', ')}`,
        suggestion: 'Por favor, usa un lenguaje respetuoso y edificante.'
      });
    }

    // 2. Verificar temas controversiales
    const foundControversial = PROHIBITED_CONTENT.controversial_topics.filter(topic => 
      lowerContent.includes(topic)
    );
    
    if (foundControversial.length > 0) {
      result.is_approved = false;
      result.negative_score += foundControversial.length * 5;
      result.violations.push({
        type: 'controversial_content',
        severity: 'medium',
        message: '⚠️ Contenido controversial detectado',
        details: `Temas sensibles: ${foundControversial.join(', ')}`,
        suggestion: 'Evita temas de guerra, sexo, política divisiva o debates religiosos que puedan ofender.'
      });
    }

    // 3. Verificar discurso de odio
    const foundHate = PROHIBITED_CONTENT.hate_speech.filter(word => 
      lowerContent.includes(word)
    );
    
    if (foundHate.length > 0) {
      result.is_approved = false;
      result.negative_score += foundHate.length * 15;
      result.violations.push({
        type: 'hate_speech',
        severity: 'critical',
        message: '🚫 Discurso de odio detectado',
        details: `Expresiones ofensivas: ${foundHate.join(', ')}`,
        suggestion: 'Recuerda: "Ámense los unos a los otros" - Juan 13:34'
      });
    }

    // 4. Calcular puntuación positiva
    const foundPositive = POSITIVE_CONTENT.filter(word => 
      lowerContent.includes(word)
    );
    
    if (foundPositive.length > 0) {
      result.positive_score = foundPositive.length * 5;
      result.warnings.push({
        type: 'positive_content',
        severity: 'info',
        message: '✅ Contenido positivo detectado',
        details: `Palabras edificantes: ${foundPositive.join(', ')}`,
        suggestion: '¡Excelente! Tu mensaje es edificante y lleno de gracia.'
      });
    }

    // 5. Verificaciones adicionales con IA (opcional)
    if (check_type === 'deep' && result.is_approved) {
      try {
        const aiCheck = await base44.integrations.Core.InvokeLLM({
          prompt: `Analiza este contenido de una red social cristiana y determina si es apropiado.
          
Contenido: "${content}"

Reglas:
- NO permitir: lenguaje ofensivo, discusiones religiosas divisivas, guerra, violencia, contenido sexual
- SÍ permitir: testimonios, alabanzas, oraciones, enseñanzas bíblicas respetuosas

Responde en JSON con:
{
  "is_appropriate": true/false,
  "reason": "explicación breve",
  "suggestion": "sugerencia de mejora si aplica"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              is_appropriate: { type: "boolean" },
              reason: { type: "string" },
              suggestion: { type: "string" }
            }
          }
        });

        if (!aiCheck.is_appropriate) {
          result.is_approved = false;
          result.violations.push({
            type: 'ai_moderation',
            severity: 'medium',
            message: '🤖 IA detectó contenido inapropiado',
            details: aiCheck.reason,
            suggestion: aiCheck.suggestion
          });
        }
      } catch (aiError) {
        console.error('Error en verificación IA:', aiError);
        // No bloquear por error de IA
      }
    }

    // 6. Calcular score final
    const final_score = result.positive_score - result.negative_score;
    
    // 7. Guardar log de moderación
    await base44.asServiceRole.entities.SystemLog.create({
      log_type: result.is_approved ? 'info' : 'warning',
      module: 'content_moderation',
      message: result.is_approved ? 'Contenido aprobado' : 'Contenido bloqueado',
      details: {
        user_email: user.email,
        content_length: content.length,
        violations_count: result.violations.length,
        positive_score: result.positive_score,
        negative_score: result.negative_score,
        final_score: final_score,
        is_approved: result.is_approved
      }
    });

    return Response.json({
      success: true,
      moderation: {
        ...result,
        final_score: final_score,
        user_email: user.email,
        checked_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en moderación de contenido:', error);
    
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { ProductIdea, PRDResponse } from '../../types/types';

// Initialize OpenAI with error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const PROMPT_TEMPLATE = `Como Product Manager experto, analiza la siguiente información del producto y genera un documento detallado de funcionalidades siguiendo un formato específico.

CONTEXTO DEL PRODUCTO:
Nombre del Producto: {productName}
Problema a Resolver: {problemStatement}
Usuario Objetivo: {targetUser}
Solución Propuesta: {proposedSolution}
Objetivos del Producto: {productObjectives}

FUNCIONALIDADES A ANALIZAR:
{detailedFunctionality}

Por favor, estructura cada funcionalidad en el siguiente formato:

[Para cada funcionalidad identificada, utiliza esta estructura:]

Funcionalidad X: [Nombre de la Funcionalidad]

X.1 Descripción:
- Descripción detallada de la funcionalidad
- Propósito principal
- Componentes clave
- Valor agregado

X.2 User Stories:
[Mínimo 3 user stories en formato:]
"Como [tipo de usuario], quiero [acción] para [beneficio]."
- Enfócate en diferentes tipos de usuarios
- Asegura que cada historia tenga un beneficio claro
- Prioriza las historias más importantes

X.3 Criterios de Aceptación:
[Mínimo 3 criterios específicos y medibles]
- Debe ser verificable
- Incluir métricas cuando sea posible
- Considerar aspectos técnicos y de usuario
- Especificar condiciones de éxito

X.4 Casos de Uso:
[Mínimo 2 casos de uso detallados]
Caso de Uso 1: [Nombre del Caso]
1. Condición inicial
2. Pasos detallados
3. Resultado esperado
4. Casos alternativos o excepciones

Caso de Uso 2: [Nombre del Caso]
1. Condición inicial
2. Pasos detallados
3. Resultado esperado
4. Casos alternativos o excepciones

X.5 Consideraciones Técnicas:
- Requerimientos técnicos específicos
- Dependencias con otros sistemas
- Consideraciones de seguridad
- Requisitos de rendimiento

Directrices Importantes:
1. Mantén un enfoque práctico y realista
2. Usa lenguaje claro y profesional
3. Incluye detalles técnicos relevantes
4. Asegura que cada sección sea accionable
5. Considera las limitaciones y dependencias

Por favor, analiza las funcionalidades proporcionadas y genera un documento detallado siguiendo esta estructura exacta. Si alguna información está incompleta, realiza suposiciones razonables basadas en el contexto proporcionado y márcarlas como "Sugerencia:".`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log every step
  console.log('1. API route called');
  console.log('2. Request method:', req.method);
  console.log('3. Request body:', req.body);
  console.log('4. OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const productIdea: ProductIdea = req.body;
    console.log('5. Parsed product idea:', productIdea);

    if (!productIdea || Object.keys(productIdea).length === 0) {
      console.error('6. Empty request body');
      return res.status(400).json({ message: 'Request body is empty' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('7. OpenAI API key missing');
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }

    console.log('8. About to call OpenAI');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an experienced Product Manager who creates detailed, professional PRDs."
        },
        {
          role: "user",
          content: PROMPT_TEMPLATE.replace(
            /{(\w+)}/g,
            (match, key) => productIdea[key as keyof ProductIdea] || match
          )
        }
      ],
      temperature: 0.7,
    });

    console.log('9. OpenAI response received');
    const prdContent = completion.choices[0].message.content;

    if (!prdContent) {
      throw new Error('No content received from OpenAI');
    }

    console.log('10. Sending response back to client');
    return res.status(200).json({ prd: prdContent });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error
    });
  }
} 
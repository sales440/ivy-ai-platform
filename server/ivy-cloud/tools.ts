
import { FunctionDeclaration, SchemaType } from '@google-cloud/vertexai';

export const TOOLS = {
    crm_tool: {
        name: 'sync_crm',
        description: 'Interactúa con Microsoft Dynamics 365 para leer leads o registrar actividades.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                action: {
                    type: SchemaType.STRING,
                    enum: ['READ_LEADS', 'LOG_ACTIVITY', 'UPDATE_STATUS'],
                    description: 'La acción a realizar en el CRM.'
                },
                data: {
                    type: SchemaType.OBJECT,
                    description: 'Diccionario con los detalles (ej. ID del lead, resumen de la llamada).',
                    properties: {}, // Allow any properties
                }
            },
            required: ['action', 'data']
        }
    } as FunctionDeclaration,

    market_intel_tool: {
        name: 'consult_market_intel',
        description: 'Busca información en tiempo real en Google sobre una empresa.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                company_name: { type: SchemaType.STRING },
                focus_area: { type: SchemaType.STRING, description: "Ej: 'Finanzas', 'Noticias Recientes'" }
            },
            required: ['company_name']
        }
    } as FunctionDeclaration,

    self_heal_tool: {
        name: 'self_heal_agent',
        description: 'Permite a ROPA reescribir las instrucciones de sistema de un agente subordinado.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                agent_name: { type: SchemaType.STRING, enum: ['IVY_VOICE', 'IVY_MAIL'] },
                new_instruction: { type: SchemaType.STRING, description: 'El nuevo prompt completo optimizado.' }
            },
            required: ['agent_name', 'new_instruction']
        }
    } as FunctionDeclaration,

    // New tools for delegation mentioned in system prompt but not in original python definitions
    delegate_voice_call: {
        name: 'delegate_voice_call',
        description: 'Delegate a task to the Voice Agent (Ivy Voice).',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                target: { type: SchemaType.STRING, description: 'The target phone number or contact ID.' },
                script_strategy: { type: SchemaType.STRING, description: 'The strategy or script to use for the call.' }
            },
            required: ['target', 'script_strategy']
        }
    } as FunctionDeclaration,

    delegate_email_campaign: {
        name: 'delegate_email_campaign',
        description: 'Delegate a task to the Email Agent (Ivy Mail).',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                target: { type: SchemaType.STRING, description: 'The target email address or contact ID.' },
                copy_framework: { type: SchemaType.STRING, description: 'The framework or key points for the email copy.' }
            },
            required: ['target', 'copy_framework']
        }
    } as FunctionDeclaration
};

// Además del email, cada solicitud se guarda en la tabla `lead` (bandeja
// "Solicitudes" del admin panel — ver LEADS_INTEGRATION.md). Se escribe aquí,
// en el servidor, con la service role key (inyectada sola en toda Edge
// Function): la tabla no tiene política de insert para la clave pública, a
// propósito, para que nadie pueda llenarla de basura desde el navegador.
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const COMPANY_ID = Deno.env.get('ARQUELIA_COMPANY_ID')

// Un `Promise.race` con temporizador de verdad: no depende de que la librería
// de red coopere con un abort (ver supabase/functions/track-arquelia).
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

const LEAD_MAX = { name: 120, email: 160, phone: 40, message: 4000, path: 300, campaign: 120 }

const clean = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM = 'Arquelia <info@arquelia.es>'
const TO = 'info@arquelia.es'

const SERVICE_LABELS: Record<string, string> = {
  integral: 'Reforma integral',
  cocina: 'Reforma de cocina',
  bano: 'Reforma de baño',
  interiorismo: 'Interiorismo',
  rehabilitacion: 'Rehabilitación',
  local: 'Local comercial',
  oficina: 'Oficina',
  otros: 'Otros',
}

interface ContactPayload {
  servicio?: string | null
  nombre?: string
  poblacion?: string
  email?: string
  telefono?: string
  descripcion?: string
  // Bandeja de solicitudes (leads)
  company_id?: string
  /** Campo trampa anti-bots: una persona nunca lo rellena. */
  company_website?: string
  source_path?: string
  source_campaign?: string
  source_item?: string
  source_referrer?: string
  source_utm_source?: string
  source_utm_medium?: string
  source_utm_term?: string
  source_utm_content?: string
  consent_given?: boolean
  consent_text_version?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type EmailData = { nombre: string; poblacion: string; email: string; telefono: string; descripcion: string }

function buildText(d: EmailData, serviceLabel: string): string {
  return [
    'Nueva solicitud de presupuesto — Arquelia',
    '',
    `Servicio: ${serviceLabel}`,
    `Nombre: ${d.nombre}`,
    `Población: ${d.poblacion || '—'}`,
    `Email: ${d.email}`,
    `Teléfono: ${d.telefono}`,
    '',
    'Descripción del proyecto:',
    d.descripcion || '(sin descripción)',
  ].join('\n')
}

// Plantilla HTML del correo — pensada para que el equipo de Arquelia la vea
// bien en Gmail/Apple Mail/Outlook: tablas (no flex/grid, Outlook de
// escritorio las ignora), estilos en línea (muchos clientes recortan
// <style>), sin fuentes externas (no se cargan de forma fiable en email).
function buildHtml(d: EmailData, serviceLabel: string): string {
  const nombre = escapeHtml(d.nombre)
  const poblacion = escapeHtml(d.poblacion || '—')
  const email = escapeHtml(d.email)
  const telefono = escapeHtml(d.telefono)
  const descripcion = escapeHtml(d.descripcion || '(sin descripción)').replace(/\n/g, '<br>')
  const serviceLabelSafe = escapeHtml(serviceLabel)

  const font =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  const row = (label: string, valueHtml: string) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e6e5e3;font:500 11px/1 ${font};letter-spacing:.08em;text-transform:uppercase;color:#8c8b87;width:120px;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #e6e5e3;font:400 15px/1.5 ${font};color:#0e0e0e;">
        ${valueHtml}
      </td>
    </tr>`

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Cabecera -->
          <tr>
            <td style="background:#0e0e0e;padding:28px 40px;text-align:center;">
              <div style="font:700 20px/1 ${font};letter-spacing:.22em;color:#ffffff;">ARQUELIA</div>
              <div style="height:2px;width:36px;background:#d4af37;margin:14px auto 0;"></div>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:40px;">
              <div style="font:600 11px/1 ${font};letter-spacing:.14em;text-transform:uppercase;color:#b8952e;margin-bottom:10px;">
                Nueva solicitud de presupuesto
              </div>
              <div style="font:700 26px/1.25 ${font};color:#0e0e0e;margin-bottom:8px;">
                ${nombre}
              </div>
              <div style="display:inline-block;background:#fffbf2;border:1px solid #e3c65f;color:#9a7b22;font:600 12px/1 ${font};letter-spacing:.04em;padding:8px 14px;border-radius:999px;margin-bottom:28px;">
                ${serviceLabelSafe}
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${row('Email', `<a href="mailto:${email}" style="color:#0e0e0e;text-decoration:underline;">${email}</a>`)}
                ${row('Teléfono', `<a href="tel:${telefono.replace(/\s+/g, '')}" style="color:#0e0e0e;text-decoration:underline;">${telefono}</a>`)}
                ${row('Población', poblacion)}
              </table>

              <div style="font:500 11px/1 ${font};letter-spacing:.08em;text-transform:uppercase;color:#8c8b87;margin:28px 0 10px;">
                Descripción del proyecto
              </div>
              <div style="background:#fafaf9;border:1px solid #e6e5e3;border-radius:8px;padding:18px 20px;font:400 15px/1.65 ${font};color:#242424;">
                ${descripcion}
              </div>

            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#fafaf9;padding:18px 40px;text-align:center;font:400 11px/1.5 ${font};color:#8c8b87;">
              Arquelia · P&nbsp;&amp;&nbsp;B Cornellà Construcciones, S.L.<br>
              Enviado automáticamente desde el formulario de arquelia.es
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface LeadRow {
  company_id: string | null
  name: string
  email: string
  phone: string
  message: string
  source_path: string | null
  source_campaign: string | null
  source_item: string | null
  source_referrer: string | null
  source_utm_source: string | null
  source_utm_medium: string | null
  source_utm_term: string | null
  source_utm_content: string | null
  consent_given: boolean
  consent_at: string | null
  consent_text_version: string | null
  consent_source: string | null
}

// Devuelve si se ha guardado. Nunca lanza: un fallo aquí no debe impedir el
// envío del email (ni al revés).
async function saveLead(lead: LeadRow): Promise<boolean> {
  if (!lead.company_id) {
    console.error('[lead] falta company_id — solicitud sin guardar en la bandeja')
    return false
  }
  try {
    // company_id debe existir: evita meter solicitudes en la bandeja de otra
    // empresa con un id inventado.
    const { data: company } = await withTimeout(
      supabase.from('companies').select('id').eq('id', lead.company_id).maybeSingle(),
      5000
    )
    if (!company) {
      console.error('[lead] company_id desconocido', lead.company_id)
      return false
    }
    const { error } = await withTimeout(
      supabase.from('lead').insert({
        ...lead,
        name: lead.name.slice(0, LEAD_MAX.name),
        email: lead.email.slice(0, LEAD_MAX.email),
        phone: lead.phone.slice(0, LEAD_MAX.phone),
        message: lead.message.slice(0, LEAD_MAX.message),
      }),
      5000
    )
    if (error) {
      console.error('[lead] insert failed', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[lead] error guardando', err)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: ContactPayload
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Bad request')
    body = parsed as ContactPayload
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!COMPANY_ID || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(COMPANY_ID)) {
    return Response.json({ error: 'Company not configured' }, { status: 503, headers: corsHeaders })
  }
  if (body.company_id !== COMPANY_ID) {
    return Response.json({ error: 'Bad request' }, { status: 400, headers: corsHeaders })
  }

  // Trampa anti-bots: se responde 200 para que el bot crea que ha funcionado
  // y no reintente, y no se envía ni guarda nada.
  if (clean(body.company_website, 200)) {
    return new Response(JSON.stringify({ success: true, lead_saved: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const nombre = clean(body.nombre, LEAD_MAX.name) ?? ''
  const email = clean(body.email, LEAD_MAX.email) ?? ''
  const telefono = clean(body.telefono, LEAD_MAX.phone) ?? ''
  const poblacion = clean(body.poblacion, 200) ?? ''
  const descripcion = clean(body.descripcion, LEAD_MAX.message) ?? ''
  const servicio = clean(body.servicio, 40)

  // El cliente ya valida esto, pero el servidor nunca se fía de eso solo:
  // es la última barrera antes de gastar una petición real a Resend.
  if (!nombre || (!email && !telefono) || (email && !EMAIL_RE.test(email)) || (telefono && telefono.replace(/\D/g, '').length < 9)) {
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { data: crm, error } = await withTimeout(supabase.from('company_modules')
      .select('is_enabled').eq('company_id', COMPANY_ID).eq('module_key', 'crm').maybeSingle(), 5000)
    if (error || !crm?.is_enabled) {
      return Response.json({ error: 'Requests unavailable' }, { status: 503, headers: corsHeaders })
    }
  } catch {
    return Response.json({ error: 'Requests unavailable' }, { status: 503, headers: corsHeaders })
  }
  const RESEND_ARQUELIA_API_KEY = Deno.env.get('RESEND_ARQUELIA_API_KEY')

  const serviceLabel = (servicio && SERVICE_LABELS[servicio]) || 'Sin especificar'
  const data = { servicio, nombre, poblacion, email, telefono, descripcion }
  const consentVersion = clean(body.consent_text_version, 80)
  const consentGiven = body.consent_given === true && Boolean(consentVersion)

  // La bandeja no tiene columnas de servicio ni población: van al principio
  // del mensaje, para que se vean al abrir la solicitud en el panel.
  const leadSaved = await saveLead({
    company_id: COMPANY_ID,
    name: nombre,
    email,
    phone: telefono,
    message: [
      `Servicio: ${serviceLabel}`,
      poblacion ? `Población: ${poblacion}` : null,
      descripcion ? `\n${descripcion}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    source_path: clean(body.source_path, LEAD_MAX.path),
    source_campaign: clean(body.source_campaign, LEAD_MAX.campaign),
    source_item: clean(body.source_item, 200),
    source_referrer: clean(body.source_referrer, 500),
    source_utm_source: clean(body.source_utm_source, 120),
    source_utm_medium: clean(body.source_utm_medium, 120),
    source_utm_term: clean(body.source_utm_term, 120),
    source_utm_content: clean(body.source_utm_content, 120),
    consent_given: consentGiven,
    consent_at: consentGiven ? new Date().toISOString() : null,
    consent_text_version: consentGiven ? consentVersion : null,
    consent_source: consentGiven ? 'public_contact_form' : null,
  })

  let emailSent = false
  try {
    if (!RESEND_ARQUELIA_API_KEY) throw new Error('RESEND_ARQUELIA_API_KEY no configurada')
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_ARQUELIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        reply_to: email || undefined,
        subject: `Nueva solicitud de presupuesto — ${nombre} (${serviceLabel})`,
        html: buildHtml(data, serviceLabel),
        text: buildText(data, serviceLabel),
      }),
      signal: AbortSignal.timeout(7000),
    })

    if (resendResponse.ok) {
      emailSent = true
    } else {
      console.error('Resend API error:', await resendResponse.text())
    }
  } catch (err) {
    console.error('Error llamando a Resend:', err)
  }

  // Si falla uno de los dos pero el otro llegó, la solicitud no se pierde:
  // está en el email o en la bandeja, y al visitante se le dice que ha ido
  // bien. Sólo es error si no ha llegado a ninguno de los dos.
  if (!emailSent && !leadSaved) {
    return new Response(JSON.stringify({ error: 'Failed to send' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, lead_saved: leadSaved }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

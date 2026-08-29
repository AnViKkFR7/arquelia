// Envío del formulario de presupuesto a info@arquelia.es vía SMTP directo
// (nodemailer) contra el buzón de correo que ya existe en el hosting de
// arquelia.es — sin dar de alta ninguna cuenta nueva de terceros (nada de
// Resend/SendGrid/etc.). Necesita las credenciales SMTP que da el panel de
// ese hosting (cPanel, IONOS...), normalmente en "Cuentas de correo" →
// "Configurar cliente de correo" o similar.
// Vercel despliega esto como Serverless Function automáticamente al vivir
// en /api, sin configuración adicional (mismo patrón que api/track.ts).
import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST!
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587)
// true sólo para el puerto 465 (TLS implícito) — el 587 típico usa STARTTLS,
// que nodemailer negocia solo cuando `secure` es false.
const SMTP_SECURE = SMTP_PORT === 465
const SMTP_USER = process.env.SMTP_USER!
const SMTP_PASS = process.env.SMTP_PASS!
// Por defecto, el mismo buzón hace de remitente y de destinatario — es el
// caso normal para un formulario de contacto (te escribes a ti mismo desde
// tu propia cuenta autenticada). `SMTP_FROM` sólo hace falta si se quiere
// enviar desde una dirección distinta a la que autentica (p. ej. una
// dirección "no-reply@" aparte, si el hosting permite crearla).
const FROM = process.env.SMTP_FROM || SMTP_USER
const TO = 'info@arquelia.es'

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
})

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

export function buildText(d: Required<ContactPayload>, serviceLabel: string): string {
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
export function buildHtml(d: Required<ContactPayload>, serviceLabel: string): string {
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

              <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e6e5e3;font:400 13px/1.6 ${font};color:#6b6a66;">
                Responde directamente a este correo para escribir a ${nombre} — el "responder" ya va dirigido a su email.
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

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: ContactPayload
  try {
    body = (await req.json()) as ContactPayload
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const nombre = (body.nombre ?? '').trim()
  const email = (body.email ?? '').trim()
  const telefono = (body.telefono ?? '').trim()
  const poblacion = (body.poblacion ?? '').trim()
  const descripcion = (body.descripcion ?? '').trim()
  const servicio = body.servicio ?? null

  // El cliente ya valida esto, pero el servidor nunca se fía de eso solo:
  // es la última barrera antes de gastar una conexión SMTP real.
  if (!nombre || !EMAIL_RE.test(email) || telefono.replace(/\D/g, '').length < 9) {
    return new Response('Bad request', { status: 400 })
  }

  const serviceLabel = (servicio && SERVICE_LABELS[servicio]) || 'Sin especificar'
  const data = { servicio, nombre, poblacion, email, telefono, descripcion }

  try {
    await transporter.sendMail({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `Nueva solicitud de presupuesto — ${nombre} (${serviceLabel})`,
      html: buildHtml(data, serviceLabel),
      text: buildText(data, serviceLabel),
    })
  } catch {
    return new Response('Error', { status: 502 })
  }

  return new Response(null, { status: 204 })
}

export const config = { runtime: 'nodejs' }

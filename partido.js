// ═══════════════════════════════════════════════════════════
// Netlify Function: partido.js
// Almacena y recupera overrides de marcador por partido.
// GET  /.netlify/functions/partido?id=2026-06-11&numero=1
// POST /.netlify/functions/partido?id=2026-06-11&numero=1  { body: JSON }
// POST con body vacío {} → borra el override (limpia)
// ═══════════════════════════════════════════════════════════

const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const params  = event.queryStringParameters || {};
  const id      = (params.id     || '').trim();
  const numero  = (params.numero || '1').trim();
  const key     = id + '-' + numero;

  const cors = {
    'Content-Type':                  'application/json',
    'Access-Control-Allow-Origin':   '*',
    'Access-Control-Allow-Methods':  'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':  'Content-Type',
  };

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  let store;
  try {
    store = getStore('overrides');
  } catch(e) {
    // Blobs no disponible (entorno local) — devolver vacío
    return { statusCode: 200, headers: cors, body: '{}' };
  }

  // ── GET: devolver override almacenado ──────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get(key, { type: 'json' });
      return { statusCode: 200, headers: cors, body: JSON.stringify(data || {}) };
    } catch(e) {
      return { statusCode: 200, headers: cors, body: '{}' };
    }
  }

  // ── POST: guardar o borrar override ───────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (!body || Object.keys(body).length === 0) {
        // Body vacío = borrar override
        await store.delete(key);
        return { statusCode: 200, headers: cors, body: '{"ok":true,"cleared":true}' };
      }
      await store.set(key, JSON.stringify(body));
      return { statusCode: 200, headers: cors, body: '{"ok":true}' };
    } catch(e) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers: cors, body: '{"error":"Method not allowed"}' };
};

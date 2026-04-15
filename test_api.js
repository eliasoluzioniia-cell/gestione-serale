import fs from 'fs';
import path from 'path';

async function testPing() {
  console.log('--- Test Locale Supabase (Zero-Deps) ---');
  
  let url = '';
  let key = '';

  try {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        url = line.split('=')[1].trim();
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        key = line.split('=')[1].trim();
      }
    }
  } catch (err) {
    console.error('Errore nella lettura del file .env:', err.message);
    return;
  }

  console.log('URL target:', url);
  console.log('Lunghezza Chiave:', key ? key.length : 0);

  if (!url || !key) {
    console.error('Errore: Dati mancanti nel file .env');
    return;
  }

  const endpoint = url.replace(/\/+$/, '') + '/rest/v1/classi?select=id&limit=1';

  try {
    console.log('Invio richiesta a Supabase...');
    const res = await fetch(endpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    console.log('Stato risposta:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body risposta (estratti):', text.substring(0, 150));

    if (res.ok) {
      console.log('✅ TEST SUPERATO: La chiave nel file .env è corretta.');
    } else {
      console.error('❌ TEST FALLITO: Supabase ha risposto picche (401?).');
    }
  } catch (err) {
    console.error('❌ ERRORE DI RETE:', err.message);
  }
}

testPing();

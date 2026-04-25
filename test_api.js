import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function testQuery() {
  let url = '';
  let key = '';

  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
    }
  } catch (err) {
    return;
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('prove_di_realta')
    .select(`
      *,
      competenza:competenze(*),
      valutazioni(
        *,
        studente:studenti(*)
      ),
      materia:assegnazioni_cattedre!inner(
        id,
        classe_id,
        docente_id,
        materia:materie(*),
        docente:docenti(*)
      )
    `)
    .limit(1);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS, data length:', data?.length);
    if (data?.length) {
      console.log('Sample Data keys:', Object.keys(data[0]));
      console.log('Materia object:', !!data[0].materia);
    }
  }
}

testQuery();

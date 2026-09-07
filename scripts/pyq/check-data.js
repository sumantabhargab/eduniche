const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
for (const l of env.split('\n')) {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { count: total } = await supabase
    .from('pyq_questions')
    .select('*', { count: 'exact', head: true });

  const branches = ['CS', 'EC', 'EE', 'ME', 'CE'];
  for (const branch of branches) {
    const { count } = await supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('branch_code', branch);
    console.log(`${branch}: ${count} questions`);
  }

  console.log(`\nTotal in DB: ${total}`);

  // Check years
  const { data: years } = await supabase
    .from('pyq_questions')
    .select('year')
    .limit;

  const yearSet = [...new Set(years?.map(q => q.year).sort())];
  console.log('\nYears:', yearSet.slice(0, 10), '... total:', yearSet.length);
})();

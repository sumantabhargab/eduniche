const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function debug() {
  // Check pyq_questions count
  const { count } = await supabase.from("pyq_questions").select("*", { count: "exact", head: true });
  console.log("Total questions:", count);

  // Get one sample
  const { data, error } = await supabase.from("pyq_questions").select("*").limit(1);
  console.log("Error:", error?.message);
  if (data?.[0]) {
    console.log("Sample keys:", Object.keys(data[0]));
    console.log("Sample options:", JSON.stringify(data[0].options).substring(0, 200));
    console.log("Sample question_text:", (data[0].question_text || "").substring(0, 100));
    console.log("Sample question_html:", (data[0].question_html || "").substring(0, 100));
  }

  // Check pyq_subjects
  const { data: subjects } = await supabase.from("pyq_subjects").select("*").limit(5);
  console.log("\nSubjects:", subjects?.map(s => ({ name: s.subject_name, branch: s.branch_id })));

  // Check pyq_branches
  const { data: branches } = await supabase.from("pyq_branches").select("*");
  console.log("\nBranches:", branches?.map(b => b.branch_code));

  // Test the query pattern from the route
  const { data: qdata, error: qerror } = await supabase
    .from("pyq_questions")
    .select("*", { count: "exact" })
    .eq("is_duplicate", false)
    .eq("branch_code", "CS")
    .ilike("subject_name", "%Algorithms%")
    .limit(3);
  console.log("\nQuery test - Error:", qerror?.message);
  console.log("Query test - Count:", qdata?.length);
}

debug().catch(e => console.error(e));

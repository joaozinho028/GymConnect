const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// const supabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl =
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    .eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b25uYnNkZXp0dHlqdXNuZnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTIyNTMsImV4cCI6MjA3MjY2ODI1M30
    .Y4dRXzhLpiy1 -
  aCt2QS05bcDBha7M -
  zGJk9_9wx6tVs;

// const supabaseKey = process.env.SUPABASE_KEY;
const supabaseKey =
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    .eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b25uYnNkZXp0dHlqdXNuZnNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA5MjI1MywiZXhwIjoyMDcyNjY4MjUzfQ
    .evSwop1SAKdHLN_fD20djyPaCNohP - aYpEi99ajO0R0;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Conectado ao Supabase!");

module.exports = supabase;

PORT = 5000;

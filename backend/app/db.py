import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# NOTE: Ensure the 'complaints' table in Supabase has a 'ticket_number' column (type: text, unique). Add via Supabase dashboard if missing.

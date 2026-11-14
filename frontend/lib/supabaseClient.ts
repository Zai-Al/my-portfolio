// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { createClient } from "@supabase/supabase-js";

// Fall back to a placeholder URL so the client can be constructed at build
// time (e.g. static prerendering) even when env vars aren't injected yet -
// actual auth calls will simply fail until real values are set at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

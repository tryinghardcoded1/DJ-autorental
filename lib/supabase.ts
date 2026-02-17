
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Project credentials from user request
const SUPABASE_URL = "https://gkdogmbiucbbiiiypdyj.supabase.co";
// Note: Using the provided publishable key.
const SUPABASE_KEY = "sb_publishable_ZFfChnQBrst8ySzYjfc2MQ_KlrbLJ1P";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

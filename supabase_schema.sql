
-- TABLE 1: CONTACT FORM LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT,
    source TEXT DEFAULT 'website_contact'
);

-- TABLE 2: CAR RENTAL BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending',
    
    -- APPLICANT DETAILS
    full_name TEXT,
    email TEXT,
    phone TEXT,
    dob TEXT,
    address TEXT,
    license_number TEXT,
    
    -- VEHICLE SNAPSHOT
    vehicle_id TEXT,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year TEXT,
    vehicle_image_url TEXT,
    weekly_rent NUMERIC,
    
    -- RENTAL DETAILS
    rental_program TEXT,
    target_platform TEXT,
    usage_type TEXT,
    start_date TEXT,
    end_date TEXT,
    payment_method TEXT,
    
    -- INSURANCE & HISTORY
    has_insurance TEXT,
    insurance_company TEXT,
    policy_number TEXT,
    history_accidents TEXT,
    history_dui TEXT,
    history_suspension TEXT,
    
    -- SYSTEM METADATA
    user_id TEXT,
    source TEXT DEFAULT 'organic'
);

-- SECURITY POLICIES
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Enable insert for public leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for public bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Allow public reads (Note: Restrict this in production)
CREATE POLICY "Enable read for public leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable read for public bookings" ON bookings FOR SELECT USING (true);

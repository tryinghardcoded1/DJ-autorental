
-- 1. Create table for Contact Form Inquiries (Leads)
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

-- 2. Create table for Car Rental Applications (Bookings)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending',
    
    -- Applicant Personal Details
    full_name TEXT,
    email TEXT,
    phone TEXT,
    dob TEXT,
    address TEXT,
    license_number TEXT,
    
    -- Vehicle Details (Snapshot of vehicle at time of booking)
    vehicle_id TEXT,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year TEXT,
    vehicle_image_url TEXT,
    weekly_rent NUMERIC,
    
    -- Rental Specifics
    rental_program TEXT,
    target_platform TEXT,
    usage_type TEXT,
    start_date TEXT,
    end_date TEXT,
    payment_method TEXT,
    
    -- Insurance & History
    has_insurance TEXT,
    insurance_company TEXT,
    policy_number TEXT,
    history_accidents TEXT,
    history_dui TEXT,
    history_suspension TEXT,
    
    -- Metadata
    user_id TEXT, -- Link to Firebase Auth UID if exists
    source TEXT DEFAULT 'organic'
);

-- 3. Security Policies (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a form (Insert)
CREATE POLICY "Enable insert for public" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for public" ON bookings FOR INSERT WITH CHECK (true);

-- Allow reading data (Update this to restricted in production)
CREATE POLICY "Enable read for public" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable read for public" ON bookings FOR SELECT USING (true);

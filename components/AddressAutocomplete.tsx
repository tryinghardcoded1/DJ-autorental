import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressData {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (data: AddressData) => void;
  error?: string;
  placeholder?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChange,
  onSelect,
  error,
  placeholder
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 3 && isOpen) {
        setIsLoading(true);
        try {
          // Using OpenStreetMap Nominatim API (Free, requires User-Agent)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5&countrycodes=us`,
            {
                headers: {
                    "Accept-Language": "en-US"
                }
            }
          );
          const data = await response.json();
          setSuggestions(data);
        } catch (err) {
          console.error("Address fetch error:", err);
        } finally {
          setIsLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, isOpen]);

  const handleSelect = (item: any) => {
    const addr = item.address;
    
    // Construct street address
    let street = "";
    if (addr.house_number) street += addr.house_number + " ";
    if (addr.road) street += addr.road;
    
    // Fallback if specific fields aren't found
    const selectedData: AddressData = {
      address: street || item.display_name.split(',')[0],
      city: addr.city || addr.town || addr.village || addr.municipality || "",
      state: addr.state || "",
      zip: addr.postcode || ""
    };

    onSelect(selectedData);
    setIsOpen(false);
    onChange(selectedData.address); 
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <Loader2 className="animate-spin text-blue-500" size={18} />
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-3 transition-colors"
            >
              <MapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
              <div className="text-sm text-gray-700 leading-tight">
                {item.display_name}
              </div>
            </li>
          ))}
          <li className="px-2 py-1 bg-gray-50 text-[10px] text-gray-400 text-center">
            Powered by OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
};
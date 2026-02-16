import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';

const Tooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center ml-2 align-text-bottom"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent triggering label click on checkboxes
            setIsVisible(!isVisible);
        }}
        className="focus:outline-none"
      >
        <Info className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 leading-relaxed border border-slate-700 font-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  tooltip?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, tooltip, className, ...props }) => (
  <div className="w-full">
    <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {tooltip && <Tooltip text={tooltip} />}
    </div>
    <div className="relative">
        <input
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
            error ? 'border-red-500 bg-red-50 pr-10' : 'border-gray-300 bg-white'
        } ${className}`}
        {...props}
        />
        {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <XCircle className="h-5 w-5 text-red-500" />
            </div>
        )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

interface DateEntryProps {
    label: string;
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    error?: string;
    tooltip?: string;
}

export const DateEntry: React.FC<DateEntryProps> = ({ label, value, onChange, error, tooltip }) => {
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const yearSelectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (value && value.includes('-')) {
            const [vYear, vMonth, vDay] = value.split('-');
            setYear(vYear === '0000' ? '' : vYear || '');
            setMonth(vMonth || '');
            setDay(vDay || '');
        } else {
            setYear('');
            setMonth('');
            setDay('');
        }
    }, [value]);

    const handleUpdate = (newY: string, newM: string, newD: string) => {
        // Only trigger the parent onChange when all fields are selected to avoid partial/invalid dates
        if (newY && newM && newD) {
            onChange(`${newY}-${newM}-${newD}`);
        } else {
            // If any part is removed, clear the DOB in parent to reset age calculations
            onChange('');
        }
    };

    const months = [
        { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
        { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
        { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
        { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
    ];

    const days = Array.from({ length: 31 }, (_, i) => {
        const d = (i + 1).toString().padStart(2, '0');
        return { v: d, l: d };
    });

    const years = [];
    for (let y = 2005; y >= 1920; y--) {
        years.push(y.toString());
    }

    return (
        <div className="w-full">
            <div className="flex items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                {tooltip && <Tooltip text={tooltip} />}
            </div>
            <div className="flex gap-2">
                <div className="flex-[2] min-w-0">
                    <select
                        value={month}
                        onChange={(e) => {
                            setMonth(e.target.value);
                            handleUpdate(year, e.target.value, day);
                        }}
                        className={`w-full h-11 px-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                        <option value="">Month</option>
                        {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-0">
                    <select
                        value={day}
                        onChange={(e) => {
                            setDay(e.target.value);
                            handleUpdate(year, month, e.target.value);
                            if (e.target.value && month) {
                                yearSelectRef.current?.focus();
                            }
                        }}
                        className={`w-full h-11 px-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                        <option value="">Day</option>
                        {days.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-0">
                    <select
                        ref={yearSelectRef}
                        value={year}
                        onChange={(e) => {
                            const val = e.target.value;
                            setYear(val);
                            handleUpdate(val, month, day);
                        }}
                        className={`w-full h-11 px-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                        <option value="">Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  tooltip?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, tooltip, className, ...props }) => (
  <div className="w-full">
    <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {tooltip && <Tooltip text={tooltip} />}
    </div>
    <div className="relative">
      <select
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-all ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
    {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

interface FileUploadProps {
  label: string;
  description?: string;
  onChange: (file: File | null) => void;
  currentFile?: File | null;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
  tooltip?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
    label, 
    description,
    onChange, 
    currentFile, 
    accept = "image/jpeg,image/png,application/pdf", 
    maxSizeMB = 5,
    error,
    tooltip
}) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentFile && currentFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(currentFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File is too large. Max size is ${maxSizeMB}MB.`);
        return;
      }
      if (!accept.split(',').some(type => file.type.match(type.trim().replace('*', '.*')))) {
          alert(`Invalid file type. Please upload ${accept}`);
          return;
      }
      onChange(file);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-0.5">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {tooltip && <Tooltip text={tooltip} />}
      </div>
      {description && <p className="text-xs text-slate-500 mb-2 leading-relaxed">{description}</p>}
      <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all ${error ? 'border-red-400 bg-red-50' : currentFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-slate-50'}`}>
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
            {previewUrl ? (
                <div className="mb-2 relative w-full h-32 flex justify-center items-center">
                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-md shadow-sm" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                        <span className="bg-white bg-opacity-80 px-2 py-1 rounded text-xs text-gray-700 opacity-0 group-hover:opacity-100">Click to replace</span>
                    </div>
                </div>
            ) : currentFile ? (
                <div className="mb-2">
                    <FileText className="w-10 h-10 text-green-500 mx-auto mb-1" />
                </div>
            ) : (
                <Upload className={`w-8 h-8 mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            )}

            {currentFile ? (
                <div className="z-20">
                    <p className="text-sm font-medium text-green-700 truncate max-w-xs px-2">{currentFile.name}</p>
                    <p className="text-xs text-green-600 mt-1">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            ) : (
                <>
                    <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>Click to upload or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF (Max {maxSizeMB}MB)</p>
                </>
            )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string | React.ReactNode;
    error?: boolean;
    tooltip?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, error, tooltip, className, ...props }) => (
    <label className={`flex items-start space-x-3 cursor-pointer group p-2 rounded-md transition-colors ${error ? 'bg-red-50 ring-1 ring-red-200' : 'hover:bg-slate-50'}`}>
        <div className="relative flex items-center pt-0.5">
            <input 
                type="checkbox" 
                className={`peer h-5 w-5 cursor-pointer appearance-none rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 checked:border-blue-600 checked:bg-blue-600 focus:ring-blue-500'}`}
                {...props}
            />
             <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <div className={`text-sm select-none ${error ? 'text-red-800' : 'text-gray-700'}`}>
            <span className="inline-flex flex-wrap items-center">
                {label}
                {tooltip && <Tooltip text={tooltip} />}
            </span>
        </div>
    </label>
);
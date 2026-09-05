import { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import type { Player, Gender, Availability } from '../types';

interface Props {
  classId: string;
  onClose: () => void;
  onImport: (players: Omit<Player, 'id'>[]) => void;
}

export default function BulkImportModal({ onClose, onImport }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    if (!text.trim()) {
      setError('Please paste some data first.');
      return;
    }

    try {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const newPlayers: Omit<Player, 'id'>[] = [];

      lines.forEach((line, index) => {
        // Splitting by Tab (\t) handles direct copy-pastes from Excel/Google Sheets perfectly
        // Fallback to commas if someone exports a CSV
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        
        const cleanParts = parts.map(p => p.trim());

        // Parse Name (Column 1)
        const name = cleanParts[0];
        if (!name) return; // Skip empty rows

        // Parse Skill (Column 2) - Default to 5 if blank
        const skill = parseInt(cleanParts[1]) || 5;

        // Parse Compete (Column 3) - Default to 3 if blank
        const compete = parseInt(cleanParts[2]) || 3;

        // Parse Gender (Column 4) - Default to M
        const genderChar = cleanParts[3]?.toUpperCase() || 'M';
        const gender: Gender = genderChar.startsWith('F') ? 'F' : 'M';

        // Parse Grade (Column 5) - Treat as string to support "11", "Junior", etc.
        const grade = cleanParts[4] || '';

        // Parse Availability (Column 6) - Default to active
        let availability: Availability = 'active';
        const avString = (cleanParts[5] || '').toLowerCase();
        if (avString.includes('injur')) availability = 'injured';
        if (avString.includes('out')) availability = 'out';

        newPlayers.push({
          name,
          skill,
          compete,
          gender,
          grade,
          availability
        });
      });

      if (newPlayers.length === 0) {
        setError('Could not read any valid players from the text.');
        return;
      }

      onImport(newPlayers);
      onClose();
    } catch (err) {
      setError('Error parsing the data. Check the format and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between shrink-0">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Upload className="h-6 w-6 text-indigo-600" /> Bulk Import Roster
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 shrink-0 rounded-lg bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-900">
          <p className="font-bold mb-2">Paste directly from Excel or Google Sheets. The columns must be in this order:</p>
          <div className="flex gap-2 text-xs font-mono bg-white p-2 rounded border border-indigo-200 overflow-x-auto">
            <span className="font-bold">Name</span> | 
            <span className="text-slate-500">Skill(1-10)</span> | 
            <span className="text-slate-500">Compete(1-5)</span> | 
            <span className="text-slate-500">Gender(M/F)</span> | 
            <span className="text-purple-600 font-bold">Grade</span> | 
            <span className="text-slate-500">Availability</span>
          </div>
          <p className="mt-2 text-xs text-indigo-700 italic">Example: Aishwarya A. &nbsp;&nbsp; 5 &nbsp;&nbsp; 2 &nbsp;&nbsp; F &nbsp;&nbsp; 12 &nbsp;&nbsp; Active</p>
        </div>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Paste your spreadsheet rows here..."
          className="w-full flex-1 rounded-lg border border-slate-300 p-4 font-mono text-sm shadow-inner focus:border-indigo-500 focus:outline-none min-h-[200px]"
        />

        {/* Error Message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-red-600 shrink-0">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 transition"
          >
            <Upload className="h-5 w-5" /> Import Roster
          </button>
        </div>
        
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Camera, Upload, Link as LinkIcon, Trash2, X, Check, User, Sparkles } from 'lucide-react';
import { StaffMember } from '../types';

interface StaffPhotoModalProps {
  staff: StaffMember;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (staffId: string, photoUrl: string | undefined) => void;
}

const PRESET_AVATARS = [
  { label: 'Nurse Sarah', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250', gender: 'F' },
  { label: 'Dr. Michael', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250', gender: 'M' },
  { label: 'Nurse Elena', url: 'https://images.unsplash.com/photo-1594824813566-832f91a511ef?auto=format&fit=crop&q=80&w=250', gender: 'F' },
  { label: 'Nurse Alex', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250', gender: 'M' },
  { label: 'Nurse Grace', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=250', gender: 'F' },
  { label: 'Dr. David', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250', gender: 'M' },
  { label: 'Specialist Anna', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250', gender: 'F' },
  { label: 'Clinician James', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250', gender: 'M' },
];

export const StaffPhotoModal: React.FC<StaffPhotoModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSavePhoto
}) => {
  const [photoInput, setPhotoInput] = useState<string>(staff.photoUrl || '');
  const [selectedTab, setSelectedTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [urlDraft, setUrlDraft] = useState<string>(staff.photoUrl || '');
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        setPhotoInput(base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const finalUrl = photoInput.trim() ? photoInput.trim() : undefined;
    onSavePhoto(staff.id, finalUrl);
    onClose();
  };

  const handleRemovePhoto = () => {
    setPhotoInput('');
    setUrlDraft('');
    onSavePhoto(staff.id, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Camera size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">NS Photo Manager</h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md uppercase">
                  {staff.isHa ? 'MSA' : 'SN'}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                  NS Authorized
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                Staff: <span className="font-bold text-slate-800">{staff.name || `Staff ${staff.id}`}</span> ({staff.id}) • {staff.isHa ? 'Medical Service Aid (MSA)' : 'Staff Nurse (SN)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* NS Authorization Notice */}
        <div className="px-3.5 py-2 bg-indigo-50/80 border border-indigo-200/70 rounded-2xl text-[11px] text-indigo-900 flex items-center gap-2 font-medium">
          <Sparkles size={14} className="text-indigo-600 shrink-0" />
          <span>Only Nurse Supervisors (NS) are authorized to upload, update, or remove personal photos for SN &amp; MSA personnel.</span>
        </div>

        {/* Current Photo Preview */}
        <div className="flex flex-col items-center justify-center space-y-3 py-2 bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
          <div className="relative group">
            {photoInput ? (
              <img
                src={photoInput}
                alt={staff.name}
                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center font-black text-2xl shadow-inner border-4 border-white ring-2 ring-indigo-200">
                {staff.name ? staff.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
            )}
            {photoInput && (
              <button
                type="button"
                onClick={() => setPhotoInput('')}
                className="absolute -top-1 -right-1 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition shadow-md"
                title="Clear current photo"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-slate-600">
            {photoInput ? 'Active Photo Selected' : 'No Personal Photo Set'}
          </span>
        </div>

        {/* Selection Tabs */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedTab('presets')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedTab === 'presets' ? 'bg-white text-indigo-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} />
              Presets
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('upload')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedTab === 'upload' ? 'bg-white text-indigo-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={14} />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('url')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedTab === 'url' ? 'bg-white text-indigo-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon size={14} />
              URL
            </button>
          </div>

          {/* TAB 1: Preset Avatars */}
          {selectedTab === 'presets' && (
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Select from Curated Healthcare Professional Avatars
              </span>
              <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoInput(preset.url)}
                    className={`flex flex-col items-center p-2 rounded-2xl border transition-all relative ${
                      photoInput === preset.url
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center mt-1">
                      {preset.label}
                    </span>
                    {photoInput === preset.url && (
                      <span className="absolute top-1 right-1 p-0.5 bg-indigo-600 text-white rounded-full">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Direct File Upload */}
          {selectedTab === 'upload' && (
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Upload Image File from Device
              </span>
              <label className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl cursor-pointer transition-colors group">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-2">
                  <Upload size={24} />
                </div>
                <span className="text-xs font-black text-slate-800">Click or Drag Image File Here</span>
                <span className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, WebP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadError && (
                <p className="text-xs font-bold text-rose-600 text-center">{uploadError}</p>
              )}
            </div>
          )}

          {/* TAB 3: Image Web URL */}
          {selectedTab === 'url' && (
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Enter Direct Image Web URL
              </span>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <LinkIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (urlDraft.trim()) {
                      setPhotoInput(urlDraft.trim());
                    }
                  }}
                  className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
                >
                  Apply Photo URL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {photoInput ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Remove Photo
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
            >
              <Check size={16} />
              Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

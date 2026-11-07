import React, { useState } from 'react';
import { 
  CreditCard, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  X, 
  Check, 
  Sparkles, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Eye,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { StaffMember } from '../types';

interface StaffLicenseCardModalProps {
  staff: StaffMember;
  isOpen: boolean;
  onClose: () => void;
  onSaveLicenseCard?: (staffId: string, licenseCardUrl: string | undefined) => void;
  isReadOnly?: boolean;
}

const PRESET_SAMPLE_CARDS = [
  {
    label: 'NHRA Practice Card (Sample 1)',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=1000&auto=format&fit=crop&q=80',
    type: 'Nursing Council / NHRA'
  },
  {
    label: 'Clinical Credential Card (Sample 2)',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1000&auto=format&fit=crop&q=80',
    type: 'Ministry of Health Accreditation'
  },
  {
    label: 'Professional ID License (Sample 3)',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1000&auto=format&fit=crop&q=80',
    type: 'Registered Specialist Card'
  }
];

export const StaffLicenseCardModal: React.FC<StaffLicenseCardModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSaveLicenseCard,
  isReadOnly = false
}) => {
  const [cardInput, setCardInput] = useState<string>(staff.licenseCardUrl || '');
  const [selectedTab, setSelectedTab] = useState<'view' | 'upload' | 'url' | 'samples'>(
    staff.licenseCardUrl ? 'view' : (isReadOnly ? 'view' : 'upload')
  );
  const [urlDraft, setUrlDraft] = useState<string>(staff.licenseCardUrl || '');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Zoom & image view state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) { // 8MB limit
      setUploadError('File size exceeds 8MB limit. Please upload a compressed photo.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        setCardInput(base64Url);
        setSelectedTab('view');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!onSaveLicenseCard) return;
    const finalUrl = cardInput.trim() ? cardInput.trim() : undefined;
    onSaveLicenseCard(staff.id, finalUrl);
    onClose();
  };

  const handleRemoveCard = () => {
    if (!onSaveLicenseCard) return;
    setCardInput('');
    setUrlDraft('');
    onSaveLicenseCard(staff.id, undefined);
    onClose();
  };

  const handleDownload = () => {
    if (!cardInput) return;
    const a = document.createElement('a');
    a.href = cardInput;
    a.download = `LicenseCard_${staff.id}_${staff.licenseNumber || 'Card'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isExpired = staff.licenseExpiry ? new Date(staff.licenseExpiry) < new Date() : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {isReadOnly ? 'Official License Card' : 'Official License Card Manager'}
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">
                  {staff.isHa ? 'MSA' : 'SN'}
                </span>
                {!isReadOnly && (
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                    <ShieldCheck size={11} /> NS Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Staff: <span className="font-bold text-slate-900">{staff.name || `Staff ${staff.id}`}</span> ({staff.id}) • {staff.jobTitle || (staff.isHa ? 'Medical Service Aid' : 'Staff Nurse')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition shrink-0"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* License Metadata Summary Pill */}
        <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Licence No.</span>
              <span className="font-mono font-bold text-slate-900">
                {staff.licenseNumber || 'Not Registered'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Expiry Date</span>
              <span className={`font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                {staff.licenseExpiry || 'N/A'} {isExpired && '(EXPIRED)'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Verification</span>
              <span className={`font-bold flex items-center gap-1 ${cardInput ? 'text-emerald-700' : 'text-amber-700'}`}>
                <Check size={13} className={cardInput ? 'text-emerald-600' : 'text-amber-500'} />
                {cardInput ? 'Card Picture Verified' : 'No Picture Attached'}
              </span>
            </div>
          </div>

          {cardInput && (
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
              title="Download card image"
            >
              <Download size={13} /> Download
            </button>
          )}
        </div>

        {/* Tabs - Only shown when editable */}
        {!isReadOnly && (
          <div className="flex border-b border-slate-100 gap-2 mt-4 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTab('view')}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                selectedTab === 'view'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye size={14} /> Card Viewer
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('upload')}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                selectedTab === 'upload'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload size={14} /> Upload Picture
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('url')}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                selectedTab === 'url'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon size={14} /> Direct URL
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('samples')}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                selectedTab === 'samples'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={14} /> Samples
            </button>
          </div>
        )}

        {/* Tab Contents / Card Viewer Area */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[260px] flex flex-col justify-center items-center">
          {uploadError && (
            <div className="w-full mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* VIEW TAB (or default in read-only mode) */}
          {(selectedTab === 'view' || isReadOnly) && (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              {cardInput ? (
                <div className="w-full flex flex-col items-center">
                  {/* Controls Bar */}
                  <div className="flex items-center gap-2 mb-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                      className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs transition"
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-slate-600 px-1">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                      className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs transition"
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs transition"
                      title="Rotate 90°"
                    >
                      <RotateCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-50 rounded-lg text-slate-700 text-[10px] font-bold shadow-xs transition"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Card Image Display Area */}
                  <div className="relative w-full max-w-lg aspect-[1.586/1] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200 flex items-center justify-center p-2">
                    <div 
                      className="transition-transform duration-200 ease-out origin-center flex items-center justify-center w-full h-full"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                      }}
                    >
                      <img
                        src={cardInput}
                        alt={`License Card for ${staff.name}`}
                        className="max-h-full max-w-full object-contain rounded-lg"
                        onError={() => setUploadError('Failed to load the license card image. The link or file may be invalid.')}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/70 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                    <CreditCard size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">No License Card Picture Uploaded</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {isReadOnly 
                        ? "An official digital photo of your license card has not been uploaded yet. Nurse Supervisor (NS) manages official license documents." 
                        : "Upload a photo of the staff member's official practicing license or NHRA accreditation card."}
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setSelectedTab('upload')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5"
                    >
                      <Upload size={14} /> Upload Picture Now
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* UPLOAD TAB */}
          {!isReadOnly && selectedTab === 'upload' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <label className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-3 shadow-xs">
                  <Upload size={26} />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  Click or drag photo of license card
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WebP (Max: 8MB)
                </span>
                <span className="mt-3 px-3 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-bold shadow-xs">
                  Browse Files
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* URL TAB */}
          {!isReadOnly && selectedTab === 'url' && (
            <div className="w-full space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Direct Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="https://hospital.org/licenses/card_123.jpg"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (urlDraft.trim()) {
                      setCardInput(urlDraft.trim());
                      setSelectedTab('view');
                    }
                  }}
                  disabled={!urlDraft.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Preview Image
                </button>
              </div>
            </div>
          )}

          {/* SAMPLE PRESETS TAB */}
          {!isReadOnly && selectedTab === 'samples' && (
            <div className="w-full space-y-3">
              <p className="text-xs text-slate-500">
                Choose a sample high-resolution license card template for preview and demonstration:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRESET_SAMPLE_CARDS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCardInput(preset.url);
                      setSelectedTab('view');
                    }}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition group flex flex-col space-y-2"
                  >
                    <div className="aspect-[1.58/1] rounded-xl overflow-hidden bg-slate-200">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">{preset.label}</div>
                      <div className="text-[10px] text-slate-500">{preset.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            {!isReadOnly && cardInput && (
              <button
                type="button"
                onClick={handleRemoveCard}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Remove Card Picture
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && onSaveLicenseCard && (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
              >
                <Check size={15} /> Save License Card
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffLicenseCardModal;

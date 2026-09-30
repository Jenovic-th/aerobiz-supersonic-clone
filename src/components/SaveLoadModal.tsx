import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types/game';
import {
  SaveMetadata,
  getSaveMetadata,
  saveGameToLocalStorage,
  loadGameFromLocalStorage,
  exportSaveFile,
} from '../utils/saveLoad';
import {
  X,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Calendar,
  Plane,
  Trophy,
  DollarSign,
  AlertCircle,
  RefreshCw,
  FileJson,
  AlertTriangle,
  Database,
  ArrowRight,
} from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onQuickSave: () => void;
  onLoadSave: (isAutoSave: boolean) => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onQuickSave,
  onLoadSave,
  onExportSave,
  onImportSave,
}) => {
  const [manualMeta, setManualMeta] = useState<SaveMetadata | null>(null);
  const [autoMeta, setAutoMeta] = useState<SaveMetadata | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const [confirmLoadType, setConfirmLoadType] = useState<'manual' | 'auto' | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playerAirline = gameState.airlines.find((a) => a.isHuman) || gameState.airlines[0];
  const playerRoutes = gameState.routes.filter((r) => r.airlineId === playerAirline.id);

  const refreshMetadata = () => {
    setManualMeta(getSaveMetadata(false));
    setAutoMeta(getSaveMetadata(true));
  };

  useEffect(() => {
    if (isOpen) {
      refreshMetadata();
      setStatusMessage(null);
      setConfirmLoadType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualQuickSave = () => {
    const success = saveGameToLocalStorage(gameState, false);
    if (success) {
      refreshMetadata();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      const now = new Date().toLocaleTimeString();
      setStatusMessage({
        text: 'บันทึกข้อมูลเกมลงใน Local Storage สำเร็จแล้วเมื่อ ' + now,
        type: 'success',
      });
      onQuickSave();
    } else {
      setStatusMessage({
        text: 'ไม่สามารถบันทึกเกมลงใน Local Storage ได้ กรุณาลองใช้ Export Save File',
        type: 'error',
      });
    }
  };

  const handleExecuteLoad = (isAutoSave: boolean) => {
    onLoadSave(isAutoSave);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportSave(file);
      onClose();
    }
    e.target.value = '';
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'ไม่มีข้อมูล';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-100 flex items-center gap-2">
                <span>Save & Load Game Data</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                  SYSTEM
                </span>
              </h2>
              <div className="text-xs text-slate-400 font-mono">
                บันทึกเซฟลงเบราว์เซอร์ โหลดเซฟย้อนหลัง และสำรองไฟล์เซฟ (.json)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-sm text-slate-200">
          {/* Active Session Status Card */}
          <div className="p-4 bg-slate-950/80 border border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">สถานะเกมปัจจุบัน:</span>
              <strong className="text-white text-sm">{playerAirline.name}</strong>
            </div>
            <div className="flex items-center gap-3 text-slate-300 flex-wrap">
              <span>{gameState.currentYear} Q{gameState.currentQuarter}</span>
              <span>•</span>
              <span className="text-sky-300 font-bold">Turn {gameState.turnNumber}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">${playerAirline.cashK.toLocaleString()}K</span>
              <span>•</span>
              <span>{playerRoutes.length} Routes</span>
            </div>
          </div>

          {/* Status / Feedback Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/90 border-rose-400 text-rose-200'
                  : 'bg-sky-950/90 border-sky-400 text-sky-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Quick Save Slot */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <Save className="w-4 h-4 text-emerald-400" />
                <span>ช่องเซฟด่วน (Quick Save - Local Storage)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Browser Storage</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">บันทึกล่าสุด:</span>
                <span className="text-emerald-300 font-bold">
                  {manualMeta ? formatTimestamp(manualMeta.savedAt) : 'ยังไม่มีข้อมูลเซฟด่วน'}
                </span>
              </div>
              {manualMeta && (
                <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                  <span>
                    {manualMeta.airlineName} • {manualMeta.currentYear} Q{manualMeta.currentQuarter} (Turn {manualMeta.turnNumber})
                  </span>
                  <span className="text-emerald-400">${manualMeta.cashK.toLocaleString()}K Cash</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleManualQuickSave}
                className={`px-4 py-2.5 rounded-xl font-black text-xs md:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg ${
                  justSaved
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 scale-98'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{justSaved ? '✓ บันทึกสำเร็จแล้ว!' : '💾 บันทึกเซฟทันที (Quick Save)'}</span>
              </button>

              {manualMeta && (
                <>
                  {confirmLoadType === 'manual' ? (
                    <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500 p-1.5 rounded-xl">
                      <span className="text-xs text-rose-200 font-bold px-1">ยืนยันโหลดเซฟ?</span>
                      <button
                        type="button"
                        onClick={() => handleExecuteLoad(false)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        ยืนยัน
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmLoadType(null)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmLoadType('manual')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl font-bold text-xs md:text-sm border border-slate-600 transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>โหลดเซฟด่วนนี้</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Section 2: Auto-Save Slot */}
          {autoMeta && (
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>เซฟอัตโนมัติประจำไตรมาส (Auto-Save)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Quarter Checkpoint</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">เซฟอัตโนมัติเมื่อ:</span>
                  <span className="text-sky-300 font-bold">{formatTimestamp(autoMeta.savedAt)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                  <span>
                    {autoMeta.airlineName} • {autoMeta.currentYear} Q{autoMeta.currentQuarter} (Turn {autoMeta.turnNumber})
                  </span>
                  <span className="text-emerald-400">${autoMeta.cashK.toLocaleString()}K Cash</span>
                </div>
              </div>

              <div className="pt-1">
                {confirmLoadType === 'auto' ? (
                  <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500 p-1.5 rounded-xl w-fit">
                    <span className="text-xs text-rose-200 font-bold px-1">ยืนยันโหลด Auto-Save?</span>
                    <button
                      type="button"
                      onClick={() => handleExecuteLoad(true)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      ยืนยัน
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLoadType(null)}
                      className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmLoadType('auto')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs md:text-sm border border-slate-600 transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>โหลดข้อมูล Auto-Save ล่าสุด</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 3: File Backup (Export / Import JSON) */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <FileJson className="w-4 h-4 text-purple-400" />
                <span>สำรองข้อมูลเป็นไฟล์ลงเครื่อง (PC File Backup)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">.json format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export */}
              <button
                type="button"
                onClick={() => {
                  onExportSave();
                  setStatusMessage({
                    text: 'ส่งออกไฟล์เซฟ (.json) ไปยังเครื่อง PC สำเร็จแล้ว',
                    type: 'info',
                  });
                }}
                className="p-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-xl text-left transition cursor-pointer group space-y-1"
              >
                <div className="flex items-center gap-2 font-bold text-sky-300 text-xs md:text-sm">
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
                  <span>Export Save File (.json)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ดาวน์โหลดไฟล์เซฟเก็บไว้บนคอมพิวเตอร์ นำไปเล่นต่อที่เครื่องอื่นได้
                </p>
              </button>

              {/* Import */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-xl text-left transition cursor-pointer group space-y-1"
              >
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs md:text-sm">
                  <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition" />
                  <span>Import Save File (.json)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  เลือกไฟล์เซฟจากเครื่อง PC เพื่อกู้คืนข้อมูลเกมกลับมาเล่นต่อ
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

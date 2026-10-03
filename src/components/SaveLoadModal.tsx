import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types/game';
import {
  SaveMetadata,
  getSaveMetadata,
  saveGameToLocalStorage,
  loadGameFromLocalStorage,
  exportSaveFile,
} from '../utils/saveLoad';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useI18n } from '../utils/i18n';
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
  gameState?: GameState | null;
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
  useEscapeKey(onClose, isOpen);
  const { t, lang } = useI18n();
  const isTh = lang === 'th';

  const [manualMeta, setManualMeta] = useState<SaveMetadata | null>(null);
  const [autoMeta, setAutoMeta] = useState<SaveMetadata | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const [confirmLoadType, setConfirmLoadType] = useState<'manual' | 'auto' | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playerAirline = gameState
    ? gameState.airlines.find((a) => a.isHuman) || gameState.airlines[0]
    : null;
  const playerRoutes =
    gameState && playerAirline
      ? gameState.routes.filter((r) => r.airlineId === playerAirline.id)
      : [];

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
    if (!gameState) {
      setStatusMessage({
        text: isTh
          ? 'ไม่มีเกมที่กำลังเล่นอยู่ กรุณาเริ่มเกมใหม่หรือโหลดเกมก่อนทำการบันทึก'
          : 'No active game in progress. Start a new game or load a save first.',
        type: 'error',
      });
      return;
    }
    const success = saveGameToLocalStorage(gameState, false);
    if (success) {
      refreshMetadata();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      const now = new Date().toLocaleTimeString();
      setStatusMessage({
        text: isTh
          ? `บันทึกข้อมูลเกมลงใน Local Storage สำเร็จแล้วเมื่อ ${now}`
          : `Saved game to Local Storage successfully at ${now}`,
        type: 'success',
      });
      onQuickSave();
    } else {
      setStatusMessage({
        text: isTh
          ? 'ไม่สามารถบันทึกเกมลงใน Local Storage ได้ กรุณาลองใช้ Export Save File'
          : 'Failed to save to Local Storage. Please use Export Save File.',
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
    if (!isoString) return isTh ? 'ไม่มีข้อมูล' : 'No data';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700 w-[92vw] max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400">
              <Database className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2.5">
                <span>{t.saveLoad.title}</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-bold">
                  SYSTEM
                </span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
                {t.saveLoad.subtitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title={`${t.common.close} (Esc)`}
            data-testid="modal-close-header-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-200">
          {/* Active Session Status Card */}
          {gameState && playerAirline ? (
            <div className="p-4 bg-slate-950/80 border border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs sm:text-sm shadow-inner">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">{t.saveLoad.activeGame}</span>
                <strong className="text-white text-base">{playerAirline.name}</strong>
              </div>
              <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                <span>
                  {gameState.currentYear} Q{gameState.currentQuarter}
                </span>
                <span>•</span>
                <span className="text-sky-300 font-bold">Turn {gameState.turnNumber}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">
                  ${playerAirline.cashK.toLocaleString()}K {t.common.cash}
                </span>
                <span>•</span>
                <span>{playerRoutes.length} {t.common.route}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-2.5 font-mono text-xs sm:text-sm text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                {t.saveLoad.noActiveGame}
              </span>
            </div>
          )}

          {/* Status / Feedback Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold transition ${
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

          {/* Side-by-Side Quick Save & Auto Save on Widescreen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 1: Quick Save Slot */}
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>{t.saveLoad.quickSaveTitle}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{isTh ? 'บันทึกในเบราว์เซอร์' : 'Browser Storage'}</span>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">{t.saveLoad.latestSave}</span>
                    <span className="text-emerald-300 font-bold">
                      {manualMeta ? formatTimestamp(manualMeta.savedAt) : t.saveLoad.noQuickSave}
                    </span>
                  </div>
                  {manualMeta && (
                    <div className="flex justify-between items-center text-slate-400 text-xs pt-1.5 border-t border-slate-800/80">
                      <span>
                        {manualMeta.airlineName} • {manualMeta.currentYear} Q{manualMeta.currentQuarter} (Turn {manualMeta.turnNumber})
                      </span>
                      <span className="text-emerald-400 font-bold">${manualMeta.cashK.toLocaleString()}K {t.common.cash}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleManualQuickSave}
                  disabled={!gameState}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg ${
                    !gameState
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
                      : justSaved
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 scale-98'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                  }`}
                  title={!gameState ? (isTh ? 'ไม่มีเกมที่กำลังเล่นอยู่' : 'No active game running') : t.saveLoad.saveQuickBtn}
                >
                  <Save className="w-4 h-4" />
                  <span>{justSaved ? t.saveLoad.saveSuccess : t.saveLoad.saveQuickBtn}</span>
                </button>

                {manualMeta && (
                  <>
                    {confirmLoadType === 'manual' ? (
                      <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500 p-1.5 rounded-xl">
                        <span className="text-xs text-rose-200 font-bold px-1">{t.saveLoad.confirmLoad}</span>
                        <button
                          type="button"
                          onClick={() => handleExecuteLoad(false)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {t.common.confirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmLoadType(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmLoadType('manual')}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl font-bold text-xs sm:text-sm border border-slate-600 transition cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.saveLoad.loadQuickBtn}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Auto-Save Slot */}
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>{t.saveLoad.autoSaveTitle}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{isTh ? 'บันทึกสิ้นไตรมาส' : 'Quarter Checkpoint'}</span>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">{t.saveLoad.latestSave}</span>
                    <span className="text-sky-300 font-bold">
                      {autoMeta ? formatTimestamp(autoMeta.savedAt) : t.saveLoad.noAutoSave}
                    </span>
                  </div>
                  {autoMeta && (
                    <div className="flex justify-between items-center text-slate-400 text-xs pt-1.5 border-t border-slate-800/80">
                      <span>
                        {autoMeta.airlineName} • {autoMeta.currentYear} Q{autoMeta.currentQuarter} (Turn {autoMeta.turnNumber})
                      </span>
                      <span className="text-emerald-400 font-bold">${autoMeta.cashK.toLocaleString()}K {t.common.cash}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                {autoMeta && (
                  <>
                    {confirmLoadType === 'auto' ? (
                      <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500 p-1.5 rounded-xl w-fit">
                        <span className="text-xs text-rose-200 font-bold px-1">{t.saveLoad.confirmLoadAuto}</span>
                        <button
                          type="button"
                          onClick={() => handleExecuteLoad(true)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {t.common.confirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmLoadType(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmLoadType('auto')}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs sm:text-sm border border-slate-600 transition cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.saveLoad.loadAutoBtn}</span>
                      </button>
                    )}
                  </>
                )}
                {!autoMeta && (
                  <span className="text-xs text-slate-500 italic font-mono">
                    {t.saveLoad.autoSaveNote}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: File Backup (Export / Import JSON) */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <FileJson className="w-4 h-4 text-purple-400" />
                <span>{t.saveLoad.exportTitle}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">.json format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export */}
              <button
                type="button"
                onClick={() => {
                  if (!gameState) return;
                  onExportSave();
                  setStatusMessage({
                    text: isTh
                      ? 'ส่งออกไฟล์บันทึกเกม (.json) เรียบร้อยแล้ว'
                      : 'Save file (.json) exported successfully to your computer.',
                    type: 'info',
                  });
                }}
                disabled={!gameState}
                className={`p-3 bg-slate-950/80 border rounded-xl text-left transition space-y-1 ${
                  !gameState
                    ? 'border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    : 'hover:bg-slate-950 border-slate-700 hover:border-sky-500 cursor-pointer group'
                }`}
                title={!gameState ? (isTh ? 'ไม่มีเกมที่กำลังเล่นอยู่' : 'No active game running') : t.saveLoad.exportBtn}
              >
                <div className="flex items-center gap-2 font-bold text-sky-300 text-xs md:text-sm">
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
                  <span>{t.saveLoad.exportBtn}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.saveLoad.exportDesc}
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
                  <span>{t.saveLoad.importBtn}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.saveLoad.importDesc}
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
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer border border-slate-700 shadow flex items-center gap-2 active:scale-95"
            data-testid="modal-close-footer-btn"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>{t.common.close}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

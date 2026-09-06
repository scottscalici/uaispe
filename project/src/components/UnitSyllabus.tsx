import { ClipboardList, CalendarDays, MessageCircle, Globe2 } from 'lucide-react';
import type { SyllabusData } from '../types';

interface Props {
  syllabus: SyllabusData;
  unitName: string;
}

export default function UnitSyllabus({ syllabus, unitName }: Props) {
  const getLogoUrl = (file?: string) => file && !file.startsWith('http') ? `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${unitName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}/${file}` : file;

  // Pre-calculate section visibility to prevent rendering empty detail blocks
  const hasRulesOrEquip = !!(syllabus.setup_image?.file || (syllabus.equipment && syllabus.equipment.length > 0) || (syllabus.rules && syllabus.rules.length > 0));
  const hasGlobalVocab = !!(syllabus.key_terms && syllabus.key_terms.length > 0);
  const hasGlobalConnections = !!(syllabus.global_connections?.description || syllabus.global_connections?.highlights_video);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {syllabus.header_image && (
        <div className="h-64 w-full overflow-hidden rounded-xl bg-slate-900 shadow-md">
          <img src={syllabus.header_image} alt="Unit Header" className="h-full w-full object-cover opacity-80" />
        </div>
      )}
      
      <h1 className="text-center text-4xl font-black text-blue-700">{syllabus.display_name || "Unit Plan"}</h1>

      {hasRulesOrEquip && (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open>
          <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
            <span className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-blue-600" /> Game Rules & Equipment</span>
            <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="border-t border-slate-100 p-5 space-y-6">
            {syllabus.setup_image?.file && (
              <div className="mb-4">
                <img src={getLogoUrl(syllabus.setup_image.file)} alt="Setup" className="mx-auto max-h-64 rounded-lg border border-slate-200 object-contain shadow-sm" />
                {syllabus.setup_image.caption && <p className="mt-2 text-center text-sm italic text-slate-500">{syllabus.setup_image.caption}</p>}
              </div>
            )}
            {syllabus.equipment && syllabus.equipment.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">Equipment</h3>
                <ul className="list-disc space-y-1 pl-5 text-slate-600">
                  {syllabus.equipment.map((e, i) => (
                    <li key={i}><strong>{e.name}</strong> {e.caption && `- ${e.caption}`}</li>
                  ))}
                </ul>
              </div>
            )}
            {syllabus.rules && syllabus.rules.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">Rules</h3>
                <ul className="list-disc space-y-1 pl-5 text-slate-600">
                  {syllabus.rules.map((r, i) => r.trim() && <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open={!hasRulesOrEquip}>
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-600" /> Daily Plan</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-5 space-y-6">
          {(syllabus.unit_plan || []).map((day, i) => (
            <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
              <h3 className="text-lg font-bold text-slate-800">Day {day.day}{day.topic ? `: ${day.topic}` : ''}</h3>
              {day.skills && <p className="text-sm font-semibold text-slate-500 mb-3">Skills: {day.skills}</p>}

              {/* Day-Specific Discussion */}
              {day.discussion && day.discussion.trim() !== '' && (
                <div className="mb-3 rounded-md bg-amber-50 p-3 border border-amber-200 shadow-sm">
                  <strong className="text-amber-800 text-sm mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" /> Discussion Prompt:
                  </strong>
                  <p className="text-sm text-amber-900">{day.discussion}</p>
                </div>
              )}

              {/* Day-Specific Vocabulary */}
              {day.key_terms && day.key_terms.length > 0 && (
                <div className="mb-3 rounded-md border border-slate-200 p-3 bg-slate-50">
                  <strong className="text-slate-700 text-sm block mb-2">Daily Vocabulary:</strong>
                  <ul className="space-y-1.5 list-disc pl-5 text-sm text-slate-600">
                    {day.key_terms.map((term, tIdx) => term.term && (
                      <li key={tIdx}><strong>{term.term}</strong>: {term.definition}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Daily Activities */}
              {day.activities && day.activities.length > 0 && (
                <div className="space-y-3 mt-3">
                  {day.activities.map((act, j) => act.name && (
                    <div key={j} className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                      <strong className="text-blue-800 block mb-1">{act.name}</strong>
                      {act.overview && <p className="text-sm text-slate-700 mb-2">{act.overview}</p>}
                      {act.rules && act.rules.some(r => r.trim() !== '') && (
                        <ul className="list-disc pl-5 text-sm text-slate-600">
                          {act.rules.map((r, k) => r.trim() !== '' && <li key={k}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!syllabus.unit_plan || syllabus.unit_plan.length === 0) && (
            <div className="text-center text-slate-400 italic py-4">No daily plans configured.</div>
          )}
        </div>
      </details>

      {/* Global Unit Vocab Fallback (Hides if empty) */}
      {hasGlobalVocab && (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
            <span className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-600" /> Unit Vocabulary</span>
            <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="border-t border-slate-100 p-5 space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-800">Key Terms</h3>
              <ul className="space-y-2 text-slate-600 list-disc pl-5">
                {syllabus.key_terms!.map((v, i) => v.term && <li key={i}><strong>{v.term}</strong>: {v.definition}</li>)}
              </ul>
            </div>
          </div>
        </details>
      )}
      
      {/* Global Connections (Hides if empty) */}
      {hasGlobalConnections && (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
            <span className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-blue-600" /> Global Connections</span>
            <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="border-t border-slate-100 p-5 space-y-4 text-slate-700">
            {syllabus.global_connections?.description && <p>{syllabus.global_connections.description}</p>}
            {syllabus.global_connections?.highlights_video && (
              <a href={syllabus.global_connections.highlights_video} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
                Watch Highlights Video ➔
              </a>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
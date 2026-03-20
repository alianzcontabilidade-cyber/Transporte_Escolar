import { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { maskPhone, maskPlate } from '../lib/utils';

type EntityType =
  | 'school' | 'academicYear' | 'classGrade' | 'subject'
  | 'teacher' | 'class' | 'student' | 'driver'
  | 'vehicle' | 'route' | 'stop';

interface QuickAddModalProps {
  entityType: EntityType;
  municipalityId: number;
  onClose: () => void;
  onSuccess: (newEntity: any) => void;
  prefilledData?: any;
}

const ENTITY_LABELS: Record<EntityType, string> = {
  school: 'Escola',
  academicYear: 'Ano Letivo',
  classGrade: 'Série/Etapa',
  subject: 'Disciplina',
  teacher: 'Professor(a)',
  class: 'Turma',
  student: 'Aluno(a)',
  driver: 'Motorista',
  vehicle: 'Veículo',
  route: 'Rota',
  stop: 'Parada',
};

const SCHOOL_TYPES = [
  { value: 'infantil', label: 'Educação Infantil' },
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'tecnico', label: 'Ensino Técnico' },
  { value: 'especial', label: 'Educação Especial' },
];

const GRADE_LEVELS = [
  { value: 'creche', label: 'Creche' },
  { value: 'pre_escola', label: 'Pré-Escola' },
  { value: 'fundamental_1', label: 'Fundamental I' },
  { value: 'fundamental_2', label: 'Fundamental II' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'eja', label: 'EJA' },
  { value: 'tecnico', label: 'Técnico' },
];

const SHIFTS = [
  { value: 'morning', label: 'Matutino' },
  { value: 'afternoon', label: 'Vespertino' },
  { value: 'evening', label: 'Noturno' },
];

const SHIFTS_WITH_FULL = [
  ...SHIFTS,
  { value: 'full_time', label: 'Integral' },
];

export default function QuickAddModal({ entityType, municipalityId, onClose, onSuccess, prefilledData }: QuickAddModalProps) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lookup data for selects
  const [schools, setSchools] = useState<any[]>([]);
  const [classGrades, setClassGrades] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Initialize form with prefilled data
  useEffect(() => {
    const defaults = getDefaultValues(entityType);
    setForm({ ...defaults, ...(prefilledData || {}) });
  }, [entityType, prefilledData]);

  // Load lookup data when needed
  useEffect(() => {
    const needsSchools = ['class', 'student', 'route'].includes(entityType);
    const needsGrades = entityType === 'class';
    const needsAcademicYears = entityType === 'class';
    const needsTeachers = entityType === 'class';

    if (needsSchools) {
      api.schools.list({ municipalityId }).then((d: any) => setSchools(d || [])).catch(() => {});
    }
    if (needsGrades) {
      api.classGrades.list({ municipalityId }).then((d: any) => setClassGrades(d || [])).catch(() => {});
    }
    if (needsAcademicYears) {
      api.academicYears.list({ municipalityId }).then((d: any) => setAcademicYears(d || [])).catch(() => {});
    }
    if (needsTeachers) {
      api.teachers.list({ municipalityId }).then((d: any) => {
        const mapped = (d || []).map((t: any) => ({ id: t.user?.id || t.teacher?.userId, name: t.user?.name || t.teacher?.name || '' }));
        setTeachers(mapped);
      }).catch(() => {});
    }
  }, [entityType, municipalityId]);

  function getDefaultValues(type: EntityType): Record<string, any> {
    switch (type) {
      case 'school': return { name: '', code: '', type: '', phone: '', email: '', directorName: '' };
      case 'academicYear': return { year: new Date().getFullYear(), name: `Ano Letivo ${new Date().getFullYear()}`, startDate: '', endDate: '' };
      case 'classGrade': return { name: '', level: 'fundamental_1' };
      case 'subject': return { name: '', code: '' };
      case 'teacher': return { name: '', email: '', phone: '' };
      case 'class': return { schoolId: '', academicYearId: '', classGradeId: '', name: '', shift: 'morning', teacherUserId: '' };
      case 'student': return { name: '', schoolId: '', birthDate: '', grade: '', classRoom: '', shift: '', enrollment: '' };
      case 'driver': return { name: '', phone: '', cnhCategory: '', cnhExpiry: '' };
      case 'vehicle': return { plate: '', nickname: '', model: '', year: '', capacity: '' };
      case 'route': return { name: '', code: '', schoolId: '', description: '' };
      case 'stop': return { name: '', address: '', latitude: '', longitude: '', orderIndex: 1, routeId: '' };
      default: return {};
    }
  }

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      const payload = buildPayload(entityType, form, municipalityId);
      const result = await callCreateApi(entityType, payload);

      // Build entity data to return
      const entityData = {
        ...result,
        id: result?.id || result?.teacherId || result?.userId,
        name: form.name || form.nickname || form.plate || '',
      };

      onSuccess(entityData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function buildPayload(type: EntityType, data: Record<string, any>, munId: number): any {
    const base: any = { municipalityId: munId };

    switch (type) {
      case 'school':
        return { ...base, name: data.name.trim(), code: data.code || undefined, type: data.type || undefined, phone: data.phone || undefined, email: data.email || undefined, directorName: data.directorName || undefined };

      case 'academicYear':
        return { ...base, year: Number(data.year), name: data.name.trim(), startDate: data.startDate, endDate: data.endDate };

      case 'classGrade':
        return { ...base, name: data.name.trim(), level: data.level };

      case 'subject':
        return { ...base, name: data.name.trim(), code: data.code || undefined };

      case 'teacher':
        return { ...base, name: data.name.trim(), email: data.email || undefined, phone: data.phone || undefined };

      case 'class':
        return {
          ...base,
          schoolId: Number(data.schoolId),
          academicYearId: Number(data.academicYearId),
          classGradeId: Number(data.classGradeId),
          name: data.name.trim(),
          shift: data.shift || undefined,
          teacherUserId: data.teacherUserId ? Number(data.teacherUserId) : undefined,
        };

      case 'student':
        return {
          ...base,
          name: data.name.trim(),
          schoolId: data.schoolId ? Number(data.schoolId) : undefined,
          birthDate: data.birthDate || undefined,
          grade: data.grade || undefined,
          classRoom: data.classRoom || undefined,
          shift: data.shift || undefined,
          enrollment: data.enrollment || undefined,
        };

      case 'driver':
        return { ...base, name: data.name.trim(), phone: data.phone || undefined, cnhCategory: data.cnhCategory || undefined, cnhExpiry: data.cnhExpiry || undefined };

      case 'vehicle':
        return {
          ...base,
          plate: data.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
          nickname: data.nickname || undefined,
          model: data.model || undefined,
          year: data.year ? Number(data.year) : undefined,
          capacity: data.capacity ? Number(data.capacity) : undefined,
        };

      case 'route':
        return { ...base, name: data.name.trim(), code: data.code || undefined, schoolId: data.schoolId ? Number(data.schoolId) : undefined, description: data.description || undefined };

      case 'stop':
        return {
          routeId: Number(data.routeId),
          name: data.name.trim(),
          address: data.address || undefined,
          latitude: data.latitude ? Number(data.latitude) : 0,
          longitude: data.longitude ? Number(data.longitude) : 0,
          orderIndex: Number(data.orderIndex) || 1,
          estimatedArrivalMinutes: data.estimatedTime ? Number(data.estimatedTime) : undefined,
        };

      default:
        return base;
    }
  }

  async function callCreateApi(type: EntityType, payload: any): Promise<any> {
    switch (type) {
      case 'school': return api.schools.create(payload);
      case 'academicYear': return api.academicYears.create(payload);
      case 'classGrade': return api.classGrades.create(payload);
      case 'subject': return api.subjects.create(payload);
      case 'teacher': return api.teachers.create(payload);
      case 'class': return api.classes.create(payload);
      case 'student': return api.students.create(payload);
      case 'driver': return api.drivers.create(payload);
      case 'vehicle': return api.vehicles.create(payload);
      case 'route': return api.routes.create(payload);
      case 'stop': return api.stops.create(payload);
      default: throw new Error('Tipo de entidade desconhecido');
    }
  }

  function isValid(): boolean {
    switch (entityType) {
      case 'school': return form.name?.trim()?.length >= 3;
      case 'academicYear': return !!form.year && form.name?.trim()?.length >= 3 && !!form.startDate && !!form.endDate;
      case 'classGrade': return form.name?.trim()?.length >= 2 && !!form.level;
      case 'subject': return form.name?.trim()?.length >= 2;
      case 'teacher': return form.name?.trim()?.length >= 3;
      case 'class': return !!form.schoolId && !!form.academicYearId && !!form.classGradeId && form.name?.trim()?.length >= 1;
      case 'student': return form.name?.trim()?.length >= 2;
      case 'driver': return form.name?.trim()?.length >= 2;
      case 'vehicle': return form.plate?.replace(/[^A-Za-z0-9]/g, '')?.length >= 7;
      case 'route': return form.name?.trim()?.length >= 3;
      case 'stop': return form.name?.trim()?.length >= 2 && !!form.routeId;
      default: return false;
    }
  }

  function renderFields() {
    switch (entityType) {
      case 'school':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Nome da escola" span2 />
            <Field label="Código INEP" value={form.code} onChange={v => set('code', v)} placeholder="Ex: 17000001" />
            <SelectField label="Tipo" value={form.type} onChange={v => set('type', v)} options={SCHOOL_TYPES} placeholder="Selecione..." />
            <Field label="Telefone" value={form.phone} onChange={v => set('phone', maskPhone(v))} placeholder="(00) 00000-0000" />
            <Field label="E-mail" value={form.email} onChange={v => set('email', v)} placeholder="escola@email.com" type="email" />
            <Field label="Diretor(a)" value={form.directorName} onChange={v => set('directorName', v)} placeholder="Nome do diretor(a)" span2 />
          </>
        );

      case 'academicYear':
        return (
          <>
            <Field label="Ano *" value={String(form.year || '')} onChange={v => set('year', v)} placeholder="2026" type="number" />
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Ano Letivo 2026" />
            <Field label="Data Início *" value={form.startDate} onChange={v => set('startDate', v)} type="date" />
            <Field label="Data Fim *" value={form.endDate} onChange={v => set('endDate', v)} type="date" />
          </>
        );

      case 'classGrade':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Ex: 5º Ano" />
            <SelectField label="Nível *" value={form.level} onChange={v => set('level', v)} options={GRADE_LEVELS} />
          </>
        );

      case 'subject':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Ex: Matemática" />
            <Field label="Código" value={form.code} onChange={v => set('code', v)} placeholder="Ex: MAT" />
          </>
        );

      case 'teacher':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Nome completo" span2 />
            <Field label="E-mail" value={form.email} onChange={v => set('email', v)} placeholder="professor@email.com" type="email" />
            <Field label="Telefone" value={form.phone} onChange={v => set('phone', maskPhone(v))} placeholder="(00) 00000-0000" />
            <p className="col-span-2 text-xs text-gray-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              Uma senha temporária será gerada automaticamente para o login do professor.
            </p>
          </>
        );

      case 'class':
        return (
          <>
            <SelectField label="Escola *" value={form.schoolId} onChange={v => set('schoolId', v)}
              options={schools.map(s => ({ value: String(s.id), label: s.name }))} placeholder="Selecione a escola" />
            <SelectField label="Ano Letivo *" value={form.academicYearId} onChange={v => set('academicYearId', v)}
              options={academicYears.map(a => ({ value: String(a.id), label: a.name }))} placeholder="Selecione o ano" />
            <SelectField label="Série *" value={form.classGradeId} onChange={v => set('classGradeId', v)}
              options={classGrades.map(g => ({ value: String(g.id), label: g.name }))} placeholder="Selecione a série" />
            <Field label="Turma *" value={form.name} onChange={v => set('name', v)} placeholder="Ex: A, B, C" />
            <SelectField label="Turno" value={form.shift} onChange={v => set('shift', v)} options={SHIFTS_WITH_FULL} placeholder="Selecione..." />
            <SelectField label="Professor(a)" value={form.teacherUserId} onChange={v => set('teacherUserId', v)}
              options={teachers.map(t => ({ value: String(t.id), label: t.name }))} placeholder="Selecione..." />
          </>
        );

      case 'student':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Nome completo do aluno" span2 />
            <SelectField label="Escola" value={form.schoolId} onChange={v => set('schoolId', v)}
              options={schools.map(s => ({ value: String(s.id), label: s.name }))} placeholder="Selecione..." />
            <Field label="Data de Nascimento" value={form.birthDate} onChange={v => set('birthDate', v)} type="date" />
            <Field label="Série" value={form.grade} onChange={v => set('grade', v)} placeholder="Ex: 5º Ano" />
            <Field label="Turma" value={form.classRoom} onChange={v => set('classRoom', v)} placeholder="Ex: A" />
            <SelectField label="Turno" value={form.shift} onChange={v => set('shift', v)} options={SHIFTS} placeholder="Selecione..." />
            <Field label="Matrícula" value={form.enrollment} onChange={v => set('enrollment', v)} placeholder="Nº de matrícula" />
          </>
        );

      case 'driver':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Nome completo" span2 />
            <Field label="Telefone" value={form.phone} onChange={v => set('phone', maskPhone(v))} placeholder="(00) 00000-0000" />
            <Field label="Categoria CNH" value={form.cnhCategory} onChange={v => set('cnhCategory', v.toUpperCase())} placeholder="Ex: D, E" />
            <Field label="Validade CNH" value={form.cnhExpiry} onChange={v => set('cnhExpiry', v)} type="date" />
            <p className="col-span-2 text-xs text-gray-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              Uma senha temporária e e-mail serão gerados automaticamente para o login do motorista.
            </p>
          </>
        );

      case 'vehicle':
        return (
          <>
            <Field label="Placa *" value={form.plate} onChange={v => set('plate', maskPlate(v))} placeholder="ABC-1D23" />
            <Field label="Apelido" value={form.nickname} onChange={v => set('nickname', v)} placeholder="Ex: Escolar 01" />
            <Field label="Modelo" value={form.model} onChange={v => set('model', v)} placeholder="Ex: Micro-ônibus" />
            <Field label="Ano" value={form.year} onChange={v => set('year', v)} placeholder="Ex: 2023" type="number" />
            <Field label="Capacidade" value={form.capacity} onChange={v => set('capacity', v)} placeholder="Nº de lugares" type="number" />
          </>
        );

      case 'route':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Nome da rota" span2 />
            <Field label="Código" value={form.code} onChange={v => set('code', v)} placeholder="Ex: R001" />
            <SelectField label="Escola vinculada" value={form.schoolId} onChange={v => set('schoolId', v)}
              options={schools.map(s => ({ value: String(s.id), label: s.name }))} placeholder="Selecione..." />
            <Field label="Descrição" value={form.description} onChange={v => set('description', v)} placeholder="Descreva a rota..." span2 />
          </>
        );

      case 'stop':
        return (
          <>
            <Field label="Nome *" value={form.name} onChange={v => set('name', v)} placeholder="Nome da parada" span2 />
            <Field label="Endereço" value={form.address} onChange={v => set('address', v)} placeholder="Endereço completo" span2 />
            <Field label="Latitude" value={form.latitude} onChange={v => set('latitude', v)} placeholder="-10.1234" type="number" />
            <Field label="Longitude" value={form.longitude} onChange={v => set('longitude', v)} placeholder="-48.5678" type="number" />
            <Field label="Ordem" value={String(form.orderIndex || '')} onChange={v => set('orderIndex', v)} placeholder="1" type="number" />
            <Field label="Tempo estimado (min)" value={form.estimatedTime} onChange={v => set('estimatedTime', v)} placeholder="Ex: 15" type="number" />
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Plus size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastro Rápido</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ENTITY_LABELS[entityType]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {renderFields()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm" disabled={saving}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValid()}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Reusable sub-components ----

function Field({ label, value, onChange, placeholder, type = 'text', span2 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; span2?: boolean;
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        step={type === 'number' ? 'any' : undefined}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, span2 }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string; span2?: boolean;
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="label">{label}</label>
      <select className="input" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder || 'Selecione...'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

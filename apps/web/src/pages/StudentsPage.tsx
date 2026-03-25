import { useState, useRef } from 'react';
// xlsx importado dinamicamente quando necessário (evita crash no carregamento)
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, Camera, Pencil, Trash2, Search, Phone, MapPin, BookOpen, Navigation, Loader2, MessageCircle, Share2, CheckCircle, Eye, Heart, AlertTriangle, Upload, FileUp, Download, QrCode, GraduationCap, FileText, ClipboardList, Bus, School, History } from 'lucide-react';
import { printStudentQRCodes } from '../lib/qrcode';
import StudentDocumentsModal from '../components/StudentDocumentsModal';
import { QuickActionButton } from '../components/EntitySummaries';
import QuickAddModal from '../components/QuickAddModal';

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover"/> : <Camera size={24} className="text-gray-400"/>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => ref.current?.click()} className="text-xs text-accent-500 hover:underline">Arquivo</button>
        <span className="text-gray-300">|</span>
        <button type="button" onClick={() => cameraRef.current?.click()} className="text-xs text-accent-500 hover:underline">Câmera</button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result); }; rd.readAsDataURL(f); } }}/>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result); }; rd.readAsDataURL(f); } }}/>
    </div>
  );
}

const SHIFTS = [{ v:'morning', l:'Manha' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' },{ v:'full_time', l:'Integral' }];
const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const RACES = ['Branca','Negra','Parda','Amarela','Indígena','Não Declarada'];
const EDUCATION_LEVELS = ['Não Alfabetizado','Fundamental Incompleto','Fundamental Completo','Médio Incompleto','Médio Completo','Superior Incompleto','Superior Completo','Pós-Graduação'];
import { maskPhone, maskCPF } from '../lib/utils';
import { lookupCEP, maskCEP } from '../lib/cnpjCep';

const emptyForm = {
  name:'', enrollment:'', grade:'', className:'', shift:'morning', birthDate:'', school:'', routeId:'', photo:'',
  // Dados pessoais
  cpf:'', rg:'', rgOrgao:'', rgUf:'', rgDate:'', sex:'', race:'', nationality:'Brasileira', naturalness:'', naturalnessUf:'',
  nis:'', cartaoSus:'',
  // Certidao
  certidaoTipo:'nascimento', certidaoNumero:'', certidaoFolha:'', certidaoLivro:'', certidaoData:'', certidaoCartorio:'',
  // Endereco
  address:'', addressNumber:'', addressComplement:'', neighborhood:'', cep:'', city:'', state:'', zone:'urbana',
  phone:'', cellPhone:'',
  // Transporte
  needsTransport:false, transportType:'', transportDistance:'',
  // Programas sociais
  bolsaFamilia:false, bpc:false, peti:false, otherPrograms:'',
  // Necessidades especiais
  hasSpecialNeeds:false, specialNeedsNotes:'', deficiencyType:'', tgd:'', superdotacao:false, salaRecursos:false,
  acompanhamento:'', encaminhamento:'',
  // Saude
  bloodType:'', allergies:'', medications:'', healthNotes:'',
  // Contatos emergencia
  emergencyContact1Name:'', emergencyContact1Phone:'', emergencyContact1Relation:'',
  emergencyContact2Name:'', emergencyContact2Phone:'', emergencyContact2Relation:'',
  guardian1Name:'', guardian1Phone:'', guardian1Relation:'',
  guardian2Name:'', guardian2Phone:'', guardian2Relation:'',
  // Filiacao
  fatherName:'', fatherCpf:'', fatherRg:'', fatherRgOrgao:'', fatherRgUf:'', fatherPhone:'', fatherProfession:'', fatherWorkplace:'', fatherEducation:'',
  fatherNaturalness:'', fatherNaturalnessUf:'',
  motherName:'', motherCpf:'', motherRg:'', motherRgOrgao:'', motherRgUf:'', motherPhone:'', motherProfession:'', motherWorkplace:'', motherEducation:'',
  motherNaturalness:'', motherNaturalnessUf:'',
  familyIncome:'',
  // Procedencia
  previousSchool:'', previousSchoolType:'', previousSchoolZone:'', previousCity:'', previousState:'',
  enrollmentType:'novato', studentStatus:'',
  observations:'',
};
export default function StudentsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [tab, setTab] = useState<'dados'|'documentos'|'endereco'|'filiacao'|'saude'|'social'|'procedencia'|'historico'>('dados');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const [inviteStudent, setInviteStudent] = useState<any>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;
  // Histórico escolar anterior
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyForm, setHistoryForm] = useState<any>(null);
  const [historySaving, setHistorySaving] = useState(false);
  const { municipios: stdMunicipios, loading: stdMunLoading } = useMunicipios(form.state);
  const { municipios: natMunicipios, loading: natMunLoading } = useMunicipios(form.naturalnessUf);
  const { municipios: fatherMunicipios, loading: fatherMunLoading } = useMunicipios(form.fatherNaturalnessUf);
  const { municipios: motherMunicipios, loading: motherMunLoading } = useMunicipios(form.motherNaturalnessUf);
  const { municipios: prevMunicipios, loading: prevMunLoading } = useMunicipios(form.previousState);
  const { data: students, refetch } = useQuery(function() { return api.students.list({ municipalityId }); }, [municipalityId]);
  const { data: routes } = useQuery(function() { return api.routes.list({ municipalityId }); }, [municipalityId]);
  const { data: schoolsData, refetch: refetchSchools } = useQuery(function() { return api.schools.list({ municipalityId }); }, [municipalityId]);
  const { data: cartoriosData } = useQuery(function() { return api.students.listCartorios({ municipalityId }); }, [municipalityId]);
  const { data: requiredFieldsData } = useQuery(function() { return api.formConfig.list({ municipalityId, formType: 'student' }); }, [municipalityId]);
  const allCartorios: string[] = (cartoriosData as any) || [];
  const requiredFields = new Set(((requiredFieldsData as any) || []).map((f: any) => f.fieldName));
  const isRequired = (field: string) => requiredFields.has(field);
  const { mutate: create, loading: creating } = useMutation(api.students.create);
  const { mutate: update, loading: updating } = useMutation(api.students.update);
  const { mutate: remove } = useMutation(api.students.delete);

  const setField = function(k: string) { return function(e: any) { const v = e.target.type==='checkbox'?e.target.checked:e.target.value; setForm(function(f: any) { return {...f,[k]:v}; }); }; };
  const allStudents = (students as any)||[];
  const allRoutes = (routes as any)||[];
  const allSchools = (schoolsData as any)||[];
  const filtered = allStudents.filter(function(s: any) { const q = search.toLowerCase(); return s.name?.toLowerCase().includes(q)||(s.enrollment||'').includes(q)||(s.grade||'').toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportStudentsCSV = function() {
    if (!allStudents.length) return;
    const rows = allStudents.map(function(s: any) {
      return {
        nome: s.name || '',
        matricula: s.enrollment || '',
        serie: s.grade || '',
        turma: s.classRoom || s.className || '',
        turno: s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manha',
        escola: s.school || '',
        nascimento: s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '',
        endereco: s.address || '',
        contato1: s.emergencyContact1Name || '',
        tel1: s.emergencyContact1Phone || '',
        contato2: s.emergencyContact2Name || '',
        tel2: s.emergencyContact2Phone || '',
      };
    });
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map(function(r: any) { return keys.map(function(k) { return '"' + (r[k] || '') + '"'; }).join(';'); })].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alunos_netescol.csv';
    a.click();
  };

  const shiftLabel = function(v: string) { return SHIFTS.find(function(s) { return s.v===v; })?.l||v; };
  const routeName = function(id: string) { const r = allRoutes.find(function(x:any){return String(x.route?.id || x.id)===String(id);}); return r?.route?.name||''; };

  const appUrl = window.location.origin;

  const generateWhatsAppLink = function(student: any, phone?: string) {
    const enrollment = student.enrollment || '';
    const studentName = student.name || 'seu filho(a)';
    const msg = `Ola! Voce foi convidado(a) para acompanhar o transporte escolar de *${studentName}* pelo aplicativo *NetEscol*.

Para instalar:
1. Acesse: ${appUrl}/cadastro
2. Escolha "Sou Pai/Responsavel"
3. Use a matricula: *${enrollment}*
4. Crie sua conta e acompanhe em tempo real!

Apos abrir o link, adicione o app na tela inicial do celular para acesso rapido.`;

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const whatsPhone = cleanPhone.length === 11 ? '55' + cleanPhone : cleanPhone.length === 13 ? cleanPhone : '';
    const url = whatsPhone
      ? `https://wa.me/${whatsPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    return url;
  };

  const sendWhatsAppInvite = function(student: any, phone?: string) {
    const url = generateWhatsAppLink(student, phone);
    window.open(url, '_blank');
    setInviteSent(true);
    setTimeout(function() { setInviteSent(false); }, 3000);
  };

  const openNew = function() { setForm(emptyForm); setEditId(null); setTab('dados'); setFormErr(''); setShowModal(true); };
  const openEdit = function(s: any) {
    // Find routeId by matching routeName
    let foundRouteId = '';
    if (s.routeName) {
      const matchRoute = allRoutes.find(function(r: any) { return (r.route?.name || r.name) === s.routeName; });
      if (matchRoute) foundRouteId = String(matchRoute.route?.id || matchRoute.id);
    }
    setForm({
      ...emptyForm,
      ...s,
      photo: s.photoUrl || s.photo || '',
      className: s.classRoom || s.className || '',
      school: s.schoolId ? String(s.schoolId) : '',
      routeId: foundRouteId,
      guardian1Name: s.emergencyContact1Name || s.guardian1Name || '',
      guardian1Phone: s.emergencyContact1Phone || s.guardian1Phone || '',
      guardian1Relation: s.emergencyContact1Relation || s.guardian1Relation || '',
      guardian2Name: s.emergencyContact2Name || s.guardian2Name || '',
      guardian2Phone: s.emergencyContact2Phone || s.guardian2Phone || '',
      guardian2Relation: s.emergencyContact2Relation || s.guardian2Relation || '',
      birthDate: s.birthDate ? (typeof s.birthDate === 'string' ? s.birthDate.split('T')[0] : new Date(s.birthDate).toISOString().split('T')[0]) : '',
    });
    setEditId(s.id); setTab('dados'); setFormErr(''); setShowModal(true); setHistoryEntries([]); setHistoryForm(null); loadHistory(s.id);
  };

  const [viewStudent, setViewStudent] = useState<any>(null);
  const [showDocs, setShowDocs] = useState<any>(null);
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  const mapHeaderToField = function(header: string): string | null {
    const h = header.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['nome', 'name', 'nome do aluno', 'aluno', 'nome_aluno'].includes(h)) return 'name';
    if (['matricula', 'enrollment', 'numero matricula', 'mat', 'codigo'].includes(h)) return 'enrollment';
    if (['serie', 'grade', 'ano', 'ano/serie', 'serie/ano', 'ano_serie'].includes(h)) return 'grade';
    if (['turma', 'class', 'classname', 'classe', 'sala'].includes(h)) return 'className';
    if (['turno', 'shift', 'periodo'].includes(h)) return 'shift';
    if (['data nascimento', 'data_nasc', 'data de nascimento', 'birthdate', 'nascimento', 'dt_nasc', 'dt nascimento'].includes(h)) return 'birthDate';
    if (['cpf', 'cpf aluno', 'cpf_aluno'].includes(h)) return 'cpf';
    if (['rg', 'rg aluno'].includes(h)) return 'rg';
    if (['endereco', 'address', 'logradouro', 'rua', 'endereco aluno'].includes(h)) return 'address';
    if (['bairro', 'neighborhood'].includes(h)) return 'neighborhood';
    if (['cidade', 'city', 'municipio'].includes(h)) return 'city';
    if (['uf', 'estado', 'state', 'sigla_uf'].includes(h)) return 'state';
    if (['telefone', 'phone', 'tel', 'fone', 'celular', 'contato'].includes(h)) return 'phone';
    if (['nome do pai', 'pai', 'fathername', 'nome_pai', 'filiacao pai'].includes(h)) return 'fatherName';
    if (['nome da mae', 'mae', 'mothername', 'nome_mae', 'filiacao mae', 'nome da me'].includes(h)) return 'motherName';
    if (['sexo', 'sex', 'genero'].includes(h)) return 'sex';
    if (['raca', 'cor', 'raca/cor', 'cor/raca', 'race'].includes(h)) return 'race';
    if (['nis', 'numero nis'].includes(h)) return 'nis';
    if (['cep', 'codigo postal'].includes(h)) return 'cep';
    if (['observacao', 'observacoes', 'obs', 'observations'].includes(h)) return 'observations';
    return null;
  };

  const parseFileRows = function(headers: string[], dataRows: string[][]): any[] {
    const fieldMap: Record<number, string> = {};
    headers.forEach(function(h, idx) {
      const field = mapHeaderToField(h);
      if (field) fieldMap[idx] = field;
    });
    setColumnMapping(fieldMap);
    setFileHeaders(headers);
    const rows: any[] = [];
    for (const vals of dataRows) {
      const row: any = {};
      Object.entries(fieldMap).forEach(function([idxStr, field]) {
        const idx = parseInt(idxStr);
        if (vals[idx] !== undefined) row[field] = vals[idx]?.trim();
      });
      if (row.name && row.name.trim()) rows.push(row);
    }
    return rows;
  };

  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [importSchoolId, setImportSchoolId] = useState<string>('');
  const [rawDataRows, setRawDataRows] = useState<string[][]>([]);

  const handleFileUpload = function(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = async function(ev) {
        try {
          const XLSX = await import('xlsx');
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (jsonData.length < 2) { setImportResult('Arquivo vazio ou sem dados'); return; }
          const headers = jsonData[0].map(function(h: any) { return String(h); });
          const dataRows = jsonData.slice(1).filter(function(r: any[]) { return r.some(function(c) { return String(c).trim(); }); })
            .map(function(r: any[]) { return r.map(function(c: any) { return String(c); }); });
          setRawDataRows(dataRows);
          const rows = parseFileRows(headers, dataRows);
          setCsvData(rows);
          setImportResult('');
        } catch (err: any) {
          setImportResult('Erro ao ler arquivo Excel: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = function(ev) {
        const text = ev.target?.result as string;
        const lines = text.split('\n').filter(function(l) { return l.trim(); });
        if (lines.length < 2) { setImportResult('Arquivo vazio ou sem dados'); return; }
        const headers = lines[0].split(';').map(function(h) { return h.trim().replace(/"/g, ''); });
        const dataRows = lines.slice(1).map(function(l) { return l.split(';').map(function(v) { return v.trim().replace(/"/g, ''); }); })
          .filter(function(r) { return r.length >= 2; });
        setRawDataRows(dataRows);
        const rows = parseFileRows(headers, dataRows);
        setCsvData(rows);
        setImportResult('');
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const updateColumnMap = function(colIdx: number, field: string) {
    const newMap = { ...columnMapping };
    if (field === '') { delete newMap[colIdx]; } else { newMap[colIdx] = field; }
    setColumnMapping(newMap);
    // Re-parse rows with new mapping
    const rows: any[] = [];
    for (const vals of rawDataRows) {
      const row: any = {};
      Object.entries(newMap).forEach(function([idxStr, f]) {
        const idx = parseInt(idxStr);
        if (vals[idx] !== undefined) row[f] = vals[idx]?.trim();
      });
      if (row.name && row.name.trim()) rows.push(row);
    }
    setCsvData(rows);
  };

  const FIELD_OPTIONS = [
    { v: '', l: '-- Ignorar --' },
    { v: 'name', l: 'Nome' }, { v: 'enrollment', l: 'Matrícula' },
    { v: 'grade', l: 'Série' }, { v: 'className', l: 'Turma' },
    { v: 'shift', l: 'Turno' }, { v: 'birthDate', l: 'Data Nascimento' },
    { v: 'cpf', l: 'CPF' }, { v: 'rg', l: 'RG' },
    { v: 'address', l: 'Endereço' }, { v: 'neighborhood', l: 'Bairro' },
    { v: 'city', l: 'Cidade' }, { v: 'state', l: 'UF' },
    { v: 'cep', l: 'CEP' }, { v: 'phone', l: 'Telefone' },
    { v: 'fatherName', l: 'Nome do Pai' }, { v: 'motherName', l: 'Nome da Mãe' },
    { v: 'sex', l: 'Sexo' }, { v: 'race', l: 'Raça/Cor' },
    { v: 'nis', l: 'NIS' }, { v: 'observations', l: 'Observações' },
  ];

  const doImport = async function() {
    if (!csvData.length) return;
    setImporting(true);
    try {
      const schoolId = importSchoolId ? parseInt(importSchoolId) : (allSchools.length > 0 ? allSchools[0].id : undefined);
      const result: any = await api.students.bulkImport({
        municipalityId,
        schoolId: schoolId,
        students: csvData,
      });
      let msg = `Criados: ${result.created}`;
      if (result.skipped > 0) msg += ` | Duplicados ignorados: ${result.skipped}`;
      if (result.errors > 0) msg += ` | Erros: ${result.errors}`;
      setImportResult(msg);
      if (result.created > 0) refetch();
    } catch (err: any) {
      setImportResult('Erro na importação: ' + (err.message || 'erro desconhecido'));
    }
    setImporting(false);
  };

  const downloadTemplate = function() {
    const csv = 'nome;matricula;serie;turma;turno;nascimento\nJoao Silva;2024001;5 Ano;A;Manha;2014-03-15\nMaria Santos;2024002;3 Ano;B;Tarde;2016-07-22';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo_alunos.csv';
    a.click();
  };

  const FIELD_LABELS: Record<string, string> = {
    name:'Nome', cpf:'CPF', rg:'RG', sex:'Sexo', race:'Cor/Raça', birthDate:'Data Nascimento',
    nationality:'Nacionalidade', naturalness:'Naturalidade', nis:'NIS', cartaoSus:'Cartão SUS',
    certidaoNumero:'Certidão Número', address:'Endereço', cep:'CEP', neighborhood:'Bairro',
    city:'Cidade', state:'UF', phone:'Telefone', fatherName:'Nome do Pai', fatherCpf:'CPF do Pai',
    motherName:'Nome da Mãe', motherCpf:'CPF da Mãe', bloodType:'Tipo Sanguíneo',
  };

  const save = function() {
    if (!form.name) { setFormErr('Nome é obrigatório.'); return; }
    if (!form.school && !editId) { setFormErr('Escola é obrigatória.'); return; }
    // Validate configured required fields
    const missing: string[] = [];
    requiredFields.forEach((field: string) => {
      if (!form[field] && field !== 'name') missing.push(FIELD_LABELS[field] || field);
    });
    if (missing.length > 0) { setFormErr('Campos obrigatórios não preenchidos: ' + missing.join(', ')); return; }
    const payload: any = {
      municipalityId, name:form.name,
      schoolId:form.school?parseInt(form.school):undefined,
      enrollment:form.enrollment||undefined,
      grade:form.grade||undefined,
      classRoom:form.className||undefined,
      shift:form.shift||undefined,
      birthDate:form.birthDate||undefined,
      photoUrl:form.photo||undefined,
      routeId:form.routeId?parseInt(form.routeId):undefined,
      // Dados pessoais
      cpf:form.cpf||undefined,
      rg:form.rg||undefined, rgOrgao:form.rgOrgao||undefined, rgUf:form.rgUf||undefined, rgDate:form.rgDate||undefined,
      sex:form.sex||undefined, race:form.race||undefined,
      nationality:form.nationality||undefined, naturalness:form.naturalness||undefined, naturalnessUf:form.naturalnessUf||undefined,
      nis:form.nis||undefined, cartaoSus:form.cartaoSus||undefined,
      // Certidão
      certidaoTipo:form.certidaoTipo||undefined, certidaoNumero:form.certidaoNumero||undefined,
      certidaoFolha:form.certidaoFolha||undefined, certidaoLivro:form.certidaoLivro||undefined,
      certidaoData:form.certidaoData||undefined, certidaoCartorio:form.certidaoCartorio||undefined,
      // Endereço completo
      address:form.address||undefined, addressNumber:form.addressNumber||undefined,
      addressComplement:form.addressComplement||undefined, neighborhood:form.neighborhood||undefined,
      cep:form.cep||undefined, city:form.city||undefined, state:form.state||undefined, zone:form.zone||undefined,
      phone:form.phone||undefined, cellPhone:form.cellPhone||undefined,
      // Transporte
      needsTransport:form.needsTransport||false, transportType:form.transportType||undefined, transportDistance:form.transportDistance||undefined,
      // Programas sociais
      bolsaFamilia:form.bolsaFamilia||false, bpc:form.bpc||false, peti:form.peti||false, otherPrograms:form.otherPrograms||undefined,
      // Necessidades especiais
      hasSpecialNeeds:form.hasSpecialNeeds||false, specialNeedsNotes:form.specialNeedsNotes||undefined,
      deficiencyType:form.deficiencyType||undefined, tgd:form.tgd||undefined,
      superdotacao:form.superdotacao||false, salaRecursos:form.salaRecursos||false,
      acompanhamento:form.acompanhamento||undefined, encaminhamento:form.encaminhamento||undefined,
      // Saude
      bloodType:form.bloodType||undefined, allergies:form.allergies||undefined,
      medications:form.medications||undefined, healthNotes:form.healthNotes||undefined,
      // Contatos emergencia + Responsaveis (unificados)
      emergencyContact1Name:form.emergencyContact1Name||form.guardian1Name||undefined,
      emergencyContact1Phone:form.emergencyContact1Phone||form.guardian1Phone||undefined,
      emergencyContact1Relation:form.emergencyContact1Relation||form.guardian1Relation||undefined,
      emergencyContact2Name:form.emergencyContact2Name||form.guardian2Name||undefined,
      emergencyContact2Phone:form.emergencyContact2Phone||form.guardian2Phone||undefined,
      emergencyContact2Relation:form.emergencyContact2Relation||form.guardian2Relation||undefined,
      guardian1Name:form.guardian1Name||form.emergencyContact1Name||undefined,
      guardian1Phone:form.guardian1Phone||form.emergencyContact1Phone||undefined,
      guardian1Relation:form.guardian1Relation||form.emergencyContact1Relation||undefined,
      guardian2Name:form.guardian2Name||form.emergencyContact2Name||undefined,
      guardian2Phone:form.guardian2Phone||form.emergencyContact2Phone||undefined,
      guardian2Relation:form.guardian2Relation||form.emergencyContact2Relation||undefined,
      // Filiação - Pai
      fatherName:form.fatherName||undefined, fatherCpf:form.fatherCpf||undefined,
      fatherRg:form.fatherRg||undefined, fatherRgOrgao:form.fatherRgOrgao||undefined, fatherRgUf:form.fatherRgUf||undefined,
      fatherPhone:form.fatherPhone||undefined, fatherProfession:form.fatherProfession||undefined,
      fatherWorkplace:form.fatherWorkplace||undefined, fatherEducation:form.fatherEducation||undefined,
      fatherNaturalness:form.fatherNaturalness||undefined, fatherNaturalnessUf:form.fatherNaturalnessUf||undefined,
      // Filiação - Mãe
      motherName:form.motherName||undefined, motherCpf:form.motherCpf||undefined,
      motherRg:form.motherRg||undefined, motherRgOrgao:form.motherRgOrgao||undefined, motherRgUf:form.motherRgUf||undefined,
      motherPhone:form.motherPhone||undefined, motherProfession:form.motherProfession||undefined,
      motherWorkplace:form.motherWorkplace||undefined, motherEducation:form.motherEducation||undefined,
      motherNaturalness:form.motherNaturalness||undefined, motherNaturalnessUf:form.motherNaturalnessUf||undefined,
      // Renda
      familyIncome:form.familyIncome||undefined,
      // Procedência
      previousSchool:form.previousSchool||undefined, previousSchoolType:form.previousSchoolType||undefined,
      previousSchoolZone:form.previousSchoolZone||undefined, previousCity:form.previousCity||undefined,
      previousState:form.previousState||undefined, enrollmentType:form.enrollmentType||undefined,
      studentStatus:form.studentStatus||undefined,
      observations:form.observations||undefined,
    };
    if (editId!==null) {
      // Don't send grade/classRoom/shift - managed by enrollments
      delete payload.grade;
      delete payload.classRoom;
      delete payload.shift;
      update({id:editId,...payload},{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    } else {
      create(payload,{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    }
  };

  // Histórico escolar - CRUD
  const loadHistory = async function(studentId: number) {
    setHistoryLoading(true);
    try {
      const data = await api.studentHistory.list({ municipalityId, studentId });
      setHistoryEntries((data as any) || []);
    } catch { setHistoryEntries([]); }
    setHistoryLoading(false);
  };
  const emptyHistoryForm = { year: new Date().getFullYear() - 1, grade: '', schoolName: '', schoolCity: '', schoolState: '', schoolType: 'municipal', result: 'aprovado', observations: '' };
  const saveHistory = async function() {
    if (!editId || !historyForm) return;
    setHistorySaving(true);
    try {
      if (historyForm.id) {
        await api.studentHistory.update({ id: historyForm.id, year: historyForm.year, grade: historyForm.grade, schoolName: historyForm.schoolName, schoolCity: historyForm.schoolCity, schoolState: historyForm.schoolState, schoolType: historyForm.schoolType, result: historyForm.result, observations: historyForm.observations });
      } else {
        await api.studentHistory.create({ studentId: editId, year: historyForm.year, grade: historyForm.grade, schoolName: historyForm.schoolName, schoolCity: historyForm.schoolCity || undefined, schoolState: historyForm.schoolState || undefined, schoolType: historyForm.schoolType || undefined, result: historyForm.result || undefined, observations: historyForm.observations || undefined });
      }
      setHistoryForm(null);
      loadHistory(editId);
    } catch (e: any) { setFormErr(e?.message || 'Erro ao salvar histórico'); }
    setHistorySaving(false);
  };
  const deleteHistory = async function(id: number) {
    if (!editId) return;
    try {
      await api.studentHistory.delete({ id });
      loadHistory(editId);
    } catch (e: any) { setFormErr(e?.message || 'Erro ao excluir'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Alunos</h1><p className="text-gray-500">{allStudents.length} aluno(s)</p></div>
        <div className="flex gap-2"><button onClick={function(){printStudentQRCodes(allStudents, window.location.origin);}} className="btn-secondary flex items-center gap-2"><QrCode size={16}/> QR Codes</button><button onClick={exportStudentsCSV} className="btn-secondary flex items-center gap-2"><Download size={16}/> Exportar</button><button onClick={function(){setShowImport(true);setCsvData([]);setImportResult('');setFileHeaders([]);setColumnMapping({});setRawDataRows([]);setImportSchoolId(allSchools.length>0?String(allSchools[0].id):'');}} className="btn-secondary flex items-center gap-2"><Upload size={16}/> Importar</button><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Aluno</button></div>
      </div>
      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nome, matrícula ou turma..." value={search} onChange={function(e){setSearch(e.target.value);setPage(1);}}/></div>
      <div className="grid gap-3">
        {paginated.map(function(s: any) { return (
          <div key={s.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {s.photo?<img src={s.photo} alt={s.name} className="w-full h-full object-cover"/>:<span className="font-bold text-indigo-700">{s.name?.[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-800">{s.name}</p>
                {s.grade&&<span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s.grade}</span>}
                {s.shift&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{shiftLabel(s.shift)}</span>}
              </div>
              <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                {s.enrollment&&<span className="flex items-center gap-1"><BookOpen size={10}/>Mat. {s.enrollment}</span>}
                {s.school&&<span>{s.school}</span>}
                {s.guardian1Phone&&<span className="flex items-center gap-1"><Phone size={10}/>{s.guardian1Phone}</span>}
                {s.city&&<span className="flex items-center gap-1"><MapPin size={10}/>{s.city}</span>}
                {s.routeId&&<span className="flex items-center gap-1 bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium"><Navigation size={10}/>{routeName(s.routeId)}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={function(){setViewStudent(s);}} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Ver detalhes"><Eye size={15}/></button>
              <button onClick={function(){setInviteStudent(s);}} className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg" title="Convidar responsavel via WhatsApp"><MessageCircle size={15}/></button>
              <button onClick={function(){openEdit(s);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={15}/></button>
              <button onClick={function(){setConfirmDelete(s);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        );})}
        {!filtered.length&&!search&&<div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhum aluno</p><button className="btn-primary" onClick={openNew}>Adicionar aluno</button></div>}
        {!filtered.length&&search&&<div className="card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Mostrando {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} de {filtered.length}</p>
          <div className="flex gap-1">
            <button onClick={function(){setPage(1);}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<<'}</button>
            <button onClick={function(){setPage(function(p){return Math.max(1,p-1);});}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<'}</button>
            <span className="px-3 py-1.5 text-sm font-medium">{page}/{totalPages}</span>
            <button onClick={function(){setPage(function(p){return Math.min(totalPages,p+1);});}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>'}</button>
            <button onClick={function(){setPage(totalPages);}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>>'}</button>
          </div>
        </div>
      )}

      {/* Modal Visualizar Aluno */}
      {viewStudent&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500"/> Detalhes do Aluno</h3>
              <div className="flex items-center gap-2">
                <button onClick={function(){
                  const el = document.getElementById('student-detail-print');
                  if (el) { const w = window.open('', '_blank'); if (w) { w.document.write('<html><head><title>'+viewStudent.name+' - NetEscol</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#333}h1{color:#1B3A5C;border-bottom:2px solid #2DB5B0;padding-bottom:8px}h2{color:#2DB5B0;margin-top:20px;font-size:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{padding:8px 12px;background:#f9fafb;border-radius:8px}.field-label{font-size:12px;color:#6b7280;margin-bottom:2px}.field-value{font-size:14px;font-weight:500}.section{margin-top:16px;padding:12px;border-radius:12px}@media print{body{padding:0}}</style></head><body>'+el.innerHTML+'<p style="margin-top:24px;font-size:11px;color:#999">Gerado por NetEscol em '+new Date().toLocaleString('pt-BR')+'</p></body></html>'); w.document.close(); w.print(); } }
                }} className="btn-secondary flex items-center gap-2 text-sm"><FileUp size={14}/> Imprimir</button>
                <button onClick={function(){
                  const s = viewStudent;
                  const csv = 'Campo;Valor\n' + [
                    ['Nome', s.name], ['Matricula', s.enrollment||''], ['Serie', s.grade||''], ['Turma', s.classRoom||s.className||''], ['Turno', shiftLabel(s.shift)],
                    ['Escola', allSchools.find(function(sc:any){return sc.id===s.schoolId;})?.name || s.school || ''],
                    ['Nascimento', s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : ''],
                    ['Endereco', s.address||''],
                    ['Tipo Sanguineo', s.bloodType||''], ['Necessidades Especiais', s.hasSpecialNeeds?'Sim':'Nao'],
                    ['Alergias', s.allergies||''], ['Medicamentos', s.medications||''], ['Obs. Saude', s.healthNotes||''],
                    ['Contato Emerg. 1 - Nome', s.emergencyContact1Name||''], ['Contato Emerg. 1 - Telefone', s.emergencyContact1Phone||''], ['Contato Emerg. 1 - Parentesco', s.emergencyContact1Relation||''],
                    ['Contato Emerg. 2 - Nome', s.emergencyContact2Name||''], ['Contato Emerg. 2 - Telefone', s.emergencyContact2Phone||''], ['Contato Emerg. 2 - Parentesco', s.emergencyContact2Relation||''],
                  ].map(function(r){ return '"'+r[0]+'";"'+r[1]+'"'; }).join('\n');
                  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
                  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=s.name.replace(/\s/g,'_')+'_netescol.csv'; a.click();
                }} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14}/> Exportar</button>
                <button onClick={function(){setViewStudent(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-5" id="student-detail-print">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">{viewStudent.photoUrl ? <img src={viewStudent.photoUrl} className="w-full h-full rounded-full object-cover"/> : viewStudent.name?.[0]}</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{viewStudent.name}</h1>
                  <p className="text-gray-500">{viewStudent.enrollment ? 'Mat. ' + viewStudent.enrollment : ''} {viewStudent.grade ? ' - ' + viewStudent.grade : ''}</p>
                </div>
              </div>

              {/* DADOS ESCOLARES */}
              <h2 className="text-sm font-bold text-accent-600 uppercase tracking-wide mb-3">Dados Escolares</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Escola</p><p className="text-sm font-medium">{allSchools.find(function(sc:any){return sc.id===viewStudent.schoolId;})?.name || viewStudent.school || '--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Série/Ano</p><p className="text-sm font-medium">{viewStudent.grade || '--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Turma</p><p className="text-sm font-medium">{viewStudent.classRoom || viewStudent.className || '--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Turno</p><p className="text-sm font-medium">{shiftLabel(viewStudent.shift)}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Matrícula</p><p className="text-sm font-medium">{viewStudent.enrollment || '--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Situação</p><p className="text-sm font-medium">{viewStudent.studentStatus || 'ativo'}</p></div>
              </div>

              {/* DADOS PESSOAIS */}
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-1"><User size={14}/> Dados Pessoais</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 p-4 bg-blue-50 rounded-xl">
                <div><p className="text-xs text-gray-400">Nascimento</p><p className="text-sm font-medium">{viewStudent.birthDate ? new Date(viewStudent.birthDate).toLocaleDateString('pt-BR') : '--'}</p></div>
                <div><p className="text-xs text-gray-400">Sexo</p><p className="text-sm font-medium">{viewStudent.sex === 'M' ? 'Masculino' : viewStudent.sex === 'F' ? 'Feminino' : '--'}</p></div>
                <div><p className="text-xs text-gray-400">Cor/Raça</p><p className="text-sm font-medium">{viewStudent.race || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Nacionalidade</p><p className="text-sm font-medium">{viewStudent.nationality || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Naturalidade</p><p className="text-sm font-medium">{viewStudent.naturalness || '--'}{viewStudent.naturalnessUf ? '/'+viewStudent.naturalnessUf : ''}</p></div>
                <div><p className="text-xs text-gray-400">CPF</p><p className="text-sm font-medium">{viewStudent.cpf || '--'}</p></div>
                <div><p className="text-xs text-gray-400">RG</p><p className="text-sm font-medium">{viewStudent.rg || '--'}{viewStudent.rgOrgao ? ' - '+viewStudent.rgOrgao : ''}{viewStudent.rgUf ? '/'+viewStudent.rgUf : ''}</p></div>
                <div><p className="text-xs text-gray-400">NIS</p><p className="text-sm font-medium">{viewStudent.nis || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Cartão SUS</p><p className="text-sm font-medium">{viewStudent.cartaoSus || '--'}</p></div>
              </div>

              {/* CERTIDÃO */}
              {(viewStudent.certidaoNumero || viewStudent.certidaoCartorio) && (
                <div className="mb-5">
                  <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wide mb-3">Certidão de Nascimento</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-amber-50 rounded-xl">
                    <div><p className="text-xs text-gray-400">Tipo</p><p className="text-sm font-medium">{viewStudent.certidaoTipo === 'nascimento' ? 'Nascimento' : viewStudent.certidaoTipo === 'casamento' ? 'Casamento' : viewStudent.certidaoTipo || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Número</p><p className="text-sm font-medium">{viewStudent.certidaoNumero || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Folha</p><p className="text-sm font-medium">{viewStudent.certidaoFolha || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Livro</p><p className="text-sm font-medium">{viewStudent.certidaoLivro || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Data Emissão</p><p className="text-sm font-medium">{viewStudent.certidaoData || '--'}</p></div>
                    <div className="col-span-2 md:col-span-1"><p className="text-xs text-gray-400">Cartório</p><p className="text-sm font-medium">{viewStudent.certidaoCartorio || '--'}</p></div>
                  </div>
                </div>
              )}

              {/* ENDEREÇO */}
              <h2 className="text-sm font-bold text-accent-600 uppercase tracking-wide mb-3 flex items-center gap-1"><MapPin size={14}/> Endereço</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl">
                <div className="col-span-2"><p className="text-xs text-gray-400">Logradouro</p><p className="text-sm font-medium">{viewStudent.address || '--'}{viewStudent.addressNumber ? ', '+viewStudent.addressNumber : ''}{viewStudent.addressComplement ? ' - '+viewStudent.addressComplement : ''}</p></div>
                <div><p className="text-xs text-gray-400">Bairro</p><p className="text-sm font-medium">{viewStudent.neighborhood || '--'}</p></div>
                <div><p className="text-xs text-gray-400">CEP</p><p className="text-sm font-medium">{viewStudent.cep || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Cidade/UF</p><p className="text-sm font-medium">{viewStudent.city || '--'}{viewStudent.state ? '/'+viewStudent.state : ''}</p></div>
                <div><p className="text-xs text-gray-400">Zona</p><p className="text-sm font-medium">{viewStudent.zone === 'urbana' ? 'Urbana' : viewStudent.zone === 'rural' ? 'Rural' : viewStudent.zone || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Telefone Fixo</p><p className="text-sm font-medium">{viewStudent.phone || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Celular</p><p className="text-sm font-medium">{viewStudent.cellPhone || '--'}</p></div>
              </div>

              {/* FILIAÇÃO - PAI */}
              <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-1"><Users size={14}/> Filiação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase">Pai</p>
                  <div className="space-y-1.5">
                    <div><p className="text-xs text-gray-400">Nome</p><p className="text-sm font-medium">{viewStudent.fatherName || '--'}</p></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-gray-400">CPF</p><p className="text-sm font-medium">{viewStudent.fatherCpf || '--'}</p></div>
                      <div><p className="text-xs text-gray-400">RG</p><p className="text-sm font-medium">{viewStudent.fatherRg || '--'}{viewStudent.fatherRgOrgao ? ' '+viewStudent.fatherRgOrgao : ''}{viewStudent.fatherRgUf ? '/'+viewStudent.fatherRgUf : ''}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-gray-400">Telefone</p><p className="text-sm font-medium">{viewStudent.fatherPhone || '--'}</p></div>
                      <div><p className="text-xs text-gray-400">Profissão</p><p className="text-sm font-medium">{viewStudent.fatherProfession || '--'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-gray-400">Local de Trabalho</p><p className="text-sm font-medium">{viewStudent.fatherWorkplace || '--'}</p></div>
                      <div><p className="text-xs text-gray-400">Escolaridade</p><p className="text-sm font-medium">{viewStudent.fatherEducation || '--'}</p></div>
                    </div>
                    <div><p className="text-xs text-gray-400">Naturalidade</p><p className="text-sm font-medium">{viewStudent.fatherNaturalness || '--'}{viewStudent.fatherNaturalnessUf ? '/'+viewStudent.fatherNaturalnessUf : ''}</p></div>
                  </div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <p className="text-xs font-semibold text-pink-600 mb-2 uppercase">Mãe</p>
                  <div className="space-y-1.5">
                    <div><p className="text-xs text-gray-400">Nome</p><p className="text-sm font-medium">{viewStudent.motherName || '--'}</p></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-gray-400">CPF</p><p className="text-sm font-medium">{viewStudent.motherCpf || '--'}</p></div>
                      <div><p className="text-xs text-gray-400">RG</p><p className="text-sm font-medium">{viewStudent.motherRg || '--'}{viewStudent.motherRgOrgao ? ' '+viewStudent.motherRgOrgao : ''}{viewStudent.motherRgUf ? '/'+viewStudent.motherRgUf : ''}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-gray-400">Telefone</p><p className="text-sm font-medium">{viewStudent.motherPhone || '--'}</p></div>
                      <div><p className="text-xs text-gray-400">Profissão</p><p className="text-sm font-medium">{viewStudent.motherProfession || '--'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-gray-400">Local de Trabalho</p><p className="text-sm font-medium">{viewStudent.motherWorkplace || '--'}</p></div>
                      <div><p className="text-xs text-gray-400">Escolaridade</p><p className="text-sm font-medium">{viewStudent.motherEducation || '--'}</p></div>
                    </div>
                    <div><p className="text-xs text-gray-400">Naturalidade</p><p className="text-sm font-medium">{viewStudent.motherNaturalness || '--'}{viewStudent.motherNaturalnessUf ? '/'+viewStudent.motherNaturalnessUf : ''}</p></div>
                  </div>
                </div>
              </div>
              {viewStudent.familyIncome && <div className="mb-5 p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Renda Familiar</p><p className="text-sm font-medium">R$ {viewStudent.familyIncome}</p></div>}

              {/* TRANSPORTE */}
              <h2 className="text-sm font-bold text-primary-600 uppercase tracking-wide mb-3 flex items-center gap-1"><Bus size={14}/> Transporte</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 p-4 bg-primary-50 rounded-xl">
                <div><p className="text-xs text-gray-400">Necessita Transporte</p><p className="text-sm font-medium">{viewStudent.needsTransport ? 'Sim' : 'Não'}</p></div>
                <div><p className="text-xs text-gray-400">Tipo</p><p className="text-sm font-medium">{viewStudent.transportType || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Distância</p><p className="text-sm font-medium">{viewStudent.transportDistance ? viewStudent.transportDistance + ' km' : '--'}</p></div>
                <div className="col-span-2 md:col-span-3"><p className="text-xs text-gray-400">Rota</p><p className="text-sm font-medium">{viewStudent.routeName || '--'}</p></div>
              </div>

              {/* PROGRAMAS SOCIAIS */}
              <h2 className="text-sm font-bold text-green-600 uppercase tracking-wide mb-3">Programas Sociais</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-green-50 rounded-xl">
                <div><p className="text-xs text-gray-400">Bolsa Família</p><p className="text-sm font-medium">{viewStudent.bolsaFamilia ? 'Sim' : 'Nao'}</p></div>
                <div><p className="text-xs text-gray-400">BPC</p><p className="text-sm font-medium">{viewStudent.bpc ? 'Sim' : 'Nao'}</p></div>
                <div><p className="text-xs text-gray-400">PETI</p><p className="text-sm font-medium">{viewStudent.peti ? 'Sim' : 'Nao'}</p></div>
                <div><p className="text-xs text-gray-400">Outros</p><p className="text-sm font-medium">{viewStudent.otherPrograms || '—'}</p></div>
              </div>

              {/* SAÚDE + NECESSIDADES ESPECIAIS */}
              <h2 className="text-sm font-bold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-1"><Heart size={14}/> Saúde e Necessidades Especiais</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 p-4 bg-red-50 rounded-xl">
                <div><p className="text-xs text-gray-400">Tipo Sanguíneo</p><p className="text-sm font-medium">{viewStudent.bloodType || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Alergias</p><p className="text-sm font-medium">{viewStudent.allergies || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Medicamentos</p><p className="text-sm font-medium">{viewStudent.medications || '--'}</p></div>
                <div className="col-span-2 md:col-span-3"><p className="text-xs text-gray-400">Observações de Saúde</p><p className="text-sm font-medium">{viewStudent.healthNotes || '--'}</p></div>
                <div><p className="text-xs text-gray-400">Nec. Especiais</p><p className="text-sm font-medium">{viewStudent.hasSpecialNeeds ? 'Sim' : 'Não'}</p></div>
                {viewStudent.hasSpecialNeeds && <>
                  <div><p className="text-xs text-gray-400">Tipo Deficiência</p><p className="text-sm font-medium">{viewStudent.deficiencyType || '--'}</p></div>
                  <div><p className="text-xs text-gray-400">TGD</p><p className="text-sm font-medium">{viewStudent.tgd || '--'}</p></div>
                  <div><p className="text-xs text-gray-400">Superdotação</p><p className="text-sm font-medium">{viewStudent.superdotacao ? 'Sim' : 'Não'}</p></div>
                  <div><p className="text-xs text-gray-400">Sala de Recursos</p><p className="text-sm font-medium">{viewStudent.salaRecursos ? 'Sim' : 'Não'}</p></div>
                  <div><p className="text-xs text-gray-400">Acompanhamento</p><p className="text-sm font-medium">{viewStudent.acompanhamento || '--'}</p></div>
                  <div><p className="text-xs text-gray-400">Encaminhamento</p><p className="text-sm font-medium">{viewStudent.encaminhamento || '--'}</p></div>
                  <div className="col-span-2 md:col-span-3"><p className="text-xs text-gray-400">Detalhes</p><p className="text-sm font-medium">{viewStudent.specialNeedsNotes || '--'}</p></div>
                </>}
              </div>

              {/* CONTATOS DE EMERGÊNCIA */}
              <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wide mb-3 flex items-center gap-1"><AlertTriangle size={14}/> Contatos de Emergência</h2>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs font-semibold text-orange-600 mb-2">Contato 1</p>
                  <p className="text-sm font-medium">{viewStudent.emergencyContact1Name || '--'}</p>
                  <p className="text-xs text-gray-500">{viewStudent.emergencyContact1Phone || '--'}</p>
                  <p className="text-xs text-gray-500">{viewStudent.emergencyContact1Relation || '--'}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs font-semibold text-orange-600 mb-2">Contato 2</p>
                  <p className="text-sm font-medium">{viewStudent.emergencyContact2Name || '--'}</p>
                  <p className="text-xs text-gray-500">{viewStudent.emergencyContact2Phone || '--'}</p>
                  <p className="text-xs text-gray-500">{viewStudent.emergencyContact2Relation || '--'}</p>
                </div>
              </div>

              {/* PROCEDÊNCIA */}
              {(viewStudent.previousSchool || viewStudent.enrollmentType) && (
                <div className="mb-5">
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Procedência</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="col-span-2 md:col-span-3"><p className="text-xs text-gray-400">Escola Anterior</p><p className="text-sm font-medium">{viewStudent.previousSchool || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Rede</p><p className="text-sm font-medium">{viewStudent.previousSchoolType || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Zona</p><p className="text-sm font-medium">{viewStudent.previousSchoolZone || '--'}</p></div>
                    <div><p className="text-xs text-gray-400">Cidade/UF</p><p className="text-sm font-medium">{viewStudent.previousCity || '--'}{viewStudent.previousState ? '/'+viewStudent.previousState : ''}</p></div>
                    <div><p className="text-xs text-gray-400">Tipo Matrícula</p><p className="text-sm font-medium">{viewStudent.enrollmentType || '--'}</p></div>
                  </div>
                </div>
              )}

              {/* OBSERVAÇÕES */}
              {viewStudent.observations && (
                <div className="mb-5">
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Observações</h2>
                  <div className="p-4 bg-yellow-50 rounded-xl"><p className="text-sm">{viewStudent.observations}</p></div>
                </div>
              )}

              {/* WHATSAPP BUTTONS */}
              {(viewStudent.emergencyContact1Phone || viewStudent.guardian1Phone || viewStudent.fatherPhone || viewStudent.motherPhone) && (
                <div className="flex gap-2 mb-3">
                  {(viewStudent.fatherPhone || viewStudent.emergencyContact1Phone) && <button onClick={function(){ const phone = (viewStudent.fatherPhone || viewStudent.emergencyContact1Phone || '').replace(/\D/g,''); const whatsPhone = phone.length===11?'55'+phone:phone; window.open('https://wa.me/'+whatsPhone+'?text='+encodeURIComponent('Olá! Informação sobre '+viewStudent.name+' - NetEscol'), '_blank'); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"><MessageCircle size={16} /> WhatsApp Pai</button>}
                  {(viewStudent.motherPhone || viewStudent.emergencyContact2Phone) && <button onClick={function(){ const phone = (viewStudent.motherPhone || viewStudent.emergencyContact2Phone || '').replace(/\D/g,''); const whatsPhone = phone.length===11?'55'+phone:phone; window.open('https://wa.me/'+whatsPhone+'?text='+encodeURIComponent('Olá! Informação sobre '+viewStudent.name+' - NetEscol'), '_blank'); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"><MessageCircle size={16} /> WhatsApp Mãe</button>}
                </div>
              )}
            </div>
            {/* Quick navigation to related pages */}
            <div className="px-5 pb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Acesso Rápido</p>
              <div className="flex flex-wrap gap-2">
                <QuickActionButton icon={FileText} label="Declarações" to="/declaracoes" />
                <QuickActionButton icon={GraduationCap} label="Boletim" to="/boletim" />
                <QuickActionButton icon={History} label="Histórico" to="/historico-escolar" />
                <QuickActionButton icon={ClipboardList} label="Ficha" to="/ficha-aluno" />
                <QuickActionButton icon={QrCode} label="Carteirinha" to="/carteirinha" />
                <QuickActionButton icon={FileUp} label="Documentos" to="" searchParams={{}} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function(){setViewStudent(null);}} className="btn-secondary flex-1">Fechar</button>
              <button onClick={function(){setShowDocs(viewStudent);}} className="btn-secondary flex-1 flex items-center justify-center gap-1"><FileUp size={14}/> Documentos</button>
              <button onClick={function(){setViewStudent(null);openEdit(viewStudent);}} className="btn-primary flex-1">Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de convite enviado */}
      {inviteSent && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={18}/> Convite enviado via WhatsApp!
        </div>
      )}

      {/* Modal Convidar Responsavel */}
      {inviteStudent&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><MessageCircle size={20} className="text-green-500"/> Convidar Responsavel</h3>
              <button onClick={function(){setInviteStudent(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18}/></button>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-green-800 mb-1">Aluno(a): {inviteStudent.name}</p>
              {inviteStudent.enrollment && <p className="text-xs text-green-600">Matricula: {inviteStudent.enrollment}</p>}
              {inviteStudent.grade && <p className="text-xs text-green-600">Turma: {inviteStudent.grade}</p>}
            </div>

            <p className="text-sm text-gray-600 mb-4">Envie o convite para o responsavel instalar o app e acompanhar o transporte escolar em tempo real.</p>

            <div className="space-y-2">
              {inviteStudent.guardian1Phone && (
                <button onClick={function(){sendWhatsAppInvite(inviteStudent, inviteStudent.guardian1Phone);}}
                  className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  <MessageCircle size={20}/>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{inviteStudent.guardian1Name || 'Responsavel 1'}</p>
                    <p className="text-xs text-green-100">{inviteStudent.guardian1Phone}</p>
                  </div>
                  <Share2 size={16}/>
                </button>
              )}

              {inviteStudent.guardian2Phone && (
                <button onClick={function(){sendWhatsAppInvite(inviteStudent, inviteStudent.guardian2Phone);}}
                  className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  <MessageCircle size={20}/>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{inviteStudent.guardian2Name || 'Responsavel 2'}</p>
                    <p className="text-xs text-green-100">{inviteStudent.guardian2Phone}</p>
                  </div>
                  <Share2 size={16}/>
                </button>
              )}

              <button onClick={function(){sendWhatsAppInvite(inviteStudent);}}
                className="w-full flex items-center gap-3 p-3 border-2 border-green-200 hover:bg-green-50 text-green-700 rounded-xl transition-colors">
                <MessageCircle size={20}/>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">Enviar para outro numero</p>
                  <p className="text-xs text-green-500">Abre o WhatsApp para escolher o contato</p>
                </div>
                <Share2 size={16}/>
              </button>
            </div>

            {!inviteStudent.enrollment && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">Este aluno nao tem matricula cadastrada. O responsavel precisara informar o nome do aluno no cadastro.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDelete&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p><div className="flex gap-3"><button onClick={function(){setConfirmDelete(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){remove({id:confirmDelete.id},{onSuccess:function(){refetch();setConfirmDelete(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 pb-2 border-b border-gray-100 flex-shrink-0"><h3 className="text-lg font-semibold">{editId?'Editar Aluno':'Novo Aluno'}</h3><button onClick={function(){setShowModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="flex gap-1 px-4 py-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex-shrink-0 overflow-x-auto">
          {([['dados','Dados'],['documentos','Docs'],['endereco','Endereço'],['filiacao','Filiação'],['saude','Saúde'],['social','Social'],['procedencia','Procedência'],...(editId?[['historico','Histórico']]:[])] as any[]).map(function(t: any){return(<button key={t[0]} onClick={function(){setTab(t[0]);}} className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap '+(tab===t[0]?'bg-primary-500 text-white shadow-sm':'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>{t[1]}</button>);})}
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {formErr&&<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
          {requiredFields.size > 0 && <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg flex items-center gap-1"><span className="text-red-500 font-bold">*</span> Campos obrigatórios definidos pelo administrador ({requiredFields.size})</div>}

          {/* ABA DADOS */}
          {tab==='dados'&&(<><div className="flex justify-center"><PhotoUpload value={form.photo} onChange={function(v:string){setForm(function(f:any){return{...f,photo:v};});}}/></div><div className="grid grid-cols-3 gap-3">
            <div className="col-span-3"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={setField('name')}/></div>
            <div><label className="label">Data Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={setField('birthDate')}/></div>
            <div><label className="label">Sexo</label><select className="input" value={form.sex} onChange={setField('sex')}><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
            <div><label className="label">Cor/Raça</label><select className="input" value={form.race} onChange={setField('race')}><option value="">Selecione</option>{RACES.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="label">Nacionalidade</label><input className="input" value={form.nationality} onChange={setField('nationality')}/></div>
            <div><label className="label">UF nasc.</label><select className="input" value={form.naturalnessUf} onChange={e=>{setForm((f:any)=>({...f,naturalnessUf:e.target.value,naturalness:''}));}}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
            <div><label className="label">Naturalidade {natMunLoading&&<Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.naturalness} onChange={setField('naturalness')} disabled={!form.naturalnessUf||natMunLoading}><option value="">Selecione</option>{natMunicipios.map(m=><option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>

            {/* Escola */}
            <div className="col-span-3"><label className="label">Escola *</label>
              <div className="flex gap-1"><select className="input flex-1" value={form.school} onChange={setField('school')}><option value="">Selecione a escola</option>{allSchools.map(function(s:any){return <option key={s.id} value={s.id}>{s.name}</option>;})}</select>
              <button type="button" onClick={() => setQuickAdd('school')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar escola"><Plus size={16}/></button></div>
            </div>

            {/* Situação da Matrícula - informativo */}
            <div className="col-span-3">
              {(form.enrollment || form.grade) ? (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">Situação Acadêmica</p>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        {form.enrollment ? 'Mat. ' + form.enrollment + ' | ' : ''}
                        {form.grade || '--'} {form.className ? '- Turma ' + form.className : ''} {form.shift ? '| ' + (form.shift==='morning'?'Manhã':form.shift==='afternoon'?'Tarde':form.shift==='full_time'?'Integral':'Noite') : ''}
                      </p>
                    </div>
                    <QuickActionButton icon={GraduationCap} label="Ir para Matrículas" to="/matriculas" />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1">Sem Matrícula</p>
                      <p className="text-sm text-amber-600 dark:text-amber-300">Este aluno ainda não possui matrícula efetivada. Salve o cadastro e depois efetive a matrícula.</p>
                    </div>
                    <QuickActionButton icon={GraduationCap} label="Matricular" to="/matriculas" />
                  </div>
                </div>
              )}
            </div>

            {/* Rota de transporte */}
            <div className="col-span-3"><label className="label flex items-center gap-1"><Navigation size={13} className="text-primary-500"/> Rota de transporte</label>
              <select className="input" value={form.routeId} onChange={setField('routeId')}><option value="">— Sem rota —</option>{allRoutes.map(function(rt:any){return <option key={(rt.route?.id || rt.id)} value={(rt.route?.id || rt.id)}>{(rt.route?.name || rt.name)}{(rt.route?.code || rt.code)?' ('+(rt.route?.code || rt.code)+')':''}</option>;})}</select>
            </div>
          </div></>)}

          {/* ABA DOCUMENTOS */}
          {tab==='documentos'&&(<div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs font-semibold text-blue-700 mb-3 uppercase">Documentos Pessoais</p><div className="grid grid-cols-3 gap-3">
              <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={e=>setForm((f:any)=>({...f,cpf:maskCPF(e.target.value)}))} placeholder="000.000.000-00" maxLength={14}/></div>
              <div><label className="label">RG</label><input className="input" value={form.rg} onChange={setField('rg')}/></div>
              <div><label className="label">Órgão Exp.</label><input className="input" value={form.rgOrgao} onChange={setField('rgOrgao')} placeholder="SSP"/></div>
              <div><label className="label">UF RG</label><input className="input" value={form.rgUf} onChange={setField('rgUf')} maxLength={2}/></div>
              <div><label className="label">Data Exp.</label><input className="input" type="date" value={form.rgDate} onChange={setField('rgDate')}/></div>
              <div><label className="label">NIS</label><input className="input" value={form.nis} onChange={setField('nis')} placeholder="Nº Identificação Social"/></div>
              <div><label className="label">Cartão SUS</label><input className="input" value={form.cartaoSus} onChange={setField('cartaoSus')}/></div>
            </div></div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><p className="text-xs font-semibold text-amber-700 mb-3 uppercase">Certidão de Nascimento</p><div className="grid grid-cols-3 gap-3">
              <div><label className="label">Tipo</label><select className="input" value={form.certidaoTipo} onChange={setField('certidaoTipo')}><option value="nascimento">Nascimento</option><option value="casamento">Casamento</option></select></div>
              <div><label className="label">Número</label><input className="input" value={form.certidaoNumero} onChange={setField('certidaoNumero')}/></div>
              <div><label className="label">Folha</label><input className="input" value={form.certidaoFolha} onChange={setField('certidaoFolha')}/></div>
              <div><label className="label">Livro</label><input className="input" value={form.certidaoLivro} onChange={setField('certidaoLivro')}/></div>
              <div><label className="label">Data Emissão</label><input className="input" type="date" value={form.certidaoData} onChange={setField('certidaoData')}/></div>
              <div className="col-span-3"><label className="label">Cartório {allCartorios.length > 0 && <span className="text-[10px] text-accent-500 font-normal ml-1">({allCartorios.length} cadastrado{allCartorios.length>1?'s':''})</span>}</label>
                <input className="input" value={form.certidaoCartorio} onChange={setField('certidaoCartorio')} list="cartorios-list" placeholder="Digite o nome do cartório..."/>
                <datalist id="cartorios-list">{allCartorios.map((c,i) => <option key={i} value={c}/>)}</datalist>
              </div>
            </div></div>
          </div>)}

          {/* ABA ENDEREÇO */}
          {tab==='endereco'&&(<div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs font-semibold text-blue-700 mb-3 uppercase">Endereço</p><div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">CEP</label>
                <div className="flex gap-2">
                  <input className="input flex-1" value={form.cep} onChange={e=>setForm((f:any)=>({...f,cep:maskCEP(e.target.value)}))} placeholder="00000-000" maxLength={9}/>
                  <button type="button" onClick={async()=>{const d=form.cep?.replace(/\D/g,'');if(d?.length===8){try{const r=await lookupCEP(d);setForm((f:any)=>({...f,address:r.logradouro||f.address,neighborhood:r.bairro||f.neighborhood,city:r.cidade||f.city,state:r.estado||f.state}));}catch{}}}} className="px-2 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm">🔍</button>
                </div>
              </div>
              <div className="col-span-2"><label className="label">Logradouro</label><input className="input" value={form.address} onChange={setField('address')}/></div>
              <div><label className="label">Número</label><input className="input" value={form.addressNumber} onChange={setField('addressNumber')}/></div>
              <div><label className="label">Complemento</label><input className="input" value={form.addressComplement} onChange={setField('addressComplement')}/></div>
              <div><label className="label">Bairro</label><input className="input" value={form.neighborhood} onChange={setField('neighborhood')}/></div>
              <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={setField('city')}/></div>
              <div><label className="label">UF</label><input className="input" value={form.state} onChange={setField('state')} maxLength={2}/></div>
              <div><label className="label">Zona</label><select className="input" value={form.zone} onChange={setField('zone')}><option value="urbana">Urbana</option><option value="rural">Rural</option></select></div>
              <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={e=>setForm((f:any)=>({...f,phone:maskPhone(e.target.value)}))} placeholder="(00) 0000-0000" maxLength={15}/></div>
              <div><label className="label">Celular</label><input className="input" value={form.cellPhone} onChange={e=>setForm((f:any)=>({...f,cellPhone:maskPhone(e.target.value)}))} placeholder="(00) 00000-0000" maxLength={15}/></div>
            </div></div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"><p className="text-xs font-semibold text-green-700 mb-3 uppercase">Transporte Escolar</p><div className="grid grid-cols-3 gap-3">
              <div><label className="label">Necessita transporte?</label><select className="input" value={form.needsTransport?'sim':'nao'} onChange={e=>setForm((f:any)=>({...f,needsTransport:e.target.value==='sim'}))}><option value="nao">Nao</option><option value="sim">Sim</option></select></div>
              {form.needsTransport&&<><div><label className="label">Tipo</label><input className="input" value={form.transportType} onChange={setField('transportType')} placeholder="Ônibus, Van..."/></div>
              <div><label className="label">Distância (km)</label><input className="input" value={form.transportDistance} onChange={setField('transportDistance')}/></div></>}
            </div></div>
          </div>)}

          {/* ABA FILIAÇÃO */}
          {tab==='filiacao'&&(<div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs font-semibold text-blue-700 mb-3 uppercase">Dados do Pai</p><div className="grid grid-cols-3 gap-3">
              <div className="col-span-3"><label className="label">Nome completo</label><input className="input" value={form.fatherName} onChange={setField('fatherName')}/></div>
              <div><label className="label">CPF</label><input className="input" value={form.fatherCpf} onChange={e=>setForm((f:any)=>({...f,fatherCpf:maskCPF(e.target.value)}))} maxLength={14}/></div>
              <div><label className="label">RG</label><input className="input" value={form.fatherRg} onChange={setField('fatherRg')}/></div>
              <div><label className="label">Órgão Emissor</label><input className="input" placeholder="SSP, DETRAN..." value={form.fatherRgOrgao} onChange={setField('fatherRgOrgao')}/></div>
              <div><label className="label">UF RG</label><select className="input" value={form.fatherRgUf} onChange={setField('fatherRgUf')}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
              <div><label className="label">Telefone</label><input className="input" value={form.fatherPhone} onChange={e=>setForm((f:any)=>({...f,fatherPhone:maskPhone(e.target.value)}))} maxLength={15}/></div>
              <div><label className="label">Profissão</label><input className="input" value={form.fatherProfession} onChange={setField('fatherProfession')}/></div>
              <div><label className="label">Local de Trabalho</label><input className="input" value={form.fatherWorkplace} onChange={setField('fatherWorkplace')}/></div>
              <div><label className="label">Escolaridade</label><select className="input" value={form.fatherEducation} onChange={setField('fatherEducation')}><option value="">Selecione</option>{EDUCATION_LEVELS.map(e=><option key={e} value={e}>{e}</option>)}</select></div>
              <div><label className="label">UF</label><select className="input" value={form.fatherNaturalnessUf} onChange={e=>{setForm((f:any)=>({...f,fatherNaturalnessUf:e.target.value,fatherNaturalness:''}));}}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
              <div className="col-span-2"><label className="label">Naturalidade {fatherMunLoading&&<Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.fatherNaturalness} onChange={setField('fatherNaturalness')} disabled={!form.fatherNaturalnessUf||fatherMunLoading}><option value="">Selecione</option>{fatherMunicipios.map(m=><option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
            </div></div>
            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl"><p className="text-xs font-semibold text-pink-700 mb-3 uppercase">Dados da Mãe</p><div className="grid grid-cols-3 gap-3">
              <div className="col-span-3"><label className="label">Nome completo</label><input className="input" value={form.motherName} onChange={setField('motherName')}/></div>
              <div><label className="label">CPF</label><input className="input" value={form.motherCpf} onChange={e=>setForm((f:any)=>({...f,motherCpf:maskCPF(e.target.value)}))} maxLength={14}/></div>
              <div><label className="label">RG</label><input className="input" value={form.motherRg} onChange={setField('motherRg')}/></div>
              <div><label className="label">Órgão Emissor</label><input className="input" placeholder="SSP, DETRAN..." value={form.motherRgOrgao} onChange={setField('motherRgOrgao')}/></div>
              <div><label className="label">UF RG</label><select className="input" value={form.motherRgUf} onChange={setField('motherRgUf')}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
              <div><label className="label">Telefone</label><input className="input" value={form.motherPhone} onChange={e=>setForm((f:any)=>({...f,motherPhone:maskPhone(e.target.value)}))} maxLength={15}/></div>
              <div><label className="label">Profissão</label><input className="input" value={form.motherProfession} onChange={setField('motherProfession')}/></div>
              <div><label className="label">Local de Trabalho</label><input className="input" value={form.motherWorkplace} onChange={setField('motherWorkplace')}/></div>
              <div><label className="label">Escolaridade</label><select className="input" value={form.motherEducation} onChange={setField('motherEducation')}><option value="">Selecione</option>{EDUCATION_LEVELS.map(e=><option key={e} value={e}>{e}</option>)}</select></div>
              <div><label className="label">UF</label><select className="input" value={form.motherNaturalnessUf} onChange={e=>{setForm((f:any)=>({...f,motherNaturalnessUf:e.target.value,motherNaturalness:''}));}}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
              <div className="col-span-2"><label className="label">Naturalidade {motherMunLoading&&<Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.motherNaturalness} onChange={setField('motherNaturalness')} disabled={!form.motherNaturalnessUf||motherMunLoading}><option value="">Selecione</option>{motherMunicipios.map(m=><option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
            </div></div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"><p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Renda e Contatos</p><div className="grid grid-cols-2 gap-3">
              <div><label className="label">Renda Familiar</label><input className="input" value={form.familyIncome} onChange={setField('familyIncome')} placeholder="Ex: 1 salário mínimo"/></div>
              <div></div>
              <div className="col-span-2"><p className="text-xs text-gray-400 mb-2">Contatos de emergência</p></div>
              <div><label className="label">Contato 1 - Nome</label><input className="input" value={form.emergencyContact1Name} onChange={setField('emergencyContact1Name')}/></div>
              <div><label className="label">Telefone</label><input className="input" value={form.emergencyContact1Phone} onChange={e=>setForm((f:any)=>({...f,emergencyContact1Phone:maskPhone(e.target.value)}))} maxLength={15}/></div>
              <div><label className="label">Contato 2 - Nome</label><input className="input" value={form.emergencyContact2Name} onChange={setField('emergencyContact2Name')}/></div>
              <div><label className="label">Telefone</label><input className="input" value={form.emergencyContact2Phone} onChange={e=>setForm((f:any)=>({...f,emergencyContact2Phone:maskPhone(e.target.value)}))} maxLength={15}/></div>
            </div></div>
          </div>)}

          {/* ABA SAUDE */}
          {tab==='saude'&&(<div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl"><p className="text-xs font-semibold text-red-700 mb-3 uppercase">Saúde</p><div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo Sanguíneo</label><select className="input" value={form.bloodType} onChange={setField('bloodType')}><option value="">Selecione</option>{BLOOD_TYPES.map(bt=><option key={bt} value={bt}>{bt}</option>)}</select></div>
              <div><label className="label">Alergias</label><input className="input" value={form.allergies} onChange={setField('allergies')} placeholder="Amendoim, Lactose..."/></div>
              <div><label className="label">Medicamentos em uso</label><input className="input" value={form.medications} onChange={setField('medications')}/></div>
              <div className="col-span-2"><label className="label">Observações de saúde</label><textarea className="input" rows={2} value={form.healthNotes} onChange={setField('healthNotes')}/></div>
            </div></div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl"><p className="text-xs font-semibold text-purple-700 mb-3 uppercase">Necessidades Especiais / Deficiência</p><div className="grid grid-cols-2 gap-3">
              <div><label className="label">Possui deficiência?</label><select className="input" value={form.hasSpecialNeeds?'sim':'nao'} onChange={e=>setForm((f:any)=>({...f,hasSpecialNeeds:e.target.value==='sim'}))}><option value="nao">Nao</option><option value="sim">Sim</option></select></div>
              {form.hasSpecialNeeds&&<>
              <div><label className="label">Tipo de deficiência</label><input className="input" value={form.deficiencyType} onChange={setField('deficiencyType')} placeholder="Surdez, Auditiva, Mental, Física, Múltipla, Cegueira, Baixa Visão"/></div>
              <div><label className="label">TGD</label><input className="input" value={form.tgd} onChange={setField('tgd')} placeholder="Autismo, Asperger, Rett..."/></div>
              <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.superdotacao} onChange={setField('superdotacao')}/> Altas Habilidades / Superdotação</label></div>
              <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.salaRecursos} onChange={setField('salaRecursos')}/> Frequenta Sala de Recursos</label></div>
              <div><label className="label">Acompanhamento</label><input className="input" value={form.acompanhamento} onChange={setField('acompanhamento')} placeholder="Psicologia, Fono, Fisioterapia..."/></div>
              <div><label className="label">Encaminhamento</label><input className="input" value={form.encaminhamento} onChange={setField('encaminhamento')} placeholder="CAPS, CRAS, CREAS..."/></div>
              <div className="col-span-2"><label className="label">Detalhes</label><textarea className="input" rows={2} value={form.specialNeedsNotes} onChange={setField('specialNeedsNotes')}/></div>
              </>}
            </div></div>
          </div>)}

          {/* ABA SOCIAL */}
          {tab==='social'&&(<div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"><p className="text-xs font-semibold text-green-700 mb-3 uppercase">Programas Sociais</p><div className="grid grid-cols-2 gap-3">
              <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.bolsaFamilia} onChange={setField('bolsaFamilia')}/> Bolsa Família</label></div>
              <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.bpc} onChange={setField('bpc')}/> BPC (Benefício Prestação Continuada)</label></div>
              <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.peti} onChange={setField('peti')}/> PETI</label></div>
              <div><label className="label">Outros programas</label><input className="input" value={form.otherPrograms} onChange={setField('otherPrograms')} placeholder="Auxílio gás, Pioneiros Mirins..."/></div>
            </div></div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"><p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Observações Gerais</p>
              <textarea className="input" rows={3} value={form.observations} onChange={setField('observations')} placeholder="Informações adicionais sobre o aluno..."/>
            </div>
          </div>)}

          {/* ABA PROCEDÊNCIA */}
          {tab==='procedencia'&&(<div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><p className="text-xs font-semibold text-amber-700 mb-3 uppercase">Escola Anterior / Procedência</p><div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Nome da escola anterior</label><input className="input" value={form.previousSchool} onChange={setField('previousSchool')}/></div>
              <div><label className="label">Rede</label><select className="input" value={form.previousSchoolType} onChange={setField('previousSchoolType')}><option value="">Selecione</option><option value="municipal">Municipal</option><option value="estadual">Estadual</option><option value="federal">Federal</option><option value="particular">Particular</option></select></div>
              <div><label className="label">Zona</label><select className="input" value={form.previousSchoolZone} onChange={setField('previousSchoolZone')}><option value="">Selecione</option><option value="urbana">Urbana</option><option value="rural">Rural</option></select></div>
              <div><label className="label">UF</label><select className="input" value={form.previousState} onChange={e=>{setForm((f:any)=>({...f,previousState:e.target.value,previousCity:''}));}}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
              <div><label className="label">Cidade {prevMunLoading&&<Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.previousCity} onChange={setField('previousCity')} disabled={!form.previousState||prevMunLoading}><option value="">Selecione</option>{prevMunicipios.map(m=><option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
            </div></div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs font-semibold text-blue-700 mb-3 uppercase">Situação do Aluno</p><div className="grid grid-cols-2 gap-3">
              <div><label className="label">Situação</label><select className="input" value={form.studentStatus} onChange={setField('studentStatus')}><option value="">Selecione</option><option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="remanejado">Remanejado</option><option value="transferido">Transferido</option><option value="abandono">Abandono</option></select></div>
            </div></div>
          </div>)}

          {/* ABA HISTÓRICO ESCOLAR */}
          {tab==='historico'&&editId&&(<div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><History size={16} className="text-primary-500"/> Histórico Escolar Anterior</p>
              <button type="button" onClick={function(){setHistoryForm({...emptyHistoryForm});}} className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5"><Plus size={14}/> Adicionar Ano</button>
            </div>
            <p className="text-xs text-gray-500">Registre aqui os anos letivos cursados em escolas anteriores. Esses dados compõem o Histórico Escolar do aluno.</p>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-primary-500"/><span className="ml-2 text-sm text-gray-500">Carregando...</span></div>
            ) : historyEntries.length === 0 && !historyForm ? (
              <div className="text-center py-8 text-gray-400"><History size={32} className="mx-auto mb-2 opacity-50"/><p className="text-sm">Nenhum histórico anterior registrado</p><p className="text-xs mt-1">Clique em "Adicionar Ano" para registrar</p></div>
            ) : (
              <div className="space-y-2">
                {historyEntries.map(function(h: any) {
                  return (
                    <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                      <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-primary-500 font-bold">{h.year}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{h.grade || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{h.schoolName || '—'}{h.schoolCity ? ' - ' + h.schoolCity : ''}{h.schoolState ? '/' + h.schoolState : ''}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (h.result === 'aprovado' ? 'bg-green-100 text-green-700' : h.result === 'reprovado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>{h.result === 'aprovado' ? 'Aprovado' : h.result === 'reprovado' ? 'Reprovado' : h.result === 'transferido' ? 'Transferido' : h.result || '—'}</span>
                          {h.schoolType && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{h.schoolType === 'municipal' ? 'Municipal' : h.schoolType === 'estadual' ? 'Estadual' : h.schoolType === 'federal' ? 'Federal' : h.schoolType === 'particular' ? 'Particular' : h.schoolType}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button type="button" onClick={function(){setHistoryForm({...h});}} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-primary-500" title="Editar"><Pencil size={14}/></button>
                        <button type="button" onClick={function(){if(confirm('Excluir registro de '+h.year+'?')) deleteHistory(h.id);}} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500" title="Excluir"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulário inline de histórico */}
            {historyForm && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase">{historyForm.id ? 'Editar Registro' : 'Novo Registro'}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="label">Ano *</label><input className="input" type="number" min="1990" max={new Date().getFullYear()} value={historyForm.year} onChange={function(e){setHistoryForm(function(f:any){return{...f,year:parseInt(e.target.value)||0};});}}/></div>
                  <div><label className="label">Série/Ano *</label><input className="input" value={historyForm.grade} onChange={function(e){setHistoryForm(function(f:any){return{...f,grade:e.target.value};});}} placeholder="Ex: 3º ANO"/></div>
                  <div><label className="label">Resultado</label><select className="input" value={historyForm.result} onChange={function(e){setHistoryForm(function(f:any){return{...f,result:e.target.value};});}}><option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="transferido">Transferido</option><option value="cursando">Cursando</option></select></div>
                  <div className="col-span-3"><label className="label">Nome da Escola</label><input className="input" value={historyForm.schoolName} onChange={function(e){setHistoryForm(function(f:any){return{...f,schoolName:e.target.value};});}} placeholder="Nome da escola"/></div>
                  <div><label className="label">Cidade</label><input className="input" value={historyForm.schoolCity||''} onChange={function(e){setHistoryForm(function(f:any){return{...f,schoolCity:e.target.value};});}}/></div>
                  <div><label className="label">UF</label><select className="input" value={historyForm.schoolState||''} onChange={function(e){setHistoryForm(function(f:any){return{...f,schoolState:e.target.value};});}}><option value="">UF</option>{ESTADOS_BR.map(es=><option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
                  <div><label className="label">Rede</label><select className="input" value={historyForm.schoolType||''} onChange={function(e){setHistoryForm(function(f:any){return{...f,schoolType:e.target.value};});}}><option value="">Selecione</option><option value="municipal">Municipal</option><option value="estadual">Estadual</option><option value="federal">Federal</option><option value="particular">Particular</option></select></div>
                  <div className="col-span-3"><label className="label">Observações</label><input className="input" value={historyForm.observations||''} onChange={function(e){setHistoryForm(function(f:any){return{...f,observations:e.target.value};});}}/></div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <button type="button" onClick={function(){setHistoryForm(null);}} className="btn-secondary text-xs px-4 py-1.5">Cancelar</button>
                  <button type="button" onClick={saveHistory} disabled={historySaving || !historyForm.year || !historyForm.grade} className="btn-primary text-xs px-4 py-1.5">{historySaving ? 'Salvando...' : historyForm.id ? 'Salvar' : 'Adicionar'}</button>
                </div>
              </div>
            )}
          </div>)}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Aluno'}</button></div>
      </div></div>)}

      {showImport&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold flex items-center gap-2"><FileUp size={18} className="text-primary-500"/> Importar Alunos</h3><button onClick={function(){setShowImport(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700 mb-2">Aceita arquivos <strong>.xlsx</strong> (Excel) ou <strong>.csv</strong> (separador <strong>;</strong>)</p>
            <p className="text-xs text-blue-600">As colunas serao detectadas automaticamente. Voce pode ajustar o mapeamento abaixo.</p>
            <button onClick={downloadTemplate} className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200">Baixar modelo CSV</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Selecione o arquivo</label><input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFileUpload} className="input"/></div>
            <div><label className="label">Escola destino</label><select value={importSchoolId} onChange={function(e){setImportSchoolId(e.target.value);}} className="input">{allSchools.length === 0 ? <option value="">Nenhuma escola</option> : <><option value="">Selecione...</option>{allSchools.map(function(s: any){return <option key={s.id} value={s.id}>{s.name}</option>;})}</>}</select></div>
          </div>
          {fileHeaders.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Mapeamento de colunas:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fileHeaders.map(function(h, idx) { return (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 truncate" title={h}>{h}</span>
                    <select value={columnMapping[idx] || ''} onChange={function(e){updateColumnMap(idx, e.target.value);}} className="input text-xs py-1">
                      {FIELD_OPTIONS.map(function(o) { return <option key={o.v} value={o.v}>{o.l}</option>; })}
                    </select>
                  </div>
                ); })}
              </div>
            </div>
          )}
          {csvData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{csvData.length} aluno(s) encontrado(s) — primeiros 5:</p>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left">Nome</th><th className="px-3 py-2 text-left">Matricula</th><th className="px-3 py-2 text-left">Serie</th><th className="px-3 py-2 text-left">Turma</th><th className="px-3 py-2 text-left">Turno</th><th className="px-3 py-2 text-left">CPF</th><th className="px-3 py-2 text-left">Mae</th></tr></thead>
                <tbody className="divide-y">{csvData.slice(0, 5).map(function(r,i){return <tr key={i}><td className="px-3 py-1.5">{r.name}</td><td className="px-3 py-1.5">{r.enrollment||'--'}</td><td className="px-3 py-1.5">{r.grade||'--'}</td><td className="px-3 py-1.5">{r.className||'--'}</td><td className="px-3 py-1.5">{r.shift||'--'}</td><td className="px-3 py-1.5">{r.cpf||'--'}</td><td className="px-3 py-1.5">{r.motherName||'--'}</td></tr>;})}</tbody></table>
              </div>
              {csvData.length > 5 && <p className="text-xs text-gray-400 mt-1">...e mais {csvData.length - 5} aluno(s)</p>}
            </div>
          )}
          {importResult && <div className={`p-3 rounded-lg text-sm ${importResult.includes('Erro')||importResult.includes('vazio')?'bg-red-50 text-red-700':'bg-green-50 text-green-700'}`}>{importResult}</div>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowImport(false);}} className="btn-secondary flex-1">Fechar</button><button onClick={doImport} disabled={!csvData.length||importing||(!importSchoolId&&allSchools.length>0)} className="btn-primary flex-1">{importing?'Importando...':'Importar '+csvData.length+' aluno(s)'}</button></div>
      </div></div>)}

      {showDocs && <StudentDocumentsModal studentId={showDocs.id} studentName={showDocs.name} onClose={() => setShowDocs(null)} />}

      {/* Quick Add Modal */}
      {quickAdd && (
        <QuickAddModal
          entityType={quickAdd as any}
          municipalityId={municipalityId}
          onClose={() => setQuickAdd(null)}
          onSuccess={(entity) => {
            if (quickAdd === 'school') { refetchSchools(); setForm((f: any) => ({ ...f, school: String(entity.id) })); }
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  User,
  GraduationCap,
  MapPin,
  School,
  Car,
  Phone,
  BookOpen,
  Users,
  Hash,
  type LucideIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const shiftLabel = (shift?: string | number | null): string => {
  if (!shift) return '';
  const map: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
    full_time: 'Integral',
    integral: 'Integral',
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
    '1': 'Manhã',
    '2': 'Tarde',
    '3': 'Noite',
  };
  return map[String(shift).toLowerCase()] ?? String(shift);
};

const shiftColor = (shift?: string | number | null): string => {
  const s = String(shift ?? '').toLowerCase();
  if (['morning', 'manha', '1'].includes(s)) return 'bg-blue-100 text-blue-700';
  if (['afternoon', 'tarde', '2'].includes(s)) return 'bg-amber-100 text-amber-700';
  if (['evening', 'noite', '3'].includes(s)) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-600';
};

const initial = (name?: string | null) =>
  (name ?? '?').trim().charAt(0).toUpperCase();

/* ------------------------------------------------------------------ */
/*  StudentMiniCard                                                    */
/* ------------------------------------------------------------------ */

interface StudentMiniCardProps {
  student: any;
  onClick?: () => void;
}

export const StudentMiniCard: React.FC<StudentMiniCardProps> = ({ student, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F2B5B] text-sm font-semibold text-white">
      {initial(student?.name)}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{student?.name ?? '—'}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {student?.enrollment && <span>Mat. {student.enrollment}</span>}
        {student?.grade && (
          <span>
            {student.grade}
            {student.className ? ` - ${student.className}` : ''}
          </span>
        )}
        {student?.shift && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${shiftColor(student.shift)}`}>
            {shiftLabel(student.shift)}
          </span>
        )}
        {student?.schoolName && (
          <span className="flex items-center gap-0.5">
            <School className="h-3 w-3" />
            {student.schoolName}
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  ClassMiniCard                                                      */
/* ------------------------------------------------------------------ */

interface ClassMiniCardProps {
  cls: any;
  onClick?: () => void;
}

export const ClassMiniCard: React.FC<ClassMiniCardProps> = ({ cls, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${shiftColor(cls?.shift)}`}>
      <GraduationCap className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">
        {cls?.grade ?? '—'}
        {cls?.className ? ` - ${cls.className}` : ''}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {cls?.shift && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${shiftColor(cls.shift)}`}>
            {shiftLabel(cls.shift)}
          </span>
        )}
        {cls?.teacherName && (
          <span className="flex items-center gap-0.5">
            <User className="h-3 w-3" />
            {cls.teacherName}
          </span>
        )}
        {cls?.enrollmentCount != null && (
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {cls.enrollmentCount} alunos
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  RouteMiniCard                                                      */
/* ------------------------------------------------------------------ */

interface RouteMiniCardProps {
  route: any;
  onClick?: () => void;
}

export const RouteMiniCard: React.FC<RouteMiniCardProps> = ({ route, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
      <Bus className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{route?.name ?? '—'}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {route?.code && (
          <span className="flex items-center gap-0.5">
            <Hash className="h-3 w-3" />
            {route.code}
          </span>
        )}
        {route?.vehiclePlate && (
          <span className="flex items-center gap-0.5">
            <Car className="h-3 w-3" />
            {route.vehiclePlate}
          </span>
        )}
        {route?.driverName && (
          <span className="flex items-center gap-0.5">
            <User className="h-3 w-3" />
            {route.driverName}
          </span>
        )}
        {route?.stopCount != null && <span>{route.stopCount} paradas</span>}
        {route?.studentCount != null && (
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {route.studentCount}
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  TeacherMiniCard                                                    */
/* ------------------------------------------------------------------ */

interface TeacherMiniCardProps {
  teacher: any;
  onClick?: () => void;
}

export const TeacherMiniCard: React.FC<TeacherMiniCardProps> = ({ teacher, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
      {initial(teacher?.name)}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{teacher?.name ?? '—'}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {teacher?.subjects && (
          <span className="flex items-center gap-0.5">
            <BookOpen className="h-3 w-3" />
            {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : teacher.subjects}
          </span>
        )}
        {teacher?.classesCount != null && (
          <span className="flex items-center gap-0.5">
            <GraduationCap className="h-3 w-3" />
            {teacher.classesCount} turmas
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  SchoolMiniCard                                                     */
/* ------------------------------------------------------------------ */

interface SchoolMiniCardProps {
  school: any;
  onClick?: () => void;
}

export const SchoolMiniCard: React.FC<SchoolMiniCardProps> = ({ school, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F2B5B] text-sm text-white">
      <School className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{school?.name ?? '—'}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {school?.inepCode && <span>INEP {school.inepCode}</span>}
        {school?.type && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            {school.type}
          </span>
        )}
        {school?.directorName && (
          <span className="flex items-center gap-0.5">
            <User className="h-3 w-3" />
            {school.directorName}
          </span>
        )}
        {school?.phone && (
          <span className="flex items-center gap-0.5">
            <Phone className="h-3 w-3" />
            {school.phone}
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  DriverMiniCard                                                     */
/* ------------------------------------------------------------------ */

interface DriverMiniCardProps {
  driver: any;
  onClick?: () => void;
}

export const DriverMiniCard: React.FC<DriverMiniCardProps> = ({ driver, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
      {initial(driver?.name)}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{driver?.name ?? '—'}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {driver?.phone && (
          <span className="flex items-center gap-0.5">
            <Phone className="h-3 w-3" />
            {driver.phone}
          </span>
        )}
        {driver?.cnhCategory && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            CNH {driver.cnhCategory}
          </span>
        )}
        {driver?.vehiclePlate && (
          <span className="flex items-center gap-0.5">
            <Car className="h-3 w-3" />
            {driver.vehiclePlate}
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  VehicleMiniCard                                                    */
/* ------------------------------------------------------------------ */

interface VehicleMiniCardProps {
  vehicle: any;
  onClick?: () => void;
}

export const VehicleMiniCard: React.FC<VehicleMiniCardProps> = ({ vehicle, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition ${
      onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
      <Car className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{vehicle?.plate ?? '—'}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {vehicle?.nickname && <span>{vehicle.nickname}</span>}
        {vehicle?.model && <span>{vehicle.model}</span>}
        {vehicle?.capacity != null && (
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {vehicle.capacity} lugares
          </span>
        )}
        {vehicle?.year && <span>{vehicle.year}</span>}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  QuickActionButton                                                  */
/* ------------------------------------------------------------------ */

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  to: string;
  searchParams?: Record<string, string>;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  to,
  searchParams,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    let path = to;
    if (searchParams && Object.keys(searchParams).length > 0) {
      const qs = new URLSearchParams(searchParams).toString();
      path = `${to}?${qs}`;
    }
    navigate(path);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F2B5B] shadow-sm transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
};

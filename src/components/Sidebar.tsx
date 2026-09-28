import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Layers,
  LogOut,
  Menu,
  Palmtree,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  const closeOnMobile = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeOnMobile}
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/" onClick={closeOnMobile} className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white shadow-md shadow-brand-500/20">
            <Calendar className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Appoint<span className="text-brand-600">Ease</span>
          </span>
        </Link>

        <nav className="space-y-1" aria-label="Application navigation">
          {user?.role === 'CUSTOMER' && (
            <>
              <NavLink to="/services" onClick={closeOnMobile} className={linkClass}>
                <Layers className="h-4 w-4" /> Services
              </NavLink>
              <NavLink to="/providers" onClick={closeOnMobile} className={linkClass}>
                <Users className="h-4 w-4" /> Providers
              </NavLink>
              <NavLink to="/book" onClick={closeOnMobile} className={linkClass}>
                <CalendarCheck className="h-4 w-4" /> Book appointment
              </NavLink>
              <NavLink to="/my-bookings" onClick={closeOnMobile} className={linkClass}>
                <Calendar className="h-4 w-4" /> My bookings
              </NavLink>
            </>
          )}

          {user?.role === 'PROVIDER' && (
            <>
              <NavLink to="/appointments" onClick={closeOnMobile} className={linkClass}>
                <Calendar className="h-4 w-4" /> Appointments
              </NavLink>
              <NavLink to="/hours" onClick={closeOnMobile} className={linkClass}>
                <Clock className="h-4 w-4" /> Working hours
              </NavLink>
              <NavLink to="/time-off" onClick={closeOnMobile} className={linkClass}>
                <Palmtree className="h-4 w-4" /> Time off
              </NavLink>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <NavLink to="/services" onClick={closeOnMobile} className={linkClass}>
                <Layers className="h-4 w-4" /> Services
              </NavLink>
              <NavLink to="/providers" onClick={closeOnMobile} className={linkClass}>
                <Users className="h-4 w-4" /> Providers
              </NavLink>
              <NavLink to="/bookings" onClick={closeOnMobile} className={linkClass}>
                <Calendar className="h-4 w-4" /> Bookings
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
          <NavLink to="/profile" onClick={closeOnMobile} className={linkClass}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {user?.first_name ? user.first_name[0] : user?.email[0].toUpperCase()}
            </span>
            <span className="min-w-0 truncate">{user?.first_name || user?.email}</span>
            <User className="ml-auto h-4 w-4" />
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>
    </>
  );
};
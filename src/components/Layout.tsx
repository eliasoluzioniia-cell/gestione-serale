import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ session }: { session: any }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Con Neon, il ruolo è in session.user.ruolo (non più in user_metadata)
  const role = (session.user.ruolo || session.user.user_metadata?.role || 'studente').toLowerCase()
  const email = session.user.email

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#f7f9fb] dark:bg-slate-950 flex flex-col py-8 px-4 gap-2 z-50 border-r border-surface-variant">
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight font-headline">Gestione Corsi Serali</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Management Suite</p>
        </div>
        
        <nav className="flex-1 flex flex-col gap-1">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white dark:bg-slate-900 border-l-4 border-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}>
            <span className="material-symbols-outlined text-[20px]" data-icon="dashboard">dashboard</span>
            <span>Bacheca</span>
          </NavLink>
          
          {(role === 'docente' || role === 'admin' || role === 'tutor') && (
            <>
              <NavLink to="/classi" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
                <span className="material-symbols-outlined text-[20px]" data-icon="groups">groups</span>
                <span>Gestione Classi</span>
              </NavLink>

              {(role === 'admin' || role === 'tutor') && (
                <NavLink to="/utenti" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
                  <span className="material-symbols-outlined text-[20px]" data-icon="manage_accounts">manage_accounts</span>
                  <span>Gestione Utenti</span>
                </NavLink>
              )}

              <NavLink to="/studenti" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
                <span className="material-symbols-outlined text-[20px]" data-icon="person">person</span>
                <span>Anagrafe Studenti</span>
              </NavLink>
              
              <NavLink to="/materie" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
                <span className="material-symbols-outlined text-[20px]" data-icon="menu_book">menu_book</span>
                <span>Materie</span>
              </NavLink>

              <NavLink to="/curriculo-gestione" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
                <span className="material-symbols-outlined text-[20px]" data-icon="library_books">library_books</span>
                <span>Gestione Curricolo</span>
              </NavLink>

              <NavLink to="/configurazioni" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
                <span className="material-symbols-outlined text-[20px]" data-icon="settings">settings</span>
                <span>Configurazioni</span>
              </NavLink>
            </>
          )}

          <NavLink to="/voti" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
            <span className="material-symbols-outlined text-[20px]" data-icon="menu_book">menu_book</span>
            <span>Registro Voti</span>
          </NavLink>

          <NavLink to="/tabellone" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
            <span className="material-symbols-outlined text-[20px]" data-icon="assignment_turned_in">assignment_turned_in</span>
            <span>Tabellone Competenze</span>
          </NavLink>

          <NavLink to="/calendario" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? 'text-primary bg-white border-l-4 border-primary shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'}`}>
            <span className="material-symbols-outlined text-[20px]" data-icon="event_note">event_note</span>
            <span>Calendario Lezioni</span>
          </NavLink>
        </nav>
        
        <div className="mt-auto flex flex-col gap-1 border-t border-surface-variant pt-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-error hover:bg-error-container/50 rounded-lg transition-all w-full text-left">
            <span className="material-symbols-outlined text-[20px]" data-icon="logout">logout</span>
            <span>Disconnetti</span>
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="ml-72 min-h-screen flex flex-col">
        {/* TopAppBar Shell */}
        <header className="sticky top-0 z-40 h-16 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-variant flex justify-between items-center px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 max-w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body text-on-surface" placeholder="Cerca classi, studenti o documenti..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-500 hover:text-primary transition-colors relative">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-surface-variant">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface leading-none">{email}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-lg font-headline border-2 border-primary-container/20">
                {email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

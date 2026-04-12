import { NavLink } from "react-router-dom";
import logo from "@/assets/logo-dark.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/invoices", label: "Faktúry", icon: "receipt_long" },
  { to: "/clients", label: "Klienti", icon: "people" },
  { to: "/settings", label: "Nastavenia", icon: "settings" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col">
      <div className="p-6 pb-4">
        <img src={logo} alt="Noveris Legal" className="h-8 w-auto" />
      </div>

      <div className="px-4 pb-4">
        <NavLink to="/invoices/new">
          <button
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm"
            style={{ background: "linear-gradient(45deg, #6d5b47, #c6af97)" }}
          >
            Nová faktúra
          </button>
        </NavLink>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 mb-1 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:bg-surface-container",
              ].join(" ")
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

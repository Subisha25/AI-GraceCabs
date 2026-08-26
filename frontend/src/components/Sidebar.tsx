import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faCar, faClipboardList,
  faUsers, faUserTie, faFileInvoice, faChartBar,
  faChevronDown, faChevronRight, faPlus, faList,
  faBuilding, faBoxOpen, faUser, faTruck, faCarSide,
  faCarAlt, faMoneyBillWave, faCheckCircle,
  faCalendarAlt, faFileLines, faCog, faHandshake,
  faIdCard, faRoute, faUserShield, faLayerGroup,
  faCreditCard, faSignOutAlt, faCalculator
} from '@fortawesome/free-solid-svg-icons';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  label: string;
  path?: string;
  icon: any;
  children?: MenuItem[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPERADMIN / OPERATOR ADMIN MENU
// Commercial Fleet & Transport Management Platform
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const superadminMenu: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: faTachometerAlt,
    path: '/dashboard',
  },

  // ── BOOKINGS ──────────────────────────────────
  {
    label: 'Bookings',
    icon: faClipboardList,
    children: [
      { label: 'New Booking',   path: '/bookings/add',  icon: faPlus },
      { label: 'All Bookings',  path: '/bookings',       icon: faList },
    ]
  },

  // ── ORGANIZATIONS ─────────────────────────────
  {
    label: 'Organizations',
    icon: faBuilding,
    children: [
      { label: 'All Organizations', path: '/organizations',      icon: faList },
      { label: 'Add Organization',  path: '/organizations/add',  icon: faPlus },
      { label: 'Org Users',         path: '/organizations/users',  icon: faUsers },
      { label: 'Add Org User',      path: '/organizations/users/add', icon: faUserTie },
    ]
  },

  // ── VEHICLES ──────────────────────────────────
  {
    label: 'Vehicles',
    icon: faCar,
    path: '/fleet/vehicles',
  },

  // ── DRIVERS ───────────────────────────────────
  {
    label: 'Drivers',
    icon: faUserShield,
    children: [
      { label: 'All Drivers', path: '/fleet/drivers',     icon: faList },
      { label: 'Add Driver',  path: '/fleet/drivers/add', icon: faPlus },
    ]
  },

  // ── CONTRACTS ─────────────────────────────────
  {
    label: 'Contracts',
    icon: faHandshake,
    children: [
      { label: 'All Contracts', path: '/contracts',     icon: faList },
      { label: 'Add Contract',  path: '/contracts/add',  icon: faPlus },
    ]
  },

  // ── MONTHLY BILLING ───────────────────────────
  {
    label: 'Monthly Billing',
    icon: faCalculator,
    path: '/admin/monthly-billing',
  },

  // ── INVOICES & PAYMENTS ───────────────────────
  {
    label: 'Invoices & Payments',
    icon: faFileInvoice,
    children: [
      { label: 'Invoices Ledger',   path: '/invoices',  icon: faList },
      { label: 'Payments History',  path: '/payments',  icon: faCreditCard },
    ]
  },

  // ── REPORTS ───────────────────────────────────
  {
    label: 'Reports',
    icon: faChartBar,
    path: '/reports',
  },

  // ── SETTINGS ──────────────────────────────────
  {
    label: 'Settings',
    icon: faCog,
    children: [
      { label: 'Payment Modes',   path: '/paymentmode/list',       icon: faMoneyBillWave },
      { label: 'Tax Rates',       path: '/master/tax/list',        icon: faFileLines },
      { label: 'Pickup Cities',   path: '/master/pickupcity/list', icon: faRoute },
      { label: 'Email Config',    path: '/configuration/email',    icon: faFileLines },
    ]
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORGANIZATION MANAGER MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const managerMenu: MenuItem[] = [
  { label: 'Dashboard',   icon: faTachometerAlt, path: '/dashboard' },
  { label: 'New Booking', icon: faPlus,          path: '/booking/create' },
  {
    label: 'Bookings',
    icon: faClipboardList,
    children: [
      { label: 'My Requests',          path: '/orders/my-requests', icon: faList },
      { label: 'Scheduled / Recurring',path: '/orders/scheduled',   icon: faCalendarAlt },
    ]
  },
  {
    label: 'Passengers',
    icon: faUsers,
    children: [
      { label: 'Add Passenger',   path: '/users/adduser', icon: faUserTie },
      { label: 'Passenger List',  path: '/users/list',    icon: faUsers },
    ]
  },
  { label: 'Invoices', icon: faFileInvoice, path: '/invoice/pending' },
  { label: 'Reports',  icon: faChartBar,    path: '/reports/company-order-summary' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOMER / USER MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const userMenu: MenuItem[] = [
  { label: 'Dashboard',   icon: faTachometerAlt, path: '/customer/dashboard' },
  { label: 'Book a Cab',  icon: faPlus,          path: '/customer/book' },
  { label: 'My Bookings', icon: faClipboardList, path: '/customer/bookings' },
  { label: 'Track Ride',  icon: faRoute,         path: '/customer/track' },
  { label: 'Invoices',    icon: faFileInvoice,   path: '/customer/invoices' },
  { label: 'Payments',    icon: faCreditCard,    path: '/customer/payments' },
  { label: 'Profile',     icon: faUser,          path: '/customer/profile' },
  { label: 'Logout',      icon: faSignOutAlt,    path: '/logout' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DRIVER MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const driverMenu: MenuItem[] = [
  { label: 'Dashboard',    icon: faTachometerAlt, path: '/dashboard' },
  { label: 'My Trips',     icon: faTruck,         path: '/drivers/assignedlist' },
  { label: 'Trip History', icon: faCheckCircle,   path: '/drivers/tripdetails' },
];

const getMenuByRole = (role: string): MenuItem[] => {
  const r = (role || '').toLowerCase();
  if (['superadmin', 'admin', 'accountant', 'manager'].includes(r)) {
    return superadminMenu;
  }
  if (r === 'driver') {
    return driverMenu;
  }
  return userMenu;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIDEBAR COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string[]>([]);
  const userRole = localStorage.getItem('role') || '';
  const menu = getMenuByRole(userRole);

  const handleLogout = () => {
    const confirm = window.confirm('Are you sure you want to logout?');
    if (!confirm) return;
    logout();
    if (userRole === 'customer') {
      navigate('/login');
    } else {
      navigate('/adminlogin');
    }
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isOpen = (label: string) => openDropdown.includes(label);

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col shadow-xl z-40 bg-[#1a3a52] text-[#e8eef2] w-64"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* ── Logo / Brand ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <img
          src="/images/favicon1.jpeg"
          alt="Fleet Platform"
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30"
        />
        <div className="leading-tight">
          <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Fleet Platform</p>
          <p className="text-sm font-bold text-white">Transport Management</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <ul className="space-y-0.5 px-2">
          {menu.map((item) => (
            <li key={item.label}>
              {item.path === '/logout' ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-[#b0c4d4] hover:bg-white/8 hover:text-white transition-all duration-150"
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </button>
              ) : item.children ? (
                <>
                  {/* Group header button */}
                  <button
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isOpen(item.label)
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/8 text-[#b0c4d4] hover:text-white'
                    }`}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4 mr-3 shrink-0 opacity-80" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <FontAwesomeIcon
                      icon={isOpen(item.label) ? faChevronDown : faChevronRight}
                      className="w-3 h-3 opacity-60 transition-transform duration-200"
                    />
                  </button>

                  {/* Children */}
                  {isOpen(item.label) && (
                    <ul className="mt-0.5 ml-5 space-y-0.5 border-l border-white/10 pl-2">
                      {item.children.map((sub) => (
                        <li key={sub.label}>
                          <NavLink
                            to={sub.path || '#'}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                                isActive
                                  ? 'bg-[#3b82f6] text-white shadow-sm'
                                  : 'text-[#94b4c7] hover:bg-white/8 hover:text-white'
                              }`
                            }
                          >
                            <FontAwesomeIcon icon={sub.icon} className="w-3.5 h-3.5 shrink-0" />
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // Single link item
                <NavLink
                  to={item.path || '#'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#3b82f6] text-white shadow-sm'
                        : 'text-[#b0c4d4] hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 text-center uppercase tracking-widest">
          Fleet & Transport Platform
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

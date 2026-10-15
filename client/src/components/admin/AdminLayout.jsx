import { NavLink, Outlet } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="adm">
      <aside className="adm__side">
        <Logo tone="light" showTagline={false} />
        <nav aria-label="Admin">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/">View store</NavLink>
        </nav>
        <div className="adm__user">
          <span>{user.full_name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="adm__main">
        <Outlet />
      </main>
    </div>
  );
}

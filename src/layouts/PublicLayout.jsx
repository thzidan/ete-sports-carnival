import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="page-shell pt-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

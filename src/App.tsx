import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import HomePage from '@/pages/HomePage';
import ModelsPage from '@/pages/ModelsPage';
import ProductPage from '@/pages/ProductPage';
import StudioPage from '@/pages/StudioPage';
import CollectionsPage from '@/pages/CollectionsPage';
import CollectionPage from '@/pages/CollectionPage';
import FreeModelsPage from '@/pages/FreeModelsPage';
import CartPage from '@/pages/CartPage';
import FavoritesPage from '@/pages/FavoritesPage';
import LoginPage from '@/pages/LoginPage';
import AccountPage from '@/pages/AccountPage';
import OrdersPage from '@/pages/OrdersPage';
import { useAuth } from '@/lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/models" element={<ModelsPage />} />
        <Route path="/models/:slug" element={<ProductPage />} />

        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collection/:slug" element={<CollectionPage />} />

        <Route path="/free-models" element={<FreeModelsPage />} />

        <Route path="/studio" element={<StudioPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
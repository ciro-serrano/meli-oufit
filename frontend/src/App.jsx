import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import AdminLogin from "./pages/AdminLogin";
import AdminHome from "./pages/AdminHome";
import RequireAdmin from "./components/RequireAdmin";
import AdminProductForm from "./pages/AdminProductForm";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ top: 72 }} // altura del header + un respiro
        toastOptions={{
          duration: 2500,
          style: {
            background: "#FBF4EC",
            color: "#5C1A2B",
            border: "1px solid #3F7D58",
            fontFamily: "Jost, sans-serif",
          },
          success: { iconTheme: { primary: "#3F7D58", secondary: "#FBF4EC" } },
        }}
      />
      <Header />
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/producto/:slug" element={<ProductPage />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/productos/nuevo" element={<AdminProductForm />} />
          <Route path="/admin/productos/:id" element={<AdminProductForm />} />
        </Route>
      </Routes>
    </>
  );
}

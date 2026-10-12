import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/producto/:slug" element={<ProductPage />} />
        <Route path="/carrito" element={<Cart />} />
      </Routes>
    </>
  );
}

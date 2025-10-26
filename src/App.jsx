import CustomerTable from "./components/CustomerTable.jsx";
import companyLogo from "./assets/doubletick-logo.png"
export default function App() {
  return (
    <div className="app">
      <header className="app-header">
         <img src={companyLogo} alt="DoubleTick Logo" className="app-logo" />
      </header>
      <main>
        <CustomerTable />
      </main>
    </div>
  );
}

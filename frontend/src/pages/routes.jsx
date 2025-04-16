import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import CreateRebate from "./CreateRebate";
import ViewRebates from "./ViewRebates";
import StudentsList from "../components/StudentsList";
import Statistics from "./Statistics";
import EditRebates from "./EditRebates";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />}>
          <Route index element={<CreateRebate />} />
          <Route path="createrebate" element={<CreateRebate />} />
          <Route path="viewrebates" element={<ViewRebates />} />
          <Route path="editrebates" element={<EditRebates />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}

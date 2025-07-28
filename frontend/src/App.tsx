import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { Agents } from "./pages/Agents";
import { CreateAgent } from "./pages/CreateAgent";
import { AgentDetails } from "./pages/AgentDetails";

export const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agent/:id" element={<AgentDetails />} />
        <Route path="/create" element={<CreateAgent />} />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
      </Routes>
    </>
  );
};

import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { Agents } from "./pages/Agents";
import { CreateAgent } from "./pages/CreateAgent";
import { AgentDetails } from "./pages/AgentDetails";
import { GetTelegramCode } from "./pages/GetTelegramCode";
import { ConfirmTelegramCode } from "./pages/ConfirmTelegramCode";
import { Documentation } from "./pages/Documentation";
import { Contacts } from "./pages/Contacts";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agent/:id" element={<AgentDetails />} />
        <Route path="/get-telegram-code" element={<GetTelegramCode />} />
        <Route
          path="/confirm-telegram-code"
          element={<ConfirmTelegramCode />}
        />
        <Route path="/create" element={<CreateAgent />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route
          path="/sso-callback"
          element={
            <AuthenticateWithRedirectCallback
              signUpForceRedirectUrl={"/auth-callback"}
            />
          }
        />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
      </Routes>
    </>
  );
};

import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import express from "express";

const app = express();
app.use(express.json());

const PORT = 3000;

app.post("/auth/sendCode", async (req, res) => {
  const { phone, apiId, apiHash } = req.body;
  const client = new TelegramClient(new StringSession(""), apiId, apiHash);
  await client.connect();

  try {
    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: phone,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({}),
      })
    );

    res.json({
      session: client.session.save(),
      phoneCodeHash: result.phoneCodeHash,
    });
  } catch (err) {
    console.error("SendCode error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Подтверждение кода (и 2FA при необходимости)
app.post("/auth/confirmCode", async (req, res) => {
  const { phoneCodeHash, apiId, apiHash, phone, session, code, password } =
    req.body;
  const client = new TelegramClient(new StringSession(session), apiId, apiHash);
  await client.connect();

  try {
    // Попытка обычного входа по SMS
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code,
      })
    );

    res.json({ ok: true, session: client.session.save() });
  } catch (err) {
    if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
      // Обработка 2FA
      try {
        await client.signInWithPassword(
          { apiId, apiHash },
          {
            password: async () => password,
            onError: (e) => console.error("2FA error:", e),
          }
        );

        res.json({ ok: true, session: client.session.save() });
      } catch (passErr) {
        res.status(401).json({
          error: "Invalid 2FA password",
          details: passErr.message,
        });
      }
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

export const sendCode = async (req, res, next) => {
  const { apiId, apiHash, phone } = req.body;

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
    next(err);
  }
};

export const confirmCode = async (req, res, next) => {
  const { phoneCodeHash, apiId, apiHash, phone, session, code, password } =
    req.body;

  const client = new TelegramClient(new StringSession(session), apiId, apiHash);
  await client.connect();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code.toString(),
      })
    );

    res.json({ ok: true, session: client.session.save() });
  } catch (err) {
    if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
      if (!password || typeof password !== "string") {
        return res.status(401).json({ error: "2FA password required" });
      }

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
};

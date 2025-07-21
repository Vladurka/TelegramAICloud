import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

export const sendCode = async (req, res) => {
  const { phone, apiId, apiHash } = req.body;

  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'phone'" });
  }
  if (!apiId || typeof apiId !== "number") {
    return res.status(400).json({ error: "Missing or invalid 'apiId'" });
  }
  if (!apiHash || typeof apiHash !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'apiHash'" });
  }

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
};

export const confirmCode = async (req, res) => {
  const { phoneCodeHash, apiId, apiHash, phone, session, code, password } =
    req.body;

  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'phone'" });
  }
  if (!apiId || typeof apiId !== "number") {
    return res.status(400).json({ error: "Missing or invalid 'apiId'" });
  }
  if (!apiHash || typeof apiHash !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'apiHash'" });
  }
  if (!phoneCodeHash || typeof phoneCodeHash !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'phoneCodeHash'" });
  }
  if (!session || typeof session !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'session'" });
  }
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'code'" });
  }

  const client = new TelegramClient(new StringSession(session), apiId, apiHash);
  await client.connect();

  try {
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

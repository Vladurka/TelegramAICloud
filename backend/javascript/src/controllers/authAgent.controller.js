import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { User } from "../models/user.model.js";
import { redis } from "../lib/redis.js";

const key = "temp";

export const sendCode = async (req, res, next) => {
  const { clerkId, apiId, apiHash, phone } = req.body;

  const client = new TelegramClient(new StringSession(""), apiId, apiHash);
  await client.connect();

  try {
    if (!(await User.exists({ clerkId }))) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: phone,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({}),
      })
    );

    await redis.hset(`${key}${clerkId}`, {
      apiId: apiId.toString(),
      apiHash: apiHash,
      phone: phone,
      phoneCodeHash: result.phoneCodeHash,
    });

    await redis.expire(`${key}${clerkId}`, 15 * 60);

    return res.status(200).json({
      session: client.session.save(),
      phoneCodeHash: result.phoneCodeHash,
    });
  } catch (err) {
    if (err.message.includes("PHONE_PASSWORD_FLOOD")) {
      return res
        .status(429)
        .json({ error: "Too many requests. Try again later." });
    }
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
    if (err.errorMessage.includes("SESSION_PASSWORD_NEEDED")) {
      if (!password || typeof password !== "string") {
        return res.status(400).json({
          error: "2FA password required",
        });
      }

      try {
        await client.signInWithPassword(
          { apiId, apiHash },
          {
            password: async () => password,
            onError: (e) => {
              throw new Error(e.message);
            },
          }
        );

        res.status(200).json({ ok: true, session: client.session.save() });
      } catch (passErr) {
        res.status(401).json({ error: "Invalid 2FA password" });
      }
    }
    next(err);
  }
};

export const getTempData = async (req, res, next) => {
  const { clerkId } = req.params;
  try {
    const data = await redis.hgetall(`${key}${clerkId}`);
    res.status(200).json({
      apiId: Number(data.apiId),
      apiHash: data.apiHash,
      phone: data.phone,
      phoneHash: data.phoneCodeHash,
    });
  } catch (err) {
    next(err);
  }
};

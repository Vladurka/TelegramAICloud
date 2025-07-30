import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Navbar } from "../components/Navbar";

export const Documentation = () => {
  return (
    <>
      <Navbar />
      <section className="min-h-screen px-6 py-20 bg-background text-foreground flex justify-center mt-10">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              📖 Telegram Agent Setup Guide
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-sm leading-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                1. Create a Telegram App
              </h2>
              <p>
                Visit{" "}
                <a
                  href="https://my.telegram.org/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  my.telegram.org/apps
                </a>{" "}
                and log in using your Telegram account.
              </p>
              <p className="mt-2">
                Fill out the form (App Title, Short Name, etc.) to create an
                app.
              </p>
              <p>
                After that, you’ll receive your <strong>API ID</strong> and{" "}
                <strong>API Hash</strong>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">
                2. Required Fields Explained
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>API ID</strong>: Unique numeric identifier for your
                  app, received from Telegram.
                </li>
                <li>
                  <strong>API Hash</strong>: Secret key paired with your API ID.
                  Keep this private.
                </li>
                <li>
                  <strong>Phone</strong>: Your Telegram phone number (e.g.{" "}
                  <code>+1234567890</code>).
                </li>
                <li>
                  <strong>Typing Time</strong>: Time (in seconds) it takes the
                  agent to type one character.
                </li>
                <li>
                  <strong>Reaction Time</strong>: Delay (in seconds) before the
                  agent starts typing after receiving a message.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">
                3. Confirming Your Code
              </h2>
              <p>
                After entering your phone number, you will receive a code from
                Telegram. Use this to confirm and generate a session string.
              </p>
              <p>
                This session is required to authorize your agent to interact
                with Telegram on your behalf.
              </p>
            </div>

            <div className="pt-4 text-muted-foreground text-sm text-center">
              Need help?{" "}
              <a href="/contacts" className="text-blue-500 underline">
                Contact support
              </a>{" "}
              or refer to the official Telegram documentation.
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
};

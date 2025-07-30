import React, { useState } from "react";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import emailjs from "emailjs-com";
import { Navbar } from "../components/Navbar";
import { useForm } from "react-hook-form";

export const Contacts = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    policy: false,
    type: "",
  });
  const [succeed, setSucceed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { reset } = useForm();

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSucceed(null);
    setError(null);

    try {
      emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          title: `${form.type} from ${form.name}`,
          name: form.name,
          email: form.email,
          message: form.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      setSucceed("Your message has been sent successfully!");
      setForm({
        name: "",
        email: "",
        message: "",
        policy: false,
        type: "",
      });
    } catch (err) {
      setError("Failed to send message. Please try again later.");
    } finally {
      reset();
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-[10%] flex items-start justify-center min-h-screen bg-[#18181b] p-10 text-white">
        <div
          className="w-[420px] bg-[#2A2A2C]/70 rounded-[60px] mr-10 flex flex-col items-center justify-center relative shadow-lg p-8"
          style={{ boxShadow: "0 4px 24px 0 rgba(38,38,230,0.15)" }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full space-y-5"
          >
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              className="p-3 rounded-xl border border-gray-700 bg-[#18181b] text-white"
            >
              <option value="" disabled>
                Select message type
              </option>
              <option value="Bug Report">🐞 Bug Report</option>
              <option value="Feature Request">💡 Feature Request</option>
              <option value="General Question">❓ General Question</option>
            </select>

            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              className="p-3 rounded-xl border border-gray-700 bg-[#18181b] text-white placeholder-gray-400"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="p-3 rounded-xl border border-gray-700 bg-[#18181b] text-white placeholder-gray-400"
            />
            <textarea
              name="message"
              placeholder="Message"
              value={form.message}
              onChange={handleChange}
              required
              className="p-3 rounded-xl border border-gray-700 bg-[#18181b] text-white placeholder-gray-400 min-h-[100px]"
            />
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                name="policy"
                checked={form.policy}
                onChange={handleChange}
                required
                className="accent-[#c4ad92]"
              />
              <span>I agree with the privacy policy</span>
            </label>
            <button
              type="submit"
              className="bg-[#18181b] text-white font-bold py-3 rounded-xl hover:opacity-80 transition cursor-pointer shadow-lg border border-gray-700"
            >
              Send
            </button>
          </form>

          {(error || succeed) && (
            <div
              className={`mt-4 px-4 py-2 rounded-xl text-center text-sm font-medium ${
                succeed ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {succeed || error}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-5xl font-bold mb-8 text-blue-400">Contact us</h1>

          <div className="flex space-x-4 mb-10">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18181b] rounded-xl p-4 hover:opacity-80"
            >
              <Facebook className="text-white text-xl" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18181b] rounded-xl p-4 hover:opacity-80"
            >
              <Twitter className="text-white text-xl" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18181b] rounded-xl p-4 hover:opacity-80"
            >
              <Instagram className="text-white text-xl" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18181b] rounded-xl p-4 hover:opacity-80"
            >
              <Linkedin className="text-white text-xl" />
            </a>
          </div>

          <ul className="list-disc list-inside space-y-2 text-lg text-gray-300">
            <li>Phone: +420 123 456 789</li>
            <li>Email: info@company.com</li>
          </ul>
        </div>
      </div>
    </>
  );
};

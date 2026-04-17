"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Lock,
  Palette,
  Globe,
  Save,
  Lock as LockIcon,
} from "lucide-react";
import { useTheme } from "../../components/ThemeProvider";
import { useToast } from "../../components/Toast";

const colorOptions = [
  { name: "Purple", value: "#3F00FF" },
  { name: "Green", value: "#10B981" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Violet", value: "#8B5CF6" },
];

interface Settings {
  venueName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const { theme, toggleTheme, primaryColor, setPrimaryColor, mounted } =
    useTheme();
  const isDark = mounted && theme === "dark";
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    venueName: "",
    email: "",
    phone: "",
    address: "",
    timezone: "Africa/Lagos",
    currency: "NGN",
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    language: "en",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      showToast("Settings saved successfully", "success");
    } catch (error) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-start">
        <div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
          >
            Settings
          </h1>
          <p className={isDark ? "text-slate-400" : "text-slate-600"}>
            Manage your preferences and account settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="hidden lg:flex btn-primary items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === "general" && (
            <div
              className={`card ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"} space-y-6`}
            >
              <h2
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                General Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Venue Name</label>
                  <input
                    type="text"
                    value={settings.venueName}
                    onChange={(e) =>
                      setSettings({ ...settings, venueName: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div className="relative group">
                  <label className="label">Timezone</label>
                  <select value={settings.timezone} className="input" disabled>
                    <option value="Africa/Lagos">Nigeria (Lagos)</option>
                  </select>
                  <div className="hidden group-hover:flex absolute right-3 top-9 text-slate-400">
                    <LockIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative group">
                  <label className="label">Currency</label>
                  <select value={settings.currency} className="input" disabled>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                  <div className="hidden group-hover:flex absolute right-3 top-9 text-slate-400">
                    <LockIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative group">
                  <label className="label">Language</label>
                  <select value={settings.language} className="input" disabled>
                    <option value="en">English</option>
                  </select>
                  <div className="hidden group-hover:flex absolute right-3 top-9 text-slate-400">
                    <LockIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  className="input h-24"
                />
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div
              className={`card ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"} space-y-6`}
            >
              <h2
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <div
                  className={`flex items-center justify-between p-4 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-50"}`}
                >
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      Email Notifications
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Receive updates via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div
                  className={`flex items-center justify-between p-4 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-50"}`}
                >
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      SMS Notifications
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Receive updates via SMS
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          smsNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div
              className={`card ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"} space-y-6`}
            >
              <h2
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Security Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    value={settings.currentPassword}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        currentPassword: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    value={settings.newPassword}
                    onChange={(e) =>
                      setSettings({ ...settings, newPassword: e.target.value })
                    }
                    className="input"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    value={settings.confirmPassword}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  onClick={() =>
                    showToast(
                      "Password update functionality coming soon",
                      "info",
                    )
                  }
                  className="btn-primary"
                >
                  Update Password
                </button>
              </div>

              <hr
                className={isDark ? "border-slate-700" : "border-slate-200"}
              />

              <div className="space-y-4">
                <h3
                  className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  Two-Factor Authentication
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Add an extra layer of security to your account
                </p>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      twoFactorEnabled: !settings.twoFactorEnabled,
                    })
                  }
                  className={`btn-secondary ${settings.twoFactorEnabled ? "bg-green-100 text-green-700" : ""}`}
                >
                  {settings.twoFactorEnabled ? "2FA Enabled" : "Enable 2FA"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div
              className={`card ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"} space-y-6`}
            >
              <h2
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Appearance Settings
              </h2>

              <div
                className={`flex items-center justify-between p-4 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-50"}`}
              >
                <div>
                  <p
                    className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    Dark Mode
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Switch between light and dark theme
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="relative inline-flex items-center cursor-pointer"
                  disabled={!mounted}
                >
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${mounted && theme === "dark" ? "bg-primary" : "bg-slate-300"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${mounted && theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`}
                    />
                  </div>
                </button>
              </div>

              <div>
                <label className="label">Primary Color</label>
                <div className="flex gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className="w-10 h-10 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color.value,
                        outline:
                          primaryColor === color.value
                            ? `3px solid ${color.value}`
                            : "none",
                        outlineOffset: "2px",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex lg:hidden btn-primary items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

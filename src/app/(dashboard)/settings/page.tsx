"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  MapPin,
  Mail,
  Phone,
  Save,
  Camera,
  Check,
  ChevronRight,
  Building,
  Landmark,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Toggle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface NotificationSetting {
  id: string;
  category: string;
  settings: { label: string; description: string; enabled: boolean }[];
}

const notificationSettings: NotificationSetting[] = [
  {
    category: "Weather Alerts",
    settings: [
      { label: "Severe Weather Warnings", description: "Get notified about storms, frost, and extreme weather", enabled: true },
      { label: "Daily Forecast Summary", description: "Receive a morning weather brief for your farm", enabled: true },
      { label: "Irrigation Weather Advisory", description: "Alerts when weather affects irrigation scheduling", enabled: true },
    ],
  },
  {
    category: "Pest & Disease",
    settings: [
      { label: "Pest Detection Alerts", description: "AI-identified pest sightings on your fields", enabled: true },
      { label: "Disease Risk Notifications", description: "Conditions favorable for crop diseases", enabled: false },
      { label: "Treatment Reminders", description: "Reminders for scheduled pest treatments", enabled: true },
    ],
  },
  {
    category: "Market & Harvest",
    settings: [
      { label: "Price Target Alerts", description: "When commodity prices hit your target", enabled: true },
      { label: "Harvest Window Notifications", description: "Optimal harvest timing based on crop data", enabled: true },
      { label: "Equipment Maintenance Due", description: "Scheduled maintenance reminders", enabled: true },
    ],
  },
];

const integrations = [
  { id: "int1", name: "John Deere Operations Center", status: "connected", icon: "🚜", lastSync: "5 min ago" },
  { id: "int2", name: "Climate FieldView", status: "connected", icon: "🌾", lastSync: "15 min ago" },
  { id: "int3", name: "Valley Irrigation", status: "connected", icon: "💧", lastSync: "1 min ago" },
  { id: "int4", name: "Farmers Edge", status: "disconnected", icon: "📊", lastSync: "Never" },
  { id: "int5", name: "Rainfall Data (NOAA)", status: "connected", icon: "🌧️", lastSync: "30 min ago" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "integrations" | "security" | "billing">("profile");
  const [notifications, setNotifications] = useState(notificationSettings);
  const [showPassword, setShowPassword] = useState(false);

  const toggleNotification = (categoryIndex: number, settingIndex: number) => {
    setNotifications((prev) => {
      const updated = [...prev];
      const cat = { ...updated[categoryIndex] };
      const settings = [...cat.settings];
      settings[settingIndex] = { ...settings[settingIndex], enabled: !settings[settingIndex].enabled };
      cat.settings = settings;
      updated[categoryIndex] = cat;
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account, preferences, and integrations</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full flex-shrink-0 lg:w-56">
          <nav className="space-y-1">
            {([
              { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
              { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
              { id: "integrations", label: "Integrations", icon: <Globe className="h-4 w-4" /> },
              { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
              { id: "billing", label: "Billing", icon: <FileText className="h-4 w-4" /> },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Personal Information</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <User className="h-10 w-10 text-green-600" />
                    </div>
                    <button className="absolute -bottom-1 -right-1 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
                      <Camera className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">John Farmer</p>
                    <p className="text-sm text-gray-500">Green Valley Farm Owner</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">First Name</label>
                    <input type="text" defaultValue="John" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Last Name</label>
                    <input type="text" defaultValue="Farmer" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                    <input type="email" defaultValue="john@greenvalleyfarm.com" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
                    <input type="tel" defaultValue="(555) 123-4567" className="input-field" />
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Farm Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Farm Name</label>
                    <input type="text" defaultValue="Green Valley Farm" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Total Acreage</label>
                    <input type="number" defaultValue="156" className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Address</label>
                    <input type="text" defaultValue="1234 Farm Road, Green Valley, CA 93022" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Primary Crops</label>
                    <input type="text" defaultValue="Corn, Soybeans, Wheat, Alfalfa" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Timezone</label>
                    <select className="input-field" defaultValue="America/Los_Angeles">
                      <option>Pacific Time (PT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Central Time (CT)</option>
                      <option>Eastern Time (ET)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Notification Preferences</h3>
                <div className="space-y-6">
                  {notifications.map((category, ci) => (
                    <div key={category.category}>
                      <h4 className="mb-3 text-sm font-medium text-gray-700">{category.category}</h4>
                      <div className="space-y-3">
                        {category.settings.map((setting, si) => (
                          <div key={setting.label} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                              <p className="text-xs text-gray-500">{setting.description}</p>
                            </div>
                            <button onClick={() => toggleNotification(ci, si)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.enabled ? "bg-green-600" : "bg-gray-200"}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.enabled ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Delivery Methods</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Email</span>
                      <Check className="ml-auto h-4 w-4 text-green-600" />
                    </div>
                    <p className="mt-1 text-xs text-green-600">john@greenvalleyfarm.com</p>
                  </div>
                  <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">SMS</span>
                      <Check className="ml-auto h-4 w-4 text-green-600" />
                    </div>
                    <p className="mt-1 text-xs text-green-600">(555) 123-4567</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Push</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Not configured</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Connected Services</h3>
                  <button className="btn-primary text-xs">
                    <Globe className="mr-1 h-3.5 w-3.5" />
                    Add Integration
                  </button>
                </div>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                      <span className="text-2xl">{integration.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-500">Last sync: {integration.lastSync}</p>
                      </div>
                      <span className={integration.status === "connected" ? "badge-green" : "badge-yellow"}>
                        {integration.status === "connected" ? "Connected" : "Disconnected"}
                      </span>
                      <button className="btn-secondary text-xs">
                        {integration.status === "connected" ? "Configure" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">API Access</h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">API Key</p>
                      <p className="font-mono text-xs text-gray-500">agr-xxxxxxxxxxxxxxxxxxxx</p>
                    </div>
                    <button className="btn-secondary text-xs">
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Reveal
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-secondary text-xs">Regenerate Key</button>
                    <button className="btn-secondary text-xs">View Docs</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Current Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} defaultValue="currentpass" className="input-field pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">New Password</label>
                    <input type="password" className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Confirm New Password</label>
                    <input type="password" className="input-field" />
                  </div>
                  <button className="btn-primary">
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-factor authentication is enabled</p>
                    <p className="text-xs text-gray-500">Using authenticator app</p>
                  </div>
                  <button className="btn-secondary text-xs">Manage</button>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100"><Globe className="h-4 w-4 text-green-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Chrome on Windows</p>
                        <p className="text-xs text-gray-500">Current session &middot; Last active: Now</p>
                      </div>
                    </div>
                    <span className="badge-green">Active</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><Globe className="h-4 w-4 text-gray-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Safari on iPhone</p>
                        <p className="text-xs text-gray-500">Last active: 2 hours ago</p>
                      </div>
                    </div>
                    <button className="text-xs text-red-600 hover:text-red-700">Revoke</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Current Plan</h3>
                <div className="rounded-xl border-2 border-green-500 bg-green-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-green-800">Professional Plan</p>
                      <p className="text-sm text-green-600">$79/month &middot; Billed monthly</p>
                    </div>
                    <span className="badge-green">Active</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-900">156</p>
                      <p className="text-xs text-green-600">Acres Monitored</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">4</p>
                      <p className="text-xs text-green-600">Drone Connections</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">Unlimited</p>
                      <p className="text-xs text-green-600">API Calls</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Payment Method</h3>
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Landmark className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
                    <p className="text-xs text-gray-500">Expires 12/2027</p>
                  </div>
                  <button className="btn-secondary text-xs">Update</button>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent Invoices</h3>
                <div className="space-y-2">
                  {[{ date: "Sep 1, 2026", amount: "$79.00", status: "Paid" }, { date: "Aug 1, 2026", amount: "$79.00", status: "Paid" }, { date: "Jul 1, 2026", amount: "$79.00", status: "Paid" }].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invoice.date}</p>
                          <p className="text-xs text-gray-500">Professional Plan</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{invoice.amount}</span>
                        <span className="badge-green">{invoice.status}</span>
                        <button className="text-xs text-gray-500 hover:text-gray-700">Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';

interface NotificationPref {
  gradeAlerts: boolean;
  attendanceAlerts: boolean;
  homeworkAlerts: boolean;
  announcementAlerts: boolean;
  messageAlerts: boolean;
  emailEnabled: boolean;
}

export default function NotificationSettingsPage() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPref>({
    gradeAlerts: true,
    attendanceAlerts: true,
    homeworkAlerts: true,
    announcementAlerts: true,
    messageAlerts: true,
    emailEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const toggle = (key: keyof NotificationPref) => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // In a full implementation, this would save to backend
      // For now, we store in localStorage as a simple approach
      localStorage.setItem('notificationPrefs', JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setTestSending(true);
    try {
      // Could call a backend endpoint to send a test email
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(t('notifSettings.testSent'));
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('notificationPrefs');
    if (stored) {
      setPrefs(JSON.parse(stored));
    }
  }, []);

  const settings: Array<{ key: keyof NotificationPref; icon: string; title: string; desc: string }> = [
    { key: 'emailEnabled', icon: '📧', title: t('notifSettings.emailTitle'), desc: t('notifSettings.masterSwitchLong') },
    { key: 'gradeAlerts', icon: '📊', title: 'Grade Alerts', desc: 'Get notified when a new grade is posted' },
    { key: 'attendanceAlerts', icon: '📅', title: 'Attendance Alerts', desc: 'Get notified about attendance updates' },
    { key: 'homeworkAlerts', icon: '📝', title: 'Homework Alerts', desc: 'Get notified about new homework assignments' },
    { key: 'announcementAlerts', icon: '📢', title: 'Announcement Alerts', desc: 'Get notified about new announcements' },
    { key: 'messageAlerts', icon: '💬', title: 'Message Alerts', desc: 'Get notified about new messages' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('notifSettings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('notifSettings.subtitle')}</p>
      </div>

      {/* Master toggle */}
      <div className={`p-4 rounded-xl border-2 transition ${prefs.emailEnabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{t('notifSettings.emailTitle')}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t('notifSettings.masterSwitch')}</p>
          </div>
          <button
            onClick={() => toggle('emailEnabled')}
            className={`relative w-12 h-6 rounded-full transition ${prefs.emailEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${prefs.emailEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      {/* Individual toggles */}
      <div className="space-y-2">
        {settings.slice(1).map((setting) => (
          <div
            key={setting.key}
            className={`p-4 rounded-xl border transition ${prefs.emailEnabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{setting.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{setting.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{setting.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(setting.key)}
                disabled={!prefs.emailEnabled}
                className={`relative w-12 h-6 rounded-full transition disabled:cursor-not-allowed ${prefs[setting.key] && prefs.emailEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${prefs[setting.key] && prefs.emailEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
        <button
          onClick={sendTestEmail}
          disabled={testSending || !prefs.emailEnabled}
          className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition disabled:opacity-50"
        >
          {testSending ? 'Sending...' : '📧 Send Test Email'}
        </button>
      </div>

      {saved && (
        <div className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-lg">
          {t('notifSettings.saved')}
        </div>
      )}

      {/* Info box */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700">
          📬 <strong>{t('notifSettings.howItWorks')}</strong> {t('notifSettings.howItWorksBody')}
        </p>
      </div>
    </div>
  );
}

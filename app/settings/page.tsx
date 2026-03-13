"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { Mail, MessageSquare, Phone, Settings2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default function Settings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [emailPassword, setEmailPassword] = useState("");
  const [voiceApiKey, setVoiceApiKey] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [webhookTestStatus, setWebhookTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          setSettings(await res.json());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        emailConfig: {
          account: settings.emailConfig.account,
          password: emailPassword || settings.emailConfig.passwordPlaceholder,
          filter: settings.emailConfig.filter,
          frequency: settings.emailConfig.frequency,
        },
        pushConfig: {
          wecomWebhook: settings.pushConfig.wecomWebhook,
          voiceBotApiKey: voiceApiKey || settings.pushConfig.voiceBotApiKeyPlaceholder,
          callTime: settings.pushConfig.callTime,
          receiver: settings.pushConfig.receiver,
        },
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEmailPassword("");
        setVoiceApiKey("");
        alert('设置已保存');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setIsTestingEmail(true);
      setEmailTestStatus("idle");
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: settings.emailConfig.account,
          password: emailPassword || settings.emailConfig.passwordPlaceholder,
        }),
      });
      const result = await res.json();
      setEmailTestStatus(result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Error testing email:', error);
      setEmailTestStatus('error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      setIsTestingWebhook(true);
      setWebhookTestStatus("idle");
      const res = await fetch('/api/settings/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: settings.pushConfig.wecomWebhook }),
      });
      const result = await res.json();
      setWebhookTestStatus(result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Error testing webhook:', error);
      setWebhookTestStatus('error');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  if (!settings) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-slate-900">{t('settings.title')}</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-full xl:max-w-7xl mx-auto w-full">
        {/* 邮件抓取配置 */}
        <Card className="rounded-sm shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">{t('settings.email_config')}</CardTitle>
                <CardDescription>{t('settings.email_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email_account')}</Label>
                <Input
                  id="email"
                  value={settings.emailConfig.account}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailConfig: { ...settings.emailConfig, account: e.target.value }
                  })}
                  placeholder="输入邮箱地址"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('settings.email_password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={settings.emailConfig.passwordPlaceholder || "输入应用专用密码"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter">{t('settings.email_filter')}</Label>
                <Input
                  id="filter"
                  value={settings.emailConfig.filter}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailConfig: { ...settings.emailConfig, filter: e.target.value }
                  })}
                  placeholder="例如: @imigrasi.go.id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">{t('settings.email_freq')}</Label>
                <Select
                  value={settings.emailConfig.frequency.toString()}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    emailConfig: { ...settings.emailConfig, frequency: parseInt(value) }
                  })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="选择频率" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('settings.freq_1m')}</SelectItem>
                    <SelectItem value="5">{t('settings.freq_5m')}</SelectItem>
                    <SelectItem value="15">{t('settings.freq_15m')}</SelectItem>
                    <SelectItem value="30">{t('settings.freq_30m')}</SelectItem>
                    <SelectItem value="60">{t('settings.freq_60m')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTestingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.testing')}
                  </>
                ) : (
                  t('settings.test_conn')
                )}
              </Button>

              {emailTestStatus === "success" && (
                <div className="flex items-center text-sm text-green-600 font-medium">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {t('settings.test_success')}
                </div>
              )}
              {emailTestStatus === "error" && (
                <div className="flex items-center text-sm text-red-600 font-medium">
                  <AlertCircle className="mr-1.5 h-4 w-4" />
                  {t('settings.test_error')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 推送通道配置 */}
        <Card className="rounded-sm shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">{t('settings.push_config')}</CardTitle>
                <CardDescription>{t('settings.push_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* 企业微信机器人 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-medium text-slate-900 border-b pb-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                {t('settings.wecom_bot')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook">{t('settings.webhook')}</Label>
                    <Input
                      id="webhook"
                      value={settings.pushConfig.wecomWebhook}
                      onChange={(e) => setSettings({
                        ...settings,
                        pushConfig: { ...settings.pushConfig, wecomWebhook: e.target.value }
                      })}
                      placeholder="输入机器人的 Webhook URL"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook}
                  >
                    {isTestingWebhook ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      t('settings.send_test')
                    )}
                  </Button>
                  {webhookTestStatus === "success" && (
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      推送测试成功
                    </div>
                  )}
                  {webhookTestStatus === "error" && (
                    <div className="flex items-center text-sm text-red-600 font-medium">
                      <AlertCircle className="mr-1.5 h-4 w-4" />
                      推送测试失败
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.template_preview')}</Label>
                  <div className="bg-slate-100 p-4 rounded-md text-sm font-mono text-slate-700 space-y-2 border">
                    <div className="font-bold text-red-600">🚨 签证到期紧急预警 (阶段三)</div>
                    <div>客户姓名：黄先生</div>
                    <div>护照号码：E12345678</div>
                    <div>签证类型：商务签 (VOA)</div>
                    <div>到期倒计时：<span className="text-red-600 font-bold">1天</span></div>
                    <div className="pt-2 border-t border-slate-200 text-slate-500 mt-2">
                      请主管立即跟进处理！
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bantu 语音机器人 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-medium text-slate-900 border-b pb-2">
                <Phone className="h-4 w-4 text-slate-500" />
                {t('settings.voice_bot')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="apikey">{t('settings.api_key')}</Label>
                  <Input
                    id="apikey"
                    type="password"
                    value={voiceApiKey}
                    onChange={(e) => setVoiceApiKey(e.target.value)}
                    placeholder={settings.pushConfig.voiceBotApiKeyPlaceholder || "输入用于触发语音推送的 API Key"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callTime">{t('settings.call_time')}</Label>
                  <Select
                    value={settings.pushConfig.callTime}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      pushConfig: { ...settings.pushConfig, callTime: value }
                    })}
                  >
                    <SelectTrigger id="callTime">
                      <SelectValue placeholder="选择允许打电话的时间段" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working-hours">{t('settings.time_working')}</SelectItem>
                      <SelectItem value="extended">{t('settings.time_extended')}</SelectItem>
                      <SelectItem value="anytime">{t('settings.time_anytime')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">{t('settings.call_time_desc')}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="receiver">{t('settings.receiver')}</Label>
                  <Select
                    value={settings.pushConfig.receiver}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      pushConfig: { ...settings.pushConfig, receiver: value }
                    })}
                  >
                    <SelectTrigger id="receiver">
                      <SelectValue placeholder="选择关联系统中的员工" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wangshuo">王硕 (销售主管)</SelectItem>
                      <SelectItem value="zhangwei">张伟 (签证专员)</SelectItem>
                      <SelectItem value="lisina">李娜 (客服经理)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">{t('settings.receiver_desc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-10">
          <Button variant="outline">{t('settings.cancel')}</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              t('settings.save')
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

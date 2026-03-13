import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'singleton',
          email_account: 'admin@bantuqifu.com',
          email_filter: '@imigrasi.go.id',
          email_frequency_minutes: 5,
          voice_call_time: 'working-hours',
          voice_receiver: 'wangshuo',
        },
      });
    }

    return NextResponse.json({
      emailConfig: {
        account: settings.email_account,
        passwordPlaceholder: settings.email_password ? '••••••••' : '',
        filter: settings.email_filter,
        frequency: settings.email_frequency_minutes,
      },
      pushConfig: {
        wecomWebhook: settings.wecom_webhook_url || '',
        voiceBotApiKeyPlaceholder: settings.voice_bot_api_key ? 'sk-••••••••' : '',
        callTime: settings.voice_call_time,
        receiver: settings.voice_receiver,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updateData: any = {};

    if (data.emailConfig) {
      updateData.email_account = data.emailConfig.account;
      if (data.emailConfig.password && !data.emailConfig.password.includes('••')) {
        updateData.email_password = data.emailConfig.password;
      }
      updateData.email_filter = data.emailConfig.filter;
      updateData.email_frequency_minutes = data.emailConfig.frequency;
    }

    if (data.pushConfig) {
      updateData.wecom_webhook_url = data.pushConfig.wecomWebhook;
      if (data.pushConfig.voiceBotApiKey && !data.pushConfig.voiceBotApiKey.includes('••')) {
        updateData.voice_bot_api_key = data.pushConfig.voiceBotApiKey;
      }
      updateData.voice_call_time = data.pushConfig.callTime;
      updateData.voice_receiver = data.pushConfig.receiver;
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

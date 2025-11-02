import React from 'react';
import TelegramConnectCard from '@/components/TelegramConnectCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

export default function NotificationsSettings() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">Билдирмелер</h1>

      <Card>
        <CardHeader>
          <span className="font-medium">Жалпы жөндөөлөр</span>
        </CardHeader>
        <CardBody className="text-sm opacity-80">
          Бул беттен Telegram билдирмелерин туташтырып/текшерсеңиз болот.
        </CardBody>
      </Card>

      <TelegramConnectCard />
    </div>
  );
}

// src/components/TelegramConnectCard.tsx
import React from 'react';
import { getTelegramLink, getTelegramStatus, sendTelegramTest, TelegramStatusResp } from '@/lib/api/telegram';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { MessageSquare, Link as LinkIcon, CheckCircle2, RefreshCcw } from 'lucide-react';

export default function TelegramConnectCard() {
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [polling, setPolling] = React.useState(false);
  const [statusLoading, setStatusLoading] = React.useState(true);
  const [linked, setLinked] = React.useState<boolean>(false);
  const [tgUsername, setTgUsername] = React.useState<string | undefined>(undefined);

const loadStatus = React.useCallback(async () => {
  try {
    setStatusLoading(true);
    // 👇 type the fallback so there's no union that drops `username`
    const s = await getTelegramStatus().catch<TelegramStatusResp>(() => ({ linked: false }));
    setLinked(!!s.linked);
    setTgUsername(s.username ?? undefined);
  } finally {
    setStatusLoading(false);
  }
}, []);

  React.useEffect(() => {
    // Initial status check on mount
    loadStatus();
  }, [loadStatus]);

const onConnect = async () => {
  try {
    setLoading(true);
    const { url } = await getTelegramLink();
    window.open(url, '_blank', 'noopener,noreferrer');

    setPolling(true);
    const started = Date.now();
    const poll = async () => {
      // 👇 same idea here
      const s = await getTelegramStatus().catch<TelegramStatusResp>(() => ({ linked: false }));
      if (s.linked) {
        setLinked(true);
        setTgUsername(s.username ?? undefined);
        setPolling(false);
        toast.push({ title: 'Даяр', message: 'Telegram ийгиликтүү туташтырылды.', variant: 'success' });
        return;
      }
      if (Date.now() - started < 90_000) {
        setTimeout(poll, 3000);
      } else {
        setPolling(false);
        toast.push({ title: 'Эскертүү', message: 'Туташуу бүтө элек окшойт. Telegram’да ботко «Start» басып, кайра текшериңиз.', variant: 'info' });
      }
    };
    poll();
  } catch (err) {
    toast.push({ title: 'Ката', message: 'Telegram шилтемесин алуу мүмкүн болгон жок.', variant: 'error' });
  } finally {
    setLoading(false);
  }
};

  const onRefresh = async () => {
    await loadStatus();
    toast.push({ title: 'Жаңыртылды', message: 'Статус текшерилди.', variant: 'success' });
  };

  const onSendTest = async () => {
    try {
      await sendTelegramTest();
      toast.push({ title: 'Жөнөтүлдү', message: 'Telegram’га тест кабар жөнөтүлдү.', variant: 'success' });
    } catch {
      toast.push({ title: 'Ката', message: 'Тест кабар жөнөтүү мүмкүн болбой калды.', variant: 'error' });
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Telegram билдирмелери</span>
        </div>
        <Button variant='ghost' onClick={onRefresh} title="Жаңыртуу" disabled={statusLoading || polling}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {statusLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
        ) : linked ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Туташкан</span>
              {tgUsername ? <span className="opacity-80">(@{tgUsername})</span> : null}
            </div>
            <div className="text-sm opacity-80">
              Эми эскертмелер Telegram аркылуу келет. Текшерүү үчүн «Тест билдирүү» басыңыз.
            </div>
            <div className="flex gap-2">
              <Button variant='primary' onClick={onSendTest}>Тест билдирүү</Button>
              <Button variant='ghost' onClick={onConnect} title="Кайра туташтыруу">
                <LinkIcon className="w-4 h-4 mr-1" /> Кайра туташтыруу
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm opacity-80">
              Telegram’га туташуу үчүн төмөнкү баскычты басыңыз. Telegram ачылгандан кийин ботто «Start» басыңыз.
            </div>
            <div className="flex items-center gap-2">
              <Button variant='primary' onClick={onConnect} disabled={loading}>
                <LinkIcon className="w-4 h-4 mr-1" />
                Telegram’га туташтыруу
              </Button>
              {polling ? (
                <span className="text-xs opacity-70 animate-pulse">
                  Текшерүү жүрүп жатат… Telegram’да «Start» басканыңызды ырастап жатабыз
                </span>
              ) : null}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

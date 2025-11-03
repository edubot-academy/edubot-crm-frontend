import React from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

type Props = {
  open: boolean;
  kind: 'DEPOSIT' | 'ENROLLMENT';
  onClose: () => void;
  onSubmit: (v: {
    amount: string; currency: string; method: 'CASH'|'CARD'|'TRANSFER'|'WALLET';
    reference?: string; note?: string;
  }) => Promise<void> | void;
  loading?: boolean;
};

export default function PaymentModal({ open, kind, onClose, onSubmit, loading }: Props) {
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState('KGS');
  const [method, setMethod] = React.useState<'CASH'|'CARD'|'TRANSFER'|'WALLET'>('CASH');
  const [reference, setReference] = React.useState('');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (open) { setAmount(''); setCurrency('KGS'); setMethod('CASH'); setReference(''); setNote(''); }
  }, [open]);

  const title = kind === 'DEPOSIT' ? 'Депозит кошуу' : 'Каттоо төлөмүн кошуу';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={!!loading}>Жокко чыгаруу</Button>
          <Button
            variant="primary"
            disabled={!!loading || !amount}
            loading={!!loading}
            onClick={() => onSubmit({ amount, currency, method, reference: reference || undefined, note: note || undefined })}
          >
            {loading ? 'Жүктөлүүдө…' : 'Сактоо'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Сумма *</label>
          <Input placeholder="15000.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="text-[11px] text-gray-500 mt-1">Нуска: 2500.00 (үпчүнү чекити менен)</div>
        </div>
        <div>
          <label className="block text-sm mb-1">Валюта</label>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="KGS">KGS</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1">Төлөм ыкмасы</label>
          <Select value={method} onChange={(e) => setMethod(e.target.value as any)}>
            <option value="CASH">Накталай</option>
            <option value="CARD">Карта</option>
            <option value="TRANSFER">Банктык которуу</option>
            <option value="WALLET">Э-капчык</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1">Квитанция/ID</label>
          <Input placeholder="POS-12345 / TRX-9876" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Белгеме</label>
          <Input placeholder="Кыскача эскертме…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

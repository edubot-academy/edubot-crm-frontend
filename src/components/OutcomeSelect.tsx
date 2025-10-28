import React from 'react';

export type Outcome =
    | 'INFO_PROVIDED'
    | 'NOT_INTERESTED'
    | 'NOT_A_FIT'
    | 'CHOSE_COMPETITOR'
    | 'INVALID_CONTACT'
    | 'DO_NOT_CONTACT'
    | 'CALLBACK_LATER';

export const LABEL: Record<Outcome, string> = {
    INFO_PROVIDED: 'Маалымат берилди',
    NOT_INTERESTED: 'Кызыктар эмес',
    NOT_A_FIT: 'Туура келбейт',
    CHOSE_COMPETITOR: 'Башка кызматты тандады',
    INVALID_CONTACT: 'Туура эмес байланыш',
    DO_NOT_CONTACT: 'Кайра байланышпагыла',
    CALLBACK_LATER: 'Кийин чалыңыз',
};

export default function OutcomeSelect({
    value,
    onChange,
    disabled,
}: {
    value?: Outcome;
    onChange: (o?: Outcome) => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm mb-1">Жыйынтык</label>
            <select
                value={value ?? ''}
                onChange={(e) => onChange((e.target.value || undefined) as Outcome | undefined)}
                className="input h-10 text-sm w-full"
                disabled={disabled}
            >
                <option value="">—</option>
                {Object.keys(LABEL).map((k) => (
                    <option key={k} value={k}>{LABEL[k as Outcome]}</option>
                ))}
            </select>
        </div>
    );
}

export const OUTCOME_LABEL = LABEL;

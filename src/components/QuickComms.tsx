import React from 'react';
import { GhostButton, SubtleButton } from '@/components/ui/Button';

function openLink(href: string, newTab = false) {
    if (newTab) window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.href = href;
}

export default function QuickComms({
    phone,
    email,
    onOutreach,
    onMark,
}: {
    phone?: string | null;
    email?: string | null;
    onOutreach: () => void;
    onMark: () => void;
}) {
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    const doAndTrack = (fn: () => void) => { fn(); onOutreach(); };

    return (
        <div className="flex flex-wrap gap-2 text-gray-800 dark:text-gray-200">
            {phone && (
                <>
                    <GhostButton onClick={() => doAndTrack(() => openLink(`tel:${phone}`))}>
                        Тел
                    </GhostButton>
                    <GhostButton onClick={() => doAndTrack(() => openLink(`https://wa.me/${phoneDigits}`, true))}>
                        WhatsApp
                    </GhostButton>
                    <GhostButton onClick={() => doAndTrack(() => openLink(`sms:${phone}`))}>
                        SMS
                    </GhostButton>
                </>
            )}
            {email && (
                <GhostButton onClick={() => doAndTrack(() => openLink(`mailto:${email}`))}>
                    Email
                </GhostButton>
            )}
            <SubtleButton
                onClick={() => { onMark(); onOutreach(); }}
                className="text-gray-700 dark:text-gray-100"
            >
                “Акыркы байланыш — азыр”
            </SubtleButton>
        </div>
    );
}

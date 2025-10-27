import React from 'react';
import Button from '@/components/ui/Button';

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
    const doAndTrack = (fn: () => void) => {
        fn();
        onOutreach();
    };

    return (
        <div className="flex flex-wrap gap-2 text-gray-800 dark:text-gray-200">
            {phone && (
                <>
                    <Button
                        variant="ghost"
                        onClick={() => doAndTrack(() => openLink(`tel:${phone}`))}
                    >
                        Тел
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => doAndTrack(() => openLink(`https://wa.me/${phoneDigits}`, true))}
                    >
                        WhatsApp
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => doAndTrack(() => openLink(`sms:${phone}`))}
                    >
                        SMS
                    </Button>
                </>
            )}
            {email && (
                <Button
                    variant="ghost"
                    onClick={() => doAndTrack(() => openLink(`mailto:${email}`))}
                >
                    Email
                </Button>
            )}
            <Button
                variant="subtle"
                onClick={() => {
                    onMark();
                    onOutreach();
                }}
                className="text-gray-700 dark:text-gray-100"
            >
                “Акыркы байланыш — азыр”
            </Button>
        </div>
    );
}

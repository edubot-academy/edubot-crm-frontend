export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card-header ${className}`}>{children}</div>;
}
export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card-body ${className}`}>{children}</div>;
}

// A larger panel with inner header like in CRM UIs
export function Section({ title, right, children }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="card">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b bg-gray-50/60 rounded-t-2xl">
                <div className="font-medium">{title}</div>
                {right}
            </div>
            <div className="card-body">{children}</div>
        </div>
    );
}

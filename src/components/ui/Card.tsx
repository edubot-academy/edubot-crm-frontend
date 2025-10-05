export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card ${className}`}>{children}</div>;
}
export function CardHeader({ children }: { children: React.ReactNode }) {
    return <div className="card-header">{children}</div>;
}
export function CardBody({ children }: { children: React.ReactNode }) {
    return <div className="card-body">{children}</div>;
}
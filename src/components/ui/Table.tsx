export function Table({ children }: { children: React.ReactNode }) {
    return <table className="table">{children}</table>;
}
export function THead({ children }: { children: React.ReactNode }) {
    return <thead>{children}</thead>;
}
export function TBody({ children }: { children: React.ReactNode }) {
    return <tbody>{children}</tbody>;
}
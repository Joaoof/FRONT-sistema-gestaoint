// src/components/Footer.tsx

export function Footer() {
    return (
        <footer className="py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Estoque Nuvem — Feito por João.
        </footer>
    );
}

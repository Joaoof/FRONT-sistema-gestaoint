export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 py-4 rounded shadow-sm">
                <div className="h-8 w-40 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-24 bg-gray-300 rounded-lg shadow-sm"
                    />
                ))}
            </div>

            {/* Atalhos */}
            <div>
                <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-32 bg-gray-200 rounded-lg shadow-inner"
                        />
                    ))}
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Receita x Despesas - ocupa 2 colunas */}
                <div className="xl:col-span-2 h-64 bg-gray-300 rounded-lg shadow-sm" />

                {/* Coluna direita */}
                <div className="space-y-4">
                    {/* Card de ajuda */}
                    <div className="h-24 bg-blue-400 rounded-lg shadow-inner animate-pulse" />

                    {/* Gráfico de pizza */}
                    <div className="h-48 bg-gray-300 rounded-lg shadow-sm" />
                </div>
            </div>

            {/* Vendas x Compras */}
            <div className="h-40 bg-gray-300 rounded-lg shadow-sm" />
        </div>
    );
}

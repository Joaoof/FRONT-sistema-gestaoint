# 🏢 Sistema de Gestão Integrado - Frontend

Sistema web moderno para gestão empresarial desenvolvido com React, TypeScript e Vite. Interface completa com recursos de visualização de dados, geração de relatórios, mapas interativos e muito mais.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Uso](#uso)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

Sistema de gestão integrado que oferece uma interface moderna e intuitiva para gerenciamento empresarial. Desenvolvido com as melhores práticas de desenvolvimento frontend, oferecendo alta performance e experiência de usuário otimizada.

## 🚀 Tecnologias

### Core
- **React 18.3** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.5** - Superset JavaScript com tipagem estática
- **Vite 5.4** - Build tool e dev server de alta performance

### UI/UX
- **Tailwind CSS 3.4** - Framework CSS utility-first
- **Framer Motion 12** - Biblioteca de animações
- **Lucide React** - Ícones modernos
- **Headless UI** - Componentes acessíveis
- **Radix UI** - Primitivos de UI de alta qualidade

### Gerenciamento de Estado e Dados
- **Apollo Client 3.13** - Cliente GraphQL
- **TanStack Query 5** - Gerenciamento de estado assíncrono
- **React Hook Form 7** - Gerenciamento de formulários
- **Zod 4** - Validação de schemas

### Visualização de Dados
- **Recharts 3** - Biblioteca de gráficos
- **TanStack Table 8** - Tabelas poderosas e flexíveis
- **React CountUp** - Animações de números

### Mapas
- **Leaflet 1.9** - Biblioteca de mapas interativos
- **React Leaflet 4** - Integração Leaflet com React

### Exportação e Relatórios
- **jsPDF 3** - Geração de PDFs
- **jsPDF AutoTable** - Tabelas em PDF
- **PDFMake** - Criação de documentos PDF
- **React CSV** - Exportação para CSV
- **XLSX** - Manipulação de planilhas Excel
- **React to Print** - Impressão de componentes

### Roteamento e Navegação
- **React Router DOM 7** - Roteamento declarativo

### Notificações
- **React Hot Toast** - Notificações toast
- **React Toastify** - Sistema de notificações
- **Sonner** - Toast notifications modernas

### Utilitários
- **PapaParse** - Parser de CSV
- **File Saver** - Download de arquivos
- **React Dropzone** - Upload de arquivos drag-and-drop
- **React Number Format** - Formatação de números
- **React Day Picker** - Seletor de datas

## ✨ Funcionalidades

- 📊 **Dashboard Interativo** - Visualização de métricas e KPIs em tempo real
- 📈 **Gráficos e Relatórios** - Análise visual de dados com gráficos personalizáveis
- 🗺️ **Mapas Interativos** - Visualização geográfica de dados
- 📄 **Exportação de Dados** - Suporte para PDF, Excel e CSV
- 🖨️ **Impressão de Relatórios** - Geração de documentos para impressão
- 📱 **Design Responsivo** - Interface adaptável para todos os dispositivos
- 🎨 **Animações Fluidas** - Transições e animações suaves
- 🔔 **Sistema de Notificações** - Feedback visual para ações do usuário
- 📋 **Formulários Validados** - Validação robusta com feedback em tempo real
- 🔍 **Tabelas Avançadas** - Ordenação, filtros e paginação
- 🌐 **GraphQL Integration** - Comunicação eficiente com backend
- 🎯 **TypeScript** - Código type-safe e autocompletar inteligente

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn** ou **pnpm**
- **Git**

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Joaoof/front-sistema-gestaoint.git
```

2. Acesse o diretório do projeto:
```bash
cd front-sistema-gestaoint
```

3. Instale as dependências:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

4. Configure as variáveis de ambiente (se necessário):
```bash
# Crie um arquivo .env na raiz do projeto
cp .env.example .env
```

## 🎮 Uso

### Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

### Build de Produção

Para criar uma build otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`

### Preview da Build

Para visualizar a build de produção localmente:

```bash
npm run preview
```

### Linting

Para verificar problemas de código:

```bash
npm run lint
```

## 📁 Estrutura do Projeto

```
front-sistema-gestaoint/
├── .bolt/                  # Configurações Bolt
├── public/                 # Arquivos públicos estáticos
│   └── images/            # Imagens do projeto
├── src/                   # Código fonte
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas da aplicação
│   ├── hooks/            # Custom hooks
│   ├── services/         # Serviços e APIs
│   ├── utils/            # Funções utilitárias
│   ├── types/            # Definições TypeScript
│   ├── styles/           # Estilos globais
│   └── App.tsx           # Componente principal
├── index.html            # HTML principal
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
├── vite.config.ts        # Configuração Vite
├── tailwind.config.js    # Configuração Tailwind
├── postcss.config.js     # Configuração PostCSS
└── eslint.config.js      # Configuração ESLint
```

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Preview da build de produção |
| `npm run lint` | Executa verificação de código |

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**Joaoof**

- GitHub: [@Joaoof](https://github.com/Joaoof)

## 🙏 Agradecimentos

- Comunidade React
- Equipe Vite
- Contribuidores de todas as bibliotecas utilizadas

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
```

Criei um README completo e profissional em português para o seu sistema de gestão! O documento inclui:

✅ **Seções principais**: Sobre, tecnologias, funcionalidades, instalação e uso
✅ **Documentação detalhada**: Todas as bibliotecas e suas finalidades explicadas
✅ **Instruções claras**: Passo a passo para instalação e execução
✅ **Estrutura visual**: Emojis e formatação para melhor legibilidade
✅ **Tabelas organizadas**: Scripts e estrutura de pastas bem documentados
✅ **Badges e links**: Referências ao seu perfil GitHub

O README destaca as principais funcionalidades do sistema baseado nas dependências do projeto, como exportação de relatórios, mapas interativos, gráficos, e muito mais. Você pode copiar este conteúdo e criar o arquivo `README.md` na raiz do seu repositório!

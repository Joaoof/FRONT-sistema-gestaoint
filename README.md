<div align="center">

# 🚀 Sistema de Gestão Integrado

### Plataforma completa para gestão empresarial moderna

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.14-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[🌟 Demo](#) • [📖 Documentação](#) • [🐛 Reportar Bug](https://github.com/Joaoof/front-sistema-gestaoint/issues) • [✨ Solicitar Feature](https://github.com/Joaoof/front-sistema-gestaoint/issues)

</div>

---

## 📋 Sobre o Projeto

O **Sistema de Gestão Integrado** é uma solução frontend moderna e completa para gerenciamento empresarial. Desenvolvido com as tecnologias mais atuais do mercado, oferece uma experiência fluida e intuitiva para gestão de dados, relatórios, visualizações e muito mais!

### ✨ Destaques

- 🎨 **Interface Moderna** - Design responsivo e intuitivo com Tailwind CSS
- ⚡ **Performance Otimizada** - Construído com Vite para carregamento ultra-rápido
- 📊 **Visualização de Dados** - Gráficos interativos e dashboards dinâmicos
- 🗺️ **Mapas Integrados** - Visualização geográfica com Leaflet
- 📄 **Exportação Avançada** - Gere relatórios em PDF e Excel
- 🔐 **Autenticação Segura** - Sistema robusto de login e permissões
- 🌐 **API REST** - Integração completa com backend via Axios
- 📱 **Totalmente Responsivo** - Funciona perfeitamente em qualquer dispositivo

---

## 🎯 Funcionalidades Principais

<table>
<tr>
<td width="50%">

### 📊 Gestão de Dados
- ✅ CRUD completo de entidades
- ✅ Tabelas interativas com ordenação e filtros
- ✅ Paginação otimizada
- ✅ Busca avançada em tempo real

</td>
<td width="50%">

### 📈 Relatórios e Analytics
- ✅ Dashboards personalizáveis
- ✅ Gráficos dinâmicos (Recharts)
- ✅ Exportação PDF/Excel
- ✅ Métricas em tempo real

</td>
</tr>
<tr>
<td width="50%">

### 🗺️ Visualização Geográfica
- ✅ Mapas interativos
- ✅ Marcadores personalizados
- ✅ Geolocalização
- ✅ Rotas e áreas

</td>
<td width="50%">

### 🎨 Interface e UX
- ✅ Design system consistente
- ✅ Componentes reutilizáveis
- ✅ Animações suaves
- ✅ Modo claro/escuro

</td>
</tr>
</table>

---

## 🛠️ Tecnologias Utilizadas

### Core
- **React 18.3.1** - Biblioteca JavaScript para interfaces
- **TypeScript 5.6.2** - Superset tipado do JavaScript
- **Vite 5.4.8** - Build tool de nova geração

### UI/UX
- **Tailwind CSS 3.4.14** - Framework CSS utility-first
- **Radix UI** - Componentes acessíveis e sem estilo
- **Lucide React** - Ícones modernos e customizáveis
- **React Hook Form** - Gerenciamento de formulários performático

### Visualização de Dados
- **Recharts 2.13.3** - Biblioteca de gráficos para React
- **React Leaflet 4.2.1** - Mapas interativos
- **jsPDF** - Geração de PDFs
- **SheetJS (xlsx)** - Manipulação de planilhas Excel

### Estado e Dados
- **TanStack Query 5.59.16** - Gerenciamento de estado assíncrono
- **Axios 1.7.7** - Cliente HTTP
- **Zod 3.23.8** - Validação de schemas TypeScript-first

### Utilitários
- **date-fns 4.1.0** - Manipulação de datas moderna
- **clsx** - Utilitário para classes condicionais
- **React Router DOM** - Roteamento para React

---

## 🚀 Começando

### 📦 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn** ou **pnpm**

### ⚙️ Instalação

1️⃣ **Clone o repositório**
```bash
git clone https://github.com/Joaoof/front-sistema-gestaoint.git
cd front-sistema-gestaoint
```

2️⃣ **Instale as dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3️⃣ **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Sistema de Gestão
```

4️⃣ **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5️⃣ **Acesse a aplicação**
```
🎉 Abra seu navegador em http://localhost:5173
```

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | 🚀 Inicia o servidor de desenvolvimento |
| `npm run build` | 🏗️ Cria build de produção otimizado |
| `npm run preview` | 👀 Preview do build de produção |
| `npm run lint` | 🔍 Executa o linter (ESLint) |

---

## 📁 Estrutura do Projeto

```
front-sistema-gestaoint/
├── 📂 public/              # Arquivos estáticos
├── 📂 src/
│   ├── 📂 components/      # Componentes reutilizáveis
│   ├── 📂 pages/           # Páginas da aplicação
│   ├── 📂 hooks/           # Custom hooks
│   ├── 📂 services/        # Serviços e APIs
│   ├── 📂 utils/           # Funções utilitárias
│   ├── 📂 types/           # Tipos TypeScript
│   ├── 📂 styles/          # Estilos globais
│   ├── 📄 App.tsx          # Componente principal
│   └── 📄 main.tsx         # Ponto de entrada
├── 📄 package.json         # Dependências do projeto
├── 📄 tsconfig.json        # Configuração TypeScript
├── 📄 vite.config.ts       # Configuração Vite
├── 📄 tailwind.config.js   # Configuração Tailwind
└── 📄 README.md            # Você está aqui! 📍
```

---

## 🎨 Capturas de Tela

<div align="center">

### Dashboard Principal
<img width="1920" height="912" alt="{27F9A4E4-FCF7-4F1C-9F4A-7439DD467CD2}" src="https://github.com/user-attachments/assets/6c9d80b8-1c88-4979-bb3f-9e5c3aa8e6f7" />

### Gestão de Dados
<img width="1915" height="908" alt="{D8D29D84-856A-4298-A8FA-E3E1E8E290E5}" src="https://github.com/user-attachments/assets/e01b568f-0271-45d9-b85c-8e6fd9bd814f" />


### Visualização em Mapas
<img width="1919" height="916" alt="{0FE2139D-F335-4FC6-AB02-35A38908A736}" src="https://github.com/user-attachments/assets/e5549b20-a65a-4b5f-b23d-93dafe9de492" />


</div>

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! 💙

1. 🍴 Faça um Fork do projeto
2. 🌿 Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. 💾 Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. 📤 Push para a branch (`git push origin feature/MinhaFeature`)
5. 🎉 Abra um Pull Request

### 📝 Padrões de Código

- Use TypeScript para type safety
- Siga as convenções do ESLint configurado
- Escreva commits semânticos
- Documente funções complexas
- Teste suas alterações antes de commitar

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**João** - [@Joaoof](https://github.com/Joaoof)

---

## 🙏 Agradecimentos

- Comunidade React pela incrível biblioteca
- Equipe Vite pelo build tool revolucionário
- Todos os contribuidores de código aberto

---

<div align="center">

### ⭐ Se este projeto foi útil, considere dar uma estrela!

**Feito com ❤️ e ☕**

[⬆ Voltar ao topo](#-sistema-de-gestão-integrado)

</div>
```

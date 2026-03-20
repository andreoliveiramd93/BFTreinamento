# Minha Escola Online (estilo cursos)

Site estático (SPA) simples para organizar módulos e adicionar vídeos instrutivos.

Funcionalidades
- Criar módulos
- Adicionar vídeos a cada módulo (YouTube ou arquivos .mp4 via URL)
- Reproduzir vídeos no próprio site
- Persistência local usando localStorage (dados permanecem no navegador)

Como usar
1. Abra o arquivo `index.html` no seu navegador (duplo clique) ou rode o servidor Node para persistência.

2. No painel esquerdo, crie um módulo com o botão "Adicionar módulo".

3. Selecione o módulo criado, adicione o título do vídeo e a URL do vídeo (YouTube ou caminho para .mp4). Clique em "Adicionar vídeo".

4. Clique em ▶︎ para reproduzir o vídeo no painel à direita.

Executar localmente (Node.js + Express + SQLite)
1) Instale dependências e inicie o servidor (PowerShell):

```powershell
cd 'C:\Users\Alessandra\Desktop\treinamento'
npm install
npm start
```

2) Abra o navegador em http://localhost:3000

Observação: o servidor cria o arquivo `data.sqlite` na raiz do projeto para armazenar módulos e vídeos.

Observações e ideias futuras
- Atualmente os dados ficam no navegador; para multiusuário é preciso backend (API + banco).
- Melhorar validação de URLs e suporte a uploads.
- Autenticação e separação por cursos/inscrições.

Arquivos criados
- `index.html` — layout e estrutura
- `styles.css` — estilos básicos
- `app.js` — lógica de UI, persistência e player
- `README.md` — instruções

Feito rápido para permitir que você comece a adicionar vídeos e organizar módulos. Se quiser, posso:
- adicionar um backend simples (Node/Express) para salvar no servidor;
- adicionar upload de arquivos mp4;
- transformar isso em um projeto React com roteamento e autenticação.

Diga qual dessas melhorias você prefere que eu implemente a seguir.# BFTreinamento

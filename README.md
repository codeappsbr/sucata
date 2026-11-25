# Sistema de Sucateamento de Equipamentos de TI

Versão web do formulário em VBA/Excel, com **banco no Google Sheets** e sincronização entre todos os dispositivos que abrirem o mesmo link.

A aplicação escolhe a fonte de dados nesta ordem:

1. **Google Sheets** via **Apps Script Web App** — recomendado e prioridade neste projeto.
2. **Cloud Firestore (Firebase)** — alternativa se você não quiser usar planilha.
3. **Servidor Python/SQLite local** — funciona na rede local.
4. **IndexedDB/localStorage do navegador** — abre `index.html` direto, sem sincronizar.

O selo no topo mostra qual modo está ativo: `Atualizado às HH:MM:SS`, `Sincronizado`, `Sem conexão` ou `Modo local`.

---

## Configurar o banco no Google Sheets (recomendado)

### 1. Criar a planilha

1. Crie uma planilha no Google Sheets. Pode ser vazia.
2. Anote a URL dela (opcional, mas útil para o link **Abrir planilha** no rodapé do site).

### 2. Instalar o código do banco

1. Na planilha, vá em **Extensões > Apps Script...**.
2. Apague o conteúdo inicial do arquivo `Code.gs`.
3. Cole todo o conteúdo de `google-apps-script.gs` deste projeto.
4. Salve com **Ctrl+S**.

O script cria automaticamente:

- aba `lancamentos` com as colunas do sistema;
- aba `meta` com a sequência de IDs;
- os 30 registros de exemplo na primeira leitura.

### 3. Publicar como aplicativo da web

1. No Apps Script, clique em **Implantar > Nova implantação > Aplicativo da Web**.
2. Preencha:
   - **Executar como:** `Eu`
   - **Quem tem acesso:** `Qualquer pessoa` (ou `Qualquer pessoa na sua organização`, se todos usarem a mesma conta Google)
3. Clique em **Implantar** e autorize o acesso quando solicitado.
4. Copie a URL que termina em `/exec`.

> Essa URL funciona como uma “chave” do banco. Não publique-a em locais abertos se não quiser que outras pessoas alterem os dados.

### 4. Colar a URL no site

Abra `google-sheets-config.js` e cole a URL copiada:

```js
window.GOOGLE_SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/SEU_ID/exec',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/SEU_ID/edit',
  pollSeconds: 5
};
```

- `webAppUrl`: obrigatório. É a URL do Apps Script terminada em `/exec`.
- `spreadsheetUrl`: opcional. Cria o link **Abrir planilha** no rodapé.
- `pollSeconds`: intervalo de consulta ao Sheets para detectar alterações feitas em outras abas/dispositivos (padrão: 5 segundos).

Depois disso, recarregue a página. O selo do topo deve mostrar o horário da última atualização e o rodapé deve citar **Google Sheets**.

### 5. Publicar o site

O `google-sheets-config.js` precisa ir junto com `index.html`, `styles.css`, `app.js` e `firebase-config.js`.

- **Firebase Hosting:** o `firebase.json` já inclui o arquivo; use `firebase deploy --only hosting`.
- **GitHub Pages:** o workflow `.github/workflows/deploy.yml` já copia o arquivo.

> Não é necessário hospedar o Apps Script em outro lugar: ele roda na conta Google e o site apenas chama a URL `/exec`.

---

## Como a sincronização funciona

- Todas as alterações (incluir, editar, excluir, importar, limpar e restaurar) são enviadas ao Apps Script, que grava na planilha.
- Cada aba do site consulta a planilha a cada `pollSeconds` segundos. Se o conteúdo mudou (inclusive se você editou a planilha diretamente), a tela atualiza sozinha.
- A aba `meta` controla a numeração sequencial de IDs, então exclusões não reaproveitam IDs.
- O selo do topo mostra `Atualizado às HH:MM:SS` sempre que uma mudança é detectada.

Se você editar a planilha diretamente, mantenha a coluna `ID` preenchida com números e não remova o cabeçalho da primeira linha.

---

## Alternativa: Firebase Firestore

Se preferir voltar ao Firestore, preencha `firebase-config.js` com os dados do app web e publique as regras:

```powershell
npm install -g firebase-tools
firebase login
firebase use SEU-PROJECT-ID
firebase deploy --only firestore:rules
```

O arquivo `firestore.rules` permite leitura e escrita sem login para facilitar testes. Depois de validar, restrinja as escritas com Firebase Authentication.

> Se a configuração do Google Sheets estiver preenchida, ela tem prioridade sobre o Firestore. Para usar apenas Firestore, deixe `webAppUrl` com o valor `COLOQUE_AQUI_A_URL_DO_APP_SCRIPT`.

---

## Executar local com o servidor Python

Se nem Google Sheets nem Firestore estiverem configurados, use o servidor incluído:

```powershell
python server.py
```

Ou dê um duplo clique em `iniciar.bat`.

- Neste computador: `http://localhost:8765`
- Outros dispositivos da rede: `http://<IP-DO-COMPUTADOR>:8765`

O servidor usa SQLite e avisa as abas abertas por **SSE** (`/api/events`).

> Abrir `index.html` diretamente (`file://`) funciona, mas sem Google Sheets/Firestore/servidor os dados ficam apenas naquele navegador (`Modo local`).

---

## Migrar os dados atuais para a planilha

Se você já tem registros no servidor/local e quer passá-los para o Google Sheets:

1. No modo atual, clique em **Backup** e salve o `.json`.
2. Configure o Google Sheets e recarregue a página (a planilha virá com os 30 exemplos).
3. Clique em **Limpar tudo** na planilha.
4. Clique em **Importar** e escolha o `.json` salvo.

O comando **Restaurar exemplos** também funciona no modo Sheets e reapaga os 30 registros originais.

---

## O que o sistema faz

- **Cadastro** com os campos do formulário original: PTM, Filial, Descrição, Motivo, Data Aquisição, Data Lançamento, Vida Útil, Mês, Destino e Status.
- **Vida útil calculada automaticamente** a partir das duas datas; sem aquisição mostra `SEM NÃO ENCONTRADO`.
- **Mês preenchido automaticamente** pela Data Lançamento.
- **Valores padrão**: Data Lançamento = hoje, Destino = `Avarias`, Status = `Ok`.
- **Grid** com busca, filtros por status/mês, ordenação e paginação de 15 registros.
- **Editar/excluir** com confirmação.
- **Estatísticas**: total, status OK, pendências e filiais atendidas.
- **Exportar CSV**, **Backup JSON**, **Importar CSV/JSON**, **Restaurar exemplos** e **Limpar tudo**.

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura da interface |
| `styles.css` | Estilos da interface |
| `app.js` | Regras de negócio e adaptadores Sheets/Firestore/servidor/local |
| `google-sheets-config.js` | URL do Apps Script e intervalo de sincronização |
| `google-apps-script.gs` | Código para colar no Apps Script (banco na planilha) |
| `firebase-config.js` | Configuração do Firebase (alternativa) |
| `firestore.rules` | Regras do Firestore (alternativa) |
| `firebase.json` | Configuração do Firebase Hosting |
| `.github/workflows/deploy.yml` | Deploy automático no GitHub Pages |
| `server.py` | Servidor SQLite/SSE (fallback) |
| `iniciar.bat` | Atalho para iniciar o servidor Python |
| `sucateamento.db` | Banco SQLite local (criado automaticamente) |
| `README.md` | Este arquivo |

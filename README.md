# Sistema de Sucateamento de Equipamentos de TI

Versão web do formulário em VBA/Excel mostrado no print. Mantém os mesmos campos e a lógica da planilha, mas com persistência em **banco de dados local (IndexedDB)**, filtros, edição, exclusão e exportação para Excel.

## Como abrir

Basta abrir o arquivo `index.html` no navegador (Chrome, Edge ou Firefox). Não precisa instalar nada.

Se preferir servir via HTTP (recomendado), execute nesta pasta:

```powershell
python -m http.server 8765
```

Depois acesse `http://localhost:8765` no navegador.

## O que o sistema faz

- **Cadastro** com os campos do formulário original: PTM, Filial, Descrição Equipamento, Motivo Sucateamento, Data Aquisição, Data Lançamento, Vida Útil Equipamento, Destino Avarias, Mês e Status.
- **Vida útil calculada automaticamente** a partir das duas datas (ex.: `3 ano(s) e 8 mês(es)`). Sem data de aquisição, exibe `SEM NÃO ENCONTRADO`, igual à planilha.
- **Mês preenchido automaticamente** com base na Data Lançamento (pode ser alterado manualmente).
- **Valores padrão ao abrir/limpar o formulário**: Data Lançamento = data de hoje, Destino Avarias = `Avarias` e Status = `Ok`.
- **Grid** com os 30 registros do print original já carregados como exemplo.
- **Busca** por PTM, filial, equipamento, motivo, status ou data.
- **Filtros** por status e mês.
- **Ordenação** ao clicar no cabeçalho da coluna.
- **Paginação** (15 registros por página).
- **Editar** e **Excluir** cada lançamento (com confirmação).
- **Estatísticas**: total de lançamentos, status OK, pendências e filiais atendidas.

## Dados e backup

- Os registros ficam salvos no **IndexedDB** (`sucateamento_db`), um banco de dados real embutido no navegador. Na primeira abertura, os 30 exemplos são inseridos automaticamente.
- **Exportar CSV**: gera arquivo com `;` como separador, BOM UTF-8 e colunas no mesmo formato do grid — abre direto no Excel.
- **Backup**: salva um arquivo `.json` com todos os registros.
- **Importar**: aceita `.csv` (adiciona registros) ou `.json` de backup (substitui todos os registros após confirmação).
- **Restaurar exemplos** volta aos 30 registros do print.
- **Limpar tudo** apaga todos os registros do banco.

> Os dados ficam vinculados ao navegador/perfil usado. Para levar para outra máquina, use **Backup** (JSON) e **Importar** no destino. Para acesso simultâneo por vários usuários em rede, é necessário um servidor com banco (ex.: Node.js + SQLite); posso adicionar essa camada se quiser.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura da interface |
| `styles.css` | Estilos (paleta amarelo/azul/verde inspirada no VBA) |
| `app.js` | Regras de negócio, banco de dados e importação/exportação |
| `README.md` | Este arquivo |

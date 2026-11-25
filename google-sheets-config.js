/* ============================================================
   Google Sheets — configuração do banco
   ------------------------------------------------------------
   1. Abra sua planilha no Google Sheets.
   2. Extensões > Apps Script...
   3. Cole o conteúdo de google-apps-script.gs e salve.
   4. Implantar > Nova implantação > Aplicativo da Web.
      - Executar como: Eu
      - Quem tem acesso: Qualquer pessoa (ou "Qualquer pessoa na sua organização")
   5. Copie a URL terminada em /exec e cole abaixo em webAppUrl.
   6. Opcional: cole também a URL da planilha em spreadsheetUrl.
   ============================================================ */

window.GOOGLE_SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbwDI1enH4RuwXK-57g6_sPvtKVW5_h3LYeCOrCmYc7dOUg7GKNUSOQ7s5KdaCbGG9CH7w/exec',
  spreadsheetUrl: '',
  pollSeconds: 5
};

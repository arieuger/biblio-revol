# Proxy OAuth de DecapCMS
Crear unha OAuth App en GitHub co callback de `GITHUB_REDIRECT_URI`, publicar este Worker e definir como secrets `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`. Restrinxir `ALLOWED_ORIGIN` ao dominio Pages. Actualizar despois `base_url` e `auth_endpoint` en `public/admin/config.yml`.

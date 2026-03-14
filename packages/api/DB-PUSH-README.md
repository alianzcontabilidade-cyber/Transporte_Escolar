# Como criar as tabelas no banco (db:push)

## Método mais fácil — pelo Railway Variables

1. No Railway, clique no serviço **Transporte_Escolar**
2. Vá em **Settings** → **Deploy** → **Pre-deploy Command**
3. Digite: `npm run db:push`
4. Clique em **Save**
5. Vá em **Deployments** → clique nos **"..."** do último deploy → **Redeploy**

As tabelas serão criadas automaticamente no próximo deploy!

## Após criadas as tabelas, remova o Pre-deploy Command

Para não rodar db:push em todo deploy futuro, volte em Settings e apague o Pre-deploy Command.

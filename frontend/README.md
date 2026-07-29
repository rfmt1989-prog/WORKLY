# WORKLY Frontend

Frontend universal em Expo SDK 54, React Native, Expo Router e TypeScript.

```bash
npm ci
npm run web
```

Comandos de validação:

```bash
npx tsc --noEmit
npm run lint
npm run build:web
```

Em desenvolvimento, a API predefinida é
`http://127.0.0.1:8000/api`. Em produção web é usado `/api`, no mesmo domínio.
Para Android/iOS físicos, defina `EXPO_PUBLIC_API_URL` com um endereço
alcançável na rede local.

Consulte o [README principal](../README.md) para arquitetura, contas demo,
backend e deploy.

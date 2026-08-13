# Portugol Fácil

Editor didático de algoritmos em Portugol, criado por **Anderson Marques Neto**, com o apoio da Inteligência Artificial.

O projeto permite escrever e executar algoritmos diretamente no navegador, com destaque de sintaxe, exemplos prontos, entrada e saída de dados e comandos em português com ou sem acentuação.

## Funcionalidades

- Execução de algoritmos em Portugol no navegador
- Comandos `escreva`, `escreval` e `leia`
- Variáveis e cálculos
- Estruturas `se`, `senão`, `para` e `enquanto`
- Comandos aceitos com ou sem acentuação
- Destaque de sintaxe por cores
- Download do código em formato `.alg`
- Compartilhamento pelo WhatsApp e por e-mail
- Interface adaptada para computador, tablet e celular

## Executar com Docker Compose

```bash
docker compose up -d --build
```

Depois, abra:

```text
http://IP_DO_SERVIDOR:3000
```

## Instalação pelo Portainer

1. Acesse **Stacks** e selecione **Add stack**.
2. Escolha **Repository**.
3. Informe este repositório e mantenha `docker-compose.yml` como caminho do arquivo Compose.
4. Clique em **Deploy the stack**.
5. Acesse o endereço do servidor pela porta `3000`.

## Atualização

No Portainer, abra a Stack e utilize a opção para buscar novamente o conteúdo do repositório e recriar os contêineres.

## Desenvolvimento local

```bash
npm ci
npm run dev
```

## Tecnologias

- React
- TypeScript
- Vinext
- Vite
- Docker

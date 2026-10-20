# Crypto Dashboard

Painel em React que consome a API pública da CoinGecko. Para **Bitcoin, Ethereum, BNB, XRP e USDC**, ele mostra preço, variação, dados de mercado e um gráfico da última semana. Cada moeda também tem uma janela de história.

![Preview do Crypto Dashboard](docs/preview.png)

**Stack:** React 19 · Vite 8 · CSS puro (sem framework de UI e sem biblioteca de gráficos) · oxlint · API REST CoinGecko (sem chave de acesso)

```bash
npm install
npm run dev
```

---

## O que o painel faz

- **Uma requisição traz tudo.** Os dados vêm todos do mesmo `/coins/markets`: preço, dados de 24h, variação de 7 dias e os 168 preços horários do gráfico. Carregamento e erro são estados separados (`loading`, `error`), e cada um tem a sua mensagem na tela.
- **Layout gerado a partir dos dados.** Cada card sai de um `coins.map()`. Para incluir uma moeda nova, basta acrescentar o id na URL, sem escrever JSX novo.
- **Números no padrão brasileiro.** Exemplos: `US$ 82.458,00`, `US$ 1,66 tri`, `0,62%`, `20,1 mi BTC`. Valores grandes usam notação compacta, porque `$1657288280708` não se lê de relance.
- **Direção da variação sem lógica no JSX.** A classe `up` ou `down` pinta o valor de verde ou vermelho, e um `::before` no CSS acrescenta ▲ ou ▼.
- **Moeda girando em 3D com brilho na cor dela.** O logo vem da própria API (`coin.image`) e gira com `rotateY` + `perspective`. Em volta dele há um `drop-shadow`, um halo pulsando e um reflexo de luz embaixo.
- **Painel que reage ao mouse.** Atrás da moeda há uma grade de quadradinhos, e as células piscam em onda diagonal. Perto do ponteiro, as linhas da grade acendem na cor da moeda.
- **Gráfico de 7 dias que se desenha no hover.** O gráfico fica escondido atrás de uma linha tracejada. Com o mouse em cima, a linha se desenha da esquerda para a direita, a área preenchida aparece e um ponto pulsa no último preço.
- **Card de detalhes ao lado.** Ranking, máxima e mínima de 24h, volume, máxima histórica e quantidade em circulação.
- **Janela de história por moeda.** O botão "Saiba mais" abre um modal com o componente daquela moeda. Ele fecha pelo ✕, pela tecla ESC ou com um clique fora da janela.

---

## Decisões técnicas

### 1. O gráfico usa a mesma requisição dos preços
```js
"...coins/markets?ids=...&sparkline=true&price_change_percentage=7d"
```
Dois parâmetros na URL que já existia trazem `sparkline_in_7d.price` e a variação de 7 dias. Não entrou uma segunda chamada nem uma biblioteca de gráficos. O componente `Sparkline` converte os preços em um `path` de SVG com `viewBox="0 0 100 32"` e `preserveAspectRatio="none"`, e o mesmo desenho estica para a largura do painel no desktop e no celular.

- **Faixa mínima de 1% no eixo.** Sem ela, a USDC (que oscila uns 0,04% na semana) viraria uma linha cheia de picos, parecendo tão volátil quanto o Bitcoin. Com a faixa mínima, uma stablecoin aparece quase reta, que é o que ela é.
- **A animação é só CSS.** O SVG começa com `clip-path: inset(0 100% 0 0)`. No `:hover` do painel, uma animação leva o recorte a `inset(0)` e revela a linha da esquerda para a direita. Ao tirar o mouse, a animação sai, o gráfico volta a se esconder e fica pronto para desenhar de novo.
- **O ponto final fica fora do SVG.** Com `preserveAspectRatio="none"`, um `<circle>` seria achatado num oval. Por isso o ponto é um `<span>` posicionado em porcentagem sobre o gráfico.
- **Sem hover, sem esconder.** Em telas de toque (`@media (hover: none)`), o gráfico já aparece pronto. Com `prefers-reduced-motion`, ele surge sem a animação de desenho e a moeda para de girar.

### 2. A luz que segue o mouse não passa pelo estado do React
```jsx
const moverLuz = (event) => {
  const caixa = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--spot-x', `${event.clientX - caixa.left}px`);
  event.currentTarget.style.setProperty('--spot-y', `${event.clientY - caixa.top}px`);
};
```
O `pointermove` dispara dezenas de vezes por segundo. Guardar a posição num `useState` faria o `App` inteiro renderizar de novo a cada movimento. Em vez disso, a função escreve duas variáveis CSS direto no elemento, e um `radial-gradient(... at var(--spot-x) var(--spot-y))` usado como máscara faz o resto. A função fica fora do componente porque não depende de nada do estado.

### 3. Animação em CSS em vez de GIF
O primeiro impulso foi usar um GIF da moeda girando. Troquei por CSS aplicado ao logo que a API já entrega. Assim:
- o repositório não tem nenhum arquivo de imagem de moeda;
- o logo fica nítido em qualquer tamanho;
- qualquer moeda adicionada depois já gira com o próprio logo.

### 4. Uma variável CSS controla a cor de cada moeda
```css
.coin-bitcoin  { --coin: 247, 147, 26; }
.coin-ethereum { --coin: 130, 150, 255; }
```
Guardo a cor como os três números RGB, e não em hexadecimal, para poder variar a opacidade com `rgba(var(--coin), x)`:

| Elemento | Opacidade |
|---|---|
| Células que piscam | 0.12 |
| Halo atrás da moeda | 0.35 |
| Borda do painel no hover | 0.45 |
| Brilho da moeda | 0.55 |
| Linhas da grade sob o ponteiro | 0.7 |

A linha do gráfico e o marcador ao lado do símbolo usam a cor cheia. Dar uma identidade visual a uma moeda nova custa uma linha.

### 5. Formatadores criados uma vez
```jsx
const formatoDolarCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2,
});
```
Os quatro `Intl.NumberFormat` ficam no topo do módulo, fora do componente. Assim eles são criados uma vez e reaproveitados em todos os cards e renderizações. A notação compacta resolve `market_cap`, `total_volume` e `circulating_supply` sem nenhuma conta manual de "milhão / bilhão / trilhão".

### 6. O estado guarda só o id
```jsx
const [moedaAberta, setMoedaAberta] = useState(null);
const moedaSelecionada = coins.find((coin) => coin.id === moedaAberta);
```
O modal precisa do nome, do logo e do símbolo, mas o estado guarda apenas o id. O resto vem da lista `coins`, que continua sendo a única fonte dos dados. Não existe uma segunda cópia do objeto que possa ficar desatualizada.

### 7. Um mapa liga cada id ao seu componente
```jsx
const historias = {
  bitcoin: <Bitcoin />,
  ethereum: <Ethereum />,
  'usd-coin': <USDC />,
  // ...
};
// no modal:
{historias[moedaAberta]}
```
O mapa substitui uma cadeia de `if` ou `switch`. As chaves são os mesmos ids da API, então os dados do mercado e o conteúdo escrito à mão se conectam sem nenhuma conversão.

### 8. O modal limpa tudo o que abre
```jsx
useEffect(() => {
  if (!moedaAberta) return;
  window.addEventListener('keydown', fecharComEsc);
  document.body.style.overflow = 'hidden';
  return () => {
    window.removeEventListener('keydown', fecharComEsc);
    document.body.style.overflow = '';
  };
}, [moedaAberta]);
```
- O listener de ESC só existe enquanto o modal está aberto. O cleanup do `useEffect` o remove quando o modal fecha, então nada se acumula a cada abertura.
- O mesmo efeito trava a rolagem da página de trás e a destrava no cleanup.
- O clique no fundo escuro fecha o modal. Dentro da janela, um `stopPropagation` impede que esse clique chegue ao fundo.

### 9. Responsividade com CSS Grid
- Cada card é um grid de duas colunas: informações e detalhes. Abaixo de 860px, os detalhes descem para baixo das informações.
- Dentro das informações, o painel da moeda ocupa a última coluna em todas as linhas (`grid-row: 1 / span 4`) e fica ao lado dos textos sem nenhum `div` extra.
- Abaixo de 560px, o painel passa a ocupar a largura toda, entre os números e o botão. Ali o gráfico ganha espaço para mostrar a semana inteira.

---

## Como o projeto evoluiu

- **Começou com um único fetch do Bitcoin.** Depois virou uma lista renderizada com `map`, e foi aí que o layout passou a ser gerado pelos dados.
- **Testei incluir a Nvidia.** A CoinGecko só lista criptoativos, e a opção disponível era uma versão tokenizada da ação (NVDAX). O preço acompanhava a ação, mas a capitalização de mercado e o ranking eram os do token (cerca de US$ 45 milhões), e não os da empresa. Mostrar esses números ao lado dos dados de cripto seria enganoso. Removi a Nvidia e mantive o painel focado em cripto.
- **A primeira versão da história usava um array de moedas abertas** (`moedasAbertas`), pensada para expandir vários cards ao mesmo tempo. Troquei por um modal que mostra uma moeda por vez. A leitura fica concentrada num lugar só, e o estado ficou mais simples: de uma lista de ids para um id ou `null`.
- **A primeira identidade visual imitava um terminal de trading.** Os números usavam JetBrains Mono, havia um selo "Mercado ao vivo" pulsando, uma grade no fundo da página e um foguete no título, e os valores apareciam crus como vinham da API.
- **Na segunda versão, limpei o que competia com os dados:**
  - A fonte mono, o selo e o foguete saíram.
  - Os números passaram pelo `Intl.NumberFormat`.
  - O selo "ao vivo" virou o horário da última atualização. O painel busca os dados uma vez ao carregar, então "Atualizado às 16:43" descreve melhor o que está na tela.
- **O brilho das moedas saiu junto nessa limpeza e fez falta.** Trouxe de volta e usei como referência o template [Kivo](https://kivo-astro.pages.dev/). Dele vieram três ideias: a grade com máscara radial, a luz que segue o ponteiro e o gráfico revelado por `clip-path`. Troquei o roxo do template pela cor de cada moeda, para o efeito reforçar a identidade dela em vez de uma cor de marca.

---

## Estrutura

```
src/
├── App.jsx              # busca dos dados, formatação, cards, estado e lógica do modal
├── index.css            # tema, cor por moeda, painel com grade, gráfico, animações, responsividade
└── components/
    ├── Sparkline.jsx    # gráfico de 7 dias: converte os preços em um path de SVG
    ├── Bitcoin.jsx      # um componente de história por moeda
    ├── Ethereum.jsx
    ├── BNB.jsx
    ├── XRP.jsx
    └── USDC.jsx
```

---

## Próximos passos

- [ ] Escrever o conteúdo de história de cada moeda (os componentes estão criados, ainda sem conteúdo)
- [ ] Atualizar os preços automaticamente com `setInterval` e cleanup no `useEffect`. Aí o horário do cabeçalho passa a andar sozinho.
- [ ] Mostrar o preço e a hora do ponto sob o mouse no gráfico
- [ ] Buscar a descrição e a data de criação no endpoint `/coins/{id}` só quando o modal abrir
- [ ] Extrair um componente `CoinCard` e um hook `useCoins()` para tirar a busca de dados do `App`
- [ ] Tirar o cálculo dos pontos do `Sparkline` para uma função pura e cobrir com testes (Vitest), incluindo o caso da faixa mínima

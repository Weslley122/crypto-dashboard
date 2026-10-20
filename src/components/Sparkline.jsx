import React from 'react';

// Altura do desenho (a largura é sempre 100, o SVG estica para caber no card)
const ALTURA = 32;

// Variação mínima mostrada no eixo: 1% do preço médio.
// Sem isso, uma stablecoin que oscila 0,03% viraria uma linha cheia de picos.
const FAIXA_MINIMA = 0.01;

const Sparkline = ({ id, precos }) => {
  if (!precos || precos.length < 2) return null;

  const menor = Math.min(...precos);
  const maior = Math.max(...precos);
  const meio = (maior + menor) / 2;
  const faixa = Math.max(maior - menor, meio * FAIXA_MINIMA);
  const base = meio - faixa / 2;

  // Converte cada preço em um ponto (x, y) dentro do viewBox 100 x 32
  const pontos = precos.map((preco, i) => [
    (i / (precos.length - 1)) * 100,
    2 + (1 - (preco - base) / faixa) * (ALTURA - 4),
  ]);

  const linha = pontos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${linha} L100 ${ALTURA} L0 ${ALTURA} Z`;
  const [ultimoX, ultimoY] = pontos[pontos.length - 1];

  return (
    <div className="spark-chart">
      <svg viewBox={`0 0 100 ${ALTURA}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="spark-area" d={area} fill={`url(#spark-${id})`} />
        <path d={linha} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* O ponto fica fora do SVG para não ser achatado pelo preserveAspectRatio="none" */}
      <span className="spark-dot" style={{ left: `${ultimoX}%`, top: `${(ultimoY / ALTURA) * 100}%` }} />
    </div>
  );
};

export default Sparkline;

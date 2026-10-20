import React, { useEffect, useState } from 'react';
import Bitcoin from './components/Bitcoin';
import Ethereum from './components/Ethereum';
import BNB from './components/BNB';
import XRP from './components/XRP';
import USDC from './components/USDC';
import Sparkline from './components/Sparkline';

// Liga o id de cada moeda (o mesmo que vem da API) ao seu componente de história
const historias = {
  bitcoin: <Bitcoin />,
  ethereum: <Ethereum />,
  binancecoin: <BNB />,
  ripple: <XRP />,
  'usd-coin': <USDC />,
};

// Formatação dos números no padrão brasileiro (US$ 82.458,00 · US$ 1,66 tri · 0,77%)
const formatoDolar = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });
const formatoDolarCompacto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
const formatoCompacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 2 });
const formatoPercentual = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Grade de fundo atrás da moeda: 8 colunas x 10 linhas. Cada célula pisca com um atraso
// diferente, o que cria uma onda diagonal atravessando a grade
const celulasDaGrade = Array.from({ length: 80 }, (_, i) => ((i % 8) * 900 + Math.floor(i / 8) * 150) % 7200);

// A luz da grade segue o mouse: guarda a posição do ponteiro dentro do painel em variáveis CSS
const moverLuz = (event) => {
  const caixa = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--spot-x', `${event.clientX - caixa.left}px`);
  event.currentTarget.style.setProperty('--spot-y', `${event.clientY - caixa.top}px`);
};

const apagarLuz = (event) => {
  event.currentTarget.style.removeProperty('--spot-x');
  event.currentTarget.style.removeProperty('--spot-y');
};

const App = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const APIurl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,ripple,usd-coin&sparkline=true&price_change_percentage=7d";


  // Um codigo fetch para consultar valores e serviços de uma API
  useEffect(() => {
    fetch(APIurl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setCoins(data);
        setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  // Guarda o id da moeda aberta no modal (null = nenhuma aberta)
  const [moedaAberta, setMoedaAberta] = useState(null);

  const abrirMoeda = (id) => {
    setMoedaAberta(id);
  };

  const fecharMoeda = () => {
    setMoedaAberta(null);
  };

  // Enquanto o modal estiver aberto: fecha com ESC e trava a rolagem da página
  useEffect(() => {
    if (!moedaAberta) return;

    const fecharComEsc = (event) => {
      if (event.key === 'Escape') {
        setMoedaAberta(null);
      }
    };

    window.addEventListener('keydown', fecharComEsc);
    document.body.style.overflow = 'hidden';

    // Limpeza: roda quando o modal fecha
    return () => {
      window.removeEventListener('keydown', fecharComEsc);
      document.body.style.overflow = '';
    };
  }, [moedaAberta]);

  // Os dados da moeda aberta (nome, logo, símbolo) para o topo do modal
  const moedaSelecionada = coins.find((coin) => coin.id === moedaAberta);

  return (
    <div>
      <header className="hero">
        <div>
          <h1>Crypto <span className="serif">Dashboard</span></h1>
          <p className="subtitle">Tudo o que você precisa saber sobre o atual mercado de criptomoedas</p>
        </div>
        <p className="hero-meta">
          Valores em USD · Fonte: CoinGecko
          {atualizadoEm && <span>Atualizado às {atualizadoEm}</span>}
        </p>
      </header>
      {loading && <p className="status">Carregando...</p>}
      {error && <p className="status status-error">Erro: {error.message}</p>}
      {!loading && !error && coins.length > 0 &&
        // Repete o mesmo layout para cada moeda que veio da API
        coins.map((coin) => (
          <div className={`coin-section coin-${coin.id}`} key={coin.id}>
            <div className="coin-info">
              <h2>{coin.name} <span className="tag">{coin.symbol.toUpperCase()}</span></h2>
              <p>Preço atual <span className="value">{formatoDolar.format(coin.current_price)}</span></p>
              <p>Variação de 24h <span className={`value ${coin.price_change_percentage_24h >= 0 ? "up" : "down"}`}>{formatoPercentual.format(coin.price_change_percentage_24h)}%</span></p>
              <p>Capitalização de mercado <span className="value">{formatoDolarCompacto.format(coin.market_cap)}</span></p>
              <div className="coin-tile" onPointerMove={moverLuz} onPointerLeave={apagarLuz}>
                <div className="coin-grid" aria-hidden="true">
                  {celulasDaGrade.map((atraso, i) => (
                    <span key={i} style={{ '--cell-delay': `${atraso}ms` }} />
                  ))}
                </div>
                <div className="coin-stage">
                  <img className="coin-spin" src={coin.image} alt={coin.name} />
                </div>
                <div className="spark">
                  <div className="spark-head">
                    <span>7 dias</span>
                    {coin.price_change_percentage_7d_in_currency != null && (
                      <span className={coin.price_change_percentage_7d_in_currency >= 0 ? "up" : "down"}>
                        {formatoPercentual.format(coin.price_change_percentage_7d_in_currency)}%
                      </span>
                    )}
                  </div>
                  <Sparkline id={coin.id} precos={coin.sparkline_in_7d?.price} />
                </div>
              </div>
              <button className="btn-saiba-mais" onClick={() => abrirMoeda(coin.id)}>
                Saiba mais sobre {coin.name}
              </button>
            </div>

            <aside className="coin-details">
              <p className="subtitle1">Informações detalhadas sobre {coin.name}</p>
              <ul>
                <li><span>Ranking de mercado</span><strong>#{coin.market_cap_rank}</strong></li>
                <li><span>Máxima de 24h</span><strong>{formatoDolar.format(coin.high_24h)}</strong></li>
                <li><span>Mínima de 24h</span><strong>{formatoDolar.format(coin.low_24h)}</strong></li>
                <li><span>Volume de 24h</span><strong>{formatoDolarCompacto.format(coin.total_volume)}</strong></li>
                <li><span>Máxima histórica</span><strong>{formatoDolar.format(coin.ath)}</strong></li>
                <li><span>Em circulação</span><strong>{formatoCompacto.format(coin.circulating_supply)} {coin.symbol.toUpperCase()}</strong></li>
              </ul>
            </aside>
          </div>
        ))}

      {/* Modal: só aparece quando tem uma moeda aberta */}
      {moedaSelecionada && (
        <div className="modal-overlay" onClick={fecharMoeda}>
          {/* stopPropagation: clicar dentro do modal não fecha ele */}
          <div className={`modal coin-${moedaSelecionada.id}`} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <img src={moedaSelecionada.image} alt={moedaSelecionada.name} />
              <h2>{moedaSelecionada.name} <span className="tag">{moedaSelecionada.symbol.toUpperCase()}</span></h2>
              <button className="modal-close" onClick={fecharMoeda} aria-label="Fechar">✕</button>
            </div>
            <div className="modal-body">
              {historias[moedaAberta]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

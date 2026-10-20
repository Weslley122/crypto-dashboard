import React, { useEffect, useState } from 'react';
import Bitcoin from './components/Bitcoin';
import Ethereum from './components/Ethereum';
import BNB from './components/BNB';
import XRP from './components/XRP';
import USDC from './components/USDC';

// Liga o id de cada moeda (o mesmo que vem da API) ao seu componente de história
const historias = {
  bitcoin: <Bitcoin />,
  ethereum: <Ethereum />,
  binancecoin: <BNB />,
  ripple: <XRP />,
  'usd-coin': <USDC />,
};

const App = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const APIurl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,ripple,usd-coin";


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
        <span className="badge"><span className="live-dot"></span>Mercado ao vivo · CoinGecko</span>
        <h1>🚀Crypto <span className="serif">Dashboard</span></h1>
        <p className="subtitle">Tudo o que você precisa saber sobre o atual mercado de criptomoedas</p>
      </header>
      {loading && <p className="status">Carregando...</p>}
      {error && <p className="status status-error">Erro: {error.message}</p>}
      {!loading && !error && coins.length > 0 &&
        // Repete o mesmo layout para cada moeda que veio da API
        coins.map((coin) => (
          <div className={`coin-section coin-${coin.id}`} key={coin.id}>
            <div className="coin-info">
              <h2>{coin.name} <span className="tag">{coin.symbol.toUpperCase()}</span></h2>
              <p>Preço atual: <span className="value">${coin.current_price}</span></p>
              <p>Variação de 24h: <span className={`value ${coin.price_change_percentage_24h >= 0 ? "up" : "down"}`}>{coin.price_change_percentage_24h}%</span></p>
              <p>Capitalização de mercado: <span className="value">${coin.market_cap}</span></p>
              <div className="coin-wrapper">
                <img className="coin-spin" src={coin.image} alt={coin.name} />
              </div>
              <button className="btn-saiba-mais" onClick={() => abrirMoeda(coin.id)}>
                Saiba mais sobre {coin.name}
              </button>
            </div>

            <aside className="coin-details">
              <p className="subtitle1">Informações detalhadas sobre {coin.name}</p>
              <ul>
                <li><span>Ranking de mercado</span><strong>#{coin.market_cap_rank}</strong></li>
                <li><span>Máxima de 24h</span><strong>${coin.high_24h}</strong></li>
                <li><span>Mínima de 24h</span><strong>${coin.low_24h}</strong></li>
                <li><span>Volume de 24h</span><strong>${coin.total_volume}</strong></li>
                <li><span>Máxima histórica</span><strong>${coin.ath}</strong></li>
                <li><span>Em circulação</span><strong>{coin.circulating_supply} {coin.symbol.toUpperCase()}</strong></li>
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

# AutoEditor Mod SN v1.1 — edição com milissegundos

Transforma **imagens/vídeos nomeados com o tempo em que devem entrar** + **uma narração** em um MP4, tudo no seu computador. Nada é enviado para a internet.

> **AutoEditor Mod SN v1.1** é uma versão modificada do **AutoEditor Mod**, que por sua vez é uma modificação do **AutoEditor** original. Veja os [Créditos](#créditos) e a [Licença](#licença) antes de usar ou compartilhar.

---

## O que eu mudei nesta versão

| # | Alteração | Onde está no código |
|---|-----------|---------------------|
| 1 | **Linha de onda de som (forma de onda) da narração**, logo abaixo da linha das imagens (faixa **A** da timeline). Clicar/arrastar nela move o cursor, como na régua. | `components/Timeline.js`, `app/globals.css` |
| 2 | **Abas de edição separadas da exportação.** As abas de edição (Effects, Captions, Audio, Overlay) ficam à **esquerda** da pré-visualização; o painel **Export** ficou separado, à **direita**. A divisória arrastável agora redimensiona o painel da esquerda. | `components/Editor.js`, `app/globals.css`, `components/QuickTour.js` |
| 3 | **Milissegundos nos nomes dos arquivos.** Além de `0-05`, agora vale `0-03-135` (minuto-segundo-milissegundo). Os tempos com milissegundos também aparecem na bandeja de importação e nas dicas da timeline. | `lib/timestamp.js`, `lib/__tests__/timestamp.test.js`, `app/page.js`, `components/Timeline.js` |
| 4 | **Iniciadores em português** para Windows, macOS (Intel e Apple Silicon) e Linux. A lógica é a do projeto base; só mudei as mensagens. | `1 Run-Windows.bat`, `1 Run-macOS-Intel.command`, `1 Run-macOS-Silicon.command`, `1 Run-Linux.sh` |
| 5 | **Motor de render: FFmpeg (GPU) por padrão.** O botão **Render MP4** usa o FFmpeg do servidor local (placa NVIDIA via NVENC, quando disponível) em vez do encoder do navegador, que podia travar no meio. O interruptor **Render engine**, acima do botão, volta ao render do navegador (WebCodecs). | `components/Editor.js`, `app/page.js` |
| 6 | **Legenda palavra por palavra.** Na aba **Captions** há o seletor **Words on screen** (*Full line / 1 word / 2 words / 3 words*). Com 1 palavra, aparece uma palavra por vez, no momento em que é falada. Funciona no preview e nos dois tipos de render. | `lib/captions.js` (`captionToWordCues`), `app/page.js`, `components/Editor.js`, `lib/__tests__/captions.test.js` |

Todos os trechos alterados no código têm o comentário `[MOD]`. O histórico detalhado está em [`CHANGELOG-MOD.md`](CHANGELOG-MOD.md) e o passo a passo de uso em [`MANUAL-DE-USO.md`](MANUAL-DE-USO.md).

### Nomes de arquivo aceitos

| Nome | Significa |
|------|-----------|
| `0-05.png` | 0 min 5 s |
| `0-03-135.png` | 0 min 3 s **135 ms** (3,135 s) |
| `1-20-050.mp4` | 1 min 20 s 50 ms |
| `1-02-05-250.png` | 1 h 02 min 05 s 250 ms |
| `1-02-05.png` | 1 h 02 min 05 s *(formato original, igual a antes)* |

**Regra importante:** o último grupo só é lido como milissegundos quando tem **exatamente 3 dígitos** (`0-03-050`, não `0-03-50`). Com 1 ou 2 dígitos o nome continua valendo como `hh-mm-ss`, como no projeto original, então nada que funcionava antes quebra.

---

## Início rápido (Windows)

1. Instale o **Node.js LTS**: <https://nodejs.org>
2. Dê dois cliques em **`1 Run-Windows.bat`**.
3. Na primeira vez ele instala as dependências e compila a interface (pode demorar alguns minutos). Depois abre o app em <http://localhost:4000> e salva os vídeos prontos em `Downloads\AutoEditor`.
4. **Deixe a janela preta aberta** enquanto usa o app. Para parar, feche a janela (ou use `stop.bat`).

> Se você alterar o código depois, apague a pasta `out` e abra o `.bat` de novo para recompilar.

### macOS e Linux

| Sistema | Como abrir |
|---------|-----------|
| macOS (Apple Silicon / M1–M4) | `1 Run-macOS-Silicon.command` |
| macOS (Intel) | `1 Run-macOS-Intel.command` |
| Linux | `./"1 Run-Linux.sh"` no terminal |

Se o arquivo não abrir por falta de permissão de execução, rode uma vez na pasta do projeto:

```bash
chmod +x "1 Run-macOS-Silicon.command" "1 Run-macOS-Intel.command" "1 Run-Linux.sh"
```

No macOS, se aparecer um aviso de segurança, clique com o botão direito no arquivo → **Abrir**. O Android (Termux) continua como no projeto base, sem alterações.

> Os iniciadores de macOS e Linux só tiveram as mensagens traduzidas (verifiquei a sintaxe, mas não testei em Mac nem em Linux real). O Windows é o que tem prioridade nesta versão.

---

## Recursos (do projeto base)

- **Efeitos de imagem** por clipe, com intensidade ajustável.
- **Edição:** importar arrastando, cortar, ajustar encaixe (cover/contain), reordenar na timeline.
- **Transições:** fade, wipe, zoom e slide, com duração ajustável.
- **Áudio:** várias camadas, volume por camada, sincronização automática de voz/música.
- **Texto:** legendas a partir de SRT/SSA ou transcrições com tempo, com estilo, tamanho e animação, e **[MOD] modo palavra por palavra** (1, 2 ou 3 palavras por vez).
- **Overlay e marca d'água:** vídeo/imagem com opacidade e modos de mistura.
- **Exportação:** resolução completa, 720p ou 4K; 24/30/60 fps; render com WebCodecs ou FFmpeg, com barra de progresso.
- **Projeto:** salvar e retomar todo o estado em um arquivo JSON.

## Modo de desenvolvimento

```bash
npm install
NEXT_PUBLIC_RENDER_URL=http://localhost:4000 npm run dev   # terminal 1 — interface em :3000
OPEN_BROWSER=1 node server/index.js                        # terminal 2 — motor de render em :4000
npm test                                                   # testes
```

---

## Créditos

Este projeto só existe por causa do trabalho de outras pessoas:

- **AutoEditor** (projeto original) — criado por **Siddique** (TryAIToday / `codewithsiddique-04`): <https://github.com/codewithsiddique-04/autoeditor>
- **AutoEditor Mod** (base direta desta versão) — modificação feita por **banonggang**: <https://github.com/banonggang/autoeditor-mod>
- **Esta versão (milissegundos, onda de som, painel Export separado, iniciador em português)** — alterações feitas por **pedroibd** (<https://github.com/pedroibd/autoeditor-ms>).

Os direitos autorais do código original continuam com os autores acima. As alterações desta versão não removem nem alteram a autoria original.

## Licença

Este projeto usa a **AutoEditor — Non-Commercial License** do autor original (arquivo [`LICENSE`](LICENSE), incluído **sem alterações**). Em resumo:

- Uso, cópia e modificação são permitidos para fins **pessoais, educacionais ou hobby sem fins lucrativos**.
- **Não é permitido** uso comercial (vender, cobrar, oferecer em plano pago, prestar serviço pago a terceiros etc.).
- Ao compartilhar cópias ou modificações, é preciso manter o `LICENSE` sem alterações e não remover nem disfarçar a autoria.
- Para pedir uma licença comercial, o autor original indica o Discord da TryAIToday, citado no próprio `LICENSE`.

Leia o `LICENSE` completo: ele é o texto que vale, este resumo não o substitui.

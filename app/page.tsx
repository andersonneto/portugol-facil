"use client";

import { useMemo, useRef, useState } from "react";

const EXEMPLOS = {
  "Olá, mundo": `algoritmo "OlaMundo"\ninicio\n   escreval("Olá, mundo!")\nfimalgoritmo`,
  "Média escolar": `algoritmo "MediaEscolar"\nvar\n   nota1, nota2, media: real\ninicio\n   escreva("Digite a primeira nota: ")\n   leia(nota1)\n   escreva("Digite a segunda nota: ")\n   leia(nota2)\n   media <- (nota1 + nota2) / 2\n\n   escreval("Média: ", media)\n   se media >= 7 entao\n      escreval("Situação: aprovado")\n   senao\n      escreval("Situação: em recuperação")\n   fimse\nfimalgoritmo`,
  "Contagem": `algoritmo "Contagem"\nvar\n   i: inteiro\ninicio\n   para i de 1 ate 10 faca\n      escreval("Número: ", i)\n   fimpara\nfimalgoritmo`,
};

const APP_VERSION = "1.1.1";

function expression(text: string) {
  return normalizeCommands(text).replace(/<>/g, "!=").replace(/\bnao\b/gi, "!").replace(/\be\b/gi, "&&").replace(/\bou\b/gi, "||")
    .replace(/(?<![<>=!])=(?!=)/g, "===").replace(/\bverdadeiro\b/gi, "true").replace(/\bfalso\b/gi, "false")
    .replace(/\bdiv\b/gi, "/").replace(/\bmod\b/gi, "%");
}

function normalizeCommands(text: string) {
  return text.split(/("(?:[^"\\]|\\.)*")/g).map((part, index) =>
    index % 2 ? part : part.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  ).join("");
}

function compile(source: string) {
  const js = ["let __out = '';", "const __print=(x,n=false)=>{__out+=x+(n?'\\n':'')};"];
  let inVars = false;
  for (const [index, sourceLine] of source.split("\n").entries()) {
    let raw = sourceLine.trim().replace(/\/\/.*$/, "").trim();
    if (!raw) continue;
    raw = normalizeCommands(raw);
    const low = raw.toLowerCase();
    if (low === "var") { inVars = true; continue; }
    if (low === "inicio") { inVars = false; continue; }
    if (/^algoritmo\b/i.test(raw) || low === "fimalgoritmo") continue;
    if (inVars) {
      const declaration = raw.match(/^([\wÀ-ÿ,\s]+)\s*:\s*(inteiro|real|caractere|literal|logico)/i);
      if (declaration) js.push(`let ${declaration[1].split(",").map(v => v.trim()).filter(Boolean).join(" = 0, ")} = 0;`);
      continue;
    }
    let m;
    if ((m = raw.match(/^escreval?\s*\((.*)\)$/i))) { js.push(`__print([${expression(m[1])}].join(''), ${/^escreval/i.test(raw)});`); continue; }
    if ((m = raw.match(/^leia\s*\((\w+)\)$/i))) { js.push(`${m[1]}=(()=>{const v=prompt('Digite o valor de ${m[1]}:')??'';return v.trim()!==''&&!isNaN(Number(v))?Number(v):v;})();`); continue; }
    if ((m = raw.match(/^se\s+(.+)\s+entao$/i))) { js.push(`if (${expression(m[1])}) {`); continue; }
    if (low === "senao") { js.push("} else {"); continue; }
    if (low === "fimse") { js.push("}"); continue; }
    if ((m = raw.match(/^enquanto\s+(.+)\s+faca$/i))) { js.push(`while (${expression(m[1])}) {`); continue; }
    if (low === "fimenquanto") { js.push("}"); continue; }
    if ((m = raw.match(/^para\s+(\w+)\s+de\s+(.+)\s+ate\s+(.+)\s+faca$/i))) { js.push(`for (${m[1]}=${expression(m[2])};${m[1]}<=${expression(m[3])};${m[1]}++){`); continue; }
    if (low === "fimpara") { js.push("}"); continue; }
    if ((m = raw.match(/^(\w+)\s*<-\s*(.+)$/))) { js.push(`${m[1]}=${expression(m[2])};`); continue; }
    throw new Error(`Linha ${index + 1}: comando não reconhecido: “${raw}”`);
  }
  js.push("return __out;"); return js.join("\n");
}

function highlight(source: string) {
  const token = /(\/\/[^\n]*|"(?:[^"\\]|\\.)*"|\b(?:algoritmo|var|in[ií]cio|fimalgoritmo|inteiro|real|caractere|literal|l[oó]gico|escreva|escreval|leia|se|ent[aã]o|sen[aã]o|fimse|enquanto|fa[cç]a|fimenquanto|para|de|at[eé]|fimpara|verdadeiro|falso|n[aã]o|e|ou|div|mod)\b|\b\d+(?:[.,]\d+)?\b|<-|>=|<=|<>|[+*/%=<>-])/gi;
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let result = "";
  let cursor = 0;
  for (const match of source.matchAll(token)) {
    const value = match[0];
    result += escape(source.slice(cursor, match.index));
    let kind = "operator";
    if (value.startsWith("//")) kind = "comment";
    else if (value.startsWith('"')) kind = "string";
    else if (/^\d/.test(value)) kind = "number";
    else if (/^[A-Za-zÀ-ÿ]+$/.test(value)) kind = /^(inteiro|real|caractere|literal|l[oó]gico|verdadeiro|falso)$/i.test(value) ? "type" : "keyword";
    result += `<span class="syntax-${kind}">${escape(value)}</span>`;
    cursor = (match.index ?? 0) + value.length;
  }
  return result + escape(source.slice(cursor));
}

export default function Home() {
  const [code, setCode] = useState(EXEMPLOS["Média escolar"]);
  const [output, setOutput] = useState("Clique em Executar para ver o resultado do algoritmo.");
  const [status, setStatus] = useState<"pronto" | "sucesso" | "erro">("pronto");
  const highlightRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lines = useMemo(() => Array.from({length: code.split("\n").length}, (_, i) => i + 1), [code]);
  function run(){try{setOutput(Function(compile(code))()||"Programa finalizado sem saída.");setStatus("sucesso");}catch(error){setOutput(error instanceof Error?error.message:"Ocorreu um erro ao executar.");setStatus("erro");}}
  function fileName(){return (code.match(/^\s*algoritmo\s+"([^"]+)"/im)?.[1]||"meu_algoritmo").replace(/[^\wÀ-ÿ-]+/g,"_")+".alg";}
  function save(){const url=URL.createObjectURL(new Blob([code],{type:"text/plain;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=fileName();link.click();URL.revokeObjectURL(url);}
  function openFile(event: React.ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{setCode(String(reader.result??""));setOutput("");setStatus("pronto");};reader.readAsText(file,"UTF-8");event.target.value="";}
  async function share(channel:"whatsapp"|"email"){const text=`Algoritmo criado no Portugol Fácil:\n\n${code}`;const file=new File([code],fileName(),{type:"text/plain"});try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:`Código Portugol: ${fileName()}`,text:"Abra este arquivo no Portugol Fácil para editar e executar.",files:[file]});return;}}catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;}const url=channel==="whatsapp"?`https://wa.me/?text=${encodeURIComponent(text)}`:`mailto:?subject=${encodeURIComponent("Código Portugol: "+fileName())}&body=${encodeURIComponent(text)}`;window.open(url,"_blank","noopener,noreferrer");}
  function printPdf(){const popup=window.open("","_blank");if(!popup)return;const safe=code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");popup.document.write(`<!doctype html><html lang="pt-BR"><head><title>${fileName()}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#17221e}h1{font-size:22px;margin-bottom:4px}p{color:#64706b;font-size:12px}pre{margin-top:28px;padding:22px;background:#f4f5f2;border:1px solid #d8ddd7;border-radius:8px;font:13px/1.6 monospace;white-space:pre-wrap}@media print{body{padding:0}pre{break-inside:avoid}}</style></head><body><h1>Portugol Fácil</h1><p>${fileName()} • versão ${APP_VERSION}</p><pre>${safe}</pre><script>window.onload=()=>window.print()<\/script></body></html>`);popup.document.close();}
  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">P</span><span>Portugol <b>Fácil</b></span></a><nav><a href="#editor">Editor</a><a href="#aprender">Aprender</a><a href="#exemplos">Exemplos</a></nav><span className="student-pill">Feito para aprender</span></header>
    <section className="hero"><div><span className="eyebrow">LÓGICA DE PROGRAMAÇÃO</span><h1>Escreva. Execute.<br/><em>Entenda.</em></h1></div><p>Aprenda algoritmos em português direto no navegador. Simples para quem está começando, útil para quem está praticando.</p></section>
    <section className="workspace" id="editor">
      <div className="workspace-bar"><div className="file-tab"><span className="file-icon">◆</span> {fileName()} <span className="dot">●</span></div><div className="actions"><button className="ghost" onClick={()=>{setCode("");setOutput("");setStatus("pronto");}}>Novo</button><button className="ghost" onClick={()=>fileInputRef.current?.click()} title="Abrir arquivo .alg ou .txt">↑ Abrir</button><input ref={fileInputRef} className="file-input" type="file" accept=".alg,.txt,text/plain" onChange={openFile}/><button className="ghost save" onClick={save} title="Baixar o código em formato .alg">↓ Salvar</button><details className="options-menu"><summary>Opções <span>▾</span></summary><div className="options-popover"><button onClick={()=>share("whatsapp")}><b>WhatsApp</b><small>Compartilhar código</small></button><button onClick={()=>share("email")}><b>E-mail</b><small>Enviar código</small></button><button onClick={printPdf}><b>Imprimir</b><small>Imprimir ou salvar</small></button></div></details><button className="run" onClick={run}><span>▶</span> Executar <kbd>F9</kbd></button></div></div>
      <div className="panels"><div className="editor-panel"><div className="panel-label">CÓDIGO <span className="syntax-label"><i></i> destaque de sintaxe</span></div><div className="code-wrap"><div className="line-numbers" aria-hidden="true">{lines.map(n=><span key={n}>{n}</span>)}</div><div className="code-editor"><pre ref={highlightRef} className="highlight-layer" aria-hidden="true" dangerouslySetInnerHTML={{__html:highlight(code)+"\n"}}/><textarea value={code} onChange={e=>setCode(e.target.value)} onScroll={e=>{if(highlightRef.current){highlightRef.current.scrollTop=e.currentTarget.scrollTop;highlightRef.current.scrollLeft=e.currentTarget.scrollLeft;}}} onKeyDown={e=>{if(e.key==="F9"){e.preventDefault();run();}}} spellCheck={false} aria-label="Editor de código Portugol"/></div></div></div>
      <div className="console-panel"><div className="console-head"><div><span className="terminal-icon">›_</span><b> SAÍDA</b></div><button onClick={()=>setOutput("")}>Limpar</button></div><pre className={status}>{output}</pre><div className="console-status"><span className={`status-dot ${status}`}></span>{status==="sucesso"?"Execução concluída":status==="erro"?"Verifique o algoritmo":"Aguardando execução"}</div></div></div>
    </section>
    <section className="learn" id="aprender"><div><span className="eyebrow">COMECE AGORA</span><h2>Exemplos para experimentar</h2><p>Escolha um exemplo, altere os valores e observe como cada comando funciona.</p></div><div className="example-grid" id="exemplos">{Object.entries(EXEMPLOS).map(([name,value],i)=><button key={name} onClick={()=>{setCode(value);setStatus("pronto");setOutput("Exemplo carregado. Clique em Executar.");window.scrollTo({top:380,behavior:"smooth"});}}><span>0{i+1}</span><b>{name}</b><small>{i===0?"Saída de texto":i===1?"Variáveis e condição":"Laço de repetição"}</small><i>→</i></button>)}</div></section>
    <footer><span>Portugol Fácil <i className="version">v{APP_VERSION}</i></span><div className="footer-copy"><p>Um ambiente didático para dar os primeiros passos na programação.</p><small>Criado por <b>Anderson Marques Neto</b>, com o apoio da Inteligência Artificial. <a className="github-link" href="https://github.com/andersonneto/portugol-facil" target="_blank" rel="noopener noreferrer">Ver projeto no GitHub ↗</a></small></div><a href="#editor">Voltar ao editor ↑</a></footer>
  </main>;
}
